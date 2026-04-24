import { useListAlertEnrichmentQuery } from '../../../api/clients/alertenrichment/v1beta1';
import {
  DEFAULT_ENRICHMENTS_LIMIT,
  ENRICHMENT_RULE_UID_LABEL_PREFIX,
  GLOBAL_ENRICHMENT_SCOPE_LABEL_SELECTOR,
} from '../constants';

export function useFilteredEnrichments(limit = DEFAULT_ENRICHMENTS_LIMIT, ruleUid?: string) {
  const {
    data: globalData,
    refetch: refetchGlobal,
    isLoading: isLoadingGlobal,
    isFetching: isFetchingGlobal,
    error: globalError,
  } = useListAlertEnrichmentQuery({ limit, labelSelector: GLOBAL_ENRICHMENT_SCOPE_LABEL_SELECTOR });

  const labelSelectorForRule = ruleUid ? `${ENRICHMENT_RULE_UID_LABEL_PREFIX}.${ruleUid}` : undefined;
  const {
    data: ruleData,
    refetch: refetchRule,
    isLoading: isLoadingRule,
    isFetching: isFetchingRule,
    error: ruleError,
  } = useListAlertEnrichmentQuery({ limit, labelSelector: labelSelectorForRule }, { skip: !labelSelectorForRule });

  const ruleItems = ruleData?.items ?? [];
  const globalItems = globalData?.items ?? [];

  const refetch = async (): Promise<void> => {
    await refetchGlobal();
    if (labelSelectorForRule) {
      await refetchRule();
    }
  };

  return {
    ruleLevelEnrichments: ruleItems,
    globalEnrichments: globalItems,
    refetch,
    isLoading: isLoadingGlobal || isLoadingRule,
    isFetching: isFetchingGlobal || isFetchingRule,
    error: globalError ?? ruleError,
  };
}
