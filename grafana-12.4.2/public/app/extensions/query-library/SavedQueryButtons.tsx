import { css } from '@emotion/css';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useLocalStorage, useMeasure } from 'react-use';

import { CoreApp, FeatureState, GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { Button, Dropdown, FeatureBadge, Icon, Menu, useStyles2, useTheme2 } from '@grafana/ui';
import { useQueryLibraryContext } from 'app/features/explore/QueryLibrary/QueryLibraryContext';

import { QueryLibraryInteractions } from './QueryLibraryAnalyticsEvents';
import { QUERY_LIBRARY_LOCAL_STORAGE_KEYS } from './QueryLibraryDrawer';
import { selectors } from './e2e-selectors/selectors';
import { useQueryLibrarySave } from './hooks/useQueryLibrarySave';
import { hasReadPermissions, hasWritePermissions } from './utils/identity';

interface Props {
  query: DataQuery;
  app?: CoreApp;
  onUpdateSuccess?: () => void;
  onSelectQuery?: (query: DataQuery) => void;
  datasourceFilters?: string[];
  parentRef?: React.RefObject<HTMLElement | null>;
}

export function SavedQueryButtons({ query, app, onSelectQuery, datasourceFilters, parentRef }: Props) {
  const { saveNewQuery } = useQueryLibrarySave();
  const { openDrawer, triggerAnalyticsEvent } = useQueryLibraryContext();

  const [hideButtons, setHideButtons] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [showQueryLibraryBadgeButton, setShowQueryLibraryBadgeButton] = useLocalStorage(
    QUERY_LIBRARY_LOCAL_STORAGE_KEYS.explore.newButton,
    true
  );

  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const parentRefCurrent = parentRef?.current;
  const [measureRef, { width }] = useMeasure<HTMLElement>();

  // Measure the parent ref width to determine if the dropdown should be small or large
  useLayoutEffect(() => {
    if (parentRefCurrent) {
      measureRef(parentRefCurrent);
    }
  }, [parentRefCurrent, measureRef]);

  const isLargeFormat = width > theme.breakpoints.values.md;

  // Update hideButtons based on datasource existence
  useEffect(() => {
    const checkDatasourceExistence = async () => {
      if (!query.datasource?.uid) {
        setHideButtons(true);
        return;
      }

      try {
        const datasource = await getDataSourceSrv().get(query.datasource.uid);
        setHideButtons(!Boolean(datasource));
      } catch (error) {
        // If there's an error getting the datasource, hide the buttons
        setHideButtons(true);
      }
    };

    checkDatasourceExistence();
  }, [query.datasource?.uid]);

  const onSaveNewQueryClick = () => {
    saveNewQuery(query, onSelectQuery, { context: app });
    setShowQueryLibraryBadgeButton(false);
  };

  const onReplaceQueryClick = () => {
    openDrawer({ datasourceFilters, onSelectQuery, options: { isReplacingQuery: true, context: app } });
    setShowQueryLibraryBadgeButton(false);
  };

  const MenuActions = () => {
    return (
      <Menu>
        {hasWritePermissions() ? (
          <Menu.Item
            label={t('query-operation.header.save-to-query-library', 'Save query')}
            onClick={onSaveNewQueryClick}
            testId={selectors.components.saveQueryButton.button}
          />
        ) : null}
        <Menu.Item
          label={t('query-operation.header.replace-query-from-library', 'Replace query')}
          onClick={onReplaceQueryClick}
          testId={selectors.components.replaceQueryButton.button}
        />
      </Menu>
    );
  };

  // Used to measure dropoff of users clicking the dropdown but no option inside
  useEffect(() => {
    if (isOpen) {
      triggerAnalyticsEvent(QueryLibraryInteractions.savedQueriesDropdownOpened, {}, app);
    }
  }, [isOpen, triggerAnalyticsEvent, app]);

  // Don't render buttons if user doesn't have read permission or datasource doesn't exist
  if (!hasReadPermissions() || hideButtons) {
    return null;
  }

  return (
    <>
      {showQueryLibraryBadgeButton && isLargeFormat && <FeatureBadge featureState={FeatureState.new} />}

      <Dropdown overlay={MenuActions} placement="bottom-end" onVisibleChange={setIsOpen}>
        <Button
          data-testid={selectors.components.savedQueriesMenuButton.button}
          icon={isOpen ? 'angle-up' : 'angle-down'}
          iconPlacement="right"
          variant="secondary"
          fill="text"
          size="sm"
          aria-label={t('query-operation.header.saved-queries', 'Saved queries')}
          tooltip={!isLargeFormat ? t('query-operation.header.saved-queries', 'Saved queries') : undefined}
        >
          <Icon name="book-open" className={isLargeFormat ? styles.savedQueriesButtonIcon : ''} />
          {isLargeFormat ? t('query-operation.header.saved-queries', 'Saved queries') : ''}
        </Button>
      </Dropdown>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    savedQueriesButtonIcon: css({
      marginRight: theme.spacing(1),
    }),
  };
};
