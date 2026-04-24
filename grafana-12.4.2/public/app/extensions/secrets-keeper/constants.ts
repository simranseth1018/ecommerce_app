import { config } from '@grafana/runtime';

export const SECRETS_KEEPER_BASE_URL = `${config.appSubUrl}/admin/secrets/keepers`;
export const SECRETS_KEEPER_NEW_URL = `${SECRETS_KEEPER_BASE_URL}/new`;
