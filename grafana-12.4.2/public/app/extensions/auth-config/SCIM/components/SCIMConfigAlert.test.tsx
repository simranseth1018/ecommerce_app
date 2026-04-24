import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SCIMSettingsData } from '../../../types';
import { SCIM_CONFIG_SOURCE } from '../constants';
import { renderWithRedux, setupMocks, cleanupMocks, mockSCIMSettingsWithStatic } from '../testUtils';

import { SCIMConfigAlert } from './SCIMConfigAlert';

describe('SCIMConfigAlert', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnResetClick = jest.fn();

  beforeEach(() => {
    setupMocks();
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  const defaultProps = {
    scimSettings: mockSCIMSettingsWithStatic,
    onResetClick: mockOnResetClick,
    isResetting: false,
  };

  it('should render when source is DATABASE', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Your configuration file contains SCIM settings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revert to use configuration file settings/i })).toBeInTheDocument();
  });

  it('should not render when source is FILE', () => {
    const settingsWithoutStatic: SCIMSettingsData = {
      ...mockSCIMSettingsWithStatic,
      source: SCIM_CONFIG_SOURCE.FILE,
    };

    const { container } = renderWithRedux(<SCIMConfigAlert {...defaultProps} scimSettings={settingsWithoutStatic} />);

    expect(container.firstChild).toBeNull();
  });

  it('should call onResetClick when reset button is clicked', async () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} />);

    const resetButton = screen.getByRole('button', { name: /Revert to use configuration file settings/i });
    await user.click(resetButton);

    expect(mockOnResetClick).toHaveBeenCalledTimes(1);
  });

  it('should disable reset button when isResetting is true', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} isResetting={true} />);

    const resetButton = screen.getByRole('button', { name: /Resetting.../i });
    expect(resetButton).toBeDisabled();
  });

  it('should show resetting text when isResetting is true', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} isResetting={true} />);

    expect(screen.getByText(/Resetting.../i)).toBeInTheDocument();
  });

  it('should show normal reset text when isResetting is false', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} isResetting={false} />);

    expect(screen.getByText(/Revert to use configuration file settings/i)).toBeInTheDocument();
  });

  it('should render with info severity alert', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} />);

    const alert = screen.getByRole('status');
    expect(alert).toBeInTheDocument();
  });

  it('should render reset button', () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} />);

    const resetButton = screen.getByRole('button', { name: /Revert to use configuration file settings/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('should handle different source settings data', () => {
    const customStaticSettings: SCIMSettingsData = {
      userSyncEnabled: true,
      groupSyncEnabled: false,
      rejectNonProvisionedUsers: true,
      source: SCIM_CONFIG_SOURCE.DATABASE,
    };

    renderWithRedux(<SCIMConfigAlert {...defaultProps} scimSettings={customStaticSettings} />);

    expect(screen.getByText('Configuration File Contains SCIM Settings')).toBeInTheDocument();
  });

  it('should not call onResetClick when button is disabled', async () => {
    renderWithRedux(<SCIMConfigAlert {...defaultProps} isResetting={true} />);

    const resetButton = screen.getByRole('button', { name: /Resetting.../i });
    await user.click(resetButton);

    expect(mockOnResetClick).not.toHaveBeenCalled();
  });
});
