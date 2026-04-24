import { render, screen } from '@testing-library/react';

import { KeeperListItem } from '../types';

import { KeeperCard } from './KeeperCard';

describe('KeeperCard', () => {
  const mockKeeper: KeeperListItem = {
    name: 'aws-prod',
    type: 'aws',
    description: 'Production AWS Secrets Manager',
    isActive: false,
    config: 'us-east-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  };

  it('renders keeper name', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.getByText('aws-prod')).toBeInTheDocument();
  });

  it('renders keeper type label', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.getByText('AWS Secrets Manager')).toBeInTheDocument();
  });

  it('renders keeper configuration', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('renders keeper description when provided', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.getByText('Production AWS Secrets Manager')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const keeperWithoutDescription = { ...mockKeeper, description: '' };
    render(<KeeperCard keeper={keeperWithoutDescription} />);
    expect(screen.queryByText('Production AWS Secrets Manager')).not.toBeInTheDocument();
  });

  it('shows active badge when keeper is active', () => {
    const activeKeeper = { ...mockKeeper, isActive: true };
    render(<KeeperCard keeper={activeKeeper} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not show active badge when keeper is inactive', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('renders view details button with accessibility label', () => {
    render(<KeeperCard keeper={mockKeeper} />);
    expect(screen.getByRole('link', { name: /view details for aws-prod/i })).toBeInTheDocument();
  });

  it('handles missing config gracefully', () => {
    const keeperWithoutConfig = { ...mockKeeper, config: '' };
    render(<KeeperCard keeper={keeperWithoutConfig} />);
    expect(screen.queryByText('•')).not.toBeInTheDocument();
    expect(screen.queryByText('us-east-1')).not.toBeInTheDocument();
  });

  describe('keeper type labels', () => {
    it('renders AWS Secrets Manager', () => {
      const keeper = { ...mockKeeper, type: 'aws' as const };
      render(<KeeperCard keeper={keeper} />);
      expect(screen.getByText('AWS Secrets Manager')).toBeInTheDocument();
    });

    it('renders Azure Key Vault', () => {
      const keeper = { ...mockKeeper, type: 'azure' as const };
      render(<KeeperCard keeper={keeper} />);
      expect(screen.getByText('Azure Key Vault')).toBeInTheDocument();
    });

    it('renders GCP Secret Manager', () => {
      const keeper = { ...mockKeeper, type: 'gcp' as const };
      render(<KeeperCard keeper={keeper} />);
      expect(screen.getByText('GCP Secret Manager')).toBeInTheDocument();
    });

    it('renders HashiCorp Vault', () => {
      const keeper = { ...mockKeeper, type: 'hashicorp' as const };
      render(<KeeperCard keeper={keeper} />);
      expect(screen.getByText('HashiCorp Vault')).toBeInTheDocument();
    });

    it('renders System (Grafana)', () => {
      const keeper = { ...mockKeeper, type: 'system' as const };
      render(<KeeperCard keeper={keeper} />);
      expect(screen.getByText('System (Grafana)')).toBeInTheDocument();
    });
  });
});
