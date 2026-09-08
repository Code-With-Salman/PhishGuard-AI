# PhishGuard AI - Setup Guide

## Complete Installation and Configuration Guide

This guide explains how to set up the PhishGuard AI phishing detection system locally.

---

## Prerequisites

Before starting, make sure the following software is installed:

- Google Chrome
- Docker Desktop
- Git
- PostgreSQL through Docker
- n8n through Docker
- A supported LLM API key
- Code editor such as Visual Studio Code

---

## 1. Clone the Project

Clone the repository:

```bash
git clone https://github.com/yourusername/PhishGuard-AI.git
```

Open the project directory:

```bash
cd PhishGuard-AI
```

The main project structure is:

```text
PhishGuard-AI/
├── backend/
│   ├── database/
│   ├── n8n-workflows/
│   ├── .env.example
│   └── docker-compose.yml
│
├── extension/
│   ├── src/
│   └── manifest.json
│
└── documentation/
```

---

## 2. Configure Environment Variables

Navigate to the backend folder:

```bash
cd backend
```

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration.

Example:

```env
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_USER=phishguard
DB_POSTGRESDB_PASSWORD=your_secure_password
DB_POSTGRESDB_DATABASE=phishguard_ai

N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_admin_password

N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

OPENAI_API_KEY=your_api_key_here
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

Never upload the real `.env` file or API keys to GitHub.

---

## 3. Start Docker Services

Make sure Docker Desktop is running.

From the backend directory, run:

```bash
docker-compose up -d
```

This starts:

- PostgreSQL database
- n8n workflow automation service

Check the running containers:

```bash
docker-compose ps
```

You should see the PostgreSQL and n8n containers running.

---

## 4. Database Setup

The PostgreSQL database uses the schema located at:

```text
backend/database/schema.sql
```

When Docker starts PostgreSQL for the first time, the schema is loaded automatically through the Docker volume configuration.

The database stores information such as:

- Email analysis results
- Sender information
- URL analysis
- Attachment analysis
- User settings
- Whitelisted senders
- Analysis cache
- Audit logs

---

## 5. Access n8n

Open your browser and go to:

```text
http://localhost:5678
```

Log in using the n8n credentials configured in your environment.

---

## 6. Import the Phishing Analysis Workflow

Inside n8n:

1. Open the n8n dashboard.
2. Choose **Import from File**.
3. Select:

```text
backend/n8n-workflows/phishing-analysis-main.json
```

4. Import the workflow.
5. Configure the required credentials.
6. Verify the PostgreSQL connection.
7. Configure the LLM/API credentials.
8. Save the workflow.
9. Activate the workflow.

---

## 7. Configure the Webhook

The local phishing analysis webhook is:

```text
http://localhost:5678/webhook/phishing-analysis
```

The Chrome extension sends extracted Gmail information to this endpoint.

For testing inside n8n, a test webhook may also be used:

```text
http://localhost:5678/webhook-test/phishing-analysis
```

Make sure the webhook URL used by the extension matches the active n8n workflow.

---

## 8. Install the Chrome Extension

Open Google Chrome.

Go to:

```text
chrome://extensions/
```

Then:

1. Enable **Developer mode**.
2. Click **Load unpacked**.
3. Select the project's `extension` folder.
4. PhishGuard AI should appear in the extensions list.
5. Pin the extension to the Chrome toolbar.

---

## 9. Verify Extension Configuration

The extension configuration is located in:

```text
extension/manifest.json
```

The extension requires access to:

```text
https://mail.google.com/*
http://localhost:5678/*
```

This allows PhishGuard AI to read the currently opened Gmail message and communicate with the local n8n backend.

---

## 10. Test PhishGuard AI

Open:

```text
https://mail.google.com
```

Then:

1. Open an email.
2. Click the PhishGuard AI extension.
3. Click **Analyze Current Email**.
4. The extension extracts the email information.
5. The data is sent to the n8n webhook.
6. The analysis workflow processes the email.
7. The final risk score and verdict are returned.
8. The result appears inside the extension popup.

---

## 11. Expected Analysis

PhishGuard AI analyzes multiple security signals including:

- Sender and domain information
- Email content
- Suspicious or shortened URLs
- SPF authentication
- DKIM authentication
- DMARC authentication
- Attachment names and file types
- Social engineering language
- Credential harvesting patterns

The system combines the results into a final phishing risk assessment.

---

## 12. View the Full Report

After an email is analyzed, click:

```text
View Full Report
```

The extension opens the detailed PhishGuard AI analysis report.

The report can include:

- Risk score
- Verdict
- Summary
- Findings
- Recommendations
- Technical analysis details

---

## 13. Troubleshooting

### n8n Does Not Start

Check Docker:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs n8n
```

Restart:

```bash
docker-compose restart n8n
```

### PostgreSQL Does Not Start

View database logs:

```bash
docker-compose logs postgres
```

Restart PostgreSQL:

```bash
docker-compose restart postgres
```

### Extension Cannot Connect to Backend

Verify that n8n is running:

```text
http://localhost:5678
```

Check that the webhook URL inside the extension matches the n8n webhook.

### Gmail Email Is Not Extracted

Make sure:

- Gmail is open.
- An email message is currently selected.
- The extension has permission to access Gmail.
- The extension is enabled in Chrome.
- The content script has loaded successfully.

Reload Gmail and try again if required.

### Workflow Returns an Error

Check:

- LLM API credentials
- PostgreSQL credentials
- n8n workflow configuration
- Webhook configuration
- Docker container logs

---

## 14. Stop the System

To stop the Docker services:

```bash
docker-compose down
```

To start them again:

```bash
docker-compose up -d
```

---

## Security Notes

- Never commit real API keys.
- Never commit the `.env` file.
- Change default passwords before production deployment.
- Use HTTPS for production webhooks.
- Restrict database access.
- Keep Docker and project dependencies updated.
- Store production secrets securely.

---

## Setup Complete

Once PostgreSQL, n8n, and the Chrome extension are configured, PhishGuard AI is ready to analyze Gmail messages through its multi-agent phishing detection workflow.
