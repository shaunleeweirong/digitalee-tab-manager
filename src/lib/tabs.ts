/**
 * Tabs service for querying and managing Chrome tabs
 */

export interface OpenTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  windowId: number;
  active: boolean;
  index: number;
}

class TabsService {
  /**
   * Get all tabs in the current window
   */
  async getCurrentWindowTabs(): Promise<OpenTab[]> {
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // Filter out chrome:// URLs and new tab pages
    return tabs
      .filter((tab) =>
        tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        tab.title
      )
      .map((tab) => ({
        id: tab.id!,
        title: tab.title!,
        url: tab.url!,
        favIconUrl: tab.favIconUrl,
        windowId: tab.windowId,
        active: tab.active,
        index: tab.index,
      }));
  }

  /**
   * Close a tab by ID
   */
  async closeTab(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
  }

  /**
   * Check if a URL is already saved in any collection
   */
  async isTabSaved(url: string, savedUrls: Record<string, any>): Promise<{
    saved: boolean;
    collectionIds: string[];
    savedUrl?: any;
  }> {
    const urlEntries = Object.values(savedUrls);
    const savedUrl = urlEntries.find((savedUrl: any) => savedUrl.url === url);

    if (savedUrl) {
      return {
        saved: true,
        collectionIds: (savedUrl as any).collectionIds || [(savedUrl as any).collectionId], // Support both new and legacy format
        savedUrl: savedUrl,
      };
    }

    return { saved: false, collectionIds: [] };
  }

  /**
   * Subscribe to tab events (created, removed, updated)
   */
  onTabsChanged(callback: () => void): () => void {
    const createdListener = () => callback();
    const removedListener = () => callback();
    const updatedListener = () => callback();

    chrome.tabs.onCreated.addListener(createdListener);
    chrome.tabs.onRemoved.addListener(removedListener);
    chrome.tabs.onUpdated.addListener(updatedListener);

    // Return cleanup function
    return () => {
      chrome.tabs.onCreated.removeListener(createdListener);
      chrome.tabs.onRemoved.removeListener(removedListener);
      chrome.tabs.onUpdated.removeListener(updatedListener);
    };
  }
}

// Export singleton instance
export const tabsService = new TabsService();
