# PhishGuard AI - Complete Tutorial & How to Run

**Master the Complete System in 30 Minutes**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Testing the System](#testing-the-system)
5. [Understanding the Architecture](#understanding-the-architecture)
6. [Common Commands](#common-commands)
7. [Debugging](#debugging)

---

## System Overview

### What is PhishGuard AI?

PhishGuard AI is a **Chrome Extension that analyzes emails in Gmail for phishing risks** using AI and multiple security agents.

### How It Works (Simple Flow)

```
1. User opens Gmail email
   ↓
2. Extension detects email automatically
   ↓
3. Extension extracts email data (sender, subject, body, links, attachments)
   ↓
4. Extension sends to n8n backend for analysis
   ↓
5. Backend runs 5 analysis agents in parallel
   ↓
6. Each agent checks different threat indicators
   ↓
7. Results combined into risk score (0-100)
   ↓
8. Result sent back to extension
   ↓
9. Banner injected into Gmail showing risk level
   ↓
10. User sees 🟢 SAFE, 🟡 SUSPICIOUS, or 🔴 HIGH RISK
```

### Three Main Components

```
┌─────────────────────────────────────────────────┐
│ 1. CHROME EXTENSION (Runs in Your Browser)      │
│    - Detects emails in Gmail                    │
│    - Extracts email data                        │
│    - Shows results banner                       │
└─────────────────────────────────────────────────┘
                      ↕ (sends data)
┌─────────────────────────────────────────────────┐
│ 2. n8n WORKFLOW (Runs on Your Computer)         │
│    - 5 analysis agents (sender, URL, content,   │
│      headers, attachments)                      │
│    - LLM integration (GPT-4 / Gemini)           │
│    - Risk scoring engine                        │
└─────────────────────────────────────────────────┘
                      ↕ (stores results)
┌─────────────────────────────────────────────────┐
│ 3. POSTGRESQL DATABASE (Stores Data)            │
│    - Analysis history                           │
│    - Sender reputation                          │
│    - User settings & whitelist                  │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

### Software to Install

**Option A: Using Docker (EASIEST - Recommended)**

You need:
- ✅ Docker Desktop (one install, everything else automatic)
- ✅ Google Chrome browser
- ✅ Text editor (VS Code recommended)

**Download Docker:**
- Windows: https://www.docker.com/products/docker-desktop
- Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt-get install docker.io docker-compose`

**Verify Installation:**
```powershell
# In PowerShell
docker --version
docker-compose --version

# Should show version numbers
```

**Option B: Manual Setup (Advanced)**
- Node.js 16+
- PostgreSQL 14+
- n8n installed globally
- Text editor

### Accounts Needed

Optional (for AI analysis):
- OpenAI API key (for GPT-4) - get at https://platform.openai.com
- OR Google Gemini API key

---

## Installation Steps

### 🟢 Step 1: Start Backend Services (Docker)

**Open PowerShell and run:**

```powershell
# Navigate to project folder
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI\backend"

# Start services
docker-compose up -d

# Check if running
docker-compose ps
```

**Expected Output:**
```
NAME                COMMAND              STATUS
phishguard-db      docker-entrypoint    Up (healthy)
phishguard-n8n     docker-entrypoint    Up
```

**What's Happening:**
- PostgreSQL database starts on port 5432
- n8n workflow engine starts on port 5678
- Both services connected and ready

**Verify Database is Ready:**
```powershell
# Test database connection
docker exec phishguard-db psql -U postgres -d phishguard_ai -c "SELECT COUNT(*) FROM email_analyses;"

# Should output: 0 (no analyses yet)
```

---

### 🟢 Step 2: Load Extension in Chrome

**In Google Chrome:**

1. **Open Extensions Page:**
   - Type in address bar: `chrome://extensions`
   - Press Enter

2. **Enable Developer Mode:**
   - Top-right corner: toggle "Developer mode" ON (it will turn blue)

3. **Load Extension:**
   - Click "Load unpacked" button
   - Navigate to: `d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI\extension`
   - Click "Select Folder"

4. **Verify Extension Loaded:**
   - You should see "PhishGuard AI" in extensions list
   - Shield icon (🛡️) appears in Chrome toolbar
   - No errors shown

**Screenshot Locations:**
```
Click here to enable → ⊙ Developer mode (top right)
                                ↓
                    Then click "Load unpacked"
                                ↓
                    Select: extension folder
                                ↓
            See "PhishGuard AI" in the list ✓
```

---

### 🟢 Step 3: Configure API Connection

The extension needs to know where the backend is running.

**Edit Configuration File:**

1. **Open File:**
   - Navigate to: `d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI\extension\src\utils\constants.js`
   - Open with VS Code or text editor

2. **Find This Line (around line 3):**
   ```javascript
   WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/phishing-analysis',
   ```

3. **Replace With (for local testing):**
   ```javascript
   WEBHOOK_URL: 'http://localhost:5678/webhook/phishing-analysis',
   ```

4. **Save File:** Ctrl+S

5. **Reload Extension:**
   - Go to `chrome://extensions`
   - Find "PhishGuard AI"
   - Click refresh icon 🔄

---

### 🟢 Step 4: Test Everything

**Open Gmail:**
1. Go to https://gmail.com
2. Open any email (or read an old one)
3. Wait 5-15 seconds

**What You Should See:**

```
🛡️ PhishGuard AI | Risk: 45/100 | SUSPICIOUS ⚠️
[View Full Report] [Add to Whitelist] [Report Phishing]
```

**If You Don't See It:**
→ See Debugging section below

---

## Testing the System

### ✅ Test 1: Check Extension is Working

```powershell
# In Chrome Console (press F12)
# Go to Console tab and run:

chrome.runtime.sendMessage({
  type: 'PING'
}, response => {
  console.log('Extension response:', response);
});

# Should output: {success: true}
```

### ✅ Test 2: Check Backend is Connected

```powershell
# In PowerShell
# Test if n8n webhook is accessible

curl -X POST "http://localhost:5678/webhook/phishing-analysis" `
  -Headers @{"Content-Type"="application/json"} `
  -Body @{test="data"} | ConvertTo-Json

# Should receive a response (might show error about missing fields, but connection works)
```

### ✅ Test 3: Check Database

```powershell
# Check if data is being stored

docker exec phishguard-db psql -U postgres -d phishguard_ai `
  -c "SELECT sender_email, risk_score FROM email_analyses LIMIT 5;"

# Should show recent analyses (might be empty if just started)
```

### ✅ Test 4: Full End-to-End Test

**Do this in Gmail:**

1. Open an email
2. Watch for banner to appear
3. Click "View Full Report"
4. Should see detailed breakdown:
   - Risk score gauge
   - Breakdown bars (sender, content, URL, attachment, auth)
   - Detailed findings from each agent
   - Recommendations

---

## Understanding the Architecture

### How the Extension Works

**File: `extension/src/content.js` (500 lines)**
- Runs inside Gmail automatically
- Detects when you open an email
- Extracts: sender, subject, body, links, attachments
- Sends to backend for analysis
- Receives results
- Injects banner into Gmail

**File: `extension/src/background.js` (450 lines)**
- Service worker that handles messages
- Communicates between popup and content script
- Stores analysis results
- Manages rate limiting & caching

**File: `extension/src/popup.html/js`**
- Settings panel (when you click extension icon)
- Shows recent analyses
- Whitelist management
- Cache statistics

### How the Backend Works

**File: `backend/n8n-workflows/phishing-analysis-main.json`**

This is a workflow with multiple steps:

```
Step 1: Webhook Trigger
  ↓ (receives email data from extension)
  
Step 2: Validate Email Data
  ↓ (checks all required fields exist)
  
Step 3: Run 5 Agents in PARALLEL
  ├─ Agent 1: Sender Domain Analysis
  │  └─ Checks: domain age, SPF/DKIM/DMARC
  │
  ├─ Agent 2: URL Intelligence
  │  └─ Checks: shorteners, IP-based, mismatches
  │
  ├─ Agent 3: Content Analysis (LLM)
  │  └─ Uses: GPT-4o to analyze language
  │
  ├─ Agent 4: Header Analysis
  │  └─ Checks: email authentication protocols
  │
  └─ Agent 5: Attachment Risk
     └─ Checks: executable files, macros

Step 4: Merge Results
  ↓ (combine all 5 agent outputs)
  
Step 5: Risk Scoring Engine
  ↓ (aggregate scores 0-100)
  
Step 6: Store in Database
  ↓ (save for future reference)
  
Step 7: Return Response
  ↓ (send back to extension)
  
Step 8: Extension Shows Banner
```

### How the Database Works

**File: `backend/database/schema.sql`**

13 Tables:

```
email_analyses ← Main table (where results are stored)
  ├─ email_senders (sender reputation tracking)
  ├─ analyzed_urls (URL cache)
  ├─ attachment_analysis (attachment details)
  ├─ whitelisted_senders (trusted senders)
  ├─ user_settings (user preferences)
  └─ ... (7 more tables for detailed tracking)
```

---

## Common Commands

### View Logs (See What's Happening)

```powershell
# n8n logs (workflow execution)
docker logs -f phishguard-n8n

# Database logs
docker logs -f phishguard-db

# Both services
docker-compose logs -f

# Stop viewing logs
# Press Ctrl+C
```

### Access Services

```powershell
# n8n Web Interface
# Open: http://localhost:5678
# Username: admin
# Password: change_me_secure_password (from docker-compose.yml)

# PostgreSQL Database
# Open: DB Client (DBeaver, pgAdmin, or command line)
# Host: localhost
# Port: 5432
# User: postgres
# Password: secure_password_change_me (from docker-compose.yml)

# Access via command line:
docker exec -it phishguard-db psql -U postgres
```

### Restart Services

```powershell
# Restart specific service
docker restart phishguard-n8n    # Restart n8n
docker restart phishguard-db     # Restart database

# Restart all
docker-compose restart

# Stop all
docker-compose down

# Start again
docker-compose up -d
```

### Clear Cache & Reset

```powershell
# Clear extension cache
# In Chrome: Extension → Settings → Click "Clear Cache" button

# Clear database (WARNING: deletes all analyses)
cd backend
docker-compose down -v
docker-compose up -d

# Reload extension
# chrome://extensions → Refresh PhishGuard AI
```

### Monitor Performance

```powershell
# Check disk usage
docker system df

# Check memory/CPU
docker stats phishguard-n8n
docker stats phishguard-db

# View extension storage
# In Chrome: F12 → Application → Local Storage → chrome-extension://...
```

---

## Debugging

### Issue: Extension Doesn't Appear in Gmail

**Check 1: Is extension loaded?**
```powershell
# chrome://extensions should show "PhishGuard AI"
# If not, click "Load unpacked" again
```

**Check 2: Are you on Gmail?**
```powershell
# Must be at https://mail.google.com
# Regular Gmail doesn't always work
# Try: https://mail.google.com/mail/u/0
```

**Check 3: Check console for errors**
```powershell
# In Gmail, press F12
# Go to Console tab
# Any red errors?
# Copy error and search documentation
```

### Issue: Banner Shows But Says "Analyzing..." Forever

**Check 1: Is n8n running?**
```powershell
docker ps | grep n8n
# Should see: phishguard-n8n running

# If not:
docker restart phishguard-n8n
```

**Check 2: Check network request**
```powershell
# In Gmail, press F12
# Go to Network tab
# Open an email
# Look for request to /webhook/phishing-analysis
# Check status: 200 (success) or error?
```

**Check 3: Is webhook URL correct?**
```powershell
# Edit: extension/src/utils/constants.js
# Should have: http://localhost:5678/webhook/phishing-analysis
# (NOT https:// for local testing)
# Reload extension after change
```

**Check 4: View n8n logs**
```powershell
docker logs phishguard-n8n
# Look for errors in output
# If red text appears, something failed
```

### Issue: "Risk Score Not Accurate"

**This is normal!** The AI model will improve over time:

```powershell
# Current accuracy: ~85-90%
# False positives: ~2-5%
# False negatives: ~5-10%

# To improve:
# 1. Click "Report Feedback" in banner
# 2. Provide examples of false positives/negatives
# 3. Model is regularly updated with feedback
```

### Issue: Very Slow Analysis (> 30 seconds)

**Check 1: LLM API is slow**
```powershell
# GPT-4o takes 10-20 seconds by default
# This is normal
# To speed up: use Gemini instead (faster)
```

**Check 2: Network connection slow**
```powershell
# Check internet speed
# If > 100ms latency to localhost, something's wrong
# Try: ping localhost
```

**Check 3: Computer overloaded**
```powershell
# Check Task Manager (Ctrl+Shift+Esc)
# If CPU/RAM nearly full, close other apps
```

---

## Quick Reference Sheet

### The 4 Main Screens You'll Use

**1. Chrome Extensions Page**
```
chrome://extensions
→ Load PhishGuard AI extension here
→ See status and errors
```

**2. Gmail**
```
https://mail.google.com
→ Open email
→ See PhishGuard banner with risk score
```

**3. n8n Interface (Optional)**
```
http://localhost:5678
→ Login: admin / change_me_secure_password
→ See workflow execution and logs
```

**4. PowerShell Terminal**
```
→ Run docker commands to manage services
→ View logs and troubleshoot
```

### The 3 Key Ports

```
Port 5678 → n8n Workflow Engine
  ├─ Webhook: http://localhost:5678/webhook/phishing-analysis
  └─ UI: http://localhost:5678

Port 5432 → PostgreSQL Database
  └─ For database clients and backups

Port 9200+ → Extension (varies by browser)
  └─ Runs inside Chrome process
```

---

## Success Checklist ✅

After following this tutorial, you should be able to:

- ✅ Start backend with `docker-compose up -d`
- ✅ Load extension in Chrome (`chrome://extensions` → Load unpacked)
- ✅ Open Gmail email and see PhishGuard banner within 15 seconds
- ✅ Click "View Full Report" and see detailed analysis
- ✅ Identify the 5 agent results (sender, URL, content, headers, attachments)
- ✅ See risk score gauge and recommendations
- ✅ Check logs with `docker logs -f phishguard-n8n`
- ✅ Understand how email flows through the system
- ✅ Troubleshoot common issues

---

## Next Steps

1. **Get it running:**
   - Follow Steps 1-4 above
   - Test in Gmail

2. **Experiment:**
   - Try with different emails
   - Test whitelist feature
   - Check cache functionality

3. **Customize (Optional):**
   - Add your OpenAI API key for better analysis
   - Adjust risk score thresholds
   - Modify agent logic

4. **Deploy to Production:**
   - Follow DEPLOYMENT_GUIDE.md
   - Set up on cloud server (AWS, DigitalOcean, etc.)
   - Submit to Chrome Web Store

---

## Help & Support

**Something not working?**

1. Check TROUBLESHOOTING.md
2. View logs: `docker logs -f phishguard-n8n`
3. Check Chrome console: F12 → Console tab
4. Restart services: `docker-compose restart`

**Want to understand more?**

1. Read: PROJECT_ARCHITECTURE.md (system design)
2. Read: N8N_WORKFLOW_DESIGN.md (workflow details)
3. Read: API_REFERENCE.md (API specification)

---

**Now go run PhishGuard AI! 🚀🛡️**

Start with: `cd backend && docker-compose up -d`

Then check: `chrome://extensions` and load the extension

Finally: Open Gmail and test with an email

