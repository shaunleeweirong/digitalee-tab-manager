/**
 * Home page - Main new tab interface
 * Displays search bar, Save All Tabs button, sidebar with open tabs, and collections grid
 */

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { searchService } from '@/lib/search';
import type { Collection, SavedURL } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, Plus } from 'lucide-react';
import { OpenTabsSection } from '@/components/OpenTabsSection';
import { NewCollectionDialog } from '@/components/NewCollectionDialog';
import { CollectionCard } from '@/components/CollectionCard';
import { CollectionDropZone } from '@/components/CollectionDropZone';
import { DeleteCollectionDialog } from '@/components/DeleteCollectionDialog';
import { generateId, getFaviconUrl } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
} from '@dnd-kit/sortable';

export default function HomePage() {
  const [collectionsMap, setCollectionsMap] = useState<Record<string, Collection>>({});
  const [urls, setUrls] = useState<Record<string, SavedURL>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newCollectionDialogOpen, setNewCollectionDialogOpen] = useState(false);
  const [deleteCollectionDialog, setDeleteCollectionDialog] = useState<{
    open: boolean;
    collection: Collection | null;
  }>({ open: false, collection: null });
  const [activeId, setActiveId] = useState<string | null>(null);

  const collections = Object.values(collectionsMap).sort((a, b) => a.position - b.position);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15,
      },
    })
  );

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectionsData, urlsData] = await Promise.all([
        storage.getCollections(),
        storage.getURLs(),
      ]);

      setCollectionsMap(collectionsData);
      setUrls(urlsData);

      // Initialize search index
      await searchService.initialize();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTab = async (url: string, title: string, collectionId: string) => {
    try {
      // Get collection
      const collection = collectionsMap[collectionId];
      if (!collection) return;

      // Try to get favicon from current tab if it matches
      let faviconUrl = getFaviconUrl(url); // Fallback to external service
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url === url && activeTab.favIconUrl) {
          faviconUrl = activeTab.favIconUrl;
        }
      } catch (error) {
        console.log('Could not query active tab for favicon, using fallback');
      }

      // Create new URL
      const urlId = generateId();
      const newUrl: SavedURL = {
        id: urlId,
        url,
        originalTitle: title,
        customName: null,
        aliases: [],
        favicon: faviconUrl,
        collectionIds: [collectionId],
        position: collection.urlIds.length,
        savedAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      // Update collection
      collection.urlIds.push(urlId);
      collection.updatedAt = Date.now();

      // Save to storage
      await Promise.all([
        storage.saveURL(newUrl),
        storage.saveCollection(collection),
      ]);

      // Update state
      setUrls(prev => ({ ...prev, [urlId]: newUrl }));
      setCollectionsMap(prev => ({ ...prev, [collectionId]: collection }));
    } catch (error) {
      console.error('Failed to save tab:', error);
    }
  };

  const handleSaveAllTabs = async (collectionName: string, tabs: any[]) => {
    try {
      // Create new collection
      const collectionId = generateId();
      const now = Date.now();

      const newCollection: Collection = {
        id: collectionId,
        name: collectionName,
        createdAt: now,
        updatedAt: now,
        position: collections.length,
        urlIds: [],
      };

      // Create URLs for all tabs
      const newUrls: Record<string, SavedURL> = {};
      const urlIds: string[] = [];

      tabs.forEach((tab, index) => {
        const urlId = generateId();
        urlIds.push(urlId);

        newUrls[urlId] = {
          id: urlId,
          url: tab.url,
          originalTitle: tab.title,
          customName: null,
          aliases: [],
          favicon: tab.favIconUrl || null,
          collectionIds: [collectionId],
          position: index,
          savedAt: now,
          lastAccessedAt: now,
        };
      });

      newCollection.urlIds = urlIds;

      // Save to storage
      await Promise.all([
        storage.saveCollection(newCollection),
        ...Object.values(newUrls).map(url => storage.saveURL(url)),
      ]);

      // Update state
      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setUrls(prev => ({ ...prev, ...newUrls }));
    } catch (error) {
      console.error('Failed to save all tabs:', error);
    }
  };

  const handleCreateCollection = async (collectionName: string) => {
    try {
      const collectionId = generateId();
      const now = Date.now();

      const newCollection: Collection = {
        id: collectionId,
        name: collectionName,
        createdAt: now,
        updatedAt: now,
        position: collections.length,
        urlIds: [],
      };

      await storage.saveCollection(newCollection);

      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setNewCollectionDialogOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleCreateAndSaveTab = async (url: string, title: string, collectionName: string) => {
    try {
      // Create new collection
      const collectionId = generateId();
      const now = Date.now();

      const newCollection: Collection = {
        id: collectionId,
        name: collectionName,
        createdAt: now,
        updatedAt: now,
        position: collections.length,
        urlIds: [],
      };

      // Try to get favicon from current tab if it matches
      let faviconUrl = getFaviconUrl(url); // Fallback to external service
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url === url && activeTab.favIconUrl) {
          faviconUrl = activeTab.favIconUrl;
        }
      } catch (error) {
        console.log('Could not query active tab for favicon, using fallback');
      }

      // Create new URL
      const urlId = generateId();
      const newUrl: SavedURL = {
        id: urlId,
        url,
        originalTitle: title,
        customName: null,
        aliases: [],
        favicon: faviconUrl,
        collectionIds: [collectionId],
        position: 0,
        savedAt: now,
        lastAccessedAt: now,
      };

      // Add URL to collection
      newCollection.urlIds = [urlId];

      // Save to storage
      await Promise.all([
        storage.saveCollection(newCollection),
        storage.saveURL(newUrl),
      ]);

      // Update state
      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setUrls(prev => ({ ...prev, [urlId]: newUrl }));
    } catch (error) {
      console.error('Failed to create collection and save tab:', error);
    }
  };

  const handleRenameCollection = async (collectionId: string, newName: string) => {
    try {
      const collection = collectionsMap[collectionId];
      if (!collection) return;

      const updatedCollection = {
        ...collection,
        name: newName,
        updatedAt: Date.now(),
      };

      await storage.saveCollection(updatedCollection);
      setCollectionsMap(prev => ({ ...prev, [collectionId]: updatedCollection }));
    } catch (error) {
      console.error('Failed to rename collection:', error);
    }
  };

  const handleUpdateURL = async (urlId: string, newCustomName: string) => {
    console.log('📝 Updating URL custom name:', {
      urlId,
      newCustomName: newCustomName || '(reset to original)',
      timestamp: new Date().toISOString()
    });

    try {
      const url = urls[urlId];
      if (!url) {
        console.error('❌ URL not found:', urlId);
        return;
      }

      const updatedURL = {
        ...url,
        customName: newCustomName.trim() || null, // Use null for empty names
        lastAccessedAt: Date.now() // Update access time when renamed
      };

      // Save to storage
      await storage.saveURL(updatedURL);
      
      // Update local state
      setUrls(prev => ({ ...prev, [urlId]: updatedURL }));
      
      console.log('✅ URL updated successfully:', {
        urlId,
        oldCustomName: url.customName,
        newCustomName: updatedURL.customName,
        originalTitle: url.originalTitle
      });
      
    } catch (error) {
      console.error('❌ Failed to update URL:', {
        urlId,
        newCustomName,
        error: error instanceof Error ? error.message : error
      });
    }
  };

  const handleDeleteURL = async (urlId: string) => {
    console.log('🗑️ Starting URL deletion process:', urlId);
    
    try {
      // Get URL details for logging before deletion
      const url = urls[urlId];
      if (!url) {
        console.log('⚠️ URL not found in state:', urlId);
        return;
      }

      console.log('🗑️ Deleting URL:', {
        urlId,
        collectionIds: url.collectionIds,
        title: url.originalTitle,
        customName: url.customName,
        url: url.url
      });

      // Delete from storage (this also updates the collection's urlIds)
      await storage.deleteURL(urlId);
      console.log('✅ URL deleted from storage:', urlId);

      // Remove from search index (with specific error handling)
      try {
        if (searchService) {
          console.log('🔍 Attempting to remove URL from search index:', urlId);
          console.log('🔍 Search service state:', {
            exists: !!searchService,
            isInitialized: searchService.initialized
          });
          
          await searchService.removeURL(urlId);
          console.log('✅ URL removed from search index successfully:', urlId);
        } else {
          console.log('⚠️ Search service not available, skipping search index removal for URL:', urlId);
        }
      } catch (searchError) {
        console.error('❌ Failed to remove URL from search index (continuing with deletion):', {
          urlId,
          searchError: searchError instanceof Error ? searchError.message : searchError,
          stack: searchError instanceof Error ? searchError.stack : undefined
        });
        // Don't throw - continue with the deletion even if search index update fails
      }

      // Update local state - remove from urls
      setUrls(prev => {
        const updated = { ...prev };
        delete updated[urlId];
        return updated;
      });
      
      // Update collection states - the storage service already updates collections,
      // but we need to refresh our local collection states for all affected collections
      const updatePromises = url.collectionIds.map(async (collectionId) => {
        const updatedCollection = await storage.getCollection(collectionId);
        if (updatedCollection) {
          setCollectionsMap(prev => ({
            ...prev,
            [collectionId]: updatedCollection
          }));
        }
        return collectionId;
      });
      
      const updatedCollectionIds = await Promise.all(updatePromises);
      console.log('✅ Collection states updated after URL deletion:', updatedCollectionIds);

      console.log('✅ URL deletion completed successfully:', urlId);
      
    } catch (error) {
      console.error('❌ Failed to delete URL:', {
        urlId,
        error: error instanceof Error ? error.message : error
      });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    const collection = collectionsMap[collectionId];
    if (!collection) return;

    setDeleteCollectionDialog({ open: true, collection });
  };


  const handleConfirmDeleteCollection = async () => {
    const { collection } = deleteCollectionDialog;
    if (!collection) return;

    try {
      await storage.deleteCollection(collection.id);
      
      // Remove from state
      setCollectionsMap(prev => {
        const updated = { ...prev };
        delete updated[collection.id];
        return updated;
      });

      // Remove all URLs from this collection (only delete URLs that are ONLY in this collection)
      setUrls(prev => 
        Object.fromEntries(
          Object.entries(prev).filter(([_, url]) => 
            !url.collectionIds.includes(collection.id) || url.collectionIds.length > 1
          )
        )
      );

      setDeleteCollectionDialog({ open: false, collection: null });
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const [activeDragData, setActiveDragData] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);

    if (!over) {
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    try {

      // Handle tab -> collection drop
      if (activeData?.type === 'tab' && overData?.type === 'collection') {
        console.log('✅ Tab to collection drop detected:', {
          tab: activeData.tab,
          isSaved: activeData.isSaved,
          savedCollectionIds: activeData.savedCollectionIds,
          targetCollection: overData.collection
        });
        
        const tab = activeData.tab;
        const targetCollection = overData.collection;
        const isSaved = activeData.isSaved;
        const savedCollectionIds = activeData.savedCollectionIds || [];
        
        // Check if this is a saved tab being added to a new collection
        if (isSaved) {
          console.log('🔄 Handling saved tab drop (multi-collection add)');
          
          // Check if tab is already in target collection
          if (savedCollectionIds.includes(targetCollection.id)) {
            console.log('⚠️ Tab already in target collection, skipping:', targetCollection.id);
            return;
          }
          
          // Find the existing SavedURL
          const existingSavedUrl = Object.values(urls).find(url => url.url === tab.url);
          
          if (!existingSavedUrl) {
            console.error('❌ Could not find existing saved URL for tab:', tab.url);
            return;
          }
          
          console.log('✅ Found existing SavedURL for multi-collection add:', {
            urlId: existingSavedUrl.id,
            currentCollections: existingSavedUrl.collectionIds
          });
          
          try {
            // Add to target collection using storage service
            await storage.addURLToCollection(existingSavedUrl.id, targetCollection.id);
            console.log('✅ Successfully added saved tab to new collection');
            
            // Refresh state
            await loadData();
          } catch (error) {
            console.error('❌ Failed to add saved tab to collection:', error);
          }
        } else {
          console.log('🔄 Handling unsaved tab drop (new URL creation)');
          
          // For unsaved tabs, use existing save logic
          await handleSaveTab(tab.url, tab.title, targetCollection.id);
          console.log('✅ Unsaved tab saved successfully');
        }
        
        return;
      }

      console.log('🔄 Checking for collection reordering...');

      // Handle collection reordering
      if (active.id === over.id) {
        return;
      }

      const oldIndex = collections.findIndex((collection) => collection.id === active.id);
      const newIndex = collections.findIndex((collection) => collection.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newCollections = arrayMove(collections, oldIndex, newIndex);
      const collectionIds = newCollections.map((collection) => collection.id);

      // Update local state immediately for UI responsiveness
      const updatedCollectionsMap = { ...collectionsMap };
      newCollections.forEach((collection, index) => {
        updatedCollectionsMap[collection.id] = {
          ...collection,
          position: index,
          updatedAt: Date.now(),
        };
      });
      setCollectionsMap(updatedCollectionsMap);

      // Save to storage
      await storage.reorderCollections(collectionIds);
    } catch (error) {
      console.error('Failed to handle drag operation:', error);
      // Could reload data here to revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar: Open Tabs */}
        <OpenTabsSection
          collections={collectionsMap}
          savedUrls={urls}
          onSaveTab={handleSaveTab}
          onCreateAndSaveTab={handleCreateAndSaveTab}
          onSaveAllTabs={handleSaveAllTabs}
          onAddToCollection={async (tabUrl: string, collectionId: string) => {
            console.log('🚀 Starting onAddToCollection handler:', { tabUrl, collectionId });
            
            try {
              // Find the existing SavedURL by URL string
              const existingSavedUrl = Object.values(urls).find(url => url.url === tabUrl);
              
              if (!existingSavedUrl) {
                console.error('❌ URL not found in saved URLs:', tabUrl);
                return;
              }
              
              console.log('✅ Found existing SavedURL:', {
                urlId: existingSavedUrl.id,
                currentCollections: existingSavedUrl.collectionIds,
                title: existingSavedUrl.originalTitle
              });
              
              // Check if URL is already in this collection
              if (existingSavedUrl.collectionIds.includes(collectionId)) {
                console.log('⚠️ URL already in collection:', collectionId);
                return;
              }
              
              // Verify collection exists
              const targetCollection = collectionsMap[collectionId];
              if (!targetCollection) {
                console.error('❌ Target collection not found:', collectionId);
                return;
              }
              
              console.log('✅ Target collection found:', {
                collectionId,
                collectionName: targetCollection.name
              });
              
              // Add URL to collection using storage service
              console.log('🔄 Calling storage.addURLToCollection...');
              await storage.addURLToCollection(existingSavedUrl.id, collectionId);
              console.log('✅ storage.addURLToCollection completed');
              
              // Search index will be updated by loadData() below
              console.log('🔍 Skipping manual search index update (will be rebuilt by loadData)');
              
              // Refresh local state by reloading data
              console.log('🔄 Refreshing local state...');
              await loadData();
              console.log('✅ Local state refreshed successfully');
              
            } catch (error) {
              console.error('❌ Error in onAddToCollection:', {
                tabUrl,
                collectionId,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
              });
            }
          }}
          onRemoveFromCollection={async (tabUrl: string, collectionId: string) => {
            console.log('🚀 Starting onRemoveFromCollection handler:', { tabUrl, collectionId });
            
            try {
              const savedUrl = Object.values(urls).find(url => url.url === tabUrl);
              
              if (!savedUrl) {
                console.error('❌ URL not found in saved URLs:', tabUrl);
                return;
              }
              
              console.log('✅ Found SavedURL for removal:', {
                urlId: savedUrl.id,
                currentCollections: savedUrl.collectionIds,
                title: savedUrl.originalTitle
              });
              
              // Check if URL is actually in this collection
              if (!savedUrl.collectionIds.includes(collectionId)) {
                console.log('⚠️ URL not in specified collection:', collectionId);
                return;
              }
              
              // Prevent removing from last collection
              if (savedUrl.collectionIds.length <= 1) {
                console.log('⚠️ Cannot remove URL from last collection');
                return;
              }
              
              console.log('🔄 Calling storage.removeURLFromCollection...');
              await storage.removeURLFromCollection(savedUrl.id, collectionId);
              console.log('✅ storage.removeURLFromCollection completed');
              
              // Search index will be updated by loadData() below
              console.log('🔍 Skipping manual search index update (will be rebuilt by loadData)');
              
              // Refresh local state
              console.log('🔄 Refreshing local state...');
              await loadData();
              console.log('✅ Local state refreshed successfully');
              
            } catch (error) {
              console.error('❌ Error in onRemoveFromCollection:', {
                tabUrl,
                collectionId,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
              });
            }
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tabs and collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Collections Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Collections Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Collections</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewCollectionDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </div>

          {/* Empty state */}
          {collections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-2 text-4xl">📁</div>
              <h2 className="mb-2 text-xl font-semibold">No collections yet</h2>
              <p className="text-muted-foreground">
                Save your open tabs from the sidebar to create your first collection.
              </p>
            </div>
          )}

          {/* Collections grid */}
          {collections.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {collections.map((collection) => (
                <CollectionDropZone
                  key={collection.id}
                  collection={collection}
                  urls={urls}
                  onRename={handleRenameCollection}
                  onDelete={handleDeleteCollection}
                  onUpdateURL={handleUpdateURL}
                  onDeleteURL={handleDeleteURL}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          (() => {
            // Handle collection dragging
            if (collectionsMap[activeId]) {
              return (
                <CollectionCard
                  collection={collectionsMap[activeId]}
                  urls={urls}
                  onRename={() => {}}
                  onDelete={() => {}}
                  onUpdateURL={() => {}}
                  onDeleteURL={() => {}}
                />
              );
            }
            

            // Handle tab dragging
            if (activeId.startsWith('tab-')) {
              const isSaved = activeDragData?.isSaved || false;
              const savedCollectionIds = activeDragData?.savedCollectionIds || [];
              const tab = activeDragData?.tab;
              
              return (
                <div className={`rounded-lg border-2 bg-background p-3 shadow-lg opacity-95 ${
                  isSaved ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded ${
                      isSaved ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {isSaved ? 'Saved Tab' : 'New Tab'}
                      </span>
                      {tab && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {tab.title}
                        </span>
                      )}
                      {isSaved && savedCollectionIds.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          In {savedCollectionIds.length} collection{savedCollectionIds.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            return null;
          })()
        ) : null}
      </DragOverlay>

      {/* New collection dialog */}
      <NewCollectionDialog
        open={newCollectionDialogOpen}
        onSave={handleCreateCollection}
        onClose={() => setNewCollectionDialogOpen(false)}
      />

      {/* Delete collection dialog */}
      <DeleteCollectionDialog
        open={deleteCollectionDialog.open}
        collection={deleteCollectionDialog.collection}
        tabCount={deleteCollectionDialog.collection?.urlIds.length || 0}
        onConfirm={handleConfirmDeleteCollection}
        onCancel={() => setDeleteCollectionDialog({ open: false, collection: null })}
      />
    </DndContext>
  );
}
