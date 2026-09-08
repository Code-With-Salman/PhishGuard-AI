/**
 * PhishGuard AI - Risk Score Formatter
 * 
 * Formats risk scores and analysis results for display,
 * with appropriate styling and messaging.
 */

import { RISK_THRESHOLDS, MESSAGES } from './constants.js';

class RiskFormatter {
  /**
   * Get risk level information from score
   * 
   * @param {number} score - Risk score (0-100)
   * @returns {Object} Risk level info with styling
   */
  getRiskLevel(score) {
    if (score <= 30) return RISK_THRESHOLDS.SAFE;
    if (score <= 60) return RISK_THRESHOLDS.SUSPICIOUS;
    return RISK_THRESHOLDS.HIGH_RISK;
  }

  /**
   * Format score for display
   * 
   * @param {number} score - Risk score
   * @returns {string} Formatted score
   */
  formatScore(score) {
    return `${Math.round(score)}/100`;
  }

  /**
   * Get badge HTML
   * 
   * @param {number} score - Risk score
   * @returns {string} HTML badge
   */
  getBadge(score) {
    const riskLevel = this.getRiskLevel(score);
    return `
      <span class="phishguard-badge" style="color: ${riskLevel.color};">
        ${riskLevel.badge}
      </span>
    `;
  }

  /**
   * Get status text
   * 
   * @param {number} score - Risk score
   * @returns {string} Status text
   */
  getStatusText(score) {
    const riskLevel = this.getRiskLevel(score);
    return riskLevel.label;
  }

  /**
   * Get status color
   * 
   * @param {number} score - Risk score
   * @returns {string} CSS color
   */
  getStatusColor(score) {
    const riskLevel = this.getRiskLevel(score);
    return riskLevel.color;
  }

  /**
   * Get background color
   * 
   * @param {number} score - Risk score
   * @returns {string} CSS background color
   */
  getBackgroundColor(score) {
    const riskLevel = this.getRiskLevel(score);
    return riskLevel.bgColor;
  }

  /**
   * Format breakdown scores as visual bars
   * 
   * @param {Object} breakdown - Score breakdown
   * @returns {string} HTML for visualization
   */
  formatBreakdownBars(breakdown) {
    return `
      <div class="phishguard-breakdown-bars">
        <div class="breakdown-item">
          <span class="breakdown-label">Sender Risk:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(breakdown.sender_risk / 25) * 100}%" 
                 title="${breakdown.sender_risk}/25"></div>
          </div>
          <span class="breakdown-value">${breakdown.sender_risk}/25</span>
        </div>
        
        <div class="breakdown-item">
          <span class="breakdown-label">Content Risk:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(breakdown.content_risk / 25) * 100}%" 
                 title="${breakdown.content_risk}/25"></div>
          </div>
          <span class="breakdown-value">${breakdown.content_risk}/25</span>
        </div>
        
        <div class="breakdown-item">
          <span class="breakdown-label">URL Risk:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(breakdown.url_risk / 25) * 100}%" 
                 title="${breakdown.url_risk}/25"></div>
          </div>
          <span class="breakdown-value">${breakdown.url_risk}/25</span>
        </div>
        
        <div class="breakdown-item">
          <span class="breakdown-label">Attachment Risk:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(breakdown.attachment_risk / 15) * 100}%" 
                 title="${breakdown.attachment_risk}/15"></div>
          </div>
          <span class="breakdown-value">${breakdown.attachment_risk}/15</span>
        </div>
        
        <div class="breakdown-item">
          <span class="breakdown-label">Auth Risk:</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(breakdown.auth_risk / 10) * 100}%" 
                 title="${breakdown.auth_risk}/10"></div>
          </div>
          <span class="breakdown-value">${breakdown.auth_risk}/10</span>
        </div>
      </div>
    `;
  }

  /**
   * Format findings as list items
   * 
   * @param {Array} findings - Array of finding strings
   * @returns {string} HTML list
   */
  formatFindings(findings) {
    if (!findings || findings.length === 0) {
      return '<p class="no-findings">No specific findings</p>';
    }

    const items = findings
      .slice(0, 10)  // Limit to 10 findings
      .map(finding => `<li>${this.escapeHtml(finding)}</li>`)
      .join('');

    return `
      <ul class="phishguard-findings">
        ${items}
      </ul>
    `;
  }

  /**
   * Format recommendations as action items
   * 
   * @param {Array} recommendations - Array of recommendation strings
   * @returns {string} HTML recommendations
   */
  formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '';
    }

    const items = recommendations
      .map(rec => `
        <div class="recommendation-item">
          <span class="recommendation-icon">→</span>
          <span>${this.escapeHtml(rec)}</span>
        </div>
      `)
      .join('');

    return `
      <div class="phishguard-recommendations">
        <h4>Recommended Actions:</h4>
        ${items}
      </div>
    `;
  }

  /**
   * Format summary as highlighted text
   * 
   * @param {string} summary - Summary text
   * @param {number} score - Risk score
   * @returns {string} HTML summary
   */
  formatSummary(summary, score) {
    const riskLevel = this.getRiskLevel(score);
    
    return `
      <div class="phishguard-summary" style="border-left: 4px solid ${riskLevel.color};">
        ${this.escapeHtml(summary)}
      </div>
    `;
  }

  /**
   * Format score as circular gauge
   * 
   * @param {number} score - Risk score
   * @returns {string} HTML gauge
   */
  formatScoreGauge(score) {
    const riskLevel = this.getRiskLevel(score);
    const percentage = (score / 100) * 360;
    
    return `
      <div class="phishguard-gauge">
        <div class="gauge-circle" style="background: conic-gradient(
          ${riskLevel.color} 0deg ${percentage}deg,
          #e5e7eb ${percentage}deg 360deg
        )">
          <div class="gauge-inner">
            <span class="gauge-score">${Math.round(score)}</span>
            <span class="gauge-label">${riskLevel.label}</span>
          </div>
        </div>
      </div>
    `;
  }

  formatReport(analysis) {
    const { risk_score, risk_level, summary, breakdown, detailed_findings, recommendations } = analysis;
    
    return `
      <div class="phishguard-report">
        <div class="report-header">
          <h2>PhishGuard AI Analysis Report</h2>
          <time>${new Date().toLocaleString()}</time>
        </div>
        
        <div class="risk-overview">
          ${this.formatScoreGauge(risk_score)}
          <div class="risk-info">
            <h3>Overall Risk: ${riskLevel}</h3>
            <p>${summary}</p>
          </div>
        </div>
        
        <section class="breakdown-section">
          <h3>Risk Breakdown</h3>
          ${this.formatBreakdownBars(breakdown)}
        </section>
        
        <section class="findings-section">
          <h3>Analysis Findings</h3>
          ${this.formatFindings(analysis.all_findings || [])}
        </section>
        
        <section class="recommendations-section">
          ${this.formatRecommendations(recommendations)}
        </section>
        
        <section class="details-section">
          <h3>Detailed Analysis</h3>
          ${this.formatDetailedFindings(detailed_findings)}
        </section>
      </div>
    `;
  }

  formatDetailedFindings(detailed_findings) {
    if (!detailed_findings) return '';

    const sections = [];

    if (detailed_findings.sender_analysis) {
      sections.push(this.formatFindingSection(
        'Sender & Domain Analysis',
        detailed_findings.sender_analysis
      ));
    }

    if (detailed_findings.content_analysis) {
      sections.push(this.formatFindingSection(
        'Content Analysis',
        detailed_findings.content_analysis
      ));
    }

    if (detailed_findings.url_analysis) {
      sections.push(this.formatFindingSection(
        'URL Analysis',
        detailed_findings.url_analysis
      ));
    }

    if (detailed_findings.attachment_analysis) {
      sections.push(this.formatFindingSection(
        'Attachment Analysis',
        detailed_findings.attachment_analysis
      ));
    }

    if (detailed_findings.header_analysis) {
      sections.push(this.formatFindingSection(
        'Header Authentication',
        detailed_findings.header_analysis
      ));
    }

    return sections.join('');
  }

  formatFindingSection(title, finding) {
    if (!finding || !finding.findings) return '';

    const statusColor = finding.status === 'HIGH_RISK' 
      ? '#ef4444' 
      : (finding.status === 'SUSPICIOUS' ? '#f59e0b' : '#10b981');

    return `
      <details class="finding-detail">
        <summary style="border-left: 3px solid ${statusColor};">
          <span class="detail-title">${title}</span>
          <span class="detail-status">${finding.status || 'REVIEWED'}</span>
        </summary>
        <div class="detail-content">
          ${this.formatFindings(finding.findings)}
        </div>
      </details>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTimestamp(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return 'Unknown time';
    }
  }

  getRiskMessage(score) {
    const level = this.getRiskLevel(score);

    const messages = {
      'SAFE': 'This email appears to be legitimate.',
      'SUSPICIOUS': 'This email has some suspicious characteristics. Be cautious.',
      'HIGH_RISK': 'This email shows strong indicators of phishing. Do not click links or open attachments.'
    };

    return messages[level.label] || 'Analysis in progress...';
  }

  formatSender(sender) {
    if (!sender) return '';

    let display = sender.email;
    
    if (sender.name) {
      display = `${sender.name} <${sender.email}>`;
    }

    return `<span class="sender-info">${this.escapeHtml(display)}</span>`;
  }

  formatURLs(urls) {
    if (!urls || urls.length === 0) {
      return '<p class="no-urls">No URLs found</p>';
    }

    const items = urls
      .slice(0, 10)
      .map(url => `
        <div class="url-item">
          <code class="url-code">${this.escapeHtml(url)}</code>
          <button class="copy-btn" data-url="${this.escapeHtml(url)}" title="Copy URL">📋</button>
        </div>
      `)
      .join('');

    return `<div class="phishguard-urls">${items}</div>`;
  }
}

export default new RiskFormatter();
