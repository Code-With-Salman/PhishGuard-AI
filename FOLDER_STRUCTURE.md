# PhishGuard AI - Project Structure

## Directory Tree

```
PhishGuard-AI/
├── extension/                           # Chrome Extension
│   ├── manifest.json                    # Extension configuration
│   ├── src/
│   │   ├── content.js                   # Content script (DOM injection)
│   │   ├── background.js                # Service worker
│   │   ├── popup.html                   # Report popup UI
│   │   ├── popup.js                     # Popup logic
│   │   ├── report.html                  # Full report view
│   │   ├── report.js                    # Report functionality
│   │   ├── styles.css                   # Main styles
│   │   ├── report-styles.css            # Report-specific styles
│   │   ├── utils/
│   │   │   ├── gmail-extractor.js       # Email extraction utilities
│   │   │   ├── api-service.js           # API communication layer
│   │   │   ├── risk-formatter.js        # Risk score formatting
│   │   │   ├── constants.js             # Constants & config
│   │   │   └── storage.js               # Chrome storage utilities
│   │   └── assets/
│   │       ├── icons/
│   │       │   ├── icon-16.png
│   │       │   ├── icon-48.png
│   │       │   ├── icon-128.png
│   │       │   └── icon-512.png
│   │       └── images/
│   │           ├── safe-badge.svg
│   │           ├── suspicious-badge.svg
│   │           └── high-risk-badge.svg
│   └── tests/                           # Extension tests (future)
│       ├── content.test.js
│       └── api-service.test.js
│
├── backend/                             # Backend System
│   ├── n8n-workflows/
│   │   ├── phishing-analysis-main.json  # Main n8n workflow
│   │   ├── agents/
│   │   │   ├── sender-domain-agent.json
│   │   │   ├── url-intelligence-agent.json
│   │   │   ├── content-analysis-agent.json
│   │   │   ├── header-analysis-agent.json
│   │   │   └── attachment-risk-agent.json
│   │   └── README.md                    # n8n setup instructions
│   │
│   └── database/
│       ├── schema.sql                   # PostgreSQL schema
│       ├── migrations/
│       │   ├── 001-initial-schema.sql
│       │   ├── 002-add-indexes.sql
│       │   └── 003-add-audit-tables.sql
│       └── seed-data.sql                # Sample/test data
│
├── documentation/                       # Project Documentation
│   ├── SETUP_GUIDE.md                  # Installation & setup
│   ├── DEPLOYMENT_GUIDE.md             # Production deployment
│   ├── API_REFERENCE.md                # API documentation
│   ├── DATABASE_DESIGN.md              # Database schema details
│   ├── N8N_WORKFLOW_GUIDE.md           # n8n workflow documentation
│   ├── SECURITY.md                     # Security considerations
│   ├── TROUBLESHOOTING.md              # Troubleshooting guide
│   └── CONTRIBUTION_GUIDE.md           # Contributing guide
│
├── PROJECT_ARCHITECTURE.md             # High-level architecture
├── README.md                           # Project overview
├── FOLDER_STRUCTURE.md                 # This file
└── .gitignore                          # Git ignore rules
```

## Directory Descriptions

### `/extension`
Chrome Extension source code including:
- **manifest.json**: Extension configuration and permissions
- **content.js**: Runs in Gmail tab context, detects emails, extracts data
- **background.js**: Service worker managing extension state, messaging, API calls
- **popup.html/js**: Report display when user clicks extension icon
- **report.html/js**: Detailed phishing analysis report
- **utils/**: Utility modules for extraction, API calls, formatting
- **assets/**: Icons and UI images
- **tests/**: Unit tests for extension components

### `/backend/n8n-workflows`
n8n workflow configurations:
- **phishing-analysis-main.json**: Primary workflow definition
- **agents/**: Individual analysis agent workflows
- Can be imported directly into n8n
- Modular design allows testing individual components

### `/backend/database`
PostgreSQL database:
- **schema.sql**: Complete database schema
- **migrations/**: Versioned SQL migrations
- **seed-data.sql**: Test and example data

### `/documentation`
Comprehensive guides including:
- Setup and installation instructions
- Production deployment procedures
- API reference and usage
- Database design rationale
- n8n workflow configuration
- Security best practices
- Troubleshooting common issues
- Contribution guidelines

---

## File Relationships

```
Gmail User Interface
        │
        └─ manifest.json (Extension registration)
           │
           ├─ content.js (Runs in Gmail)
           │   │
           │   └─ gmail-extractor.js (Extract email data)
           │
           ├─ background.js (Service Worker)
           │   │
           │   └─ api-service.js (Send to n8n)
           │
           └─ popup.html + popup.js (UI)
               │
               └─ risk-formatter.js (Display scores)

n8n Webhook
    │
    ├─ phishing-analysis-main.json (Main workflow)
    │   │
    │   ├─ sender-domain-agent.json
    │   ├─ url-intelligence-agent.json
    │   ├─ content-analysis-agent.json
    │   ├─ header-analysis-agent.json
    │   └─ attachment-risk-agent.json
    │
    ├─ PostgreSQL Database
    │   │
    │   └─ schema.sql (Table definitions)
    │
    └─ Response to Extension → Display Banner
```

---

## File Sizes & Counts

| Category | Count | Est. Size |
|----------|-------|-----------|
| Extension Files | 12 | ~150 KB |
| n8n Workflows | 6 | ~200 KB |
| Database Schemas | 4 | ~50 KB |
| Documentation | 8 | ~500 KB |
| Assets (Icons/Images) | 7 | ~100 KB |

---

## Development Workflow

```
1. Extension Development
   ├─ Edit manifest.json
   ├─ Modify content.js, background.js
   ├─ Update utils/ as needed
   └─ Test in Chrome (chrome://extensions)

2. Backend Development
   ├─ Design workflow in n8n UI
   ├─ Export as JSON
   ├─ Save to n8n-workflows/
   └─ Test with sample data

3. Database
   ├─ Start with schema.sql
   ├─ Apply migrations in order
   ├─ Run seed-data.sql for testing
   └─ Verify in PostgreSQL

4. Testing
   ├─ Unit test extension components
   ├─ Test n8n workflow with sample emails
   ├─ Verify database transactions
   └─ End-to-end testing in Gmail

5. Documentation
   ├─ Update relevant .md files
   ├─ Keep examples current
   ├─ Add troubleshooting entries
   └─ Update API documentation
```

---

## Installation Dependencies

### Extension
- Chrome/Chromium browser (v90+)
- No npm packages required (vanilla JS)

### Backend
- n8n instance (self-hosted or cloud)
- PostgreSQL 14+
- OpenAI API key (for GPT-4o) OR Google Gemini API key
- Node.js (for n8n)

### Development
- Code editor (VS Code recommended)
- Git for version control
- Optional: Docker for PostgreSQL (containerized setup)

---

## Configuration Files Location

| Config | Location | Purpose |
|--------|----------|---------|
| Extension Config | `manifest.json` | Chrome permissions, scripts |
| API Settings | `src/utils/constants.js` | n8n webhook URL, timeouts |
| Database Config | `.env` or `config/db.js` | DB connection string |
| n8n Workflows | `backend/n8n-workflows/` | Analysis logic |

---

## Version Control

### .gitignore Contents
```
node_modules/
.env
.env.local
*.log
dist/
build/
.DS_Store
__pycache__/
*.pyc
.vscode/settings.json
.idea/
```

### Sensitive Files (Do Not Commit)
- API keys
- Database passwords
- OAuth tokens
- Personal configuration

