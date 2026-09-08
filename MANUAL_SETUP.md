# 🚀 PhishGuard AI - Manual Setup (No Docker)

This guide walks you through setting up PhishGuard AI **without Docker** on Windows.

---

## ✅ Prerequisites Check

- ✅ **Node.js:** v22.17.0 (Already installed!)
- ✅ **npm:** 10.9.2 (Already installed!)
- ⏳ **PostgreSQL:** Needs installation

---

## 📋 Step 1: Install PostgreSQL 14+

### Option A: Windows Installer (Recommended - 5 minutes)

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Select **PostgreSQL 14** or **PostgreSQL 15**

2. **Run Installer:**
   - Double-click the downloaded `.exe`
   - Follow wizard prompts:
     - **Installation Directory:** Keep default (C:\Program Files\PostgreSQL\14)
     - **Password:** Set a strong password (remember this!)
     - **Port:** Keep default **5432**
     - **Components:** Select all
   - Click "Next" through all steps, then "Install"

3. **Verify Installation:**
   ```powershell
   psql --version
   ```
   - Should output: `psql (PostgreSQL) 14.x`

### Option B: Use Windows Subsystem for Linux (WSL2)

```powershell
# In WSL terminal
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
psql --version
```

---

## 🗄️ Step 2: Create Database & User

After PostgreSQL is installed, run these commands:

```powershell
# Connect to PostgreSQL as default admin
psql -U postgres

# In the PostgreSQL prompt, type:
CREATE USER phishguard WITH PASSWORD 'secure_password_123';
CREATE DATABASE phishguard_ai OWNER phishguard;
ALTER ROLE phishguard WITH CREATEDB;
\q
```

**Or use this automated script** (save as `setup-db.ps1`):

```powershell
# setup-db.ps1
$pgPassword = "postgres"  # PostgreSQL admin password
$phishguardPassword = "secure_password_123"

# Create database and user
psql -U postgres -c "CREATE USER phishguard WITH PASSWORD '$phishguardPassword';" 2>$null
psql -U postgres -c "CREATE DATABASE phishguard_ai OWNER phishguard;" 2>$null
psql -U postgres -c "ALTER ROLE phishguard WITH CREATEDB;" 2>$null

Write-Host "✅ Database created successfully!"
Write-Host "Username: phishguard"
Write-Host "Password: $phishguardPassword"
Write-Host "Database: phishguard_ai"
```

Run it:
```powershell
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI"
.\setup-db.ps1
```

---

## 🔧 Step 3: Apply Database Schema

After creating the database, load the schema:

```powershell
# Navigate to backend folder
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI\backend"

# Apply schema to database
psql -U phishguard -d phishguard_ai -f database/schema.sql
```

**Success indicators:**
- No error messages
- Output shows CREATE TABLE statements

---

## 🚀 Step 4: Install & Run n8n

### Install n8n globally via npm:

```powershell
npm install -g n8n
```

This takes 2-3 minutes. Coffee time ☕

### Create environment configuration for n8n:

Create file: `backend/.env`

```env
# PostgreSQL Configuration
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_USER=phishguard
DB_POSTGRESDB_PASSWORD=secure_password_123
DB_POSTGRESDB_DATABASE=phishguard_ai

# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_TUNNEL_URL=http://localhost:5678/
```

### Start n8n:

```powershell
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI\backend"

# Start n8n with PostgreSQL backend
n8n --db=postgresdb `
  --dbPostgresHost=localhost `
  --dbPostgresPort=5432 `
  --dbPostgresUser=phishguard `
  --dbPostgresPassword=secure_password_123 `
  --dbPostgresDatabase=phishguard_ai
```

**Wait for output:**
```
n8n ready on 0.0.0.0:5678
```

Then open: http://localhost:5678

---

## 📥 Step 5: Import n8n Workflow

1. **Login to n8n:** http://localhost:5678
   - Username: `admin`
   - Password: `admin123`

2. **Import workflow:**
   - Click "Menu" (top left) → "Workflows"
   - Click "Import from file"
   - Select: `backend/n8n-workflows/phishing-analysis-main.json`
   - Click "Open"

3. **Activate workflow:**
   - Click the workflow
   - Toggle "Active" switch to ON (blue)

---

## 🧩 Step 6: Configure Chrome Extension

1. **Edit extension configuration:**
   - File: `extension/src/utils/constants.js`
   - Find: `WEBHOOK_URL`
   - Set to: `http://localhost:5678/webhook/phishing-analysis`

2. **Load extension in Chrome:**
   - Open Chrome
   - Go to: `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select: `extension/src/` folder
   - ✅ Done! Shield icon appears in toolbar

---

## ✅ Verification Checklist

### PostgreSQL Running:
```powershell
psql -U phishguard -d phishguard_ai -c "SELECT version();"
```
Should return: `PostgreSQL 14.x ...`

### n8n Running:
```powershell
# In another PowerShell window
curl http://localhost:5678
```
Should return: HTML page (n8n interface)

### Extension Loaded:
- Check Chrome extensions page
- Shield icon visible in toolbar
- Can click it to see popup

### Full Test:
1. Open Gmail: https://mail.google.com
2. Open any email
3. Wait 5-15 seconds
4. PhishGuard banner appears
5. Click "View Report" to see analysis

---

## 🆘 Troubleshooting

### PostgreSQL won't start:
```powershell
# Check if service is running
Get-Service postgresql-* | Start-Service

# Or check port conflict
netstat -ano | findstr :5432
```

### n8n connection errors:
```powershell
# Verify PostgreSQL connection
psql -U phishguard -d phishguard_ai -c "SELECT 1;"
```

### Chrome extension not connecting:
1. Check WEBHOOK_URL in `constants.js` matches `http://localhost:5678/webhook/phishing-analysis`
2. Check n8n is running: http://localhost:5678
3. Check workflow is activated (blue toggle)
4. Reload extension: chrome://extensions → Reload button

### Port already in use:
```powershell
# Check what's using port 5678
netstat -ano | findstr :5678

# Kill process if needed
taskkill /PID <PID> /F
```

---

## 📊 Quick Reference

| Component | Status | Port | Command |
|-----------|--------|------|---------|
| PostgreSQL | Running | 5432 | `psql -U phishguard -d phishguard_ai` |
| n8n | Running | 5678 | http://localhost:5678 |
| Extension | Loaded | N/A | chrome://extensions |

---

## 🎯 Next Steps After Setup

1. **Test in Gmail** - Open an email and wait for banner
2. **Check n8n Dashboard** - Watch workflow execute at http://localhost:5678
3. **Review Database** - Query results from `email_analyses` table
4. **Configure LLM** - Update API keys for Claude/Gemini in n8n
5. **Add Whitelisted Domains** - Use extension popup

---

## 📞 Support

For issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check n8n logs: `n8n logs`
3. Check PostgreSQL logs: Windows Event Viewer

