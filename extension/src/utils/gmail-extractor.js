/**
 * PhishGuard AI - Gmail Email Extractor
 * 
 * Extracts email data from Gmail's DOM including sender,
 * subject, body, links, and attachments.
 */

class GmailExtractor {
  constructor() {
    this.currentEmail = null;
    this.observer = null;
  }

  /**
   * Initialize DOM observer to detect email opens
   */
  initializeObserver() {
    // Use MutationObserver to detect when emails are opened
    const targetNode = document.body;
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'data-message-id']
    };

    this.observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });

    this.observer.observe(targetNode, config);
    console.log('Gmail email observer initialized');
  }

  /**
   * Handle DOM changes and detect email opens
   * 
   * @param {Array} mutations - DOM mutations
   */
  handleDOMChanges(mutations) {
    // Check if an email is currently open
    const emailContainer = this.getEmailContainer();
    
    if (emailContainer) {
      const messageId = this.extractMessageId();
      
      // Only process if email changed
      if (!this.currentEmail || this.currentEmail.message_id !== messageId) {
        this.currentEmail = { message_id: messageId };
        
        // Dispatch event that email is ready for analysis
        const event = new CustomEvent('phishguard-email-opened', {
          detail: { messageId: messageId }
        });
        document.dispatchEvent(event);
      }
    }
  }

  /**
   * Get the email container element
   * 
   * @returns {Element|null} Email container or null
   */
  getEmailContainer() {
    // Gmail message view container
    const containers = document.querySelectorAll('div[role="main"]');
    
    for (const container of containers) {
      // Check if this is an email view (contains headers and body)
      if (this.isEmailView(container)) {
        return container;
      }
    }
    
    return null;
  }

  /**
   * Check if element is an email view
   * 
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is email view
   */
  isEmailView(element) {
    // Look for email headers and body
    const hasHeaders = element.querySelector('[email]') !== null;
    const hasBody = element.querySelector('[role="region"]') !== null;
    
    return hasHeaders && hasBody;
  }

  /**
   * Extract email message ID from Gmail
   * 
   * @returns {string} Message ID
   */
  extractMessageId() {
    // Try multiple methods to get message ID
    
    // Method 1: From data attribute
    const emailElement = document.querySelector('[data-message-id]');
    if (emailElement) {
      return emailElement.getAttribute('data-message-id');
    }

    // Method 2: From URL
    const urlMatch = window.location.hash.match(/#all\/([a-f0-9]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Method 3: Generate pseudo ID from timestamp + random
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract all email data
   * 
   * @returns {Object} Extracted email data
   */
  async extractEmailData() {
    const emailContainer = this.getEmailContainer();
    
    if (!emailContainer) {
      console.warn('Email container not found');
      return null;
    }

    try {
      const emailData = {
        message_id: this.extractMessageId(),
        sender: this.extractSender(emailContainer),
        recipient: this.extractRecipient(emailContainer),
        cc: this.extractCC(emailContainer),
        bcc: this.extractBCC(emailContainer),
        subject: this.extractSubject(emailContainer),
        body: this.extractBody(emailContainer),
        body_html: this.extractBodyHTML(emailContainer),
        timestamp: this.extractTimestamp(emailContainer),
        message_headers: this.extractHeaders(emailContainer),
        is_reply: this.isReply(emailContainer),
        is_forwarded: this.isForwarded(emailContainer)
      };

      return emailData;
    } catch (error) {
      console.error('Error extracting email data:', error);
      return null;
    }
  }

  /**
   * Extract sender information
   * 
   * @param {Element} container - Email container
   * @returns {Object} Sender object
   */
  extractSender(container) {
    try {
      // Look for email element with sender info
      const senderElement = container.querySelector('[email]');
      
      if (senderElement) {
        const email = senderElement.getAttribute('email') || '';
        const name = senderElement.textContent.trim();

        return {
          name: name,
          email: email
        };
      }

      // Fallback: extract from "From:" label
      const fromText = this.extractLabeledText(container, 'From:');
      const emailMatch = fromText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      
      if (emailMatch) {
        return {
          name: fromText.replace(emailMatch[1], '').trim(),
          email: emailMatch[1]
        };
      }

      return { name: '', email: '' };
    } catch (error) {
      console.error('Error extracting sender:', error);
      return { name: '', email: '' };
    }
  }

  /**
   * Extract recipient (To field)
   * 
   * @param {Element} container - Email container
   * @returns {string} Recipient email
   */
  extractRecipient(container) {
    try {
      // Get current user email from Gmail UI
      const userEmailElement = document.querySelector('[data-email]');
      if (userEmailElement) {
        return userEmailElement.getAttribute('data-email');
      }

      // Fallback: try to get from storage or settings
      const toText = this.extractLabeledText(container, 'To:');
      const emailMatch = toText.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      
      return emailMatch ? emailMatch[1] : 'unknown@example.com';
    } catch (error) {
      console.error('Error extracting recipient:', error);
      return 'unknown@example.com';
    }
  }

  /**
   * Extract CC recipients
   * 
   * @param {Element} container - Email container
   * @returns {Array} CC email addresses
   */
  extractCC(container) {
    try {
      const ccText = this.extractLabeledText(container, 'Cc:');
      const emails = this.extractEmails(ccText);
      return emails;
    } catch (error) {
      console.error('Error extracting CC:', error);
      return [];
    }
  }

  /**
   * Extract BCC recipients
   * 
   * @param {Element} container - Email container
   * @returns {Array} BCC email addresses
   */
  extractBCC(container) {
    try {
      const bccText = this.extractLabeledText(container, 'Bcc:');
      const emails = this.extractEmails(bccText);
      return emails;
    } catch (error) {
      console.error('Error extracting BCC:', error);
      return [];
    }
  }

  /**
   * Extract email subject
   * 
   * @param {Element} container - Email container
   * @returns {string} Subject line
   */
  extractSubject(container) {
    try {
      // Look for subject in h2 tags
      const h2Elements = container.querySelectorAll('h2');
      
      for (const h2 of h2Elements) {
        const text = h2.textContent.trim();
        // Subject usually contains common words
        if (text.length > 0 && text.length < 500) {
          return text;
        }
      }

      // Fallback: look for subject pattern in document
      const subjectPattern = /Subject:\s*(.+?)(?:\n|$)/i;
      const match = document.body.textContent.match(subjectPattern);
      
      return match ? match[1].trim() : '(No Subject)';
    } catch (error) {
      console.error('Error extracting subject:', error);
      return '(No Subject)';
    }
  }

  /**
   * Extract email body (text)
   * 
   * @param {Element} container - Email container
   * @returns {string} Email body text
   */
  extractBody(container) {
    try {
      // Look for email body in main content area
      const bodyElements = container.querySelectorAll('div[role="region"]');
      
      let bodyText = '';
      
      for (const elem of bodyElements) {
        const text = elem.innerText;
        if (text && text.length > bodyText.length) {
          bodyText = text;
        }
      }

      // Clean up the text
      bodyText = this.cleanText(bodyText);

      return bodyText || '(No content)';
    } catch (error) {
      console.error('Error extracting body:', error);
      return '(No content)';
    }
  }

  /**
   * Extract email body (HTML)
   * 
   * @param {Element} container - Email container
   * @returns {string|null} HTML body or null
   */
  extractBodyHTML(container) {
    try {
      // Look for email content div
      const contentDiv = container.querySelector('[role="region"]');
      
      if (contentDiv) {
        // Clone to avoid modifying DOM
        const clone = contentDiv.cloneNode(true);
        
        // Remove scripts and styles
        clone.querySelectorAll('script, style').forEach(el => el.remove());
        
        return clone.innerHTML;
      }

      return null;
    } catch (error) {
      console.error('Error extracting body HTML:', error);
      return null;
    }
  }

  /**
   * Extract email timestamp
   * 
   * @param {Element} container - Email container
   * @returns {string} ISO 8601 timestamp
   */
  extractTimestamp(container) {
    try {
      // Look for date/time text in headers
      const headerElements = container.querySelectorAll('[role="region"]');
      
      for (const elem of headerElements) {
        const text = elem.textContent;
        
        // Look for date patterns
        const datePatterns = [
          /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
          /(\w+\s+\d{1,2},?\s+\d{4})/,
          /(\d{4}-\d{2}-\d{2})/
        ];

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            try {
              const date = new Date(match[1]);
              return date.toISOString();
            } catch (e) {
              // Invalid date, continue
            }
          }
        }
      }

      // Fallback to current time
      return new Date().toISOString();
    } catch (error) {
      console.error('Error extracting timestamp:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Extract email headers (SPF, DKIM, DMARC)
   * 
   * @param {Element} container - Email container
   * @returns {Object} Headers object
   */
  extractHeaders(container) {
    // Gmail doesn't easily expose these in DOM
    // They would need to be extracted from full headers
    return {
      spf: 'unknown',
      dkim: 'unknown',
      dmarc: 'unknown'
    };
  }

  /**
   * Check if email is a reply
   * 
   * @param {Element} container - Email container
   * @returns {boolean} True if reply
   */
  isReply(container) {
    const subjectText = this.extractSubject(container).toLowerCase();
    return /^re:/i.test(subjectText);
  }

  /**
   * Check if email is forwarded
   * 
   * @param {Element} container - Email container
   * @returns {boolean} True if forwarded
   */
  isForwarded(container) {
    const subjectText = this.extractSubject(container).toLowerCase();
    return /^fwd:/i.test(subjectText);
  }

  /**
   * Extract all links from email
   * 
   * @param {Element} container - Email container
   * @returns {Array} Links array
   */
  extractLinks(container) {
    const links = [];
    
    try {
      const linkElements = container.querySelectorAll('a[href]');
      
      linkElements.forEach((linkEl, index) => {
        const href = linkEl.getAttribute('href');
        const text = linkEl.textContent.trim();
        
        // Skip mail links and other non-HTTP links
        if (!href.startsWith('http')) return;
        
        links.push({
          href: href,
          anchor_text: text || href,
          position: index
        });
      });
    } catch (error) {
      console.error('Error extracting links:', error);
    }

    return links;
  }

  /**
   * Extract attachment information
   * 
   * @param {Element} container - Email container
   * @returns {Array} Attachments array
   */
  extractAttachments(container) {
    const attachments = [];
    
    try {
      // Gmail attachment containers
      const attachmentElements = container.querySelectorAll('[data-filename]');
      
      attachmentElements.forEach((attEl) => {
        const fileName = attEl.getAttribute('data-filename');
        const sizeAttr = attEl.getAttribute('data-size');
        
        if (fileName) {
          attachments.push({
            name: fileName,
            size: sizeAttr ? parseInt(sizeAttr) : 0,
            mime_type: this.getMimeType(fileName)
          });
        }
      });
    } catch (error) {
      console.error('Error extracting attachments:', error);
    }

    return attachments;
  }

  /**
   * Get MIME type from filename
   * 
   * @param {string} fileName - File name
   * @returns {string} MIME type
   */
  getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'docm': 'application/vnd.ms-word.document.macroEnabled.12',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'exe': 'application/x-msdownload',
      'zip': 'application/zip',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Extract labeled text from container (e.g., "From:", "To:")
   * 
   * @param {Element} container - Email container
   * @param {string} label - Label to find
   * @returns {string} Text after label
   */
  extractLabeledText(container, label) {
    const text = container.textContent;
    const pattern = new RegExp(`${label}\\s*(.+?)(?=\\n|$)`, 'i');
    const match = text.match(pattern);
    
    return match ? match[1].trim() : '';
  }

  /**
   * Extract email addresses from text
   * 
   * @param {string} text - Text containing email addresses
   * @returns {Array} Email addresses
   */
  extractEmails(text) {
    const emailRegex = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Clean up text (remove extra whitespace, etc.)
   * 
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\n+/g, '\n')
      .trim();
  }

  /**
   * Destroy observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      console.log('Gmail email observer destroyed');
    }
  }
}

// Export singleton instance
export default new GmailExtractor();
