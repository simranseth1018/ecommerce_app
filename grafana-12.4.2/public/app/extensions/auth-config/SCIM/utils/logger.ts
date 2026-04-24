import { createMonitoringLogger } from '@grafana/runtime';

// Shared structured logging for SCIM operations
export const { logInfo, logError, logWarning, logMeasurement } = createMonitoringLogger('extensions.auth-config.scim', {
  module: 'SCIM',
});
