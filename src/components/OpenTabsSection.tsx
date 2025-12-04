import { useState, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabItem } from '@/components/TabItem';
import { SaveTabDialog } from '@/components/SaveTabDialog';
import { SaveAllTabsDialog } from '@/components/SaveAllTabsDialog';
import { OpenTab, tabsService } from '@/lib/tabs';
import { Collection, SavedURL } from '@/types';
import { debounce } from '@/lib/utils';

interface OpenTabsSectionProps {
  collections: Record<string, Collection>;
  savedUrls: Record<string, SavedURL>;
  onSaveTab: (url: string, title: string, collectionId: string) => Promise<void>;
  onCreateAndSaveTab: (url: string, title: string, collectionName: string) => Promise<void>;
  onSaveAllTabs: (collectionName: string, tabs: OpenTab[]) => Promise<void>;
  onAddToCollection?: (tabUrl: string, collectionId: string) => Promise<void>;
  onRemoveFromCollection?: (tabUrl: string, collectionId: string) => Promise<void>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function OpenTabsSection({
  collections,
  savedUrls,
  onSaveTab,
  onCreateAndSaveTab,
  onSaveAllTabs,
  onAddToCollection,
  onRemoveFromCollection,
  collapsed = false,
  onToggleCollapse,
}: OpenTabsSectionProps) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveAllDialogOpen, setSaveAllDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<OpenTab | null>(null);

  const DEFAULT_LIMIT = 5;
  const displayedTabs = showAll ? openTabs : openTabs.slice(0, DEFAULT_LIMIT);

  // Load tabs
  const loadTabs = async () => {
    const tabs = await tabsService.getCurrentWindowTabs();
    setOpenTabs(tabs);
  };

  // Initial load
  useEffect(() => {
    loadTabs();
  }, []);

  // Subscribe to tab changes
  useEffect(() => {
    const debouncedLoad = debounce(loadTabs, 100);
    const cleanup = tabsService.onTabsChanged(debouncedLoad);
    return cleanup;
  }, []);

  // Check if tab is saved and get collection info
  const getTabSaveInfo = (url: string): { saved: boolean; savedCollectionIds: string[]; savedUrl?: SavedURL } => {
    const savedUrl = Object.values(savedUrls).find((savedUrl) => savedUrl.url === url);
    if (savedUrl) {
      return {
        saved: true,
        savedCollectionIds: savedUrl.collectionIds,
        savedUrl: savedUrl,
      };
    }
    return { saved: false, savedCollectionIds: [] };
  };

  const handleSaveTab = (tab: OpenTab) => {
    setSelectedTab(tab);
    setDialogOpen(true);
  };

  const handleCloseTab = async (tabId: number) => {
    try {
      await tabsService.closeTab(tabId);
      // Tabs will update automatically via the listener
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  };

  const handleSaveToCollection = async (
    url: string,
    title: string,
    collectionId: string
  ) => {
    await onSaveTab(url, title, collectionId);
    setDialogOpen(false);
    setSelectedTab(null);
  };

  const handleSaveAllTabs = async (collectionName: string) => {
    await onSaveAllTabs(collectionName, openTabs);
    setSaveAllDialogOpen(false);
  };

  if (collapsed) {
    return (
      <div className="w-12 border-r border-border bg-muted/30 flex flex-col items-center py-4 gap-2">
        {/* Icon bar with favicons */}
        {displayedTabs.slice(0, 8).map((tab) => (
          <div
            key={tab.id}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-accent cursor-pointer"
            title={tab.title}
          >
            {tab.favIconUrl ? (
              <img src={tab.favIconUrl} alt="" className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded bg-muted" />
            )}
          </div>
        ))}

        {/* Tab count badge */}
        {openTabs.length > 8 && (
          <div className="text-xs text-muted-foreground mt-2">
            +{openTabs.length - 8}
          </div>
        )}

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-auto w-8 h-8 p-0"
          onClick={onToggleCollapse}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-[280px] border-r border-border bg-muted/30 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-medium text-sm">
            Currently Open ({openTabs.length})
          </h2>
        </div>

        {/* Tab list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {displayedTabs.map((tab) => {
            const { saved, savedCollectionIds } = getTabSaveInfo(tab.url);
            const allCollections = Object.values(collections);
            return (
              <TabItem
                key={tab.id}
                tab={tab}
                isSaved={saved}
                savedCollectionIds={savedCollectionIds}
                allCollections={allCollections}
                onSave={handleSaveTab}
                onClose={handleCloseTab}
                onAddToCollection={onAddToCollection || (async () => {})}
                onRemoveFromCollection={onRemoveFromCollection || (async () => {})}
              />
            );
          })}

          {openTabs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tabs open
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Save All Tabs button */}
          {openTabs.length > 0 && (
            <Button
              className="w-full"
              size="sm"
              onClick={() => setSaveAllDialogOpen(true)}
            >
              Save All Tabs ({openTabs.length})
            </Button>
          )}

          {openTabs.length > DEFAULT_LIMIT && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronDown className="mr-2 h-4 w-4 rotate-180" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show All ({openTabs.length})
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Collapse
          </Button>
        </div>
      </div>

      {/* Save tab dialog */}
      <SaveTabDialog
        open={dialogOpen}
        tab={selectedTab}
        collections={collections}
        onSave={handleSaveToCollection}
        onCreateAndSave={onCreateAndSaveTab}
        onClose={() => {
          setDialogOpen(false);
          setSelectedTab(null);
        }}
      />

      {/* Save all tabs dialog */}
      <SaveAllTabsDialog
        open={saveAllDialogOpen}
        tabCount={openTabs.length}
        onSave={handleSaveAllTabs}
        onClose={() => setSaveAllDialogOpen(false)}
      />
    </>
  );
}
