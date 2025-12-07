/**
 * Storage layer abstraction for chrome.storage.local
 * Provides type-safe access to extension storage
 */

import type {
  Collection,
  SavedURL,
  UserPreferences,
} from '@/types';
import { DEFAULT_PREFERENCES, StorageKey } from '@/types';

class StorageService {
  /**
   * Get all collections
   */
  async getCollections(): Promise<Record<string, Collection>> {
    const result = await chrome.storage.local.get(StorageKey.COLLECTIONS);
    return result[StorageKey.COLLECTIONS] || {};
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string): Promise<Collection | null> {
    const collections = await this.getCollections();
    return collections[id] || null;
  }

  /**
   * Save or update a collection with comprehensive error tracking
   */
  async saveCollection(collection: Collection): Promise<void> {
    const operationId = `saveCollection-${Date.now()}-${collection.id.substring(0, 8)}`;
    const startTime = Date.now();
    
    console.log(`🗂️ [${operationId}] Starting collection save:`, {
      collectionId: collection.id,
      name: collection.name,
      urlCount: collection.urlIds.length,
      position: collection.position,
      createdAt: new Date(collection.createdAt).toISOString(),
      updatedAt: new Date(collection.updatedAt).toISOString()
    });

    try {
      const collections = await this.getCollections();
      const isUpdate = !!collections[collection.id];
      
      const existingCollection = isUpdate ? collections[collection.id] : null;
      console.log(`📝 [${operationId}] Collection operation type:`, {
        isUpdate,
        existingCollection: existingCollection ? {
          name: existingCollection.name,
          urlCount: existingCollection.urlIds.length,
          lastUpdated: new Date(existingCollection.updatedAt).toISOString()
        } : null
      });

      collections[collection.id] = collection;
      
      await chrome.storage.local.set({ [StorageKey.COLLECTIONS]: collections });
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${operationId}] Collection saved successfully (${duration}ms):`, {
        collectionId: collection.id,
        name: collection.name,
        isUpdate,
        finalUrlCount: collection.urlIds.length,
        totalCollectionsInStorage: Object.keys(collections).length
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = `Failed to save collection ${collection.id}: ${error instanceof Error ? error.message : error}`;
      console.error(`❌ [${operationId}] ${errorMsg} (${duration}ms)`, {
        collectionId: collection.id,
        name: collection.name,
        urlCount: collection.urlIds.length,
        error: error instanceof Error ? error.stack : error
      });
      throw new Error(errorMsg);
    }
  }

  /**
   * Delete a collection and all its URLs
   */
  async deleteCollection(id: string): Promise<void> {
    const [collections, urls] = await Promise.all([
      this.getCollections(),
      this.getURLs(),
    ]);

    // Remove collection
    delete collections[id];

    // Remove all URLs that are ONLY in this collection, or remove this collection from URLs that are in multiple collections
    const updatedUrls = Object.fromEntries(
      Object.entries(urls).map(([urlId, url]) => {
        if (url.collectionIds.includes(id)) {
          const newCollectionIds = url.collectionIds.filter(cId => cId !== id);
          if (newCollectionIds.length === 0) {
            // URL only existed in this collection, remove it entirely
            return null;
          } else {
            // URL exists in other collections, just remove this collection reference
            return [urlId, { ...url, collectionIds: newCollectionIds }];
          }
        }
        return [urlId, url];
      }).filter(Boolean) as [string, SavedURL][]
    );

    await chrome.storage.local.set({
      [StorageKey.COLLECTIONS]: collections,
      [StorageKey.URLS]: updatedUrls,
    });
  }

  /**
   * Get all URLs with automatic migration from legacy format
   */
  async getURLs(): Promise<Record<string, SavedURL>> {
    const result = await chrome.storage.local.get(StorageKey.URLS);
    const urls = result[StorageKey.URLS] || {};
    
    // Check if migration is needed
    let needsMigration = false;
    const migratedUrls: Record<string, SavedURL> = {};
    
    for (const [urlId, url] of Object.entries(urls)) {
      const typedUrl = url as any;
      
      // Check if this URL has the legacy format (collectionId instead of collectionIds)
      if (typedUrl.collectionId && !typedUrl.collectionIds) {
        console.log('🔄 Migrating URL from legacy format:', urlId);
        needsMigration = true;
        
        migratedUrls[urlId] = {
          ...typedUrl,
          collectionIds: [typedUrl.collectionId], // Convert single ID to array
          // Remove the old property
          collectionId: undefined as any,
        };
        
        // Clean up the undefined property
        delete (migratedUrls[urlId] as any).collectionId;
      } else {
        migratedUrls[urlId] = url as SavedURL;
      }
    }
    
    // Save migrated data if needed
    if (needsMigration) {
      console.log('💾 Saving migrated URL data to storage');
      await chrome.storage.local.set({
        [StorageKey.URLS]: migratedUrls,
      });
      console.log('✅ URL migration completed');
    }
    
    return migratedUrls;
  }

  /**
   * Get URLs for a specific collection
   */
  async getURLsForCollection(collectionId: string): Promise<SavedURL[]> {
    const urls = await this.getURLs();
    return Object.values(urls)
      .filter((url) => url.collectionIds.includes(collectionId))
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get a single URL by ID
   */
  async getURL(id: string): Promise<SavedURL | null> {
    const urls = await this.getURLs();
    return urls[id] || null;
  }

  /**
   * Save a URL with verification and retry logic
   */
  async saveURLWithVerification(url: SavedURL, maxRetries: number = 3): Promise<void> {
    const operationId = `saveURLVerified-${Date.now()}-${url.id.substring(0, 8)}`;
    console.log(`💾 [${operationId}] Starting verified URL save with ${maxRetries} max retries:`, {
      urlId: url.id,
      url: url.url,
      title: url.originalTitle
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [${operationId}] Attempt ${attempt}/${maxRetries}...`);
        
        // Save the URL
        await this.saveURL(url);
        
        // Verify it was actually saved
        const exists = await this.verifyURLExists(url.id);
        
        if (exists) {
          console.log(`✅ [${operationId}] URL saved and verified successfully on attempt ${attempt}`);
          return;
        } else {
          throw new Error(`URL verification failed - URL not found in storage after save`);
        }
        
      } catch (error) {
        const errorMsg = `Attempt ${attempt} failed: ${error instanceof Error ? error.message : error}`;
        console.warn(`⚠️ [${operationId}] ${errorMsg}`);
        
        if (attempt === maxRetries) {
          const finalError = `Failed to save URL after ${maxRetries} attempts: ${error instanceof Error ? error.message : error}`;
          console.error(`❌ [${operationId}] ${finalError}`);
          throw new Error(finalError);
        } else {
          // Wait before retrying
          const delay = attempt * 100; // 100ms, 200ms, 300ms
          console.log(`⏳ [${operationId}] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  /**
   * Save or update a URL with comprehensive error tracking
   */
  async saveURL(url: SavedURL): Promise<void> {
    const operationId = `saveURL-${Date.now()}-${url.id.substring(0, 8)}`;
    const startTime = Date.now();
    
    console.log(`💾 [${operationId}] Starting URL save:`, {
      urlId: url.id,
      url: url.url,
      title: url.originalTitle,
      collectionIds: url.collectionIds,
      customName: url.customName
    });

    try {
      const urls = await this.getURLs();
      const isUpdate = !!urls[url.id];
      
      const existingURL = isUpdate ? urls[url.id] : null;
      console.log(`📝 [${operationId}] URL operation type:`, {
        isUpdate,
        existingURL: existingURL ? {
          collectionIds: existingURL.collectionIds,
          lastAccessed: new Date(existingURL.lastAccessedAt).toISOString()
        } : null
      });

      urls[url.id] = url;
      
      await chrome.storage.local.set({ [StorageKey.URLS]: urls });
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${operationId}] URL saved successfully (${duration}ms):`, {
        urlId: url.id,
        isUpdate,
        finalCollectionIds: url.collectionIds,
        totalUrlsInStorage: Object.keys(urls).length
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = `Failed to save URL ${url.id}: ${error instanceof Error ? error.message : error}`;
      console.error(`❌ [${operationId}] ${errorMsg} (${duration}ms)`, {
        urlId: url.id,
        url: url.url,
        title: url.originalTitle,
        collectionIds: url.collectionIds,
        error: error instanceof Error ? error.stack : error
      });
      throw new Error(errorMsg);
    }
  }

  /**
   * Delete a URL (removes from all collections)
   */
  async deleteURL(id: string): Promise<void> {
    const urls = await this.getURLs();
    const url = urls[id];

    if (!url) return;

    // Remove URL from all its collections
    const collections = await this.getCollections();
    const updatePromises: Promise<void>[] = [];

    for (const collectionId of url.collectionIds) {
      const collection = collections[collectionId];
      if (collection) {
        collection.urlIds = collection.urlIds.filter((urlId) => urlId !== id);
        collection.updatedAt = Date.now();
        updatePromises.push(this.saveCollection(collection));
      }
    }

    // Wait for all collection updates to complete
    await Promise.all(updatePromises);

    // Delete the URL itself
    delete urls[id];
    await chrome.storage.local.set({ [StorageKey.URLS]: urls });
  }

  /**
   * Find URL by URL string
   */
  async findURLByString(urlString: string): Promise<SavedURL | null> {
    const urls = await this.getURLs();
    const urlEntry = Object.values(urls).find(url => url.url === urlString);
    return urlEntry || null;
  }

  /**
   * Get collections that contain a specific URL
   */
  async getCollectionsForURL(urlId: string): Promise<Collection[]> {
    const url = await this.getURL(urlId);
    if (!url) return [];

    const collections = await this.getCollections();
    return url.collectionIds
      .map(id => collections[id])
      .filter(collection => collection != null);
  }

  /**
   * Add URL to a collection (supports multiple collections)
   */
  async addURLToCollection(urlId: string, collectionId: string): Promise<void> {
    console.log('🏪 StorageService.addURLToCollection called:', { urlId, collectionId });
    
    const url = await this.getURL(urlId);
    const collection = await this.getCollection(collectionId);
    
    if (!url) {
      const errorMsg = `URL not found in storage: ${urlId}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!collection) {
      const errorMsg = `Collection not found in storage: ${collectionId}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Found URL and Collection:', {
      url: {
        id: url.id,
        title: url.originalTitle,
        currentCollections: url.collectionIds,
      },
      collection: {
        id: collection.id,
        name: collection.name,
        currentUrls: collection.urlIds.length,
      }
    });

    // Check if URL is already in this collection
    if (url.collectionIds.includes(collectionId)) {
      console.log('⚠️ URL already in collection, skipping:', collectionId);
      return;
    }

    console.log('🔄 Adding URL to collection...');
    
    // Add to URL's collection list
    const oldCollectionIds = [...url.collectionIds];
    url.collectionIds.push(collectionId);

    // Add to collection's URL list
    if (!collection.urlIds.includes(urlId)) {
      collection.urlIds.push(urlId);
    }
    
    collection.updatedAt = Date.now();

    console.log('💾 Saving updated URL and Collection:', {
      url: {
        id: url.id,
        oldCollectionIds,
        newCollectionIds: url.collectionIds,
      },
      collection: {
        id: collection.id,
        totalUrls: collection.urlIds.length,
      }
    });

    await Promise.all([
      this.saveURL(url),
      this.saveCollection(collection),
    ]);
    
    console.log('✅ StorageService.addURLToCollection completed successfully');
  }

  /**
   * Remove URL from a collection
   */
  async removeURLFromCollection(urlId: string, collectionId: string): Promise<void> {
    console.log('🏪 StorageService.removeURLFromCollection called:', { urlId, collectionId });
    
    const url = await this.getURL(urlId);
    const collection = await this.getCollection(collectionId);
    
    if (!url) {
      const errorMsg = `URL not found in storage: ${urlId}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!collection) {
      const errorMsg = `Collection not found in storage: ${collectionId}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Found URL and Collection:', {
      url: {
        id: url.id,
        title: url.originalTitle,
        currentCollections: url.collectionIds,
      },
      collection: {
        id: collection.id,
        name: collection.name,
        currentUrls: collection.urlIds.length,
      }
    });

    // Check if URL is actually in this collection
    if (!url.collectionIds.includes(collectionId)) {
      console.log('⚠️ URL not in specified collection, skipping:', collectionId);
      return;
    }

    console.log('🔄 Removing URL from collection...');

    // Remove from URL's collection list
    const oldCollectionIds = [...url.collectionIds];
    url.collectionIds = url.collectionIds.filter(id => id !== collectionId);

    // Remove from collection's URL list
    const oldUrlIds = [...collection.urlIds];
    collection.urlIds = collection.urlIds.filter(id => id !== urlId);
    collection.updatedAt = Date.now();

    console.log('💾 Saving updated URL and Collection:', {
      url: {
        id: url.id,
        oldCollectionIds,
        newCollectionIds: url.collectionIds,
      },
      collection: {
        id: collection.id,
        oldUrlCount: oldUrlIds.length,
        newUrlCount: collection.urlIds.length,
      }
    });

    await Promise.all([
      this.saveURL(url),
      this.saveCollection(collection),
    ]);
    
    console.log('✅ StorageService.removeURLFromCollection completed successfully');
  }

  /**
   * Move URL to a different collection (legacy method - now adds to target and removes from source)
   */
  async moveURL(urlId: string, sourceCollectionId: string, targetCollectionId: string): Promise<void> {
    await this.removeURLFromCollection(urlId, sourceCollectionId);
    await this.addURLToCollection(urlId, targetCollectionId);
  }

  /**
   * Reorder URLs within a collection
   */
  async reorderURLs(collectionId: string, urlIds: string[]): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return;

    collection.urlIds = urlIds;
    collection.updatedAt = Date.now();

    // Update positions of all URLs
    const urls = await this.getURLs();
    urlIds.forEach((urlId, index) => {
      if (urls[urlId]) {
        urls[urlId].position = index;
      }
    });

    await Promise.all([
      this.saveCollection(collection),
      chrome.storage.local.set({ [StorageKey.URLS]: urls }),
    ]);
  }

  /**
   * Reorder collections
   */
  async reorderCollections(collectionIds: string[]): Promise<void> {
    const collections = await this.getCollections();
    
    // Update positions for all collections
    collectionIds.forEach((id, index) => {
      if (collections[id]) {
        collections[id].position = index;
        collections[id].updatedAt = Date.now();
      }
    });

    await chrome.storage.local.set({ [StorageKey.COLLECTIONS]: collections });
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const result = await chrome.storage.local.get(StorageKey.PREFERENCES);
    return result[StorageKey.PREFERENCES] || DEFAULT_PREFERENCES;
  }

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<void> {
    await chrome.storage.local.set({ [StorageKey.PREFERENCES]: preferences });
  }

  /**
   * Get serialized search index
   */
  async getSearchIndex(): Promise<string | null> {
    const result = await chrome.storage.local.get(StorageKey.SEARCH_INDEX);
    return result[StorageKey.SEARCH_INDEX] || null;
  }

  /**
   * Save serialized search index
   */
  async saveSearchIndex(index: string): Promise<void> {
    await chrome.storage.local.set({ [StorageKey.SEARCH_INDEX]: index });
  }

  /**
   * Clear all data (for development/testing)
   */
  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    bytesInUse: number;
    collections: number;
    urls: number;
  }> {
    const [bytesInUse, collections, urls] = await Promise.all([
      chrome.storage.local.getBytesInUse(),
      this.getCollections(),
      this.getURLs(),
    ]);

    return {
      bytesInUse,
      collections: Object.keys(collections).length,
      urls: Object.keys(urls).length,
    };
  }

  /**
   * Validate and smart cleanup of data inconsistencies
   * Removes orphaned URL references that are older than the specified threshold
   */
  async validateAndCleanupData(olderThanMinutes: number = 5): Promise<{
    orphanedUrlsRemoved: number;
    collectionsFixed: string[];
    errors: string[];
  }> {
    const operationId = `cleanup-${Date.now()}`;
    console.log(`🔍 [${operationId}] Starting smart data validation and cleanup (threshold: ${olderThanMinutes} minutes)...`);
    
    const result = {
      orphanedUrlsRemoved: 0,
      collectionsFixed: [] as string[],
      errors: [] as string[]
    };

    const startTime = Date.now();
    const thresholdTime = startTime - (olderThanMinutes * 60 * 1000);

    try {
      const [collections, urls] = await Promise.all([
        this.getCollections(),
        this.getURLs()
      ]);

      const urlIds = Object.keys(urls);
      console.log(`📊 [${operationId}] Data overview:`, {
        totalCollections: Object.keys(collections).length,
        totalUrls: urlIds.length,
        thresholdTime: new Date(thresholdTime).toISOString()
      });

      // Smart cleanup: only remove orphaned references from collections older than threshold
      for (const [, collection] of Object.entries(collections)) {
        const orphanedUrls = collection.urlIds.filter(urlId => !urls[urlId]);
        
        if (orphanedUrls.length > 0) {
          const collectionAge = startTime - collection.createdAt;
          const isOldEnoughForCleanup = collection.createdAt < thresholdTime;
          
          console.log(`🔍 [${operationId}] Collection "${collection.name}" analysis:`, {
            orphanedCount: orphanedUrls.length,
            createdAt: new Date(collection.createdAt).toISOString(),
            ageMinutes: Math.round(collectionAge / (60 * 1000)),
            thresholdMinutes: olderThanMinutes,
            isOldEnoughForCleanup,
            orphanedUrlIds: orphanedUrls.slice(0, 3).concat(orphanedUrls.length > 3 ? [`...and ${orphanedUrls.length - 3} more`] : [])
          });

          if (isOldEnoughForCleanup) {
            console.log(`🧹 [${operationId}] Cleaning up ${orphanedUrls.length} old orphaned URLs from collection "${collection.name}"`);
            
            const originalUrlIds = [...collection.urlIds];
            const validUrlIds = collection.urlIds.filter(urlId => urls[urlId]);
            
            collection.urlIds = validUrlIds;
            collection.updatedAt = Date.now();
            
            try {
              await this.saveCollection(collection);
              result.collectionsFixed.push(collection.name);
              result.orphanedUrlsRemoved += orphanedUrls.length;
              
              console.log(`✅ [${operationId}] Cleaned collection "${collection.name}":`, {
                removedCount: orphanedUrls.length,
                oldCount: originalUrlIds.length,
                newCount: validUrlIds.length,
                removedUrlIds: orphanedUrls.slice(0, 2).concat(orphanedUrls.length > 2 ? [`...and ${orphanedUrls.length - 2} more`] : [])
              });
            } catch (error) {
              const errorMsg = `Failed to save cleaned collection ${collection.name}: ${error instanceof Error ? error.message : error}`;
              result.errors.push(errorMsg);
              console.error(`❌ [${operationId}] ${errorMsg}`);
            }
          } else {
            console.log(`⏳ [${operationId}] Collection "${collection.name}" is too recent for cleanup (age: ${Math.round(collectionAge / (60 * 1000))} minutes)`);
            // Still count these for reporting but don't remove them
            result.orphanedUrlsRemoved += orphanedUrls.length;
          }
        } else {
          console.log(`✅ [${operationId}] Collection "${collection.name}" is healthy (${collection.urlIds.length} URLs, all valid)`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [${operationId}] Data validation complete (${duration}ms):`, {
        orphanedUrlsRemoved: result.orphanedUrlsRemoved,
        collectionsFixed: result.collectionsFixed.length,
        collectionsFixedNames: result.collectionsFixed,
        errors: result.errors.length,
        thresholdMinutes: olderThanMinutes
      });

    } catch (error) {
      const errorMsg = `Data validation failed: ${error instanceof Error ? error.message : error}`;
      result.errors.push(errorMsg);
      console.error(`❌ [${operationId}] ${errorMsg}`, {
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return result;
  }

  /**
   * Manual cleanup method for immediate orphan removal
   * Use this when you need to clean up orphans regardless of age
   */
  async cleanupOrphanedReferences(force: boolean = false): Promise<{
    orphanedUrlsRemoved: number;
    collectionsFixed: string[];
    errors: string[];
  }> {
    const operationId = `manual-cleanup-${Date.now()}`;
    console.log(`🧹 [${operationId}] Starting manual orphaned references cleanup (force: ${force})...`);
    
    const result = {
      orphanedUrlsRemoved: 0,
      collectionsFixed: [] as string[],
      errors: [] as string[]
    };

    const startTime = Date.now();

    try {
      const [collections, urls] = await Promise.all([
        this.getCollections(),
        this.getURLs()
      ]);

      console.log(`📊 [${operationId}] Starting manual cleanup:`, {
        totalCollections: Object.keys(collections).length,
        totalUrls: Object.keys(urls).length,
        force
      });

      // Remove all orphaned references regardless of age
      for (const [, collection] of Object.entries(collections)) {
        const orphanedUrls = collection.urlIds.filter(urlId => !urls[urlId]);
        
        if (orphanedUrls.length > 0) {
          console.log(`🧹 [${operationId}] Removing ${orphanedUrls.length} orphaned URLs from collection "${collection.name}":`, {
            collectionAge: Math.round((startTime - collection.createdAt) / (60 * 1000)),
            orphanedUrlIds: orphanedUrls.slice(0, 3).concat(orphanedUrls.length > 3 ? [`...and ${orphanedUrls.length - 3} more`] : [])
          });
          
          const originalUrlIds = [...collection.urlIds];
          const validUrlIds = collection.urlIds.filter(urlId => urls[urlId]);
          
          collection.urlIds = validUrlIds;
          collection.updatedAt = Date.now();
          
          try {
            await this.saveCollection(collection);
            result.collectionsFixed.push(collection.name);
            result.orphanedUrlsRemoved += orphanedUrls.length;
            
            console.log(`✅ [${operationId}] Cleaned collection "${collection.name}":`, {
              removedCount: orphanedUrls.length,
              oldCount: originalUrlIds.length,
              newCount: validUrlIds.length
            });
          } catch (error) {
            const errorMsg = `Failed to save cleaned collection ${collection.name}: ${error instanceof Error ? error.message : error}`;
            result.errors.push(errorMsg);
            console.error(`❌ [${operationId}] ${errorMsg}`);
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [${operationId}] Manual cleanup complete (${duration}ms):`, {
        orphanedUrlsRemoved: result.orphanedUrlsRemoved,
        collectionsFixed: result.collectionsFixed.length,
        collectionsFixedNames: result.collectionsFixed,
        errors: result.errors.length
      });

    } catch (error) {
      const errorMsg = `Manual cleanup failed: ${error instanceof Error ? error.message : error}`;
      result.errors.push(errorMsg);
      console.error(`❌ [${operationId}] ${errorMsg}`, {
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return result;
  }

  /**
   * Get storage quota and usage information
   */
  async getStorageQuotaInfo(): Promise<{
    bytesInUse: number;
    quotaBytes: number;
    usagePercentage: number;
    isNearLimit: boolean;
  }> {
    const operationId = `quotaCheck-${Date.now()}`;
    console.log(`💾 [${operationId}] Checking storage quota...`);
    
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      const quotaBytes = chrome.storage.local.QUOTA_BYTES;
      const usagePercentage = (bytesInUse / quotaBytes) * 100;
      const isNearLimit = usagePercentage > 80;
      
      console.log(`📊 [${operationId}] Storage quota info:`, {
        bytesInUse,
        quotaBytes,
        usagePercentage: `${usagePercentage.toFixed(2)}%`,
        isNearLimit
      });
      
      return {
        bytesInUse,
        quotaBytes,
        usagePercentage,
        isNearLimit
      };
    } catch (error) {
      console.error(`❌ [${operationId}] Failed to get storage quota:`, error);
      throw error;
    }
  }

  /**
   * Verify a URL exists in storage after saving
   */
  async verifyURLExists(urlId: string): Promise<boolean> {
    const operationId = `verify-${Date.now()}-${urlId.substring(0, 8)}`;
    console.log(`🔍 [${operationId}] Verifying URL exists in storage...`);
    
    try {
      const url = await this.getURL(urlId);
      const exists = !!url;
      
      console.log(`${exists ? '✅' : '❌'} [${operationId}] URL verification:`, {
        urlId,
        exists,
        url: exists ? {
          title: url.originalTitle,
          collectionIds: url.collectionIds
        } : null
      });
      
      return exists;
    } catch (error) {
      console.error(`❌ [${operationId}] URL verification failed:`, error);
      return false;
    }
  }

  /**
   * Get data health report
   */
  async getDataHealthReport(): Promise<{
    isHealthy: boolean;
    issues: string[];
    stats: {
      collections: number;
      urls: number;
      orphanedReferences: number;
    };
  }> {
    console.log('🔍 Generating data health report...');
    
    const report = {
      isHealthy: true,
      issues: [] as string[],
      stats: {
        collections: 0,
        urls: 0,
        orphanedReferences: 0
      }
    };

    try {
      const [collections, urls] = await Promise.all([
        this.getCollections(),
        this.getURLs()
      ]);

      report.stats.collections = Object.keys(collections).length;
      report.stats.urls = Object.keys(urls).length;

      // Check for orphaned URL references
      for (const [, collection] of Object.entries(collections)) {
        for (const urlId of collection.urlIds) {
          if (!urls[urlId]) {
            report.stats.orphanedReferences++;
            report.isHealthy = false;
            report.issues.push(`Collection "${collection.name}" references missing URL: ${urlId}`);
          }
        }
      }

      // Check for orphaned URLs (URLs not referenced by any collection)
      const referencedUrls = new Set<string>();
      Object.values(collections).forEach(collection => {
        collection.urlIds.forEach(urlId => referencedUrls.add(urlId));
      });

      const orphanedUrls = Object.keys(urls).filter(urlId => !referencedUrls.has(urlId));
      if (orphanedUrls.length > 0) {
        report.isHealthy = false;
        report.issues.push(`Found ${orphanedUrls.length} orphaned URLs not referenced by any collection`);
      }

      console.log('📊 Data health report:', {
        isHealthy: report.isHealthy,
        issueCount: report.issues.length,
        stats: report.stats
      });

    } catch (error) {
      report.isHealthy = false;
      report.issues.push(`Failed to generate health report: ${error instanceof Error ? error.message : error}`);
      console.error('❌ Health report generation failed:', error);
    }

    return report;
  }

  /**
   * Reorder URLs within a collection
   * Updates the collection's urlIds array to match the new order
   */
  async reorderURLsInCollection(collectionId: string, orderedUrlIds: string[]): Promise<void> {
    const operationId = `reorderURLs-${Date.now()}-${collectionId.substring(0, 8)}`;
    const startTime = Date.now();
    
    console.log(`🔄 [${operationId}] Starting URL reordering in collection:`, {
      collectionId,
      newUrlCount: orderedUrlIds.length,
      newOrder: orderedUrlIds.slice(0, 3).map(id => id.substring(0, 8)).join(', ') + 
                (orderedUrlIds.length > 3 ? `, ...${orderedUrlIds.length - 3} more` : '')
    });

    try {
      // Get the collection
      const collection = await this.getCollection(collectionId);
      
      if (!collection) {
        const errorMsg = `Collection not found: ${collectionId}`;
        console.error(`❌ [${operationId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`✅ [${operationId}] Collection found:`, {
        name: collection.name,
        currentUrlCount: collection.urlIds.length,
        currentOrder: collection.urlIds.slice(0, 3).map(id => id.substring(0, 8)).join(', ') +
                     (collection.urlIds.length > 3 ? `, ...${collection.urlIds.length - 3} more` : '')
      });

      // Validate that all provided URL IDs exist in the current collection
      const currentUrlIds = new Set(collection.urlIds);
      const providedUrlIds = new Set(orderedUrlIds);
      
      // Check for missing URLs (in current but not in provided order)
      const missingUrls = collection.urlIds.filter(id => !providedUrlIds.has(id));
      if (missingUrls.length > 0) {
        const errorMsg = `Missing URLs in new order: ${missingUrls.slice(0, 3).join(', ')}${missingUrls.length > 3 ? ` ...${missingUrls.length - 3} more` : ''}`;
        console.error(`❌ [${operationId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Check for extra URLs (in provided but not in current)
      const extraUrls = orderedUrlIds.filter(id => !currentUrlIds.has(id));
      if (extraUrls.length > 0) {
        const errorMsg = `Extra URLs in new order: ${extraUrls.slice(0, 3).join(', ')}${extraUrls.length > 3 ? ` ...${extraUrls.length - 3} more` : ''}`;
        console.error(`❌ [${operationId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Check if order actually changed
      const orderChanged = collection.urlIds.some((id, index) => id !== orderedUrlIds[index]);
      if (!orderChanged) {
        console.log(`⚠️ [${operationId}] URL order unchanged, skipping save`);
        return;
      }

      console.log(`🔄 [${operationId}] Updating collection URL order...`);

      // Update the collection's URL order
      const updatedCollection = {
        ...collection,
        urlIds: [...orderedUrlIds], // Create a copy of the new order
        updatedAt: Date.now(),
      };

      // Save the updated collection
      await this.saveCollection(updatedCollection);

      const duration = Date.now() - startTime;
      console.log(`✅ [${operationId}] URL reordering completed successfully (${duration}ms):`, {
        collectionId,
        collectionName: collection.name,
        urlCount: orderedUrlIds.length,
        duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${operationId}] URL reordering failed (${duration}ms):`, {
        collectionId,
        urlCount: orderedUrlIds.length,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new StorageService();
