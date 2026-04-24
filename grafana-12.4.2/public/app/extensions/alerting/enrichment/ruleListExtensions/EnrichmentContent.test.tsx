import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from 'test/test-utils';

import { grantPermissionsHelper } from 'app/features/alerting/unified/test/test-utils';
import { isLLMPluginEnabled } from 'app/features/dashboard/components/GenAI/utils';
import { addExtraMiddleware, addRootReducer } from 'app/store/configureStore';
import { AccessControlAction } from 'app/types/accessControl';

import { generatedAPI } from '../../../api/clients/alertenrichment/v1beta1/endpoints.gen';
import { setupEnrichmentMockServer, mockAlertEnrichmentList } from '../__mocks__/enrichmentApi';

import { EnrichmentContent } from './EnrichmentContent';

jest.mock('app/features/dashboard/components/GenAI/utils');

setupEnrichmentMockServer();

beforeAll(() => {
  addRootReducer({
    [generatedAPI.reducerPath]: generatedAPI.reducer,
  });
  addExtraMiddleware(generatedAPI.middleware);
});

describe('EnrichmentContent', () => {
  const mockEnrichments = mockAlertEnrichmentList();

  const defaultProps = {
    ruleLevelEnrichments: mockEnrichments.items ?? [],
    globalEnrichments: [],
    ruleUid: 'test-rule-uid',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isLLMPluginEnabled).mockResolvedValue(false);
  });

  it('should show "Add alert enrichment" button when user has write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsWrite]);

    render(<EnrichmentContent {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Add alert enrichment')).toBeInTheDocument();
    });
  });

  it('should hide "Add alert enrichment" button when user lacks write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsRead]);

    render(<EnrichmentContent {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Add alert enrichment')).not.toBeInTheDocument();
    });
  });

  it('should show edit icon for enrichments when user has write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsWrite]);

    render(<EnrichmentContent {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit enrichment/i })).toBeInTheDocument();
    });
  });

  it('should show eye icon for enrichments when user lacks write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsRead]);

    render(<EnrichmentContent {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view enrichment/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /edit enrichment/i })).not.toBeInTheDocument();
  });

  it('should render form as read-only when user lacks write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsRead]);

    const user = userEvent.setup();
    render(<EnrichmentContent {...defaultProps} />);

    // Wait for the component to be fully loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view enrichment/i })).toBeInTheDocument();
    });

    const viewButton = screen.getByRole('button', { name: /view enrichment/i });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('View Enrichment')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should render form as editable when user has write permission', async () => {
    grantPermissionsHelper([AccessControlAction.AlertingEnrichmentsWrite]);

    const user = userEvent.setup();
    render(<EnrichmentContent {...defaultProps} />);

    // Wait for the component to be fully loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit enrichment/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit enrichment/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Enrichment')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show both read and write features for admin users', async () => {
    jest.spyOn(require('app/features/alerting/unified/utils/misc'), 'isAdmin').mockReturnValue(true);
    grantPermissionsHelper([]);

    render(<EnrichmentContent {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Add alert enrichment')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /edit enrichment/i })).toBeInTheDocument();
  });
});
