import { ComponentType, useCallback } from 'react';

import { t } from '@grafana/i18n';
import { Stack, Text, Box, InteractiveTable, Column, IconButton } from '@grafana/ui';
import { AlertEnrichment } from 'app/extensions/api/clients/alertenrichment/v1beta1/endpoints.gen';
import { ProvisioningBadge } from 'app/features/alerting/unified/components/Provisioning';
import { K8sAnnotations } from 'app/features/alerting/unified/utils/k8s/constants';
import { isK8sEntityProvisioned, getAnnotation } from 'app/features/alerting/unified/utils/k8s/utils';

export interface EnrichmentSectionProps {
  title: string;
  subtitle: string;
  enrichments: AlertEnrichment[];
  showActions: boolean;
  emptyStateMessage: string;
  showSectionHeader?: boolean;
  canWrite?: boolean; // RBAC permission to write/edit enrichments
  onEdit?: (enrichment: AlertEnrichment) => void;
  onDelete?: (enrichment: AlertEnrichment) => void;
}

export const EnrichmentSection: ComponentType<EnrichmentSectionProps> = ({
  title,
  subtitle,
  enrichments,
  showActions,
  emptyStateMessage,
  showSectionHeader = true,
  canWrite = true, // Default to true for backward compatibility
  onEdit,
  onDelete,
}) => {
  const handleEdit = useCallback(
    (enrichment: AlertEnrichment) => {
      onEdit?.(enrichment);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (enrichment: AlertEnrichment) => {
      onDelete?.(enrichment);
    },
    [onDelete]
  );

  const createColumns = (showActionsLocal: boolean): Array<Column<AlertEnrichment>> => [
    {
      id: 'name',
      header: t('alerting.enrichment.table.enrichment', 'Enrichment'),
      cell: ({ row }) => {
        const enrichment = row.original;
        const spec = enrichment.spec;
        const enricherType = spec?.steps?.[0]?.enricher?.type;

        return (
          <Stack direction="column" gap={0}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Text color="primary">{enrichment.spec?.title || enrichment.metadata?.name || '<no title>'}</Text>
            </Stack>
            {enrichment.spec?.description && (
              <Text variant="bodySmall" color="secondary" truncate>
                {enrichment.spec.description}
              </Text>
            )}
            {enricherType && (
              <Text variant="bodySmall" color="secondary">
                {enricherType}
              </Text>
            )}
          </Stack>
        );
      },
    },
    {
      id: 'status',
      header: '',
      disableGrow: true,
      cell: ({ row }) => {
        const enrichment = row.original;
        const enrichmentIsProvisioned = isK8sEntityProvisioned(enrichment);
        const provenance = getAnnotation(enrichment, K8sAnnotations.Provenance);

        return (
          <Box paddingX={2} paddingY={1}>
            {enrichmentIsProvisioned && <ProvisioningBadge tooltip provenance={provenance} />}
          </Box>
        );
      },
    },
    ...(showActionsLocal
      ? [
          {
            id: 'actions',
            header: t('alerting.enrichment.table.actions', 'Actions'),
            disableGrow: true,
            cell: ({ row }: { row: { original: AlertEnrichment } }) => {
              const enrichment = row.original;
              const enrichmentIsProvisioned = isK8sEntityProvisioned(enrichment);
              // Enrichment is editable only if user has write permission AND enrichment is not provisioned
              const isEditable = canWrite && !enrichmentIsProvisioned;

              return (
                <Box paddingX={2} paddingY={1}>
                  <Stack direction="row" gap={1}>
                    <IconButton
                      name={isEditable ? 'edit' : 'eye'}
                      onClick={() => handleEdit(enrichment)}
                      tooltip={
                        isEditable
                          ? t('alerting.enrichment.drawer.edit-tooltip', 'Edit enrichment')
                          : t('alerting.enrichment.drawer.view-tooltip', 'View enrichment')
                      }
                      aria-label={
                        isEditable
                          ? t('alerting.enrichment.drawer.edit-aria-label', 'Edit enrichment')
                          : t('alerting.enrichment.drawer.view-aria-label', 'View enrichment')
                      }
                      size="sm"
                    />
                    {isEditable && (
                      <IconButton
                        name="trash-alt"
                        onClick={() => handleDelete(enrichment)}
                        tooltip={t('alerting.enrichment.drawer.delete-tooltip', 'Delete enrichment')}
                        aria-label={t('alerting.enrichment.drawer.delete-aria-label', 'Delete enrichment')}
                        size="sm"
                        variant="destructive"
                      />
                    )}
                  </Stack>
                </Box>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <Stack direction="column" gap={2}>
      {showSectionHeader && (
        <Text variant="h4" weight="medium">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      )}
      {enrichments.length > 0 ? (
        <InteractiveTable
          columns={createColumns(showActions)}
          data={enrichments}
          getRowId={(row) => `enrichment-${row.metadata?.name || ''}`}
          pageSize={0}
        />
      ) : (
        <Box
          padding={3}
          backgroundColor="secondary"
          borderRadius="default"
          borderStyle="dashed"
          borderColor="weak"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text variant="bodySmall" color="secondary" textAlignment="center">
            {emptyStateMessage}
          </Text>
        </Box>
      )}
    </Stack>
  );
};
