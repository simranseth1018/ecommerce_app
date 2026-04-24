import { Keeper, KeeperListItem, KeeperType } from '../types';

export const createMockKeeper = (
  name: string,
  type: KeeperType,
  description: string,
  isActive = false,
  config?: Partial<Keeper['spec']>
): Keeper => {
  const baseKeeper: Keeper = {
    metadata: {
      name,
      namespace: 'default',
      // Random time within last 7 days
      creationTimestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      labels: {
        'app.kubernetes.io/managed-by': 'grafana',
      },
    },
    spec: {
      description,
      ...config,
    },
    isActive,
  };

  switch (type) {
    case 'aws':
      baseKeeper.spec.aws = config?.aws || {
        region: 'us-east-1',
        assumeRole: {
          assumeRoleArn: 'arn:aws:iam::123456789012:role/GrafanaSecretsRole',
          externalID: 'grafana-external-id',
        },
      };
      break;
    case 'azure':
      baseKeeper.spec.azure = config?.azure || {
        keyVaultName: 'grafana-secrets-vault',
        tenantID: 'tenant-uuid-here',
        clientID: 'client-uuid-here',
        clientSecret: {
          secureValueName: 'azure-client-secret',
        },
      };
      break;
    case 'gcp':
      baseKeeper.spec.gcp = config?.gcp || {
        projectID: 'grafana-prod',
        credentialsFile: '/etc/grafana/gcp-credentials.json',
      };
      break;
    case 'hashicorp':
      baseKeeper.spec.hashiCorpVault = config?.hashiCorpVault || {
        address: 'https://vault.company.com',
        token: {
          valueFromEnv: 'VAULT_TOKEN',
        },
      };
      break;
    case 'system':
      // System keeper uses Grafana's internal storage - no additional config needed
      break;
  }

  return baseKeeper;
};

export const keeperToListItem = (keeper: Keeper): KeeperListItem => {
  let type: KeeperType = 'system';
  let config = '';

  if (keeper.spec.aws) {
    type = 'aws';
    config = keeper.spec.aws.region;
  } else if (keeper.spec.azure) {
    type = 'azure';
    config = keeper.spec.azure.keyVaultName;
  } else if (keeper.spec.gcp) {
    type = 'gcp';
    config = keeper.spec.gcp.projectID;
  } else if (keeper.spec.hashiCorpVault) {
    type = 'hashicorp';
    try {
      config = new URL(keeper.spec.hashiCorpVault.address).hostname;
    } catch {
      config = keeper.spec.hashiCorpVault.address;
    }
  }

  return {
    name: keeper.metadata.name,
    type,
    description: keeper.spec.description,
    isActive: keeper.isActive || false,
    createdAt: keeper.metadata.creationTimestamp,
    config,
  };
};

export const MOCK_KEEPERS: Keeper[] = [
  createMockKeeper('aws-prod', 'aws', 'Production AWS Secrets Manager', true),
  createMockKeeper('aws-staging', 'aws', 'Staging AWS Secrets Manager', false, {
    aws: {
      region: 'us-west-2',
      accessKey: {
        accessKeyID: { secureValueName: 'aws-access-key-staging' },
        secretAccessKey: { secureValueName: 'aws-secret-key-staging' },
      },
    },
  }),
  createMockKeeper('azure-prod', 'azure', 'Production Azure Key Vault', false),
  createMockKeeper('vault-internal', 'hashicorp', 'Internal HashiCorp Vault', false),
];

export const MOCK_KEEPER_LIST: KeeperListItem[] = MOCK_KEEPERS.map(keeperToListItem);
