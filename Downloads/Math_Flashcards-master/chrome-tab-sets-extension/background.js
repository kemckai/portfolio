// Storage abstraction layer supporting both local and sync storage
class StorageManager {
  static async saveTabSet(tabSet, useSync = false) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    
    try {
      // Get existing sets
      const existing = await this.getAllTabSets(useSync);
      
      // Check for errors
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      // Add or update the set
      existing[tabSet.id] = tabSet;
      
      // Save back
      await storage.set({ tabSets: existing });
      
      // Check for storage errors
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        // If sync storage fails (quota exceeded), fallback to local
        if (useSync && (error.message.includes('QUOTA_BYTES') || error.message.includes('quota'))) {
          console.warn('Sync storage quota exceeded, falling back to local storage');
          tabSet.useSync = false;
          return this.saveTabSet(tabSet, false);
        }
        throw new Error(error.message);
      }
      
      // Also maintain an index for quick lookup
      const index = await this.getIndex(useSync);
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      if (!index.includes(tabSet.id)) {
        index.push(tabSet.id);
        await storage.set({ tabSetIndex: index });
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      }
      
      return { success: true };
    } catch (error) {
      // If sync storage fails (quota exceeded), fallback to local
      if (useSync && (error.message.includes('QUOTA_BYTES') || error.message.includes('quota'))) {
        console.warn('Sync storage quota exceeded, falling back to local storage');
        tabSet.useSync = false;
        return this.saveTabSet(tabSet, false);
      }
      return { success: false, error: error.message };
    }
  }
  
  static async getAllTabSets(useSync = false) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get(['tabSets', 'tabSetIndex']);
    if (chrome.runtime.lastError) {
      console.error('Error getting tab sets:', chrome.runtime.lastError);
      return {};
    }
    return result.tabSets || {};
  }
  
  static async getTabSet(id, useSync = false) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    const allSets = await this.getAllTabSets(useSync);
    return allSets[id] || null;
  }
  
  static async deleteTabSet(id, useSync = false) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    
    try {
      const existing = await this.getAllTabSets(useSync);
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      delete existing[id];
      await storage.set({ tabSets: existing });
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      // Update index
      const index = await this.getIndex(useSync);
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      const newIndex = index.filter(i => i !== id);
      await storage.set({ tabSetIndex: newIndex });
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async getIndex(useSync = false) {
    const storage = useSync ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get('tabSetIndex');
    if (chrome.runtime.lastError) {
      console.error('Error getting index:', chrome.runtime.lastError);
      return [];
    }
    return result.tabSetIndex || [];
  }
  
  static async getAllTabSetsFromBoth() {
    const [localSets, syncSets] = await Promise.all([
      this.getAllTabSets(false),
      this.getAllTabSets(true)
    ]);
    
    // Merge sets, with sync taking precedence for duplicates
    return { ...localSets, ...syncSets };
  }
}

// Tab operations
class TabManager {
  static async getCurrentTabs() {
    try {
      const window = await chrome.windows.getCurrent({ populate: true });
      if (chrome.runtime.lastError) {
        console.error('Error getting current window:', chrome.runtime.lastError);
        return [];
      }
      const tabs = window.tabs || [];
      
      // Filter out invalid URLs (chrome://, chrome-extension:// internal pages)
      return tabs
        .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
        .map((tab, index) => ({
          url: tab.url,
          title: tab.title || 'Untitled',
          order: index,
          active: tab.active
        }));
    } catch (error) {
      console.error('Error getting current tabs:', error);
      return [];
    }
  }
  
  static async saveCurrentTabs(name, category = '', useSync = false) {
    try {
      const tabs = await this.getCurrentTabs();
      
      if (tabs.length === 0) {
        return { success: false, error: 'No tabs to save' };
      }
      
      const tabSet = {
        id: `tabset_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        name: name || `Tab Set ${new Date().toLocaleString()}`,
        category: category || 'Uncategorized',
        tabs: tabs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useSync: useSync
      };
      
      const result = await StorageManager.saveTabSet(tabSet, useSync);
      if (result.success) {
        return { success: true, tabSet };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async restoreTabSet(tabSetId, useSync = false) {
    try {
      const tabSet = await StorageManager.getTabSet(tabSetId, useSync);
      
      if (!tabSet || !tabSet.tabs || tabSet.tabs.length === 0) {
        return { success: false, error: 'Tab set not found or empty' };
      }
      
      // Sort tabs by order and filter invalid URLs
      const sortedTabs = [...tabSet.tabs]
        .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (sortedTabs.length === 0) {
        return { success: false, error: 'No valid tabs to restore' };
      }
      
      // Find the active tab
      const activeTab = sortedTabs.find(t => t.active) || sortedTabs[0];
      const activeIndex = sortedTabs.indexOf(activeTab);
      
      // Create new window with first tab
      const firstTab = sortedTabs[0];
      const window = await chrome.windows.create({
        url: firstTab.url,
        focused: true
      });
      
      if (chrome.runtime.lastError) {
        return { success: false, error: chrome.runtime.lastError.message };
      }
      
      // Open remaining tabs in sequence
      const tabPromises = [];
      for (let i = 1; i < sortedTabs.length; i++) {
        const tab = sortedTabs[i];
        tabPromises.push(
          chrome.tabs.create({
            windowId: window.id,
            url: tab.url,
            active: false
          }).catch(err => {
            console.error(`Error creating tab ${i}:`, err);
            return null;
          })
        );
      }
      
      const createdTabs = await Promise.all(tabPromises);
      const validTabs = createdTabs.filter(t => t !== null);
      
      // Activate the correct tab after tabs are created
      // Use a more reliable approach: wait for tabs to load
      if (activeIndex < validTabs.length + 1) {
        // Wait a bit for tabs to start loading, then activate
        setTimeout(async () => {
          try {
            const allTabs = await chrome.tabs.query({ windowId: window.id });
            if (chrome.runtime.lastError) {
              console.error('Error querying tabs:', chrome.runtime.lastError);
              return;
            }
            // Find the tab at the correct index
            if (allTabs[activeIndex]) {
              await chrome.tabs.update(allTabs[activeIndex].id, { active: true });
              if (chrome.runtime.lastError) {
                console.error('Error activating tab:', chrome.runtime.lastError);
              }
            }
          } catch (error) {
            console.error('Error activating tab:', error);
          }
        }, 300);
      }
      
      return { success: true, windowId: window.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Message handler for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'getCurrentTabs':
          const tabs = await TabManager.getCurrentTabs();
          sendResponse({ success: true, tabs });
          break;
          
        case 'saveCurrentTabs':
          const saveResult = await TabManager.saveCurrentTabs(
            request.name,
            request.category,
            request.useSync
          );
          sendResponse(saveResult);
          break;
          
        case 'getAllTabSets':
          const allSets = await StorageManager.getAllTabSetsFromBoth();
          sendResponse({ success: true, tabSets: allSets });
          break;
          
        case 'getTabSet':
          const set = await StorageManager.getTabSet(request.id, request.useSync);
          sendResponse({ success: true, tabSet: set });
          break;
          
        case 'deleteTabSet':
          const deleteResult = await StorageManager.deleteTabSet(request.id, request.useSync);
          sendResponse(deleteResult);
          break;
          
        case 'updateTabSet':
          const updateResult = await StorageManager.saveTabSet(request.tabSet, request.useSync);
          sendResponse(updateResult);
          break;
          
        case 'restoreTabSet':
          const restoreResult = await TabManager.restoreTabSet(request.id, request.useSync);
          sendResponse(restoreResult);
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});
