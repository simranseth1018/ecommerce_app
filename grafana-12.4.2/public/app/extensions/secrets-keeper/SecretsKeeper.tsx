import { css } from '@emotion/css';
import { useMemo } from 'react';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { LinkButton, useStyles2, Alert, EmptyState } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { KeeperCard } from './components/KeeperCard';
import { SECRETS_KEEPER_NEW_URL } from './constants';
import { useKeepers } from './hooks/useKeepers';

export const SecretsKeeper = (): JSX.Element => {
  const { keepers, isLoading, error, activeKeeper } = useKeepers();
  const styles = useStyles2(getStyles);

  const pageNav: NavModelItem = useMemo(
    () => ({
      text: t('secrets-keeper.home.title', 'Secrets Keepers'),
      children: [
        {
          text: t('secrets.tabs.values', 'Values'),
          url: '/admin/secrets',
          active: false,
        },
        // Only show Keepers tab if feature flag is enabled
        ...(config.featureToggles.secretsKeeperUI
          ? [
              {
                text: t('secrets.tabs.keepers', 'Keepers'),
                url: '/admin/secrets/keepers',
                active: true,
              },
            ]
          : []),
      ],
    }),
    []
  );

  const activeKeeperText = activeKeeper
    ? t('secrets-keeper.home.active-keeper', 'Active keeper: {{name}} ({{type}})', {
        name: activeKeeper.name,
        type: activeKeeper.type,
      })
    : '';

  const header = (
    <div className={styles.header}>
      <div>{activeKeeper && <div className={styles.activeInfo}>{activeKeeperText}</div>}</div>
      <LinkButton href={SECRETS_KEEPER_NEW_URL} icon="plus" variant="primary">
        {t('secrets-keeper.home.add-keeper', 'Add keeper')}
      </LinkButton>
    </div>
  );

  const errorState = (
    <Alert title={t('secrets-keeper.home.error-title', 'Error loading keepers')}>{error?.message}</Alert>
  );

  const emptyStateDescription = t(
    'secrets-keeper.home.empty-state',
    'Secrets keepers allow you to store Grafana secrets in external services like AWS Secrets Manager or HashiCorp Vault.'
  );

  const emptyState = (
    <EmptyState
      variant="call-to-action"
      message={t('secrets-keeper.home.empty-title', 'No keepers configured')}
      button={
        <LinkButton href={SECRETS_KEEPER_NEW_URL} icon="plus">
          {t('secrets-keeper.home.add-first-keeper', 'Add your first keeper')}
        </LinkButton>
      }
    >
      {emptyStateDescription}
    </EmptyState>
  );

  const keepersList = (
    <div className={styles.list}>
      {keepers.map((keeper) => (
        <KeeperCard key={keeper.name} keeper={keeper} />
      ))}
    </div>
  );

  return (
    <Page
      navId="secrets-management"
      pageNav={pageNav}
      subTitle={t('secrets-keeper.home.subtitle', 'Manage external secrets storage for Grafana')}
    >
      <Page.Contents isLoading={isLoading}>
        {header}
        {error && errorState}
        {!isLoading && keepers.length === 0 && emptyState}
        {keepers.length > 0 && keepersList}
      </Page.Contents>
    </Page>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  }),
  activeInfo: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(0.5),
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
});

export default SecretsKeeper;
