# PhishGuard AI - Quick Start Guide

**Get up and running in 15 minutes!**

---

## 1️⃣ Install Backend (Docker) - 5 minutes

```bash
cd backend
docker-compose up -d

# Verify services running
docker-compose ps

# Check database
docker exec phishguard-db psql -U postgres -d phishguard_ai -c "SELECT COUNT(*) FROM email_analyses;"
```

**Expected Output:**
```
✓ postgres running on port 5432
✓ n8n running on port 5678
✓ Database ready
```

---

## 2️⃣ Load Extension in Chrome - 3 minutes

1. Open **chrome://extensions**
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `PhishGuard-AI/extension` folder
5. Extension icon appears in toolbar 🛡️

**Verify:**
- Click extension icon → Settings should load
- You should see toggle switches for "Enable Analysis"

---

## 3️⃣ Configure API - 2 minutes

1. Get n8n webhook URL:
   - Open http://localhost:5678 (if local)
   - Username: `admin` | Password: `change_me_secure_password` (from docker-compose.yml)

2. Update extension config:
   - Open `extension/src/utils/constants.js`
   - Find: `WEBHOOK_URL`
   - Set to: `http://localhost:5678/webhook/phishing-analysis`

3. Save file and reload extension (F5)

---

## 4️⃣ Test It - 5 minutes

**Test Analysis:**
```
1. Go to Gmail
2. Open any email
3. Wait 5-15 seconds
4. Should see PhishGuard banner at top of email
5. Click "View Full Report" for details
```

**Expected Banner:**
```
🛡️ PhishGuard AI | Risk: 45/100 | SUSPICIOUS
[View Full Report] [Add to Whitelist] [Report]
```

---

## 🎯 Quick Reference

### Services Status
```bash
# Check services
docker ps | grep phishguard

# View logs
docker logs -f phishguard-n8n    # n8n logs
docker logs -f phishguard-db     # Database logs
```

### Reset Everything
```bash
# Stop services
docker-compose down

# Clear data (WARNING: deletes analysis history)
docker volume rm phishguard-api_postgres_data phishguard-api_n8n_data

# Start fresh
docker-compose up -d
```

### Common Ports
```
PostgreSQL: localhost:5432
n8n: localhost:5678
API Webhook: http://localhost:5678/webhook/phishing-analysis
```

---

## ⚠️ Troubleshooting

### "Extension doesn't work in Gmail"

```bash
# 1. Check extension is enabled
# chrome://extensions → PhishGuard AI should be ON

# 2. Check API configuration
# Open console in Gmail (F12)
# Check network tab for webhook requests

# 3. Reload extension
# chrome://extensions → Refresh button on PhishGuard AI

# 4. Check n8n is running
docker logs phishguard-n8n
```

### "Cannot connect to n8n"

```bash
# Check n8n is running
docker exec phishguard-n8n curl http://localhost:5678/health

# Restart n8n
docker restart phishguard-n8n

# Check logs
docker logs phishguard-n8n
```

### "Database connection error"

```bash
# Check database is running
docker exec phishguard-db psql -U postgres -c "SELECT 1"

# View database logs
docker logs phishguard-db

# Restart database
docker restart phishguard-db
```

---

## 📚 Full Documentation

For detailed information, see:
- **Setup:** [SETUP_GUIDE.md](documentation/SETUP_GUIDE.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](documentation/DEPLOYMENT_GUIDE.md)
- **Security:** [SECURITY.md](documentation/SECURITY.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](documentation/TROUBLESHOOTING.md)
- **API:** [API_REFERENCE.md](documentation/API_REFERENCE.md)

---

## ✅ Verification Checklist

- [ ] Docker services running (`docker ps`)
- [ ] Extension loaded in Chrome (`chrome://extensions`)
- [ ] Extension icon visible in toolbar
- [ ] Settings page opens when clicking extension
- [ ] Gmail email triggers analysis banner
- [ ] Report page shows risk assessment
- [ ] n8n logs show successful webhook calls

---

## 🚀 Next Steps

1. **Test More Scenarios:**
   - Try with different email types
   - Test whitelist functionality
   - Check report details

2. **Customize (Optional):**
   - Update webhook URL for production
   - Configure LLM API keys
   - Adjust risk score thresholds

3. **Deploy to Production:**
   - Follow [DEPLOYMENT_GUIDE.md](documentation/DEPLOYMENT_GUIDE.md)
   - Set up SSL certificates
   - Configure backup procedures

4. **Submit to Chrome Web Store:**
   - Update manifest version
   - Add screenshots
   - Submit for review

---

## 💡 Quick Commands

```bash
# Start services
cd backend && docker-compose up -d

# Stop services
cd backend && docker-compose down

# View real-time logs
docker-compose logs -f

# Check database contents
docker exec phishguard-db psql -U postgres -d phishguard_ai \
  -c "SELECT sender_email, risk_score, created_at FROM email_analyses LIMIT 5;"

# Restart specific service
docker restart phishguard-n8n

# Clean up everything
docker-compose down -v
```

---

## 📞 Need Help?

- **GitHub Issues:** https://github.com/yourusername/PhishGuard-AI/issues
- **Email:** support@phishguard.example.com
- **Documentation:** https://docs.phishguard.example.com

---

**Happy analyzing! 🛡️**

