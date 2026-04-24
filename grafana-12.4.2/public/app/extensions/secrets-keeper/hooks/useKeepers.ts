import { useMemo, useState, useEffect } from 'react';

import { MOCK_KEEPER_LIST } from '../mocks/mockData';
import { KeeperListItem } from '../types';

export interface UseKeepersResult {
  keepers: KeeperListItem[];
  isLoading: boolean;
  error: Error | null;
  activeKeeper: KeeperListItem | undefined;
}

export const useKeepers = (): UseKeepersResult => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate network delay for realistic development experience
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const keepers: KeeperListItem[] = useMemo(() => {
    return [...MOCK_KEEPER_LIST].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const activeKeeper: KeeperListItem | undefined = useMemo(() => {
    return keepers.find((k) => k.isActive);
  }, [keepers]);

  return {
    keepers,
    isLoading,
    error: null,
    activeKeeper,
  };
};
