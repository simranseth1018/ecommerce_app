import { createMockKeeper, keeperToListItem } from './mockData';

describe('mockData utilities', () => {
  describe('createMockKeeper', () => {
    it('creates AWS keeper with default config', () => {
      const keeper = createMockKeeper('test-aws', 'aws', 'Test AWS keeper');

      expect(keeper.metadata.name).toBe('test-aws');
      expect(keeper.spec.description).toBe('Test AWS keeper');
      expect(keeper.spec.aws).toBeDefined();
      expect(keeper.spec.aws?.region).toBe('us-east-1');
      expect(keeper.isActive).toBe(false);
    });

    it('creates AWS keeper with custom config', () => {
      const keeper = createMockKeeper('test-aws', 'aws', 'Test', false, {
        aws: {
          region: 'eu-west-1',
          accessKey: {
            accessKeyID: { secureValueName: 'key-id' },
            secretAccessKey: { secureValueName: 'secret-key' },
          },
        },
      });

      expect(keeper.spec.aws?.region).toBe('eu-west-1');
      expect(keeper.spec.aws?.accessKey).toBeDefined();
    });

    it('creates active keeper when specified', () => {
      const keeper = createMockKeeper('test', 'aws', 'Test', true);
      expect(keeper.isActive).toBe(true);
    });

    it('creates HashiCorp Vault keeper', () => {
      const keeper = createMockKeeper('vault', 'hashicorp', 'Test Vault');

      expect(keeper.spec.hashiCorpVault).toBeDefined();
      expect(keeper.spec.hashiCorpVault?.address).toBe('https://vault.company.com');
    });

    it('adds K8s metadata', () => {
      const keeper = createMockKeeper('test', 'aws', 'Test');

      expect(keeper.metadata.namespace).toBe('default');
      expect(keeper.metadata.creationTimestamp).toBeDefined();
      expect(keeper.metadata.labels).toEqual({
        'app.kubernetes.io/managed-by': 'grafana',
      });
    });
  });

  describe('keeperToListItem', () => {
    it('converts AWS keeper to list item', () => {
      const keeper = createMockKeeper('aws-test', 'aws', 'Test', true);
      const listItem = keeperToListItem(keeper);

      expect(listItem.name).toBe('aws-test');
      expect(listItem.type).toBe('aws');
      expect(listItem.description).toBe('Test');
      expect(listItem.isActive).toBe(true);
      expect(listItem.config).toBe('us-east-1');
    });

    it('converts Azure keeper to list item', () => {
      const keeper = createMockKeeper('azure-test', 'azure', 'Test');
      const listItem = keeperToListItem(keeper);

      expect(listItem.type).toBe('azure');
      expect(listItem.config).toBe('grafana-secrets-vault');
    });

    it('converts GCP keeper to list item', () => {
      const keeper = createMockKeeper('gcp-test', 'gcp', 'Test');
      const listItem = keeperToListItem(keeper);

      expect(listItem.type).toBe('gcp');
      expect(listItem.config).toBe('grafana-prod');
    });

    it('converts HashiCorp keeper to list item with valid URL', () => {
      const keeper = createMockKeeper('vault-test', 'hashicorp', 'Test');
      const listItem = keeperToListItem(keeper);

      expect(listItem.type).toBe('hashicorp');
      expect(listItem.config).toBe('vault.company.com');
    });

    it('handles invalid HashiCorp URL gracefully', () => {
      const keeper = createMockKeeper('vault-test', 'hashicorp', 'Test', false, {
        hashiCorpVault: {
          address: 'not-a-valid-url',
          token: { valueFromEnv: 'TOKEN' },
        },
      });
      const listItem = keeperToListItem(keeper);

      expect(listItem.config).toBe('not-a-valid-url');
    });

    it('defaults to system type when no specific type is configured', () => {
      const keeper = createMockKeeper('system-test', 'aws', 'Test');
      // Remove the aws config to simulate a keeper with no type-specific config
      keeper.spec.aws = undefined;

      const listItem = keeperToListItem(keeper);

      expect(listItem.type).toBe('system');
      expect(listItem.config).toBe('');
    });

    it('preserves creation timestamp', () => {
      const keeper = createMockKeeper('test', 'aws', 'Test');
      const listItem = keeperToListItem(keeper);

      expect(listItem.createdAt).toBe(keeper.metadata.creationTimestamp);
    });

    it('handles missing isActive field', () => {
      const keeper = createMockKeeper('test', 'aws', 'Test');
      keeper.isActive = undefined;

      const listItem = keeperToListItem(keeper);

      expect(listItem.isActive).toBe(false);
    });
  });
});
