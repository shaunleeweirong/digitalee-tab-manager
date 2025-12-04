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
   * Save or update a collection
   */
  async saveCollection(collection: Collection): Promise<void> {
    const collections = await this.getCollections();
    collections[collection.id] = collection;
    await chrome.storage.local.set({ [StorageKey.COLLECTIONS]: collections });
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
   * Save or update a URL
   */
  async saveURL(url: SavedURL): Promise<void> {
    const urls = await this.getURLs();
    urls[url.id] = url;
    await chrome.storage.local.set({ [StorageKey.URLS]: urls });
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
      console.error('❌ URL not found in storage:', urlId);
      return;
    }
    
    if (!collection) {
      console.error('❌ Collection not found in storage:', collectionId);
      return;
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
      console.error('❌ URL not found in storage:', urlId);
      return;
    }
    
    if (!collection) {
      console.error('❌ Collection not found in storage:', collectionId);
      return;
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
}

// Export singleton instance
export const storage = new StorageService();
