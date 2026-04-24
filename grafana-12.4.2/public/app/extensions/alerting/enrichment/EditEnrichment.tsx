import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom-v5-compat';
import { useAsync } from 'react-use';

import { NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { Alert } from '@grafana/ui';
import { EntityNotFound } from 'app/core/components/PageNotFound/EntityNotFound';
import { AlertingPageWrapper } from 'app/features/alerting/unified/components/AlertingPageWrapper';
import { ProvisioningAlert, ProvisionedResource } from 'app/features/alerting/unified/components/Provisioning';
import { isK8sEntityProvisioned } from 'app/features/alerting/unified/utils/k8s/utils';
import { stringifyErrorLike } from 'app/features/alerting/unified/utils/misc';
import { isLLMPluginEnabled } from 'app/features/dashboard/components/GenAI/utils';

import { AlertEnrichment, generatedAPI } from '../../api/clients/alertenrichment/v1beta1/endpoints.gen';
import { enrichmentNav } from '../navigation';

import { AlertEnrichmentForm } from './form/AlertEnrichmentForm';
import { AlertEnrichmentFormData, getInitialFormData, useEnrichmentUpdate } from './form/form';
import { useEditEnrichmentNavModel } from './navigation';

function EditEnrichment() {
  const { enrichmentK8sName } = useParams<{ enrichmentK8sName: string }>();
  const pageNav: NavModelItem = useEditEnrichmentNavModel(enrichmentK8sName);

  const {
    data: enrichment,
    isLoading,
    error,
  } = generatedAPI.useGetAlertEnrichmentQuery(enrichmentK8sName ? { name: enrichmentK8sName } : skipToken);

  if (error) {
    return (
      <AlertingPageWrapper navId="alerting-admin" pageNav={pageNav}>
        <Alert severity="error" title={t('alerting.enrichment.load-error', 'Failed to load enrichment')}>
          {stringifyErrorLike(error)}
        </Alert>
      </AlertingPageWrapper>
    );
  }

  if (!isLoading && !enrichment) {
    return (
      <AlertingPageWrapper navId="alerting-admin" pageNav={pageNav}>
        <EntityNotFound entity="Alert Enrichment" />
      </AlertingPageWrapper>
    );
  }

  return (
    <AlertingPageWrapper navId="alerting-admin" pageNav={pageNav} isLoading={isLoading}>
      {enrichment && <ExistingEnrichmentForm enrichment={enrichment} />}
    </AlertingPageWrapper>
  );
}

function ExistingEnrichmentForm({ enrichment }: { enrichment: AlertEnrichment }) {
  const { value: llmEnabled } = useAsync(isLLMPluginEnabled);

  const onCancel = () => {
    locationService.push(enrichmentNav.list);
  };

  // Use the custom hook for enrichment updates
  const { updateEnrichment, isLoading: isUpdating } = useEnrichmentUpdate('enrichmentForm', () => {
    // Redirect to enrichments list page after successful update
    locationService.push(enrichmentNav.list);
  });

  const onSubmit = async (formData: AlertEnrichmentFormData) => {
    await updateEnrichment(enrichment, formData);
  };

  const enrichmentIsProvisioned = isK8sEntityProvisioned(enrichment);

  const editPayload = getInitialFormData(enrichment);
  return (
    <>
      {enrichmentIsProvisioned && <ProvisioningAlert resource={ProvisionedResource.AlertEnrichment} />}
      <AlertEnrichmentForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        editPayload={editPayload}
        isLoading={isUpdating}
        llmEnabled={!!llmEnabled}
        readOnly={enrichmentIsProvisioned}
      />
    </>
  );
}

export default EditEnrichment;
