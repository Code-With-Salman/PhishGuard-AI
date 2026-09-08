/**
 * PhishGuard AI - Constants & Configuration
 * 
 * Central configuration file for extension-wide constants,
 * API endpoints, timeouts, and thresholds.
 */

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  // n8n webhook endpoint - CHANGE THIS TO YOUR N8N INSTANCE
  WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/phishing-analysis',
  
  // Timeout for API requests (milliseconds)
  REQUEST_TIMEOUT: 20000,  // 20 seconds
  
  // Maximum number of retries for failed requests
  MAX_RETRIES: 2,
  
  // Retry backoff multiplier (exponential backoff)
  RETRY_BACKOFF: 1000,  // 1 second base
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 20,
    WINDOW_SIZE_MS: 60000
  }
};

// ============================================================================
// RISK SCORING THRESHOLDS
// ============================================================================

export const RISK_THRESHOLDS = {
  SAFE: {
    min: 0,
    max: 30,
    label: 'SAFE',
    badge: '🟢',
    color: '#10b981',
    bgColor: '#ecfdf5'
  },
  SUSPICIOUS: {
    min: 31,
    max: 60,
    label: 'SUSPICIOUS',
    badge: '🟡',
    color: '#f59e0b',
    bgColor: '#fffbeb'
  },
  HIGH_RISK: {
    min: 61,
    max: 100,
    label: 'HIGH_RISK',
    badge: '🔴',
    color: '#ef4444',
    bgColor: '#fef2f2'
  }
};

// ============================================================================
// BANNER STYLING
// ============================================================================

export const BANNER_CONFIG = {
  // Banner element IDs
  BANNER_ID: 'phishguard-ai-banner',
  CLOSE_BTN_ID: 'phishguard-ai-close',
  REPORT_BTN_ID: 'phishguard-ai-report',
  
  // Z-index to ensure banner stays on top
  Z_INDEX: 10000,
  
  // Animation duration (milliseconds)
  ANIMATION_DURATION: 300,
  
  // Hide banner after (ms) - 0 = never auto-hide
  AUTO_HIDE_TIMEOUT: 0
};

// ============================================================================
// DANGEROUS FILE EXTENSIONS
// ============================================================================

export const DANGEROUS_EXTENSIONS = {
  EXECUTABLE: [
    'exe', 'bat', 'scr', 'vbs', 'com', 'pif', 'msi',
    'dll', 'sys', 'drv', 'cmd', 'ps1', 'jar', 'sh', 'bash'
  ],
  MACRO_ENABLED: [
    'docm', 'xlsm', 'pptm', 'potm', 'ppam', 'ppsm', 'sldm'
  ],
  ARCHIVE: [
    'zip', 'rar', 'gz', '7z', 'tar', 'iso', 'cab'
  ],
  SCRIPT: [
    'js', 'py', 'rb', 'go', 'php', 'java', 'cpp'
  ],
  SHORTCUT: [
    'lnk', 'scf', 'url'
  ]
};

// ============================================================================
// URL SHORTENER DOMAINS
// ============================================================================

export const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'ow.ly',
  'goo.gl',
  'short.link',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'tiny.cc',
  'lnk.co'
];

// ============================================================================
// KNOWN THREAT KEYWORDS
// ============================================================================

export const THREAT_KEYWORDS = {
  URGENCY: [
    'act now',
    'immediate action',
    'urgent',
    'verify immediately',
    'confirm quickly',
    'time sensitive',
    'limited time',
    'don\'t delay',
    'asap',
    'right away'
  ],
  
  CREDENTIAL_THEFT: [
    'verify account',
    'confirm identity',
    'enter password',
    'login credentials',
    'validate account',
    'update information',
    'provide details',
    'confirm email address',
    'enter credit card',
    'social security'
  ],
  
  FINANCIAL: [
    'payment',
    'invoice',
    'billing',
    'wire transfer',
    'bank account',
    'credit card',
    'refund',
    'compensation',
    'claim',
    'settlement'
  ],
  
  SOCIAL_ENGINEERING: [
    'confirm you are',
    'click below',
    'verify here',
    'follow this link',
    'download this',
    'read more',
    'see attachment',
    'open document'
  ]
};

// ============================================================================
// GMAIL DOM SELECTORS
// ============================================================================

export const GMAIL_SELECTORS = {
  // Email container (message view)
  EMAIL_CONTAINER: 'div[role="main"]',
  
  // Email header area
  HEADER_AREA: 'div[class*="gJ"]',
  
  // Sender info
  SENDER_NAME: 'span[email]',
  SENDER_EMAIL: 'span[email]',
  
  // Subject line
  SUBJECT: 'h2',
  
  // Email body
  EMAIL_BODY: 'div[role="region"]',
  
  // Link elements
  LINKS: 'a[href]',
  
  // Attachment container
  ATTACHMENT_CONTAINER: 'div[data-filename]'
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  // User settings
  USER_SETTINGS: 'phishguard_user_settings',
  
  // Analysis cache
  ANALYSIS_CACHE: 'phishguard_analysis_cache',
  
  // Whitelisted senders
  WHITELIST: 'phishguard_whitelist',
  
  // Extension enabled/disabled
  EXTENSION_ENABLED: 'phishguard_enabled',
  
  // Last analysis timestamp
  LAST_ANALYSIS: 'phishguard_last_analysis',
  
  // API configuration
  API_CONFIG_STORED: 'phishguard_api_config',
  
  // Analysis history
  ANALYSIS_HISTORY: 'phishguard_analysis_history'
};

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_SETTINGS = {
  // Enable/disable extension
  enabled: true,
  
  // Analysis preferences
  enableBodyAnalysis: true,
  enableAttachmentAnalysis: true,
  enableURLAnalysis: true,
  
  // Sensitivity level: 'LOW', 'MEDIUM', 'HIGH'
  sensitivityLevel: 'MEDIUM',
  
  // Notification preferences
  notifyHighRisk: true,
  notifyOnAnalysisComplete: false,
  
  // UI preferences
  theme: 'auto',  // 'auto', 'light', 'dark'
  bannerPosition: 'top',  // 'top', 'inline'
  
  // Data preferences
  cacheAnalysis: true,
  cacheExpiration: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
  
  // Debug mode
  debugMode: false
};

// ============================================================================
// ANALYSIS RESULT MESSAGES
// ============================================================================

export const MESSAGES = {
  // Analysis states
  ANALYZING: 'Analyzing email for phishing threats...',
  ANALYSIS_COMPLETE: 'Analysis complete',
  ANALYSIS_FAILED: 'Analysis failed. Please try again.',
  
  // User actions
  COPIED: 'Copied to clipboard',
  WHITELIST_ADDED: 'Sender added to whitelist',
  WHITELIST_REMOVED: 'Sender removed from whitelist',
  
  // Errors
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_API: 'API error. Please try again later.',
  ERROR_INVALID_EMAIL: 'Could not extract email data',
  ERROR_TIMEOUT: 'Request timed out. Please try again.'
};

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const CACHE_CONFIG = {
  // Cache expiration in milliseconds
  EXPIRATION_TIME: 7 * 24 * 60 * 60 * 1000,  // 7 days
  
  // Maximum cache size
  MAX_CACHE_SIZE: 1000,  // Maximum number of cached analyses
  
  // Storage quota check interval
  QUOTA_CHECK_INTERVAL: 60000  // Check every minute
};

// ============================================================================
// MONITORING & LOGGING
// ============================================================================

export const LOGGING_CONFIG = {
  // Log levels: 'debug', 'info', 'warn', 'error'
  LOG_LEVEL: 'info',
  
  // Enable console logging
  CONSOLE_LOGGING: true,
  
  // Enable file logging (requires background service worker)
  FILE_LOGGING: false,
  
  // Maximum log entries to keep in memory
  MAX_LOG_ENTRIES: 1000,
  
  // Log retention time (milliseconds)
  LOG_RETENTION: 24 * 60 * 60 * 1000  // 24 hours
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  // Enable advanced LLM analysis
  ENABLE_LLM_ANALYSIS: true,
  
  // Enable URL redirect analysis
  ENABLE_URL_REDIRECT_ANALYSIS: true,
  
  // Enable attachment scanning
  ENABLE_ATTACHMENT_SCANNING: true,
  
  // Enable email header analysis
  ENABLE_HEADER_ANALYSIS: true,
  
  // Enable caching
  ENABLE_CACHING: true,
  
  // Enable one-click phishing report
  ENABLE_ONE_CLICK_REPORT: true,
  
  // Enable offline mode (cached results only)
  ENABLE_OFFLINE_MODE: false,
  
  // Enable dark mode
  ENABLE_DARK_MODE: true
};

// ============================================================================
// EXTERNAL API KEYS (Load from storage)
// ============================================================================

export const EXTERNAL_APIS = {
  VIRUSTOTAL: null,          // Loaded from storage
  GOOGLE_SAFE_BROWSING: null, // Loaded from storage
  OPENAI: null                // Loaded from storage
};

// ============================================================================
// DEVELOPMENT SETTINGS
// ============================================================================

export const DEV_CONFIG = {
  // Enable mock data (for testing)
  USE_MOCK_DATA: false,
  
  // Mock API response delay (milliseconds)
  MOCK_DELAY: 2000,
  
  // Enable extension logging
  ENABLE_LOGGING: true,
  
  // Test mode (no external API calls)
  TEST_MODE: false
};

// ============================================================================
// EXPORT ALL CONFIGURATION
// ============================================================================

export default {
  API_CONFIG,
  RISK_THRESHOLDS,
  BANNER_CONFIG,
  DANGEROUS_EXTENSIONS,
  URL_SHORTENERS,
  THREAT_KEYWORDS,
  GMAIL_SELECTORS,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  MESSAGES,
  CACHE_CONFIG,
  LOGGING_CONFIG,
  FEATURE_FLAGS,
  EXTERNAL_APIS,
  DEV_CONFIG
};
