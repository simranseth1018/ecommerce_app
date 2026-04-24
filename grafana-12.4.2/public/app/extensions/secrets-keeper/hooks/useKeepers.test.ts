import { renderHook, waitFor } from '@testing-library/react';

import { useKeepers } from './useKeepers';

describe('useKeepers', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useKeepers());
    expect(result.current.isLoading).toBe(true);
  });

  it('loads keepers after delay', async () => {
    const { result } = renderHook(() => useKeepers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keepers.length).toBeGreaterThan(0);
  });

  it('provides keepers immediately even while loading', () => {
    const { result } = renderHook(() => useKeepers());

    // Mock data is available immediately (useMemo is synchronous)
    expect(result.current.keepers.length).toBeGreaterThan(0);
  });

  it('sorts keepers by name', async () => {
    const { result } = renderHook(() => useKeepers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const keeperNames = result.current.keepers.map((k) => k.name);
    const sortedNames = [...keeperNames].sort();
    expect(keeperNames).toEqual(sortedNames);
  });

  it('identifies active keeper', async () => {
    const { result } = renderHook(() => useKeepers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeKeeper).toBeDefined();
    expect(result.current.activeKeeper?.isActive).toBe(true);
  });

  it('returns null error in mock implementation', async () => {
    const { result } = renderHook(() => useKeepers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('cleans up timeout on unmount', () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useKeepers());

    unmount();
    jest.advanceTimersByTime(300);

    jest.useRealTimers();
  });
});
