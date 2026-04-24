import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { CoreApp } from '@grafana/data';
import { config } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { QueryLibraryContext, QueryLibraryDrawerOptions } from 'app/features/explore/QueryLibrary/QueryLibraryContext';

import { SavedQuery, type OnSelectQueryType } from '../../features/explore/QueryLibrary/types';

import { QueryDetails } from './QueryLibrary/QueryLibraryDetails';
import { QueryLibraryInteractions } from './QueryLibraryAnalyticsEvents';
import { QueryLibraryDrawer } from './QueryLibraryDrawer';
import { QueryLibraryEditingHeader } from './QueryLibraryEditingHeader';
import { SavedQueryButtons } from './SavedQueryButtons';
import { QueryLibraryEventsPropertyMap, QueryLibraryTab } from './types';
import { getUserStorageFavorites, setUserStorageFavorites } from './utils/favorites';
import { hasWritePermissions } from './utils/identity';

import { getQueryLibraryDrawerAction, getQueryLibraryRenderContext } from './index';

export function QueryLibraryContextProvider({ children }: PropsWithChildren) {
  // SAVED QUERIES STATE
  // Context / Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [context, setContext] = useState('unknown');
  const [activeTab, setActiveTab] = useState(QueryLibraryTab.ALL);
  const [activeDatasources, setActiveDatasources] = useState<string[]>([]);

  // Callback State
  const [onSelectQuery, setOnSelectQuery] = useState<OnSelectQueryType>(() => () => {});
  const [onSave, setOnSave] = useState<(() => void) | undefined>(undefined);
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: boolean }>({});
  // Guard function that checks if drawer is allowed to close (returns true to allow, false to prevent)
  const [closeGuard, setCloseGuard] = useState<() => boolean>(() => () => true);

  // Query Specific State
  const [newQuery, setNewQuery] = useState<SavedQuery | undefined>(undefined);
  const [highlightedQuery, setHighlightedQuery] = useState<string | undefined>(undefined);
  const [isEditingQuery, setIsEditingQuery] = useState(!!newQuery);

  const QueryDetailsFormMethods = useFormContext<QueryDetails>();

  useEffect(() => {
    getUserStorageFavorites().then((value) => setUserFavorites(value));
  }, []);

  useEffect(() => {
    // Update tab to All if editing a new query
    if (newQuery && activeTab !== QueryLibraryTab.ALL) {
      setActiveTab(QueryLibraryTab.ALL);
    }
  }, [newQuery, activeTab, setActiveTab]);

  // SAVED QUERIES CALLBACKS
  const triggerAnalyticsEvent = useCallback(
    (
      handleAnalyticEvent: (properties?: QueryLibraryEventsPropertyMap) => void,
      properties?: QueryLibraryEventsPropertyMap,
      contextOverride?: string
    ) => {
      const appContext = contextOverride || context;
      const propertiesWithContext = { app: appContext, ...properties };
      handleAnalyticEvent(propertiesWithContext);
    },
    [context]
  );

  const onFavorite = useCallback(
    async (uid: string) => {
      const prevFavorites = { ...userFavorites };

      const newUserFavorites = { ...prevFavorites, [uid]: true };
      try {
        setUserFavorites(newUserFavorites);
        await setUserStorageFavorites(newUserFavorites);
        triggerAnalyticsEvent(QueryLibraryInteractions.favoriteQueryClicked, { favoriteState: true });
      } catch (e) {
        setUserFavorites(prevFavorites);
      }
    },
    [userFavorites, triggerAnalyticsEvent]
  );

  const onUnfavorite = useCallback(
    async (uid: string) => {
      const prevFavorites = { ...userFavorites };

      const newUserFavorites = { ...prevFavorites };
      delete newUserFavorites[uid];
      try {
        setUserFavorites(newUserFavorites);
        await setUserStorageFavorites(newUserFavorites);
        triggerAnalyticsEvent(QueryLibraryInteractions.favoriteQueryClicked, { favoriteState: false });
      } catch (e) {
        setUserFavorites(prevFavorites);
      }
    },
    [userFavorites, triggerAnalyticsEvent]
  );

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedQuery) {
      const timer = setTimeout(() => {
        setHighlightedQuery(undefined);
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [highlightedQuery]);

  const openDrawer = useCallback(
    ({ datasourceFilters, onSelectQuery, options, query }: QueryLibraryDrawerOptions) => {
      // this means the user is trying to save a query but doesn't have write permission
      if (!!query && !hasWritePermissions()) {
        return;
      }

      setActiveDatasources(datasourceFilters || []);
      setOnSave(() => options?.onSave);
      // Update the callback state
      if (onSelectQuery) {
        setOnSelectQuery(() => onSelectQuery);
      }
      setIsDrawerOpen(true);
      setContext(getQueryLibraryRenderContext(options?.context));
      // Set enhanced options
      setHighlightedQuery(options?.highlightQuery);

      triggerAnalyticsEvent(
        QueryLibraryInteractions.queryLibraryOpened,
        {
          mode: getQueryLibraryDrawerAction({ query, options }),
        },
        options?.context
      );

      if (!!query) {
        setNewQuery({ query });
        triggerAnalyticsEvent(QueryLibraryInteractions.saveQueryToLibraryClicked, undefined, options?.context);
      } else {
        options?.isReplacingQuery
          ? triggerAnalyticsEvent(
              QueryLibraryInteractions.replaceWithQueryFromLibraryClicked,
              undefined,
              options?.context
            )
          : triggerAnalyticsEvent(QueryLibraryInteractions.addQueryFromLibraryClicked, undefined, options?.context);
      }
    },
    [triggerAnalyticsEvent]
  );

  const handleSetCloseGuard = useCallback((shouldAllowClose: () => boolean) => {
    setCloseGuard(() => shouldAllowClose);
  }, []);

  const closeDrawer = useCallback(
    (isSelectingQuery?: boolean, isEditingQuery?: boolean) => {
      // Check if the close guard allows closing
      if (!closeGuard()) {
        return; // Guard prevented close
      }

      setActiveDatasources([]);
      // Reset the callback to no-op function
      setOnSelectQuery(() => () => {});
      setNewQuery(undefined);
      setIsEditingQuery(false);
      setIsDrawerOpen(false);
      setCloseGuard(() => () => true);

      // Clear enhanced options
      setHighlightedQuery(undefined);

      if (isEditingQuery) {
        QueryDetailsFormMethods?.reset();

        triggerAnalyticsEvent(QueryLibraryInteractions.queryLibraryClosedToEditQueryInExplore);
      } else if (!isSelectingQuery && !newQuery) {
        triggerAnalyticsEvent(QueryLibraryInteractions.queryLibraryClosedWithoutSelection);
      } else if (newQuery) {
        triggerAnalyticsEvent(QueryLibraryInteractions.queryLibraryClosedWithoutSavingNewQUery);
      }
    },
    [newQuery, QueryDetailsFormMethods, closeGuard, triggerAnalyticsEvent]
  );

  const onAddHistoryQueryToLibrary = useCallback(
    (newQuery: SavedQuery) => {
      setNewQuery(newQuery);
      setIsEditingQuery(true);
      triggerAnalyticsEvent(QueryLibraryInteractions.saveRecentQueryClicked);
    },
    [triggerAnalyticsEvent]
  );

  const onTabChange = useCallback(
    (tab: QueryLibraryTab) => {
      triggerAnalyticsEvent(QueryLibraryInteractions.tabClicked, { tab });
      setActiveTab(tab);
    },
    [triggerAnalyticsEvent, setActiveTab]
  );

  const contextVal = useMemo(
    () => ({
      closeDrawer,
      onAddHistoryQueryToLibrary,
      onFavorite,
      onSave,
      onSelectQuery,
      onTabChange,
      onUnfavorite,
      openDrawer,
      renderQueryLibraryEditingHeader: (
        query: DataQuery,
        app?: CoreApp,
        queryLibraryRef?: string,
        onCancelEdit?: () => void,
        onUpdateSuccess?: () => void,
        onSelectQuery?: (query: DataQuery) => void
      ) => (
        <QueryLibraryEditingHeader
          query={query}
          app={app}
          queryLibraryRef={queryLibraryRef}
          onCancelEdit={onCancelEdit}
          onUpdateSuccess={onUpdateSuccess}
          onSelectQuery={onSelectQuery}
        />
      ),
      renderSavedQueryButtons: (
        query: DataQuery,
        app?: CoreApp,
        onUpdateSuccess?: () => void,
        onSelectQuery?: (query: DataQuery) => void,
        datasourceFilters?: string[],
        parentRef?: React.RefObject<HTMLElement | null>
      ) => (
        <SavedQueryButtons
          query={query}
          app={app}
          onUpdateSuccess={onUpdateSuccess}
          onSelectQuery={onSelectQuery}
          datasourceFilters={datasourceFilters || []}
          parentRef={parentRef}
        />
      ),
      setActiveTab,
      setIsEditingQuery,
      setNewQuery,
      triggerAnalyticsEvent,
      activeDatasources,
      activeTab,
      context,
      highlightedQuery,
      isDrawerOpen,
      isEditingQuery,
      newQuery,
      queryLibraryEnabled: Boolean(config.featureToggles.queryLibrary),
      userFavorites,
      setCloseGuard: handleSetCloseGuard,
    }),
    [
      closeDrawer,
      onAddHistoryQueryToLibrary,
      onFavorite,
      onSave,
      onSelectQuery,
      onTabChange,
      onUnfavorite,
      openDrawer,
      setActiveTab,
      setIsEditingQuery,
      setNewQuery,
      triggerAnalyticsEvent,
      activeDatasources,
      activeTab,
      context,
      highlightedQuery,
      isDrawerOpen,
      isEditingQuery,
      newQuery,
      userFavorites,
      handleSetCloseGuard,
    ]
  );

  return (
    <QueryLibraryContext.Provider value={contextVal}>
      {children}
      <QueryLibraryDrawer />
    </QueryLibraryContext.Provider>
  );
}
