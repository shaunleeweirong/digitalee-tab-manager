/**
 * Search service using MiniSearch
 * Provides fuzzy search across collections and URLs
 */

import MiniSearch from 'minisearch';
import type { Collection, SavedURL, SearchResult } from '@/types';
import { storage } from './storage';

interface SearchDocument {
  id: string;
  type: 'url' | 'collection';
  customName: string;
  aliases: string;
  title: string;
  url: string;
  collectionName: string;
  collectionId: string;
  // Store original data for results
  originalTitle?: string;
  favicon?: string | null;
  savedAt?: number;
  urlId?: string; // Original URL ID for multi-collection URLs
}

class SearchService {
  private miniSearch: MiniSearch<SearchDocument>;
  private isInitialized = false;

  constructor() {
    this.miniSearch = new MiniSearch<SearchDocument>({
      fields: ['customName', 'aliases', 'title', 'url', 'collectionName'],
      storeFields: [
        'type',
        'collectionId',
        'collectionName',
        'url',
        'title',
        'customName',
        'favicon',
        'originalTitle',
        'savedAt',
        'urlId',
      ],
      searchOptions: {
        boost: {
          customName: 3,
          aliases: 2.5,
          title: 2,
          collectionName: 1.5,
          url: 1,
        },
        fuzzy: 0.2,
        prefix: true,
        combineWith: 'AND',
      },
    });
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Initialize or rebuild the search index
   */
  async initialize(): Promise<void> {
    const [collections, urls] = await Promise.all([
      storage.getCollections(),
      storage.getURLs(),
    ]);

    const documents: SearchDocument[] = [];

    // Index collections
    Object.values(collections).forEach((collection) => {
      documents.push({
        id: collection.id,
        type: 'collection',
        customName: '',
        aliases: '',
        title: collection.name,
        url: '',
        collectionName: collection.name,
        collectionId: collection.id,
      });
    });

    // Index URLs - create separate search documents for each collection membership
    Object.values(urls).forEach((url) => {
      url.collectionIds.forEach((collectionId) => {
        const collection = collections[collectionId];
        if (!collection) return;

        documents.push({
          id: `${url.id}-${collectionId}`, // Unique ID per URL-collection combination
          type: 'url',
          customName: url.customName || '',
          aliases: url.aliases.join(' '),
          title: url.originalTitle,
          url: url.url,
          collectionName: collection.name,
          collectionId: collectionId,
          originalTitle: url.originalTitle,
          favicon: url.favicon,
          savedAt: url.savedAt,
          urlId: url.id, // Store original URL ID for retrieval
        });
      });
    });

    // Clear and rebuild index
    this.miniSearch.removeAll();
    this.miniSearch.addAll(documents);
    this.isInitialized = true;

    // Persist index to storage
    await this.persistIndex();
  }

  /**
   * Load index from storage (faster than rebuilding)
   */
  async loadFromStorage(): Promise<boolean> {
    try {
      const serialized = await storage.getSearchIndex();
      if (!serialized) return false;

      const parsed = JSON.parse(serialized);
      this.miniSearch = MiniSearch.loadJS(parsed, {
        fields: ['customName', 'aliases', 'title', 'url', 'collectionName'],
        storeFields: [
          'type',
          'collectionId',
          'collectionName',
          'url',
          'title',
          'customName',
          'favicon',
          'originalTitle',
          'savedAt',
          'urlId',
        ],
      });
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to load search index from storage:', error);
      return false;
    }
  }

  /**
   * Persist current index to storage
   */
  private async persistIndex(): Promise<void> {
    try {
      console.log('🔍 Starting search index persistence...');
      const searchData = this.miniSearch.toJSON();
      console.log('🔍 Search data extracted, size:', JSON.stringify(searchData).length, 'characters');
      
      const serialized = JSON.stringify(searchData);
      console.log('🔍 Search data serialized successfully');
      
      await storage.saveSearchIndex(serialized);
      console.log('✅ Search index persisted to storage successfully');
      
    } catch (error) {
      console.error('❌ Failed to persist search index:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Re-throw to let caller know persistence failed
    }
  }

  /**
   * Search across all collections and URLs
   */
  async search(query: string, limit = 50): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      // Try to load from storage first
      const loaded = await this.loadFromStorage();
      if (!loaded) {
        // If that fails, rebuild
        await this.initialize();
      }
    }

    if (!query.trim()) {
      return [];
    }

    const results = this.miniSearch.search(query, {
      boost: {
        customName: 3,
        aliases: 2.5,
        title: 2,
        collectionName: 1.5,
        url: 1,
      },
      fuzzy: 0.2,
      prefix: true,
    });

    return results.slice(0, limit).map((result) => ({
      id: result.id,
      type: result.type as 'url' | 'collection',
      score: result.score,
      matchField: this.determineMatchField(result.match),
      collectionId: result.collectionId,
      collectionName: result.collectionName,
      url: result.url,
      title: result.originalTitle || result.title,
      customName: result.customName || null,
      favicon: result.favicon,
    }));
  }

  /**
   * Determine which field matched for boosting/highlighting
   */
  private determineMatchField(match: Record<string, string[]>): 'customName' | 'title' | 'url' | 'alias' | 'collectionName' {
    if (match.customName) return 'customName';
    if (match.aliases) return 'alias';
    if (match.title) return 'title';
    if (match.url) return 'url';
    return 'collectionName';
  }

  /**
   * Add a new URL to the index (adds for all collections)
   */
  async addURL(url: SavedURL, collectionsMap: Record<string, Collection>): Promise<void> {
    if (!this.isInitialized) return;

    // Add a search document for each collection the URL belongs to
    url.collectionIds.forEach((collectionId) => {
      const collection = collectionsMap[collectionId];
      if (collection) {
        this.miniSearch.add({
          id: `${url.id}-${collectionId}`,
          type: 'url',
          customName: url.customName || '',
          aliases: url.aliases.join(' '),
          title: url.originalTitle,
          url: url.url,
          collectionName: collection.name,
          collectionId: collectionId,
          originalTitle: url.originalTitle,
          favicon: url.favicon,
          savedAt: url.savedAt,
          urlId: url.id,
        });
      }
    });

    await this.persistIndex();
  }

  /**
   * Update a URL in the index (updates all collection memberships)
   */
  async updateURL(url: SavedURL, collectionsMap: Record<string, Collection>): Promise<void> {
    if (!this.isInitialized) return;

    // Remove all existing entries for this URL
    await this.removeURL(url.id);
    // Re-add with current collection memberships
    await this.addURL(url, collectionsMap);
  }

  /**
   * Remove a URL from the index (removes all collection entries)
   */
  async removeURL(urlId: string): Promise<void> {
    console.log('🔍 SearchService.removeURL called:', {
      urlId,
      isInitialized: this.isInitialized
    });

    if (!this.isInitialized) {
      console.log('⚠️ Search service not initialized, skipping URL removal:', urlId);
      return;
    }

    try {
      console.log('🔍 Removing all search entries for URL:', urlId);
      
      // Find all search documents for this URL (across all collections)
      // Search through all documents and find ones with matching urlId
      const allDocuments = this.miniSearch.search('*');
      console.log('🔍 Total search documents found:', allDocuments.length);
      
      const urlDocuments = allDocuments.filter(doc => {
        const isMatch = doc.type === 'url' && doc.urlId === urlId;
        if (isMatch) {
          console.log('🔍 Found matching document:', { id: doc.id, urlId: doc.urlId, collectionId: doc.collectionId });
        }
        return isMatch;
      });

      console.log('🔍 Found', urlDocuments.length, 'search documents for URL:', urlId);
      
      // Remove each document
      urlDocuments.forEach(doc => {
        this.miniSearch.discard(doc.id);
      });
      
      console.log('✅ miniSearch.discard completed for URL:', urlId);
      
      console.log('🔍 Persisting search index after URL removal...');
      await this.persistIndex();
      console.log('✅ Search index persisted successfully after URL removal:', urlId);
      
    } catch (error) {
      console.error('❌ Error in SearchService.removeURL:', {
        urlId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Re-throw so the caller can handle it
    }
  }

  /**
   * Add a new collection to the index
   */
  async addCollection(collection: Collection): Promise<void> {
    if (!this.isInitialized) return;

    this.miniSearch.add({
      id: collection.id,
      type: 'collection',
      customName: '',
      aliases: '',
      title: collection.name,
      url: '',
      collectionName: collection.name,
      collectionId: collection.id,
    });

    await this.persistIndex();
  }

  /**
   * Update a collection in the index
   */
  async updateCollection(collection: Collection): Promise<void> {
    if (!this.isInitialized) return;

    this.miniSearch.discard(collection.id);
    await this.addCollection(collection);

    // Update all URLs in this collection with new collection name
    const urls = await storage.getURLsForCollection(collection.id);
    const collections = await storage.getCollections();
    for (const url of urls) {
      await this.updateURL(url, collections);
    }
  }

  /**
   * Remove a collection from the index
   */
  async removeCollection(collectionId: string): Promise<void> {
    if (!this.isInitialized) return;

    this.miniSearch.discard(collectionId);
    await this.persistIndex();
  }

  /**
   * Get recent URLs (for empty search state)
   */
  async getRecentURLs(limit = 5): Promise<SearchResult[]> {
    const urls = await storage.getURLs();
    const collections = await storage.getCollections();

    return Object.values(urls)
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, limit)
      .flatMap((url) => 
        url.collectionIds.map((collectionId) => ({
          id: `${url.id}-${collectionId}`,
          type: 'url' as const,
          score: 0,
          matchField: 'title' as const,
          collectionId: collectionId,
          collectionName: collections[collectionId]?.name || 'Unknown',
          url: url.url,
          title: url.originalTitle,
          customName: url.customName,
          favicon: url.favicon,
        }))
      )
      .slice(0, limit);
  }
}

// Export singleton instance
export const searchService = new SearchService();
