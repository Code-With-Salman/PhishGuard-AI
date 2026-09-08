# PhishGuard AI - Project Architecture

## Executive Summary

PhishGuard AI is a production-ready Chrome Extension that automatically analyzes emails in Gmail for phishing risks using an LLM-powered agent workflow hosted in n8n. The system provides real-time risk assessment with a comprehensive reporting interface.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       GMAIL                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    Email Viewer with PhishGuard AI Banner                │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 🛡️ PhishGuard AI | Risk: 87/100 | HIGH RISK       │ │  │
│  │  │ [View Full Report] [Details] [Whitelist]           │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Extract Email Data)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         CHROME EXTENSION (Manifest V3)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Content Script (DOM Injection & Extraction)              │  │
│  │ • Detects email opens                                    │  │
│  │ • Extracts sender, subject, body, links, attachments   │  │
│  │ • Injects UI banner                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Background Service Worker                                │  │
│  │ • Manages messaging                                      │  │
│  │ • Handles API calls (rate limiting)                     │  │
│  │ • Stores temporary analysis cache                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Popup & Report UI                                        │  │
│  │ • Display detailed analysis report                       │  │
│  │ • Settings & configuration                               │  │
│  │ • Historical analysis view                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Send Analysis Request)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     n8n WORKFLOW                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Webhook Trigger                                          │  │
│  │ • Receives email data from extension                     │  │
│  │ • Validates payload                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │        ANALYSIS AGENTS (Parallel)                        │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ A. Sender & Domain Analysis Agent                  │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ B. URL Intelligence Agent                          │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ C. Email Content Agent (LLM)                       │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ D. Header Analysis Agent (SPF/DKIM/DMARC)        │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ E. Attachment Risk Agent                          │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                         │                               │  │
│  ├─────────────────────────▼───────────────────────────────┤  │
│  │ Risk Scoring Engine                                      │  │
│  │ • Aggregates scores from all agents                      │  │
│  │ • Calculates final risk score (0-100)                   │  │
│  │ • Generates findings & recommendations                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ Report Generator & Database Storage                      │  │
│  │ • Formats comprehensive report                           │  │
│  │ • Stores in PostgreSQL                                   │  │
│  │ • Prepares response payload                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Return Analysis Result)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                            │
│  • Email Analyses (metadata, scores, findings)                 │
│  • User Settings & Preferences                                 │
│  • Whitelisted Senders                                         │
│  • Historical Analysis Data                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Chrome Extension (Frontend)

**Files:**
- `manifest.json` - Extension configuration
- `src/content.js` - Gmail DOM injection & email extraction
- `src/background.js` - Service worker for messaging & API calls
- `src/popup.html` - Report display UI
- `src/popup.js` - Report interactions
- `src/styles.css` - UI styling
- `src/utils/gmail-extractor.js` - Email data extraction utilities
- `src/utils/api-service.js` - API communication
- `src/utils/risk-formatter.js` - Risk score presentation

**Responsibilities:**
- Detect when emails are opened in Gmail
- Extract email metadata and content
- Inject analysis banner into Gmail UI
- Display risk scores and reports
- Handle user interactions
- Manage extension state

### 2. n8n Workflow (Backend Analysis)

**Workflow Stages:**
1. **Webhook Trigger** - Receives email data
2. **Validation** - Sanitizes and validates input
3. **Parallel Analysis Agents**:
   - Sender & Domain Analysis
   - URL Intelligence & Analysis
   - Email Content Analysis (LLM)
   - Email Header Analysis
   - Attachment Risk Analysis
4. **Risk Scoring Engine** - Aggregates scores
5. **Report Generator** - Creates detailed report
6. **Database Storage** - Persists analysis
7. **Response Handler** - Returns result to extension

### 3. Database (PostgreSQL)

**Tables:**
- `email_analyses` - Main analysis records
- `email_senders` - Sender reputation tracking
- `analyzed_urls` - URL analysis cache
- `whitelisted_senders` - User-whitelisted senders
- `user_settings` - Extension user settings
- `analysis_history` - Audit trail

---

## Data Flow

```
1. USER OPENS EMAIL
   ↓
2. CONTENT.JS DETECTS EMAIL
   ↓
3. EMAIL DATA EXTRACTED
   ├─ Sender Name & Email
   ├─ Subject Line
   ├─ Email Body
   ├─ All Hyperlinks
   ├─ Attachment Names
   └─ Message Headers (if available)
   ↓
4. BACKGROUND.JS SENDS TO N8N WEBHOOK
   ↓
5. N8N PERFORMS ANALYSIS
   ├─ Sender reputation check
   ├─ Domain analysis
   ├─ URL intelligence
   ├─ Content analysis (LLM)
   ├─ Header verification
   └─ Attachment risk check
   ↓
6. RISK SCORING ENGINE
   ├─ Sender Risk (0-25)
   ├─ Content Risk (0-25)
   ├─ URL Risk (0-25)
   ├─ Attachment Risk (0-15)
   └─ Authentication Risk (0-10)
   = TOTAL (0-100)
   ↓
7. REPORT GENERATED & STORED IN DB
   ↓
8. RESULT RETURNED TO EXTENSION
   ↓
9. CONTENT.JS INJECTS BANNER & DISPLAYS RESULT
   ├─ Risk Score Badge
   ├─ Risk Level Status
   └─ View Full Report Button
   ↓
10. USER CLICKS VIEW REPORT
    ↓
11. POPUP DISPLAYS DETAILED ANALYSIS
    ├─ Executive Summary
    ├─ Sender Analysis
    ├─ Domain Analysis
    ├─ URL Analysis
    ├─ Content Analysis
    ├─ Attachment Analysis
    └─ Recommendations
```

---

## Security Considerations

1. **API Communication**
   - All communication uses HTTPS
   - Sensitive data is encrypted in transit
   - API key stored in extension storage (sync API)
   - Rate limiting implemented (max 20 requests/min per user)

2. **Data Privacy**
   - Email content sent only to trusted n8n instance
   - No PII stored longer than necessary
   - Option to disable email body analysis
   - GDPR-compliant data retention

3. **Content Security Policy (CSP)**
   - Strict CSP in manifest.json
   - No inline scripts
   - Modular JavaScript architecture

4. **DOM Manipulation**
   - Sandboxed injection prevents XSS
   - Sanitized HTML templates
   - Safe appendChild methods

---

## Risk Scoring Methodology

### Sender Risk (0-25 points)
- Sender domain matches recipient domain: -5 points
- New sender (< 7 days old domain): +15 points
- Sender domain typosquatting known brand: +12 points
- Sender has poor reputation history: +10 points

### Content Risk (0-25 points)
- Urgency language detected ("act now", "verify immediately"): +8 points
- Financial request detected: +10 points
- Credential harvesting language: +15 points
- Impersonation attempt detected: +12 points
- Social engineering tactics detected: +8 points

### URL Risk (0-25 points)
- Suspicious domain in URLs: +10 points
- URL shortener detected: +5 points
- IP-based URL: +12 points
- Domain mismatch (hyperlink text ≠ actual URL): +8 points
- Excessive redirects detected: +10 points
- Known malicious URL: +20 points

### Attachment Risk (0-15 points)
- Executable file (.exe, .bat, .scr, .vbs): +15 points
- Macro-enabled Office file (.docm, .xlsm, .pptm): +12 points
- Suspicious extension (.zip with .exe inside): +10 points
- Multiple suspicious attachments: +8 points

### Authentication Risk (0-10 points)
- SPF check failed: +5 points
- DKIM signature missing/invalid: +4 points
- DMARC policy failed: +3 points

### Risk Levels
- **0-30**: 🟢 SAFE - Low phishing risk
- **31-60**: 🟡 SUSPICIOUS - Moderate risk, review carefully
- **61-100**: 🔴 HIGH RISK - Likely phishing, do not click links

---

## Deployment Architecture

```
┌─────────────────────────────────┐
│   Chrome Web Store              │
│   (PhishGuard AI Extension)     │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   User Browser (Chrome)          │
│   ├─ Extension Installed         │
│   └─ Content Scripts Running     │
└──────────────┬──────────────────┘
               │
               │ HTTPS
               │
┌──────────────▼──────────────────────────────────────────┐
│            Self-Hosted Infrastructure                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │          n8n Server                             │  │
│  │  ├─ Workflow Engine                             │  │
│  │  ├─ Webhook Endpoint                            │  │
│  │  ├─ LLM Integration (GPT-4o/Gemini)            │  │
│  │  └─ External API Integrations                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │          PostgreSQL Database                    │  │
│  │  ├─ Analysis Data                               │  │
│  │  ├─ User Settings                               │  │
│  │  └─ Historical Records                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Extension | Chrome Manifest V3 | v3 |
| Frontend | HTML/CSS/JavaScript | ES2021+ |
| Backend | n8n | v1.0+ |
| AI/LLM | GPT-4o / Gemini | Latest |
| Database | PostgreSQL | 14+ |
| APIs | REST | HTTP/2 |
| Security | HTTPS/TLS | 1.3 |

---

## Performance Targets

- **Email Detection**: < 100ms
- **Data Extraction**: < 200ms
- **n8n Analysis**: 2-8 seconds (depends on LLM)
- **Banner Injection**: < 300ms
- **Full Report Load**: < 1 second
- **Database Query**: < 100ms

---

## Future Enhancements

- [ ] Microsoft Outlook support
- [ ] Apple Mail support
- [ ] Machine learning model fine-tuning
- [ ] Real-time threat intelligence feeds
- [ ] Team/Enterprise management dashboard
- [ ] Advanced analytics & reporting
- [ ] Integration with email security gateways
- [ ] Webhook for automated email filtering

