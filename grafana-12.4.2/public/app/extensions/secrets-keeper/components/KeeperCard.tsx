import { css } from '@emotion/css';
import { memo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { LinkButton, useStyles2, Badge } from '@grafana/ui';

import { KeeperListItem } from '../types';

interface KeeperCardProps {
  keeper: KeeperListItem;
}

const KeeperCardComponent = ({ keeper }: KeeperCardProps): JSX.Element => {
  const styles = useStyles2(getStyles);

  const titleSection = (
    <div className={styles.cardTitle}>
      {keeper.name}
      {keeper.isActive && (
        <Badge
          text={t('secrets-keeper.home.active-badge', 'Active')}
          color="green"
          icon="check"
          className={styles.activeBadge}
        />
      )}
    </div>
  );

  const metaSection = (
    <div className={styles.cardMeta}>
      <span className={styles.type}>{getKeeperTypeLabel(keeper.type)}</span>
      {keeper.config && (
        <>
          <span className={styles.separator}>•</span>
          <span className={styles.config}>{keeper.config}</span>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        {/* Groups title and metadata for flexbox layout */}
        <div>
          {titleSection}
          {metaSection}
        </div>
        <LinkButton
          href="#"
          variant="secondary"
          size="sm"
          aria-label={t('secrets-keeper.home.view-details-aria', 'View details for {{name}}', { name: keeper.name })}
        >
          {t('secrets-keeper.home.view-details', 'View details')}
        </LinkButton>
      </div>
      {keeper.description && <div className={styles.cardDescription}>{keeper.description}</div>}
    </div>
  );
};

const getKeeperTypeLabel = (type: KeeperListItem['type']): string => {
  const labels: Record<KeeperListItem['type'], string> = {
    aws: t('secrets-keeper.type.aws', 'AWS Secrets Manager'),
    azure: t('secrets-keeper.type.azure', 'Azure Key Vault'),
    gcp: t('secrets-keeper.type.gcp', 'GCP Secret Manager'),
    hashicorp: t('secrets-keeper.type.hashicorp', 'HashiCorp Vault'),
    system: t('secrets-keeper.type.system', 'System (Grafana)'),
  };
  return labels[type];
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    padding: theme.spacing(2),
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    '&:hover': {
      background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
      borderColor: theme.colors.border.medium,
    },
  }),
  cardHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1),
  }),
  cardTitle: css({
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  activeBadge: css({
    marginLeft: theme.spacing(1),
  }),
  cardMeta: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
  type: css({
    fontWeight: theme.typography.fontWeightMedium,
  }),
  separator: css({
    color: theme.colors.text.disabled,
  }),
  config: css({
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
  cardDescription: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing(1),
  }),
});

export const KeeperCard = memo(KeeperCardComponent);
