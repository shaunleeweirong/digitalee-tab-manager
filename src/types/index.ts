/**
 * Core data models for the Tab Manager extension
 * Based on PRD Appendix: Data Model
 */

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  position: number; // For ordering on home screen
  urlIds: string[]; // Ordered list of URL IDs
}

export interface SavedURL {
  id: string;
  url: string;
  originalTitle: string;
  customName: string | null;
  aliases: string[];
  favicon: string | null;
  collectionIds: string[]; // URLs can now belong to multiple collections
  position: number; // For ordering within collection (deprecated for multi-collection)
  savedAt: number;
  lastAccessedAt: number;
}

export interface UserPreferences {
  defaultCollection: string | null;
  autoFocusSearch: boolean;
  showUrlPreviews: boolean;
  collectionsPerRow: 2 | 3 | 4 | 'auto';
  showOpenTabs: boolean;
  openTabsCollapsed: boolean;
  openTabsLimit: number;
  autoRefreshTabs: boolean;
}

export type SearchMatchField = 'customName' | 'title' | 'url' | 'alias' | 'collectionName';

export interface SearchResult {
  id: string;
  type: 'url' | 'collection';
  score: number;
  matchField: SearchMatchField;
  collectionId: string;
  collectionName: string;
  // Extended fields for display
  url?: string;
  title?: string;
  customName?: string | null;
  favicon?: string | null;
}

/**
 * Storage keys for chrome.storage.local
 */
export enum StorageKey {
  COLLECTIONS = 'collections',
  URLS = 'urls',
  PREFERENCES = 'preferences',
  SEARCH_INDEX = 'searchIndex',
}

/**
 * Helper type for storage data structure
 */
export interface StorageData {
  [StorageKey.COLLECTIONS]: Record<string, Collection>;
  [StorageKey.URLS]: Record<string, SavedURL>;
  [StorageKey.PREFERENCES]: UserPreferences;
  [StorageKey.SEARCH_INDEX]: string | null; // Serialized MiniSearch index
}

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultCollection: null,
  autoFocusSearch: true,
  showUrlPreviews: true,
  collectionsPerRow: 'auto',
  showOpenTabs: true,
  openTabsCollapsed: false,
  openTabsLimit: 5,
  autoRefreshTabs: true,
};
