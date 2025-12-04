/**
 * Background service worker
 * Handles extension lifecycle and background tasks
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Tab Manager installed');

    // Initialize default preferences
    await chrome.storage.local.set({
      preferences: {
        theme: 'system',
        defaultCollection: null,
        autoFocusSearch: true,
        showUrlPreviews: true,
        collectionsPerRow: 'auto',
      },
      collections: {},
      urls: {},
      searchIndex: null,
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle async responses
  (async () => {
    try {
      switch (message.type) {
        case 'SAVE_CURRENT_TAB':
          await saveCurrentTab(message.collectionId);
          sendResponse({ success: true });
          break;

        case 'SAVE_ALL_TABS':
          const result = await saveAllTabs();
          sendResponse({ success: true, data: result });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  // Return true to indicate we'll respond asynchronously
  return true;
});

/**
 * Save current active tab to a collection
 */
async function saveCurrentTab(collectionId: string) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.title) {
    throw new Error('No active tab found');
  }

  const urlId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get collection and update it
  const storage = await chrome.storage.local.get(['collections', 'urls']);
  const collections = storage.collections || {};
  const urls = storage.urls || {};

  const collection = collections[collectionId];
  if (!collection) {
    throw new Error('Collection not found');
  }

  // Create URL object
  const newUrl = {
    id: urlId,
    url: tab.url,
    originalTitle: tab.title,
    customName: null,
    aliases: [],
    favicon: tab.favIconUrl || null,
    collectionIds: [collectionId],
    position: collection.urlIds.length,
    savedAt: Date.now(),
    lastAccessedAt: Date.now(),
  };

  // Update collection and URLs
  collection.urlIds.push(urlId);
  collection.updatedAt = Date.now();
  collections[collectionId] = collection;
  urls[urlId] = newUrl;

  await chrome.storage.local.set({ collections, urls });

  return { urlId, url: newUrl };
}

/**
 * Save all open tabs as a new collection
 */
async function saveAllTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // Filter out the new tab page itself and invalid tabs
  const validTabs = tabs.filter(
    (tab) => tab.url && !tab.url.startsWith('chrome://') && tab.title
  );

  if (validTabs.length === 0) {
    throw new Error('No tabs to save');
  }

  const collectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  // Generate collection name
  const date = new Date(timestamp);
  const collectionName = `Saved ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  // Get current storage
  const storage = await chrome.storage.local.get(['collections', 'urls']);
  const collections = storage.collections || {};
  const urls = storage.urls || {};

  // Get current collection count for position
  const collectionCount = Object.keys(collections).length;

  // Create collection
  const newCollection = {
    id: collectionId,
    name: collectionName,
    createdAt: timestamp,
    updatedAt: timestamp,
    position: collectionCount,
    urlIds: [] as string[],
  };

  // Create URL objects
  validTabs.forEach((tab, index) => {
    const urlId = `${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;

    urls[urlId] = {
      id: urlId,
      url: tab.url!,
      originalTitle: tab.title!,
      customName: null,
      aliases: [],
      favicon: tab.favIconUrl || null,
      collectionIds: [collectionId],
      position: index,
      savedAt: timestamp,
      lastAccessedAt: timestamp,
    };

    newCollection.urlIds.push(urlId);
  });

  collections[collectionId] = newCollection;

  await chrome.storage.local.set({ collections, urls });

  return {
    collectionId,
    collection: newCollection,
    tabCount: validTabs.length,
  };
}

export {};
