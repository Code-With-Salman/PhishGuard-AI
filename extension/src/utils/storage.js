/**
 * PhishGuard AI - Chrome Storage Utilities
 * 
 * Helper functions for Chrome extension storage operations.
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, CACHE_CONFIG } from './constants.js';

class StorageManager {
  /**
   * Get a value from Chrome storage
   * 
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {Promise<*>} Stored value or default
   */
  static async get(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a value in Chrome storage
   * 
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      throw error;
    }
  }

  /**
   * Remove a value from Chrome storage
   * 
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  static async remove(key) {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }

  /**
   * Clear all storage
   * 
   * @returns {Promise<void>}
   */
  static async clear() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all storage data
   * 
   * @returns {Promise<Object>} All stored data
   */
  static async getAll() {
    try {
      return await chrome.storage.local.get(null);
    } catch (error) {
      console.error('Error getting all storage:', error);
      return {};
    }
  }

  /**
   * Initialize storage with defaults
   * 
   * @returns {Promise<void>}
   */
  static async initialize() {
    try {
      const existing = await chrome.storage.local.get(null);

      // Initialize user settings if needed
      if (!existing[STORAGE_KEYS.USER_SETTINGS]) {
        await this.set(STORAGE_KEYS.USER_SETTINGS, DEFAULT_SETTINGS);
      }

      // Initialize other keys
      if (!existing[STORAGE_KEYS.WHITELIST]) {
        await this.set(STORAGE_KEYS.WHITELIST, []);
      }

      if (!existing[STORAGE_KEYS.ANALYSIS_CACHE]) {
        await this.set(STORAGE_KEYS.ANALYSIS_CACHE, {});
      }

      if (!existing['analysis_history']) {
        await this.set('analysis_history', []);
      }

      console.log('Storage initialized');
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  /**
   * Get storage size info
   * 
   * @returns {Promise<Object>} Storage size info
   */
  static async getStorageInfo() {
    try {
      const data = await this.getAll();
      const size = JSON.stringify(data).length;

      return {
        entries: Object.keys(data).length,
        sizeBytes: size,
        sizeKB: (size / 1024).toFixed(2),
        sizeMB: (size / (1024 * 1024)).toFixed(2),
        percentageUsed: ((size / chrome.storage.local.QUOTA_BYTES) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  /**
   * Export storage to JSON file
   * 
   * @returns {Promise<string>} JSON string of all data
   */
  static async exportData() {
    try {
      const data = await this.getAll();
      const timestamp = new Date().toISOString();
      
      return JSON.stringify({
        timestamp,
        version: chrome.runtime.getManifest().version,
        data
      }, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  /**
   * Import storage from JSON
   * 
   * @param {string} jsonData - JSON string to import
   * @returns {Promise<boolean>} True if successful
   */
  static async importData(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data) {
        throw new Error('Invalid import format');
      }

      // Clear and import
      await this.clear();
      
      for (const [key, value] of Object.entries(imported.data)) {
        await this.set(key, value);
      }

      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Cleanup old/expired data
   * 
   * @returns {Promise<void>}
   */
  static async cleanup() {
    try {
      const now = Date.now();

      // Cleanup cache
      const cache = await this.get(STORAGE_KEYS.ANALYSIS_CACHE, {});
      let cleaned = 0;

      for (const [key, value] of Object.entries(cache)) {
        if (value.expiration < now) {
          delete cache[key];
          cleaned++;
        }
      }

      if (cleaned > 0) {
        await this.set(STORAGE_KEYS.ANALYSIS_CACHE, cache);
        console.log(`Cleaned up ${cleaned} expired cache entries`);
      }

      // Cleanup history (keep last 100)
      let history = await this.get('analysis_history', []);
      if (history.length > 100) {
        history = history.slice(0, 100);
        await this.set('analysis_history', history);
        console.log('History truncated to 100 entries');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Watch for storage changes
   * 
   * @param {Function} callback - Called with changes
   */
  static onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        callback(changes);
      }
    });
  }
}

export default StorageManager;
