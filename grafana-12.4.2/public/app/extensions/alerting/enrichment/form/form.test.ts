import type { FeatureToggles } from '@grafana/data';
import { config } from '@grafana/runtime';

import { AlertEnrichment } from '../../../api/clients/alertenrichment/v1beta1/endpoints.gen';

import { getEnricherTypeOptions, getInitialFormData } from './form';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    featureToggles: {},
  },
}));

describe('getEnricherTypeOptions', () => {
  beforeEach(() => {
    config.featureToggles = {} as FeatureToggles;
  });

  it('should return standard enricher types without Assistant Investigations when feature toggle is disabled', () => {
    config.featureToggles.alertingEnrichmentAssistantInvestigations = false;

    const options = getEnricherTypeOptions();

    const optionValues = options.map((option) => option.value);
    const optionLabels = options.map((option) => option.label);

    // Should include all standard types
    expect(optionValues).toContain('assign');
    expect(optionValues).toContain('external');
    expect(optionValues).toContain('dsquery');
    expect(optionValues).toContain('asserts');
    expect(optionValues).toContain('sift');
    expect(optionValues).toContain('explain');

    // Should not include assistant
    expect(optionValues).not.toContain('assistant');
    expect(optionLabels).not.toContain('Assistant Investigations');
    expect(options).toHaveLength(6);
  });

  it('should return standard enricher types without Assistant Investigations when feature toggle is undefined', () => {
    // Feature toggle not set at all
    delete config.featureToggles.alertingEnrichmentAssistantInvestigations;

    const options = getEnricherTypeOptions();

    const optionValues = options.map((option) => option.value);
    expect(optionValues).not.toContain('assistant');
    expect(options).toHaveLength(6);
  });

  it('should include Assistant Investigations when feature toggle is enabled', () => {
    config.featureToggles.alertingEnrichmentAssistantInvestigations = true;

    const options = getEnricherTypeOptions();

    const optionValues = options.map((option) => option.value);
    const optionLabels = options.map((option) => option.label);

    // Should include all standard types
    expect(optionValues).toContain('assign');
    expect(optionValues).toContain('external');
    expect(optionValues).toContain('dsquery');
    expect(optionValues).toContain('asserts');
    expect(optionValues).toContain('sift');
    expect(optionValues).toContain('explain');

    // Should also include assistant
    expect(optionValues).toContain('assistant');
    expect(optionLabels).toContain('Assistant Investigations');
    expect(options).toHaveLength(7);

    const assistantInvestigationsOption = options.find((option) => option.value === 'assistant');
    expect(assistantInvestigationsOption).toEqual({
      description: 'Start Assistant Investigation for alerts',
      label: 'Assistant Investigations',
      value: 'assistant',
    });
  });
});

describe('getInitialFormData', () => {
  it('should fix existing enrichments with missing dataSource.type field', () => {
    // Create an enrichment with empty dataSource.type
    const enrichmentWithBug: AlertEnrichment = {
      metadata: {
        name: 'test-enrichment',
      },
      spec: {
        title: 'Test Enrichment',
        steps: [
          {
            timeout: '30s',
            type: 'enricher',
            enricher: {
              type: 'dsquery',
              dataSource: {
                type: '' as any, // Bug: empty type
                raw: {
                  request: {
                    queries: [
                      {
                        refId: 'A',
                        datasource: { uid: 'test-uid', type: 'loki' },
                      },
                    ],
                  },
                  refId: 'A',
                },
              },
            },
          },
        ],
      },
    };

    const formData = getInitialFormData(enrichmentWithBug);

    // Verify the dataSource.type is fixed to 'raw'
    expect(formData.steps[0].enricher?.type).toBe('dsquery');
    expect(formData.steps[0].enricher?.dataSource?.type).toBe('raw');
    expect(formData.steps[0].enricher?.dataSource?.raw?.request?.queries).toHaveLength(1);
  });

  it('should not modify enrichments with valid dataSource.type', () => {
    const validEnrichment: AlertEnrichment = {
      metadata: {
        name: 'test-enrichment',
      },
      spec: {
        title: 'Test Enrichment',
        steps: [
          {
            timeout: '30s',
            type: 'enricher',
            enricher: {
              type: 'dsquery',
              dataSource: {
                type: 'raw',
                raw: {
                  request: {
                    queries: [
                      {
                        refId: 'A',
                        datasource: { uid: 'test-uid', type: 'loki' },
                      },
                    ],
                  },
                  refId: 'A',
                },
              },
            },
          },
        ],
      },
    };

    const formData = getInitialFormData(validEnrichment);

    // Verify the dataSource.type remains 'raw'
    expect(formData.steps[0].enricher?.type).toBe('dsquery');
    expect(formData.steps[0].enricher?.dataSource?.type).toBe('raw');
  });
});
