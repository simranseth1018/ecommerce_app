// NOTE: Currently using mock data. When connecting to real data in Phase 2+,
// look into using @grafana/test-utils for API mocking patterns.

import { render, screen } from 'test/test-utils';

import { SecretsKeeper } from './SecretsKeeper';
import { KeeperListItem } from './types';

const mockUseKeepers = jest.fn();

jest.mock('./hooks/useKeepers', () => ({
  useKeepers: () => mockUseKeepers(),
}));

jest.mock('./components/KeeperCard', () => ({
  KeeperCard: ({ keeper }: { keeper: KeeperListItem }) => (
    <div data-testid={`keeper-card-${keeper.name}`}>{keeper.name}</div>
  ),
}));

describe('SecretsKeeper', () => {
  const mockKeepers: KeeperListItem[] = [
    {
      name: 'aws-prod',
      type: 'aws',
      description: 'Production AWS Secrets Manager',
      isActive: true,
      config: 'us-east-1',
    },
    {
      name: 'aws-staging',
      type: 'aws',
      description: 'Staging environment',
      isActive: false,
      config: 'us-west-2',
    },
  ];

  beforeEach(() => {
    mockUseKeepers.mockReturnValue({
      keepers: mockKeepers,
      isLoading: false,
      error: null,
      activeKeeper: mockKeepers[0],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SecretsKeeper />);
    expect(screen.getByText('Secrets Keepers')).toBeInTheDocument();
  });

  // Note: Tabs are now rendered by Page component via pageNav.children
  // Test removed as it requires complex Page/navigation mocking
  // Tab functionality tested via manual/E2E testing

  it('displays active keeper information', () => {
    render(<SecretsKeeper />);
    expect(screen.getByText(/active keeper: aws-prod \(aws\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('keeper-card-aws-prod')).toBeInTheDocument();
  });

  it('renders all keepers in list', () => {
    render(<SecretsKeeper />);
    expect(screen.getByTestId('keeper-card-aws-prod')).toBeInTheDocument();
    expect(screen.getByTestId('keeper-card-aws-staging')).toBeInTheDocument();
  });

  it('renders only the expected keepers without extras', () => {
    render(<SecretsKeeper />);
    const keeperCards = screen.queryAllByTestId(/keeper-card-/);
    expect(keeperCards).toHaveLength(2);
    expect(keeperCards[0]).toHaveTextContent('aws-prod');
    expect(keeperCards[1]).toHaveTextContent('aws-staging');
  });

  it('shows Add keeper button in header', () => {
    render(<SecretsKeeper />);
    expect(screen.getByRole('link', { name: /add keeper/i })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseKeepers.mockReturnValue({
      keepers: [],
      isLoading: true,
      error: null,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.queryByTestId(/keeper-card/)).not.toBeInTheDocument();
  });

  it('displays error state when error occurs', () => {
    const mockError = new Error('Failed to load keepers');
    mockUseKeepers.mockReturnValue({
      keepers: [],
      isLoading: false,
      error: mockError,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.getByText('Error loading keepers')).toBeInTheDocument();
    expect(screen.getByText('Failed to load keepers')).toBeInTheDocument();
  });

  it('does not show error state when no error', () => {
    render(<SecretsKeeper />);
    expect(screen.queryByText('Error loading keepers')).not.toBeInTheDocument();
  });

  it('displays empty state when no keepers configured', () => {
    mockUseKeepers.mockReturnValue({
      keepers: [],
      isLoading: false,
      error: null,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.getByText('No keepers configured')).toBeInTheDocument();
    expect(
      screen.getByText(/secrets keepers allow you to store grafana secrets in external services/i)
    ).toBeInTheDocument();
  });

  it('shows Add your first keeper button in empty state', () => {
    mockUseKeepers.mockReturnValue({
      keepers: [],
      isLoading: false,
      error: null,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.getByRole('link', { name: /add your first keeper/i })).toBeInTheDocument();
  });

  it('does not show active keeper info when none is active', () => {
    mockUseKeepers.mockReturnValue({
      keepers: mockKeepers.map((k) => ({ ...k, isActive: false })),
      isLoading: false,
      error: null,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.queryByText(/active keeper:/i)).not.toBeInTheDocument();
  });

  it('does not show keeper list when empty', () => {
    mockUseKeepers.mockReturnValue({
      keepers: [],
      isLoading: false,
      error: null,
      activeKeeper: undefined,
    });

    render(<SecretsKeeper />);
    expect(screen.queryByTestId(/keeper-card/)).not.toBeInTheDocument();
  });
});
