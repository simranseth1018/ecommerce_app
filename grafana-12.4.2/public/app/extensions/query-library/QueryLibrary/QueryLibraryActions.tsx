import { css } from '@emotion/css';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Stack, useStyles2 } from '@grafana/ui';
import { useQueryLibraryContext } from 'app/features/explore/QueryLibrary/QueryLibraryContext';
import { SavedQuery } from 'app/features/explore/QueryLibrary/types';
import { DrilldownExtensionPoint } from 'app/features/explore/extensions/DrilldownExtensionPoint';

import { showDiscardAddQueryModal } from '..';
import { QueryLibraryInteractions } from '../QueryLibraryAnalyticsEvents';
import { selectors } from '../e2e-selectors/selectors';
import { canEditQuery } from '../utils/identity';
import { hasUnresolvedVariables } from '../utils/templateVariables';

import { QueryDetails } from './QueryLibraryDetails';
import { QueryLibraryMenuActions } from './QueryLibraryMenuActions';

export interface QueryLibraryActionsProps {
  selectedQueryRow: SavedQuery;
  isSavingLoading: boolean;
  usingHistory?: boolean;
  onEditQuerySuccess: (uid: string, isNew?: boolean) => void;
}

export function QueryLibraryActions({
  selectedQueryRow,
  usingHistory,
  isSavingLoading,
  onEditQuerySuccess,
}: QueryLibraryActionsProps) {
  const styles = useStyles2(getStyles);
  const {
    setNewQuery,
    context,
    triggerAnalyticsEvent,
    closeDrawer,
    onSelectQuery,
    onAddHistoryQueryToLibrary,
    isEditingQuery,
    setIsEditingQuery,
  } = useQueryLibraryContext();

  const hasTemplateVariables = hasUnresolvedVariables(selectedQueryRow.query);

  const {
    reset,
    formState: { isDirty },
  } = useFormContext<QueryDetails>();

  if (usingHistory) {
    return (
      <Stack width="100%" justifyContent="flex-end">
        <Button
          data-testid={selectors.components.queryLibraryDrawer.confirm}
          onClick={() =>
            onAddHistoryQueryToLibrary({
              ...selectedQueryRow,
              uid: undefined,
              title: t('explore.query-library.default-title', 'New query'),
            })
          }
        >
          <Trans i18nKey="query-library.actions.save-history-query-button">Save query</Trans>
        </Button>
      </Stack>
    );
  }

  const resetForm = () => {
    reset();
    if (!selectedQueryRow.uid) {
      QueryLibraryInteractions.cancelSaveNewQueryClicked();
      setNewQuery(undefined);
    } else {
      QueryLibraryInteractions.cancelEditClicked();
    }
    setIsEditingQuery(false);
  };

  const onCancelEditClick = () => {
    if (isDirty && context !== 'unknown') {
      showDiscardAddQueryModal(resetForm);
    } else {
      resetForm();
    }
    // Closing the drawer if not in explore or panel editor
    if (context === 'unknown') {
      closeDrawer();
    }
  };

  let saveButtonText = '';
  if (isSavingLoading) {
    saveButtonText = t('explore.query-library.saving', 'Saving...');
  } else if (context === 'unknown') {
    saveButtonText = t('explore.query-library.save-and-close', 'Save and close');
  } else {
    saveButtonText = t('explore.query-library.save', 'Save');
  }

  return (
    <Stack wrap="wrap" justifyContent="end">
      {isEditingQuery || !selectedQueryRow.uid ? (
        <div className={styles.editActionsContainer}>
          <Stack alignItems="center">
            <Button variant="secondary" onClick={onCancelEditClick}>
              <Trans i18nKey="explore.query-library.cancel">Cancel</Trans>
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={(!isDirty && !!selectedQueryRow.uid) || isSavingLoading || !canEditQuery(selectedQueryRow)}
              icon={isSavingLoading ? 'spinner' : undefined}
              data-testid={selectors.components.queryLibraryDrawer.saveQueryButton}
            >
              {saveButtonText}
            </Button>
          </Stack>
        </div>
      ) : (
        <>
          <QueryLibraryMenuActions selectedQueryRow={selectedQueryRow} onEditQuerySuccess={onEditQuerySuccess} />
          {!isEditingQuery && selectedQueryRow.uid && context !== 'drilldown' && (
            <DrilldownExtensionPoint
              queries={[selectedQueryRow.query]}
              onExtensionClick={() => {
                triggerAnalyticsEvent(QueryLibraryInteractions.openInDrilldownClicked);
              }}
            />
          )}
          <Button
            data-testid={selectors.components.queryLibraryDrawer.confirm}
            disabled={hasTemplateVariables && context === 'explore'}
            onClick={() => {
              onSelectQuery(selectedQueryRow.query);
              closeDrawer(true);
              triggerAnalyticsEvent(QueryLibraryInteractions.selectQueryClicked, { hasTemplateVariables });
            }}
          >
            <Trans i18nKey="query-library.actions.select-query-button">Select query</Trans>
          </Button>
        </>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    editActionsContainer: css({
      marginLeft: 'auto',
    }),
  };
};
