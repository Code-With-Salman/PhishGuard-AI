/**
 * PhishGuard AI - API Service Layer
 * 
 * Handles all communication with the n8n webhook,
 * including rate limiting, retries, and error handling.
 */

import { API_CONFIG, MESSAGES, STORAGE_KEYS } from './constants.js';

class APIService {
  constructor() {
    this.requestQueue = [];
    this.requestTimestamps = [];
    this.activeRequests = new Map();
  }

  /**
   * Send email analysis request to n8n
   * 
   * @param {Object} emailData - Extracted email data
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeEmail(emailData) {
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please wait before analyzing another email.');
      }

      // Validate email data
      this.validateEmailData(emailData);

      // Prepare payload
      const payload = this.preparePayload(emailData);

      // Execute with retries
      const result = await this.executeWithRetry(payload);

      // Store in cache
      await this.cacheResult(emailData, result);

      return result;
    } catch (error) {
      console.error('Email analysis failed:', error);
      throw error;
    }
  }

  /**
   * Check rate limiting based on configured threshold
   * 
   * @returns {boolean} True if request is allowed
   */
  checkRateLimit() {
    const now = Date.now();
    const windowStart = now - API_CONFIG.RATE_LIMIT.WINDOW_SIZE_MS;

    // Remove old timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (this.requestTimestamps.length >= API_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
      console.warn('Rate limit reached:', this.requestTimestamps.length, 'requests in last minute');
      return false;
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
    return true;
  }

  /**
   * Validate email data structure
   * 
   * @param {Object} emailData - Email data to validate
   * @throws {Error} If validation fails
   */
  validateEmailData(emailData) {
    if (!emailData) {
      throw new Error('Email data is required');
    }

    if (!emailData.email) {
      throw new Error('Email object is required');
    }

    const email = emailData.email;

    // Check required fields
    if (!email.sender || !email.sender.email) {
      throw new Error('Sender email is required');
    }

    if (!email.body || email.body.trim().length === 0) {
      throw new Error('Email body cannot be empty');
    }

    if (!email.message_id) {
      throw new Error('Message ID is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.sender.email)) {
      throw new Error('Invalid sender email format');
    }

    // Sanitize body (limit length)
    const MAX_BODY_LENGTH = 50000;
    if (email.body.length > MAX_BODY_LENGTH) {
      email.body = email.body.substring(0, MAX_BODY_LENGTH);
      console.warn('Email body truncated to', MAX_BODY_LENGTH, 'characters');
    }
  }

  /**
   * Prepare the API payload
   * 
   * @param {Object} emailData - Email data
   * @returns {Object} API payload
   */
  preparePayload(emailData) {
    const now = new Date();
    
    return {
      metadata: {
        request_id: this.generateUUID(),
        timestamp: now.toISOString(),
        extension_version: chrome.runtime.getManifest().version,
        user_email: emailData.metadata?.user_email || 'unknown@example.com'
      },
      email: {
        message_id: emailData.email.message_id,
        sender: {
          name: emailData.email.sender.name || '',
          email: emailData.email.sender.email
        },
        recipient: emailData.email.recipient || '',
        cc: emailData.email.cc || [],
        bcc: emailData.email.bcc || [],
        subject: emailData.email.subject || '(No Subject)',
        body: emailData.email.body,
        body_html: emailData.email.body_html || null,
        timestamp: emailData.email.timestamp || now.toISOString(),
        message_headers: emailData.email.message_headers || {},
        is_reply: emailData.email.is_reply || false,
        is_forwarded: emailData.email.is_forwarded || false
      },
      links: emailData.links || [],
      attachments: emailData.attachments || []
    };
  }

  /**
   * Execute API request with exponential backoff retry
   * 
   * @param {Object} payload - Request payload
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async executeWithRetry(payload, attempt = 0) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

      // Make request
      const response = await fetch(API_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      // Check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      // Parse response
      const result = await response.json();

      console.log("PhishGuard API Response:", result);

      // Your n8n webhook already returns the report directly
      return result;

    } catch (error) {
      // Check if we should retry
      if (attempt < API_CONFIG.MAX_RETRIES && this.isRetryable(error)) {
        const delay = API_CONFIG.RETRY_BACKOFF * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${API_CONFIG.MAX_RETRIES} after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(payload, attempt + 1);
      }

      // Max retries exceeded or non-retryable error
      throw error;
    }
  }

  /**
   * Determine if error is retryable
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryable(error) {
    // Network errors and timeouts are retryable
    if (error.name === 'AbortError') return true;  // Timeout
    if (error.message.includes('Failed to fetch')) return true;  // Network error
    if (error.message.includes('ERR_')) return true;  // Chrome network error

    // 5xx server errors are retryable
    if (error.message.includes('HTTP 5')) return true;

    // 429 (Too Many Requests) is retryable
    if (error.message.includes('HTTP 429')) return true;

    // 408 (Request Timeout) is retryable
    if (error.message.includes('HTTP 408')) return true;

    return false;
  }

  /**
   * Cache analysis result for future use
   * 
   * @param {Object} emailData - Original email data
   * @param {Object} result - Analysis result
   */
  async cacheResult(emailData, result) {
    try {
      const cache = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_CACHE) || {};
      const analysisCache = cache[STORAGE_KEYS.ANALYSIS_CACHE] || {};

      // Create cache key from email hash
      const cacheKey = this.generateCacheKey(emailData.email);

      analysisCache[cacheKey] = {
        result: result,
        timestamp: Date.now(),
        expiration: Date.now() + (7 * 24 * 60 * 60 * 1000)  // 7 days
      };

      // Limit cache size (FIFO)
      const keys = Object.keys(analysisCache);
      if (keys.length > 1000) {
        const oldestKey = keys.reduce((oldest, key) => 
          analysisCache[key].timestamp < analysisCache[oldest].timestamp ? key : oldest
        );
        delete analysisCache[oldestKey];
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.ANALYSIS_CACHE]: analysisCache
      });
    } catch (error) {
      console.warn('Failed to cache analysis result:', error);
      // Non-fatal error - continue execution
    }
  }

  /**
   * Generate cache key from email data
   * 
   * @param {Object} email - Email object
   * @returns {string} Cache key
   */
  generateCacheKey(email) {
    // Use sender + subject + body hash as cache key
    const content = `${email.sender.email}|${email.subject}|${email.body}`;
    return this.hashString(content);
  }

  /**
   * Simple hash function for cache keys
   * 
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;  // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate UUID v4
   * 
   * @returns {string} UUID v4 string
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get cached analysis result
   * 
   * @param {Object} email - Email object
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getCachedResult(email) {
    try {
      const cache = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_CACHE);
      const analysisCache = cache[STORAGE_KEYS.ANALYSIS_CACHE] || {};

      const cacheKey = this.generateCacheKey(email);
      const cached = analysisCache[cacheKey];

      if (!cached) return null;

      // Check if expired
      if (cached.expiration < Date.now()) {
        delete analysisCache[cacheKey];
        await chrome.storage.local.set({
          [STORAGE_KEYS.ANALYSIS_CACHE]: analysisCache
        });
        return null;
      }

      return cached.result;
    } catch (error) {
      console.warn('Failed to retrieve cached result:', error);
      return null;
    }
  }

  /**
   * Clear analysis cache
   */
  async clearCache() {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.ANALYSIS_CACHE);
      console.log('Analysis cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache stats
   * 
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    try {
      const cache = await chrome.storage.local.get(STORAGE_KEYS.ANALYSIS_CACHE);
      const analysisCache = cache[STORAGE_KEYS.ANALYSIS_CACHE] || {};
      const cacheKeys = Object.keys(analysisCache);

      return {
        entries: cacheKeys.length,
        size: JSON.stringify(analysisCache).length,
        oldestEntry: cacheKeys.length > 0 
          ? Math.min(...cacheKeys.map(k => analysisCache[k].timestamp))
          : null
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { entries: 0, size: 0, oldestEntry: null };
    }
  }
}

// Export singleton instance
export default new APIService();
