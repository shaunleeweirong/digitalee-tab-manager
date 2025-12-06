/**
 * Home page - Main new tab interface
 * Displays search bar, Save All Tabs button, sidebar with open tabs, and collections grid
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { searchService } from '@/lib/search';
import type { Collection, SavedURL, SearchResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { OpenTabsSection } from '@/components/OpenTabsSection';
import { NewCollectionDialog } from '@/components/NewCollectionDialog';
import { CollectionCard } from '@/components/CollectionCard';
import { CollectionDropZone } from '@/components/CollectionDropZone';
import { DeleteCollectionDialog } from '@/components/DeleteCollectionDialog';
import { SearchResults } from '@/components/SearchResults';
import { generateId, getFaviconUrl, debounce } from '@/lib/utils';
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentUrls, setRecentUrls] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
      console.log('📥 Loading data from storage...');
      
      const [collectionsData, urlsData] = await Promise.all([
        storage.getCollections(),
        storage.getURLs(),
      ]);

      console.log('📊 Raw data loaded:', {
        collections: Object.keys(collectionsData).length,
        urls: Object.keys(urlsData).length
      });

      // Run data health check and cleanup if needed
      console.log('🔍 Running data health check...');
      const healthReport = await storage.getDataHealthReport();
      
      if (!healthReport.isHealthy) {
        console.warn('⚠️ Data inconsistencies detected:', {
          orphanedReferences: healthReport.stats.orphanedReferences,
          issues: healthReport.issues
        });
        
        console.log('🔧 Running smart data validation and cleanup...');
        const validationResult = await storage.validateAndCleanupData(5); // 5 minute threshold
        
        console.log('📋 Smart validation results:', {
          orphanedUrlsFound: validationResult.orphanedUrlsRemoved,
          collectionsFixed: validationResult.collectionsFixed.length,
          collectionsFixedNames: validationResult.collectionsFixed,
          errors: validationResult.errors.length
        });
        
        if (validationResult.collectionsFixed.length > 0) {
          console.log('✅ Collections were cleaned up, reloading data...');
          
          // Reload data after cleanup
          const [cleanedCollections, cleanedUrls] = await Promise.all([
            storage.getCollections(),
            storage.getURLs(),
          ]);
          
          setCollectionsMap(cleanedCollections);
          setUrls(cleanedUrls);
          
          console.log('📊 Clean data loaded:', {
            collections: Object.keys(cleanedCollections).length,
            urls: Object.keys(cleanedUrls).length,
            cleanedCollections: validationResult.collectionsFixed
          });
        } else if (validationResult.orphanedUrlsRemoved > 5) {
          // If there are many orphans that weren't cleaned (too recent), run manual cleanup
          console.warn('⚠️ Many orphaned URLs detected but they are too recent for auto-cleanup:', {
            orphanedCount: validationResult.orphanedUrlsRemoved,
            action: 'Running manual cleanup to fix this issue'
          });
          
          console.log('🧹 Running manual cleanup for orphaned URLs...');
          const manualCleanupResult = await storage.cleanupOrphanedReferences(true);
          
          if (manualCleanupResult.collectionsFixed.length > 0) {
            console.log('✅ Manual cleanup completed, reloading data...');
            
            // Reload data after manual cleanup
            const [cleanedCollections, cleanedUrls] = await Promise.all([
              storage.getCollections(),
              storage.getURLs(),
            ]);
            
            setCollectionsMap(cleanedCollections);
            setUrls(cleanedUrls);
            
            console.log('📊 Data after manual cleanup:', {
              collections: Object.keys(cleanedCollections).length,
              urls: Object.keys(cleanedUrls).length,
              cleanedCollections: manualCleanupResult.collectionsFixed,
              orphansRemoved: manualCleanupResult.orphanedUrlsRemoved
            });
          } else {
            console.log('📋 No orphans removed in manual cleanup');
            setCollectionsMap(collectionsData);
            setUrls(urlsData);
          }
        } else {
          console.log('📋 Using original data (no cleanup performed)');
          setCollectionsMap(collectionsData);
          setUrls(urlsData);
        }
      } else {
        console.log('✅ Data is healthy, no cleanup needed');
        setCollectionsMap(collectionsData);
        setUrls(urlsData);
      }

      // Initialize search index
      console.log('🔍 Initializing search service...');
      await searchService.initialize();
      console.log('✅ Search service initialized');
      
      // Load recent URLs for search
      await loadRecentUrls();
      
    } catch (error) {
      console.error('❌ Failed to load data:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent URLs for empty search state
  const loadRecentUrls = async () => {
    try {
      console.log('🔍 Loading recent URLs for search...');
      const recent = await searchService.getRecentURLs(5);
      setRecentUrls(recent);
      console.log('✅ Recent URLs loaded:', recent.length);
    } catch (error) {
      console.error('❌ Failed to load recent URLs:', error);
    }
  };

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Performing search for:', query);
      const results = await searchService.search(query, 50);
      setSearchResults(results);
      console.log('✅ Search completed:', results.length, 'results');
    } catch (error) {
      console.error('❌ Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((...args: unknown[]) => {
      const [query] = args;
      if (typeof query === 'string') {
        performSearch(query);
      }
    }, 300),
    []
  );

  // Handle search query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Search result handlers
  const handleOpenURL = useCallback((url: string) => {
    console.log('🔗 Opening URL:', url);
    chrome.tabs.create({ url, active: true });
  }, []);

  const handleNavigateToCollection = useCallback((collectionId: string) => {
    console.log('📁 Navigating to collection:', collectionId);
    // Clear search to show collections view
    setSearchQuery('');
    setSearchResults([]);
    // Scroll to collection (you could add this functionality later)
    const collectionElement = document.getElementById(`collection-${collectionId}`);
    if (collectionElement) {
      collectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleSaveTab = async (url: string, title: string, collectionId: string) => {
    console.log('💾 Starting handleSaveTab:', {
      url,
      title,
      collectionId,
      timestamp: new Date().toISOString()
    });

    try {
      // Get collection
      const collection = collectionsMap[collectionId];
      if (!collection) {
        console.error('❌ Collection not found in collectionsMap:', {
          collectionId,
          availableCollections: Object.keys(collectionsMap)
        });
        return;
      }

      console.log('✅ Collection found:', {
        collectionName: collection.name,
        currentUrlCount: collection.urlIds.length
      });

      // Try to get favicon from current tab if it matches
      let faviconUrl = getFaviconUrl(url); // Fallback to external service
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url === url && activeTab.favIconUrl) {
          faviconUrl = activeTab.favIconUrl;
          console.log('✅ Using tab favicon:', activeTab.favIconUrl);
        } else {
          console.log('🔄 Using fallback favicon service');
        }
      } catch (error) {
        console.warn('⚠️ Could not query active tab for favicon, using fallback:', error);
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

      console.log('📄 Created new URL object:', {
        urlId,
        url: newUrl.url,
        title: newUrl.originalTitle,
        collectionIds: newUrl.collectionIds,
        position: newUrl.position
      });

      // Update collection
      collection.urlIds.push(urlId);
      collection.updatedAt = Date.now();

      console.log('🔄 Updated collection with new URL:', {
        collectionId,
        urlIdsCount: collection.urlIds.length,
        newUrlIds: collection.urlIds
      });

      // Save to storage with individual error handling
      console.log('💾 Starting storage operations...');
      
      try {
        await storage.saveURL(newUrl);
        console.log('✅ URL saved to storage successfully:', urlId);
      } catch (urlSaveError) {
        console.error('❌ Failed to save URL to storage:', {
          urlId,
          error: urlSaveError instanceof Error ? urlSaveError.message : urlSaveError,
          stack: urlSaveError instanceof Error ? urlSaveError.stack : undefined
        });
        throw new Error(`URL save failed: ${urlSaveError instanceof Error ? urlSaveError.message : urlSaveError}`);
      }

      try {
        await storage.saveCollection(collection);
        console.log('✅ Collection saved to storage successfully:', collectionId);
      } catch (collectionSaveError) {
        console.error('❌ Failed to save collection to storage:', {
          collectionId,
          error: collectionSaveError instanceof Error ? collectionSaveError.message : collectionSaveError,
          stack: collectionSaveError instanceof Error ? collectionSaveError.stack : undefined
        });
        throw new Error(`Collection save failed: ${collectionSaveError instanceof Error ? collectionSaveError.message : collectionSaveError}`);
      }

      // Update search index
      try {
        console.log('🔍 Updating search index for new URL...');
        await searchService.addURL(newUrl, collectionsMap);
        console.log('✅ Search index updated successfully for URL:', urlId);
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with save):', {
          urlId,
          error: searchIndexError instanceof Error ? searchIndexError.message : searchIndexError,
          stack: searchIndexError instanceof Error ? searchIndexError.stack : undefined
        });
        // Don't throw - continue with save even if search index update fails
      }

      // Update state
      setUrls(prev => {
        const updated = { ...prev, [urlId]: newUrl };
        console.log('🔄 Updated URLs state:', {
          urlId,
          totalUrls: Object.keys(updated).length,
          newUrlAdded: !!updated[urlId]
        });
        return updated;
      });

      setCollectionsMap(prev => {
        const updated = { ...prev, [collectionId]: collection };
        console.log('🔄 Updated collections state:', {
          collectionId,
          urlIdsCount: updated[collectionId]?.urlIds.length ?? 0
        });
        return updated;
      });

      // Refresh recent URLs
      loadRecentUrls();

      // Show success toast
      toast.success(`Saved "${title}" to "${collection?.name || 'Collection'}"`, {
        description: `URL added successfully`,
      });

      console.log('✅ handleSaveTab completed successfully:', {
        urlId,
        collectionId,
        totalTime: urlId ? Date.now() - (parseInt(urlId.split('-')[0] ?? '0') || 0) : 0
      });

    } catch (error) {
      console.error('❌ handleSaveTab failed completely:', {
        url,
        title,
        collectionId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      // Show error toast
      toast.error(`Failed to save "${title}"`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        action: {
          label: 'Retry',
          onClick: () => handleSaveTab(url, title, collectionId),
        },
      });
      
      // Try to reload data to ensure consistency
      console.log('🔄 Reloading data due to save failure...');
      try {
        await loadData();
        console.log('✅ Data reloaded after save failure');
      } catch (reloadError) {
        console.error('❌ Failed to reload data after save failure:', reloadError);
      }
    }
  };

  const handleSaveAllTabs = async (collectionName: string, tabs: any[]) => {
    const operationId = `saveAllTabs-${Date.now()}-${tabs.length}`;
    const startTime = Date.now();
    
    console.log(`📥 [${operationId}] Starting ATOMIC Save All Tabs operation:`, {
      collectionName,
      tabCount: tabs.length,
      tabUrls: tabs.slice(0, 3).map(tab => tab.url).concat(tabs.length > 3 ? [`...and ${tabs.length - 3} more`] : [])
    });

    try {
      // Check storage quota before starting
      const quotaInfo = await storage.getStorageQuotaInfo();
      if (quotaInfo.isNearLimit) {
        console.warn(`⚠️ [${operationId}] Storage is near limit (${quotaInfo.usagePercentage.toFixed(2)}%), proceeding with caution`);
      }

      const collectionId = generateId();
      const now = Date.now();

      console.log(`📄 [${operationId}] Creating ${tabs.length} URL objects...`);

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

      console.log(`💾 [${operationId}] STEP 1: Saving all URLs sequentially with verification...`);
      
      // STEP 1: Save ALL URLs sequentially with verification and retry
      const savedUrls: string[] = [];
      const urlArray = Object.values(newUrls);
      
      for (let i = 0; i < urlArray.length; i++) {
        const url = urlArray[i];
        if (!url) {
          throw new Error(`URL at index ${i} is undefined`);
        }
        
        console.log(`🔄 [${operationId}] Saving URL ${i + 1}/${urlArray.length}: ${url.originalTitle.substring(0, 50)}${url.originalTitle.length > 50 ? '...' : ''}`);
        
        try {
          await storage.saveURLWithVerification(url, 3); // 3 retries
          savedUrls.push(url.id);
          console.log(`✅ [${operationId}] URL ${i + 1}/${urlArray.length} saved and verified`);
        } catch (error) {
          console.error(`❌ [${operationId}] CRITICAL: Failed to save URL ${i + 1}/${urlArray.length}:`, {
            urlId: url.id,
            url: url.url,
            title: url.originalTitle,
            error: error instanceof Error ? error.message : error
          });
          
          // CLEANUP: Remove any URLs that were successfully saved
          if (savedUrls.length > 0) {
            console.log(`🧹 [${operationId}] Cleaning up ${savedUrls.length} successfully saved URLs due to failure...`);
            for (const urlId of savedUrls) {
              try {
                await storage.deleteURL(urlId);
                console.log(`🗑️ [${operationId}] Cleaned up URL: ${urlId}`);
              } catch (cleanupError) {
                console.error(`❌ [${operationId}] Failed to cleanup URL ${urlId}:`, cleanupError);
              }
            }
          }
          
          throw new Error(`Atomic operation failed: URL save failed for "${url.originalTitle}": ${error instanceof Error ? error.message : error}`);
        }
      }

      console.log(`✅ [${operationId}] STEP 1 COMPLETE: All ${urlArray.length} URLs saved and verified successfully`);

      // STEP 2: Create and save collection (only after all URLs are confirmed saved)
      console.log(`🗂️ [${operationId}] STEP 2: Creating collection with verified URL IDs...`);
      
      const newCollection: Collection = {
        id: collectionId,
        name: collectionName,
        createdAt: now,
        updatedAt: now,
        position: collections.length,
        urlIds: urlIds, // All URLs are now guaranteed to exist in storage
      };

      try {
        await storage.saveCollection(newCollection);
        console.log(`✅ [${operationId}] STEP 2 COMPLETE: Collection saved successfully`);
      } catch (error) {
        console.error(`❌ [${operationId}] CRITICAL: Collection save failed, cleaning up all URLs...`);
        
        // CLEANUP: Remove all saved URLs since collection creation failed
        for (const urlId of urlIds) {
          try {
            await storage.deleteURL(urlId);
            console.log(`🗑️ [${operationId}] Cleaned up URL: ${urlId}`);
          } catch (cleanupError) {
            console.error(`❌ [${operationId}] Failed to cleanup URL ${urlId}:`, cleanupError);
          }
        }
        
        throw new Error(`Atomic operation failed: Collection save failed: ${error instanceof Error ? error.message : error}`);
      }

      // STEP 3: Update search index for all new content
      try {
        console.log(`🔍 [${operationId}] STEP 3: Updating search index for collection and ${savedUrls.length} URLs...`);
        const updatedCollectionsMap = { ...collectionsMap, [collectionId]: newCollection };
        
        // Add collection to search index
        await searchService.addCollection(newCollection);
        console.log(`✅ [${operationId}] Collection added to search index`);
        
        // Add all URLs to search index
        for (const urlId of savedUrls) {
          const savedUrl = newUrls[urlId];
          if (savedUrl) {
            await searchService.addURL(savedUrl, updatedCollectionsMap);
          }
        }
        console.log(`✅ [${operationId}] All ${savedUrls.length} URLs added to search index`);
        
      } catch (searchIndexError) {
        console.error(`❌ [${operationId}] Failed to update search index (continuing with save):`, {
          error: searchIndexError instanceof Error ? searchIndexError.message : searchIndexError,
          stack: searchIndexError instanceof Error ? searchIndexError.stack : undefined
        });
        // Don't throw - search index failure shouldn't break the atomic save operation
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 [${operationId}] ATOMIC SAVE ALL TABS COMPLETED SUCCESSFULLY (${duration}ms):`, {
        collectionId,
        collectionName,
        urlsSaved: urlIds.length,
        totalTime: duration,
        urlsVerified: savedUrls.length
      });

      // Update state
      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setUrls(prev => ({ ...prev, ...newUrls }));
      
      // Refresh recent URLs
      loadRecentUrls();

      // Show success toast
      toast.success(`Saved all ${tabs.length} tabs to "${collectionName}"`, {
        description: `Collection created successfully in ${duration}ms`,
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 [${operationId}] ATOMIC SAVE ALL TABS FAILED COMPLETELY (${duration}ms):`, {
        collectionName,
        tabCount: tabs.length,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Show error toast
      toast.error(`Failed to save ${tabs.length} tabs`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 6000,
      });
      
      // Reload data to ensure UI consistency after failure
      console.log(`🔄 [${operationId}] Reloading data to ensure UI consistency...`);
      try {
        await loadData();
        console.log(`✅ [${operationId}] Data reloaded after atomic save failure`);
      } catch (reloadError) {
        console.error(`❌ [${operationId}] Failed to reload data after atomic save failure:`, reloadError);
      }
      
      // Re-throw to show error to user
      throw error;
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

      // Update search index
      try {
        console.log('🔍 Updating search index for new collection...');
        await searchService.addCollection(newCollection);
        console.log('✅ Search index updated successfully for new collection:', collectionId);
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with save):', searchIndexError);
        // Don't throw - continue with save even if search index update fails
      }

      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setNewCollectionDialogOpen(false);

      // Show success toast
      toast.success(`Created collection "${collectionName}"`, {
        description: 'Ready to add URLs',
      });
    } catch (error) {
      console.error('Failed to create collection:', error);
      
      // Show error toast
      toast.error(`Failed to create collection "${collectionName}"`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
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

      // Update search index
      try {
        console.log('🔍 Updating search index for new collection and URL...');
        const updatedCollectionsMap = { ...collectionsMap, [collectionId]: newCollection };
        await Promise.all([
          searchService.addCollection(newCollection),
          searchService.addURL(newUrl, updatedCollectionsMap),
        ]);
        console.log('✅ Search index updated successfully for new collection and URL');
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with save):', searchIndexError);
        // Don't throw - continue with save even if search index update fails
      }

      // Update state
      setCollectionsMap(prev => ({ ...prev, [collectionId]: newCollection }));
      setUrls(prev => ({ ...prev, [urlId]: newUrl }));

      // Refresh recent URLs
      loadRecentUrls();

      // Show success toast
      toast.success(`Created "${collectionName}" and saved "${title}"`, {
        description: 'Collection ready for more tabs',
      });
    } catch (error) {
      console.error('Failed to create collection and save tab:', error);
      
      // Show error toast
      toast.error(`Failed to create collection and save tab`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
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

      // Update search index
      try {
        console.log('🔍 Updating search index for renamed collection...');
        await searchService.updateCollection(updatedCollection);
        console.log('✅ Search index updated successfully for renamed collection:', collectionId);
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with save):', searchIndexError);
        // Don't throw - continue with save even if search index update fails
      }

      setCollectionsMap(prev => ({ ...prev, [collectionId]: updatedCollection }));

      // Show success toast
      toast.success(`Renamed collection to "${newName}"`, {
        description: `Was "${collection.name}"`,
      });
    } catch (error) {
      console.error('Failed to rename collection:', error);
      
      // Show error toast
      toast.error('Failed to rename collection', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
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
      
      // Update search index
      try {
        console.log('🔍 Updating search index for updated URL...');
        await searchService.updateURL(updatedURL, collectionsMap);
        console.log('✅ Search index updated successfully for updated URL:', urlId);
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with save):', searchIndexError);
        // Don't throw - continue with save even if search index update fails
      }
      
      // Update local state
      setUrls(prev => ({ ...prev, [urlId]: updatedURL }));

      // Show success toast
      const displayName = newCustomName.trim() || url.originalTitle;
      toast.success(`Renamed URL to "${displayName}"`, {
        description: newCustomName.trim() ? `Custom name updated` : 'Reset to original title',
      });
      
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

      // Show error toast
      toast.error('Failed to rename URL', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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

      // Show success toast
      toast.success(`Deleted "${url.customName || url.originalTitle}"`, {
        description: `Removed from ${url.collectionIds.length} collection${url.collectionIds.length !== 1 ? 's' : ''}`,
      });
      
    } catch (error) {
      console.error('❌ Failed to delete URL:', {
        urlId,
        error: error instanceof Error ? error.message : error
      });

      // Show error toast
      toast.error('Failed to delete URL', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
      
      // Update search index
      try {
        console.log('🔍 Updating search index for deleted collection...');
        await searchService.removeCollection(collection.id);
        console.log('✅ Search index updated successfully for deleted collection:', collection.id);
      } catch (searchIndexError) {
        console.error('❌ Failed to update search index (continuing with delete):', searchIndexError);
        // Don't throw - continue with delete even if search index update fails
      }
      
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

      // Show success toast
      toast.success(`Deleted collection "${collection.name}"`, {
        description: `${collection.urlIds.length} URLs removed`,
      });
    } catch (error) {
      console.error('Failed to delete collection:', error);

      // Show error toast
      toast.error(`Failed to delete collection "${collection.name}"`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
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
            // Verify URL actually exists in storage before trying to add to collection
            console.log('🔍 Verifying URL exists in storage...');
            const urlInStorage = await storage.getURL(existingSavedUrl.id);
            
            if (!urlInStorage) {
              console.warn('⚠️ URL found in state but not in storage, saving first:', {
                urlId: existingSavedUrl.id,
                url: existingSavedUrl.url,
                title: existingSavedUrl.originalTitle
              });
              
              // Save the URL to storage first to fix state/storage desync
              await storage.saveURL(existingSavedUrl);
              console.log('✅ URL persisted to storage successfully');
            } else {
              console.log('✅ URL verified in storage');
            }
            
            // Add to target collection using storage service
            await storage.addURLToCollection(existingSavedUrl.id, targetCollection.id);
            console.log('✅ Successfully added saved tab to new collection');
            
            // Refresh state
            await loadData();
          } catch (error) {
            console.error('❌ Failed to add saved tab to collection:', {
              urlId: existingSavedUrl?.id,
              targetCollectionId: targetCollection.id,
              error: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : undefined
            });
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

        {/* Main Content - Search Results or Collections */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery.trim() || searchResults.length > 0 || isSearching ? (
            /* Search Results View */
            <SearchResults
              query={searchQuery}
              results={searchResults}
              recentUrls={recentUrls}
              isSearching={isSearching}
              onOpenURL={handleOpenURL}
              onNavigateToCollection={handleNavigateToCollection}
            />
          ) : (
            /* Collections View */
            <>
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
                    <div key={collection.id} id={`collection-${collection.id}`}>
                      <CollectionDropZone
                        collection={collection}
                        urls={urls}
                        onRename={handleRenameCollection}
                        onDelete={handleDeleteCollection}
                        onUpdateURL={handleUpdateURL}
                        onDeleteURL={handleDeleteURL}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
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
