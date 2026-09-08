# PhishGuard AI - Troubleshooting Guide

## Common Issues and Solutions

This guide covers common problems that may occur while setting up or running PhishGuard AI.

---

## 1. Docker Is Not Running

### Problem

The backend services fail to start.

### Solution

Make sure Docker Desktop is installed and running.

Check containers:

```bash
docker ps
```

Start the PhishGuard services:

```bash
cd backend
docker-compose up -d
```

Check their status:

```bash
docker-compose ps
```

---

## 2. n8n Does Not Start

### Problem

The n8n dashboard is not available.

### Solution

Check the n8n container:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs n8n
```

Restart n8n:

```bash
docker-compose restart n8n
```

Then open:

```text
http://localhost:5678
```

---

## 3. PostgreSQL Does Not Start

### Problem

The database container fails or n8n cannot connect to PostgreSQL.

### Solution

Check PostgreSQL:

```bash
docker-compose ps
```

View database logs:

```bash
docker-compose logs postgres
```

Restart PostgreSQL:

```bash
docker-compose restart postgres
```

Verify that the database credentials match the values configured in the Docker and environment configuration.

---

## 4. Database Connection Error

### Problem

n8n displays a PostgreSQL connection error.

### Solution

Verify:

- Database host
- Database port
- Database username
- Database password
- Database name

Default Docker port:

```text
5432
```

If n8n is running inside Docker, the PostgreSQL host should normally use the Docker service name rather than `localhost`.

---

## 5. n8n Workflow Is Not Running

### Problem

The extension sends a request but no analysis is returned.

### Solution

Open:

```text
http://localhost:5678
```

Then:

1. Open the phishing analysis workflow.
2. Make sure all nodes are configured.
3. Verify API credentials.
4. Verify PostgreSQL credentials.
5. Save the workflow.
6. Activate the workflow.

The workflow file is located at:

```text
backend/n8n-workflows/phishing-analysis-main.json
```

---

## 6. Webhook Not Found

### Problem

The extension receives a webhook error or HTTP 404 response.

### Solution

Verify the webhook URL.

Production webhook:

```text
http://localhost:5678/webhook/phishing-analysis
```

Test webhook:

```text
http://localhost:5678/webhook-test/phishing-analysis
```

The test URL is normally used while manually testing the workflow in n8n.

The production webhook requires the workflow to be active.

---

## 7. Extension Cannot Connect to n8n

### Problem

Clicking **Analyze Current Email** does not return a result.

### Solution

First verify that n8n is accessible:

```text
http://localhost:5678
```

Then check the webhook URL configured inside the extension.

The local backend URL should point to:

```text
http://localhost:5678/webhook/phishing-analysis
```

Also verify that `manifest.json` allows access to:

```text
http://localhost:5678/*
```

Reload the extension after making configuration changes.

---

## 8. Chrome Extension Does Not Load

### Problem

Chrome displays an error when loading PhishGuard AI.

### Solution

Open:

```text
chrome://extensions/
```

Then:

1. Enable **Developer mode**.
2. Click **Load unpacked**.
3. Select the `extension` folder.
4. Check Chrome for manifest or JavaScript errors.

Make sure this file exists:

```text
extension/manifest.json
```

Do not select the entire repository when using **Load unpacked**. Select the extension directory.

---

## 9. Analyze Button Does Nothing

### Problem

The popup opens but clicking the analysis button does not work.

### Solution

Check:

- Gmail is open.
- An email is selected.
- The content script is loaded.
- n8n is running.
- The webhook URL is correct.

Open the extension developer console and check for JavaScript errors.

---

## 10. Email Data Is Empty

### Problem

The extension returns an empty sender, subject, or email body.

### Solution

Make sure a Gmail message is fully open before starting the analysis.

Reload Gmail:

```text
https://mail.google.com
```

Open the message again and retry.

Gmail can dynamically change its page structure, so DOM selectors used by the content script may require updates if Gmail changes its interface.

---

## 11. Content Script Not Loaded

### Problem

The popup cannot communicate with the Gmail page.

### Solution

Verify that `manifest.json` contains the Gmail content script configuration.

The extension must have access to:

```text
https://mail.google.com/*
```

After changing `manifest.json`:

1. Open `chrome://extensions/`.
2. Find PhishGuard AI.
3. Click **Reload**.
4. Reload Gmail.

---

## 12. API or LLM Error

### Problem

The n8n workflow fails at the AI analysis node.

### Solution

Check that the required API credentials are configured correctly.

Verify:

- API key exists.
- API key is valid.
- API quota is available.
- The configured model is available.
- The n8n credential is connected to the correct node.

Never place real API keys directly in GitHub source files.

---

## 13. Analysis Takes Too Long

### Problem

The extension stays on:

```text
Analyzing email...
```

### Solution

Possible causes include:

- Slow LLM API response
- Internet connection issues
- n8n workflow failure
- Database delay
- Invalid API credentials

Check n8n executions to identify the slow or failed node.

Also inspect:

```bash
docker-compose logs n8n
```

---

## 14. Database Tables Are Missing

### Problem

The workflow reports that a PostgreSQL table does not exist.

### Solution

The database schema is located at:

```text
backend/database/schema.sql
```

The Docker configuration loads this schema when PostgreSQL is initialized for the first time.

If necessary, apply the schema manually:

```bash
psql -U postgres -d phishguard_ai -f database/schema.sql
```

---

## 15. Port 5678 Is Already in Use

### Problem

n8n cannot start because port `5678` is occupied.

### Solution

Find the process using the port or stop the conflicting service.

Alternatively, change the exposed port inside:

```text
backend/docker-compose.yml
```

If the port changes, also update the webhook URL used by the Chrome extension.

---

## 16. Port 5432 Is Already in Use

### Problem

PostgreSQL cannot start because another database is already using port `5432`.

### Solution

Stop the existing PostgreSQL service or change the Docker port mapping.

After changing the port, update all relevant database configuration values.

---

## 17. Report Does Not Open

### Problem

Clicking **View Full Report** does not display the latest result.

### Solution

Verify that:

```text
extension/src/report.html
extension/src/report.js
```

exist.

Also check that the latest analysis result has been stored in:

```javascript
chrome.storage.local
```

Reload the extension after making changes.

---

## 18. No Report Available

### Problem

The report page displays:

```text
No report available
```

### Solution

Analyze an email first.

The analysis response is stored locally after a successful webhook request. If no successful analysis has been completed, there may be no report available to display.

---

## 19. Changes to Extension Are Not Appearing

### Problem

You modify the source code but Chrome continues using the old version.

### Solution

After editing extension files:

1. Open `chrome://extensions/`.
2. Find PhishGuard AI.
3. Click **Reload**.
4. Refresh Gmail.
5. Test again.

---

## 20. Complete Restart

If the system is behaving unexpectedly, perform a complete restart.

Stop containers:

```bash
docker-compose down
```

Start them again:

```bash
docker-compose up -d
```

Reload the Chrome extension and refresh Gmail.

---

## Debugging Checklist

When troubleshooting, check these components in order:

1. Docker Desktop is running.
2. PostgreSQL container is running.
3. n8n container is running.
4. n8n dashboard opens.
5. Phishing workflow is imported.
6. Workflow credentials are configured.
7. Workflow is active.
8. Webhook URL is correct.
9. Chrome extension is loaded.
10. Gmail permissions are available.
11. An email is open.
12. Browser console has no critical errors.
13. n8n execution logs show successful processing.

---

## Useful Commands

Check services:

```bash
docker-compose ps
```

View all logs:

```bash
docker-compose logs
```

View n8n logs:

```bash
docker-compose logs n8n
```

View PostgreSQL logs:

```bash
docker-compose logs postgres
```

Restart n8n:

```bash
docker-compose restart n8n
```

Restart PostgreSQL:

```bash
docker-compose restart postgres
```

Stop everything:

```bash
docker-compose down
```

Start everything:

```bash
docker-compose up -d
```

---

## Security Reminder

Never share or commit:

- Real API keys
- `.env` files
- Database passwords
- Private credentials
- Authentication tokens

Use `.env.example` only as a template for configuration.

---

## Still Having Problems?

Check the following project documentation:

- `SETUP_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `API_REFERENCE.md`
- `SECURITY.md`

Also review Docker logs and n8n workflow execution logs for detailed error information.
