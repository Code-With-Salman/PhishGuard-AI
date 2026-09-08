# 🚀 PhishGuard AI - Quick Start (Manual Setup)

Get PhishGuard AI running in **15 minutes** without Docker.

---

## ⚡ 3-Step Setup

### **Step 1️⃣: Install PostgreSQL (5 minutes)**

1. Download: https://www.postgresql.org/download/windows/
2. Run installer, accept defaults
3. **Remember the password you set!**
4. Restart your computer

Verify:
```powershell
psql --version
```

---

### **Step 2️⃣: Setup Database (2 minutes)**

```powershell
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI"
.\setup-database.ps1
```

Expected output:
```
✅ PostgreSQL found
✅ User created: phishguard
✅ Database created: phishguard_ai
✅ Schema applied successfully
```

---

### **Step 3️⃣: Install & Run n8n (5 minutes)**

**Install n8n globally:**
```powershell
npm install -g n8n
```

**Start n8n:**
```powershell
cd "d:\UNIVERSITY\8th smester\IS PROJECT\PhishGuard-AI"
.\run-n8n.ps1
```

Wait for:
```
n8n ready on 0.0.0.0:5678
```

---

## 🌐 Access n8n

**Open in browser:** http://localhost:5678

**Login:**
- Username: `admin`
- Password: `admin123`

---

## 📥 Import Workflow

1. Click menu (top left)
2. Click "Workflows"
3. Click "Import from file"
4. Select: `backend/n8n-workflows/phishing-analysis-main.json`
5. Toggle "Active" switch (blue) to activate

---

## 🧩 Load Chrome Extension

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select: `extension/src/` folder
6. ✅ Shield icon in toolbar!

---

## ✅ Test It

1. Open Gmail: https://mail.google.com
2. Open any email
3. Wait 5-15 seconds
4. PhishGuard banner appears with risk assessment 🎉

---

## 📊 All Services Running?

| Service | Status | Check Command |
|---------|--------|---|
| PostgreSQL | ✅ Running | `psql -U phishguard -d phishguard_ai -c "SELECT 1;"` |
| n8n | ✅ Running | http://localhost:5678 |
| Extension | ✅ Loaded | chrome://extensions |

---

## 🆘 Problems?

**PostgreSQL won't connect:**
```powershell
# Start PostgreSQL service
Get-Service postgresql-* | Start-Service
```

**Port 5678 already in use:**
```powershell
# Kill process using port 5678
netstat -ano | findstr :5678
taskkill /PID <PID> /F
```

**Extension not connecting:**
- Check: http://localhost:5678 loads
- Check: Workflow has blue "Active" toggle
- Reload extension: chrome://extensions → Reload button

---

## 📚 Detailed Help

For more details, see:
- [MANUAL_SETUP.md](./MANUAL_SETUP.md) - Full setup guide with troubleshooting
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and fixes

---

## 📞 Still stuck?

1. Check n8n logs while running
2. Check PostgreSQL is listening on port 5432
3. Try running setup-database.ps1 again

💬 Feel free to ask questions!

