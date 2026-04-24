import { ComponentType, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useAsync } from 'react-use';

import { t, Trans } from '@grafana/i18n';
import { Stack, Text, Button, Field, Input, TextArea, Divider, Dropdown, Menu, FieldSet } from '@grafana/ui';
import { AlertEnrichment } from 'app/extensions/api/clients/alertenrichment/v1beta1/endpoints.gen';
import { logError } from 'app/features/alerting/unified/Analytics';
import { ProvisioningAlert, ProvisionedResource } from 'app/features/alerting/unified/components/Provisioning';
import { EnrichmentAction, useEnrichmentAbility } from 'app/features/alerting/unified/hooks/useAbilities';
import { isK8sEntityProvisioned } from 'app/features/alerting/unified/utils/k8s/utils';
import { isLLMPluginEnabled } from 'app/features/dashboard/components/GenAI/utils';

import { useDeleteAlertEnrichmentMutation } from '../../../api/clients/alertenrichment/v1beta1';
import { DeleteEnrichmentModal } from '../components/DeleteEnrichmentModal';
import { EnricherConfigSection } from '../form/EnricherConfigSection';
import {
  getEnricherTypeOptions,
  getInitialFormData,
  AlertEnrichmentFormData,
  useEnrichmentCreation,
  useEnrichmentUpdate,
  getInitialFormDataForType,
  EnrichmentType,
} from '../form/form';

import { EnrichmentSection } from './EnrichmentSection';

export interface EnrichmentContentProps {
  ruleLevelEnrichments: AlertEnrichment[];
  globalEnrichments: AlertEnrichment[];
  ruleUid: string;
  onDeleteEnrichment?: (enrichmentId: string) => void;
  showRuleEnrichments?: boolean;
  showGlobalEnrichments?: boolean;
  showAddForm?: boolean;
  showSectionHeader?: boolean;
  onEnrichmentCreated?: () => void;
  onEnrichmentUpdated?: () => void;
}

export const EnrichmentContent: ComponentType<EnrichmentContentProps> = ({
  ruleLevelEnrichments,
  globalEnrichments,
  onDeleteEnrichment,
  ruleUid,
  showRuleEnrichments = true,
  showGlobalEnrichments = true,
  showAddForm = true,
  showSectionHeader = true,
  onEnrichmentCreated,
  onEnrichmentUpdated,
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [enrichmentSelected, setEnrichmentSelected] = useState<AlertEnrichment | null>(null);
  const [enrichmentToDelete, setEnrichmentToDelete] = useState<AlertEnrichment | null>(null);
  const { value: llmEnabled } = useAsync(isLLMPluginEnabled);

  const [deleteEnrichmentMutation] = useDeleteAlertEnrichmentMutation();

  const [, canWrite] = useEnrichmentAbility(EnrichmentAction.Write);

  const form = useForm<AlertEnrichmentFormData>({
    defaultValues: getInitialFormData(),
  });

  const handleAddNew = (enrichmentType: EnrichmentType) => {
    setIsEditMode(false);
    setEnrichmentSelected(null);

    // Populate form with the selected enrichment type and default values
    const formData = getInitialFormDataForType(enrichmentType);
    formData.alertRuleUids = [ruleUid]; // Set the rule uid for the new enrichment

    // Create new: Reset with type-specific defaults
    form.reset(formData);
    setIsFormVisible(true);
  };

  const handleEdit = (enrichment: AlertEnrichment) => {
    setEnrichmentSelected(enrichment);
    setIsEditMode(true);

    // Populate form with existing data - same pattern as EditEnrichment
    const formData = getInitialFormData(enrichment);
    form.reset(formData);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setIsEditMode(false);
    setEnrichmentSelected(null);
    // Cancel: Reset to clean state
    form.reset(getInitialFormData());
  };

  const handleEnrichmentCreated = () => {
    handleCancel();
    onEnrichmentCreated?.();
  };

  const handleEnrichmentUpdated = () => {
    handleCancel();
    onEnrichmentUpdated?.();
  };

  const { createEnrichment, isLoading: isCreating } = useEnrichmentCreation(
    'enrichmentContent',
    handleEnrichmentCreated
  );

  const { updateEnrichment, isLoading: isUpdating } = useEnrichmentUpdate('enrichmentContent', handleEnrichmentUpdated);

  const handleSubmit = async (data: AlertEnrichmentFormData) => {
    if (isEditMode && enrichmentSelected) {
      // Update existing enrichment
      await updateEnrichment(enrichmentSelected, data);
    } else {
      // Create new enrichment
      await createEnrichment(data);
    }
  };

  const handleDelete = useCallback((enrichment: AlertEnrichment) => {
    setEnrichmentToDelete(enrichment);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (enrichmentToDelete?.metadata?.name) {
      await deleteEnrichmentMutation({ name: enrichmentToDelete.metadata.name });
      setEnrichmentToDelete(null);
      // Call the optional callback if provided
      if (onDeleteEnrichment) {
        onDeleteEnrichment(enrichmentToDelete.metadata.name);
      }
    } else {
      logError(new Error('No enrichment to delete', { cause: 'Enrichment has no metadata.name defined' }));
    }
  }, [deleteEnrichmentMutation, enrichmentToDelete, onDeleteEnrichment]);

  const handleCancelDelete = useCallback(() => {
    setEnrichmentToDelete(null);
  }, []);

  const renderAddForm = () => {
    if (!showAddForm || !isFormVisible) {
      return null;
    }

    const enrichmentIsProvisioned = enrichmentSelected ? isK8sEntityProvisioned(enrichmentSelected) : false;
    // Form should be read-only if user lacks write permission OR enrichment is provisioned
    const isEnrichmentReadOnly = !canWrite || enrichmentIsProvisioned;

    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Stack direction="column" gap={3}>
            <Text variant="h6" weight="medium">
              {isEditMode ? (
                isEnrichmentReadOnly ? (
                  <Trans i18nKey="alerting.enrichment.drawer.view-section">View Enrichment</Trans>
                ) : (
                  <Trans i18nKey="alerting.enrichment.drawer.edit-section">Edit Enrichment</Trans>
                )
              ) : (
                <Trans i18nKey="alerting.enrichment.drawer.create-section">Create New Enrichment</Trans>
              )}
            </Text>

            {enrichmentIsProvisioned && <ProvisioningAlert resource={ProvisionedResource.AlertEnrichment} />}

            {/* Basic Info Section */}
            <FieldSet disabled={isEnrichmentReadOnly}>
              <Stack direction="column" gap={3}>
                <Stack direction="column" gap={2}>
                  <Field label={t('alert-enrichment-form.basic-info.name', 'Enrichment Name')} noMargin htmlFor="title">
                    <Input
                      {...form.register('title', {
                        required: t('alert-enrichment-form.basic-info.name-required', 'Name is required'),
                      })}
                      placeholder={t('alert-enrichment-form.basic-info.name-placeholder', 'my-enrichment')}
                      invalid={!!form.formState.errors.title}
                      id="title"
                    />
                  </Field>

                  <Field
                    label={t('alert-enrichment-form.basic-info.description', 'Description (Optional)')}
                    noMargin
                    htmlFor="description"
                  >
                    <TextArea
                      {...form.register('description')}
                      placeholder={t(
                        'alert-enrichment-form.basic-info.description-placeholder',
                        'Description of the enrichment'
                      )}
                      rows={2}
                      id="description"
                    />
                  </Field>

                  <Field
                    label={t('alert-enrichment-form.basic-info.timeout', 'Timeout')}
                    noMargin
                    description={t(
                      'alert-enrichment-form.basic-info.timeout-description',
                      'Maximum time allowed for this enrichment (e.g., 30s, 1m)'
                    )}
                    htmlFor="steps.0.timeout"
                  >
                    <Input
                      {...form.register('steps.0.timeout')}
                      placeholder={t('alert-enrichment-form.basic-info.timeout-placeholder', '30s')}
                      id="steps.0.timeout"
                    />
                  </Field>
                </Stack>

                {/* Enricher Config Section */}
                <EnricherConfigSection llmEnabled={llmEnabled ?? false} />
              </Stack>
            </FieldSet>

            {/* Form Actions */}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={isUpdating || isCreating}>
                {isEnrichmentReadOnly ? (
                  <Trans i18nKey="alerting.enrichment.drawer.close">Close</Trans>
                ) : (
                  <Trans i18nKey="alerting.enrichment.drawer.cancel">Cancel</Trans>
                )}
              </Button>
              {!isEnrichmentReadOnly && (
                <Button type="submit" variant="primary" disabled={isUpdating || isCreating}>
                  {isUpdating || isCreating ? (
                    <Trans i18nKey="alerting.enrichment.drawer.saving">Saving...</Trans>
                  ) : (
                    <Trans i18nKey="alerting.enrichment.drawer.save">Save</Trans>
                  )}
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    );
  };

  return (
    <Stack direction="column" gap={3}>
      {/* Rule Enrichments Section */}
      {showRuleEnrichments && (
        <>
          <EnrichmentSection
            title={t('alerting.enrichment.drawer.rule-enrichments-title', 'Rule Enrichments')}
            subtitle={t(
              'alerting.enrichment.rule-enrichment-subtitle',
              'Add additional enrichments specific for this alert rule.'
            )}
            enrichments={ruleLevelEnrichments}
            showActions={true}
            canWrite={canWrite}
            emptyStateMessage={t(
              'alerting.enrichment.drawer.rule-empty-state',
              'No enrichments configured yet.\nUse the dropdown below to add your first enrichment.'
            )}
            showSectionHeader={showSectionHeader}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Add New Enrichment Section for Rule Enrichments */}
          {!isFormVisible && canWrite && (
            <Stack gap={0}>
              <Dropdown
                overlay={
                  <Menu>
                    {getEnricherTypeOptions().map((option) => (
                      <Menu.Item
                        key={option.value}
                        label={option.label || option.value}
                        onClick={() => handleAddNew(option.value)}
                      />
                    ))}
                  </Menu>
                }
              >
                <Button variant="secondary" icon="angle-down" size="md">
                  <Trans i18nKey="alerting.enrichment.drawer.add-button">Add alert enrichment</Trans>
                </Button>
              </Dropdown>
            </Stack>
          )}
        </>
      )}

      {/* Divider between sections if both are shown */}
      {showRuleEnrichments && showGlobalEnrichments && <Divider />}

      {/* Global Enrichments Section */}
      {showGlobalEnrichments && (
        <EnrichmentSection
          title={t('alerting.enrichment.drawer.global-enrichments-title', 'Global Enrichments')}
          subtitle={t(
            'alerting.enrichment.global-enrichment-subtitle',
            'Some enrichments for this alert rule have already been configured under Alerting > Settings.'
          )}
          enrichments={globalEnrichments}
          showActions={false}
          emptyStateMessage={t(
            'alerting.enrichment.drawer.global-empty-state',
            'No global enrichments available.\nGlobal enrichments are managed separately and applied to all alert rules.'
          )}
          showSectionHeader={showSectionHeader}
        />
      )}

      {/* Add Form */}
      {renderAddForm()}

      {/* Delete Confirmation Modal */}
      {enrichmentToDelete && (
        <DeleteEnrichmentModal
          enrichment={enrichmentToDelete}
          onConfirm={handleConfirmDelete}
          onDismiss={handleCancelDelete}
        />
      )}
    </Stack>
  );
};
