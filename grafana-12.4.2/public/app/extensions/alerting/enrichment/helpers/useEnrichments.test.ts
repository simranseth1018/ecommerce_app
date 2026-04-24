import { renderHook, act, waitFor, getWrapper } from 'test/test-utils';

import { addExtraMiddleware, addRootReducer } from 'app/store/configureStore';

import { generatedAPI } from '../../../api/clients/alertenrichment/v1beta1/endpoints.gen';
import { setupEnrichmentMockServer } from '../__mocks__/enrichmentApi';

import { useFilteredEnrichments } from './useEnrichments';

setupEnrichmentMockServer();

beforeAll(() => {
  addRootReducer({
    [generatedAPI.reducerPath]: generatedAPI.reducer,
  });
  addExtraMiddleware(generatedAPI.middleware);
});

describe('useEnrichments', () => {
  it('queries global and rule enrichments when ruleUid is provided', async () => {
    const { result } = renderHook(() => useFilteredEnrichments(1000, 'dev123'), {
      wrapper: getWrapper({}),
    });

    await waitFor(() => {
      expect(result.current.globalEnrichments).toMatchObject([
        { metadata: { name: 'global-enrichment', uid: 'uid-global' } },
      ]);
      expect(result.current.ruleLevelEnrichments).toMatchObject([
        { metadata: { name: 'rule-dev123-enrichment', uid: 'uid-rule-dev123' } },
      ]);
    });

    await act(async () => {
      await result.current.refetch();
    });
  });

  it('skips rule query when ruleUid is undefined', async () => {
    const { result } = renderHook(() => useFilteredEnrichments(1000, undefined), {
      wrapper: getWrapper({}),
    });

    await waitFor(() => {
      expect(result.current.globalEnrichments).toMatchObject([
        { metadata: { name: 'global-enrichment', uid: 'uid-global' } },
      ]);
      expect(result.current.ruleLevelEnrichments).toEqual([]);
    });
  });
});
