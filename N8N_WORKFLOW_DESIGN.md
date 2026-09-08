# PhishGuard AI - n8n Workflow Design

## Overview

The n8n workflow orchestrates the phishing analysis pipeline, coordinating five parallel analysis agents and aggregating their results into a risk score.

---

## Workflow Architecture

```
Webhook Input (Email Data)
        │
        ▼
   Data Validation
        │
        ├─ Parallel Execution ───┐
        │   (Split)              │
        │                        ▼
        │          ┌──────────────────────────┐
        │          │ SENDER DOMAIN AGENT      │
        │          │ • Domain age check       │
        │          │ • SPF/DKIM verification │
        │          │ • Reputation lookup     │
        │          │ • Returns: 0-25 score   │
        │          └──────────────────────────┘
        │
        │          ┌──────────────────────────┐
        │          │ URL INTELLIGENCE AGENT   │
        │          │ • Typosquatting detect   │
        │          │ • Malware DB check       │
        │          │ • Redirect analysis      │
        │          │ • Returns: 0-25 score   │
        │          └──────────────────────────┘
        │
        │          ┌──────────────────────────┐
        │          │ CONTENT ANALYSIS AGENT   │
        │          │ (LLM - GPT-4o/Gemini)    │
        │          │ • Urgency language       │
        │          │ • Credential harvesting  │
        │          │ • Financial scams        │
        │          │ • Returns: 0-25 score   │
        │          └──────────────────────────┘
        │
        │          ┌──────────────────────────┐
        │          │ HEADER ANALYSIS AGENT    │
        │          │ • SPF check              │
        │          │ • DKIM validation        │
        │          │ • DMARC policy review    │
        │          │ • Returns: 0-10 score   │
        │          └──────────────────────────┘
        │
        │          ┌──────────────────────────┐
        │          │ ATTACHMENT RISK AGENT    │
        │          │ • File type analysis     │
        │          │ • Macro detection        │
        │          │ • Known malware DB       │
        │          │ • Returns: 0-15 score   │
        │          └──────────────────────────┘
        │
        └─ Merge Results ───────┘
                │
                ▼
        Risk Scoring Engine
        (Aggregate 5 scores)
                │
                ▼
        Report Generator
        (Format findings)
                │
                ▼
        Database Storage
        (PostgreSQL save)
                │
                ▼
        Response Builder
        (JSON response)
                │
                ▼
        Send to Extension
```

---

## Node-by-Node Breakdown

### 1. Webhook Trigger
```json
{
  "name": "Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "position": [300, 100],
  "typeVersion": 2,
  "webhookId": "generated-by-n8n",
  "parameters": {
    "path": "phishing-analysis",
    "httpMethod": "POST",
    "responseMode": "responseNode"
  }
}
```

**Purpose**: Accept incoming email data from Chrome Extension

**Input**: Raw JSON payload from extension

### 2. Data Validation

```json
{
  "name": "Validate Email Data",
  "type": "n8n-nodes-base.code",
  "position": [300, 200],
  "parameters": {
    "jsCode": "// Validate incoming email data\nconst body = $input.first().json.email;\nconst links = $input.first().json.links || [];\nconst attachments = $input.first().json.attachments || [];\n\n// Required fields validation\nif (!body || !body.sender || !body.sender.email) {\n  throw new Error('Missing required field: email.sender.email');\n}\n\nif (!body.body || body.body.trim().length === 0) {\n  throw new Error('Email body cannot be empty');\n}\n\nif (!body.subject) {\n  console.log('Warning: Subject is missing');\n}\n\n// Sanitize email body (remove excessive whitespace)\nbody.body = body.body.trim().replace(/\\s+/g, ' ');\n\n// Validate URLs\nconst validatedLinks = links.filter(link => {\n  try {\n    new URL(link.href);\n    return true;\n  } catch {\n    console.log('Invalid URL skipped:', link.href);\n    return false;\n  }\n});\n\nreturn {\n  email: body,\n  links: validatedLinks,\n  attachments: attachments,\n  request_id: $input.first().json.metadata.request_id,\n  user_email: $input.first().json.metadata.user_email\n};\n"
  }
}
```

**Purpose**: Validate and sanitize input data

### 3-7. Parallel Analysis Agents (Executed in Parallel)

#### Agent 3: Sender Domain Analysis

```json
{
  "name": "Sender Domain Agent",
  "type": "n8n-nodes-base.code",
  "position": [500, 100],
  "parameters": {
    "jsCode": "// Sender and Domain Analysis\nconst email = $input.first().json.email;\nconst senderEmail = email.sender.email;\nconst senderDomain = senderEmail.split('@')[1];\nconst recipientDomain = email.recipient.split('@')[1];\n\nlet score = 0;\nlet findings = [];\n\n// 1. Check if sender domain matches recipient domain\nif (senderDomain === recipientDomain) {\n  findings.push('Sender domain matches recipient domain (internal)');\n} else if (senderDomain.includes(recipientDomain) || recipientDomain.includes(senderDomain)) {\n  findings.push('Sender domain is similar to recipient domain');\n} else {\n  score += 8;\n  findings.push('Sender domain differs from recipient domain');\n}\n\n// 2. Check domain age (mock - would call API in production)\nconst mockDomainAge = Math.floor(Math.random() * 365);\nif (mockDomainAge < 7) {\n  score += 15;\n  findings.push(`Domain is very new (${mockDomainAge} days old)`);\n} else if (mockDomainAge < 30) {\n  score += 10;\n  findings.push(`Domain is relatively new (${mockDomainAge} days old)`);\n}\n\n// 3. Check SPF/DKIM/DMARC\nconst headers = email.message_headers || {};\nif (headers.spf !== 'pass') {\n  score += 5;\n  findings.push(`SPF check failed: ${headers.spf || 'not set'}`);\n}\nif (headers.dkim !== 'pass') {\n  score += 4;\n  findings.push(`DKIM check failed: ${headers.dkim || 'not set'}`);\n}\nif (headers.dmarc !== 'pass') {\n  score += 3;\n  findings.push(`DMARC check failed: ${headers.dmarc || 'not set'}`);\n}\n\n// Cap at 25\nscore = Math.min(score, 25);\n\nreturn {\n  agent: 'sender_domain',\n  score: score,\n  findings: findings,\n  sender_domain: senderDomain,\n  domain_age_days: mockDomainAge\n};\n"
  }
}
```

#### Agent 4: URL Intelligence Agent

```json
{
  "name": "URL Intelligence Agent",
  "type": "n8n-nodes-base.code",
  "position": [500, 200],
  "parameters": {
    "jsCode": "// URL Intelligence and Analysis\nconst links = $input.first().json.links || [];\nconst senderEmail = $input.first().json.email.sender.email;\n\nlet score = 0;\nlet findings = [];\nlet suspiciousUrls = [];\n\nlinks.forEach((link, index) => {\n  try {\n    const url = new URL(link.href);\n    const domain = url.hostname;\n    const anchorText = (link.anchor_text || '').toLowerCase();\n    \n    // 1. Check for URL shorteners\n    if (['bit.ly', 'tinyurl.com', 'short.link', 'ow.ly', 'goo.gl'].includes(domain)) {\n      score += 5;\n      findings.push(`URL shortener detected: ${domain}`);\n      suspiciousUrls.push(link.href);\n    }\n    \n    // 2. Check for IP-based URLs\n    if (/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(domain)) {\n      score += 12;\n      findings.push(`IP-based URL detected: ${link.href}`);\n      suspiciousUrls.push(link.href);\n    }\n    \n    // 3. Check for domain mismatch\n    if (anchorText && !anchorText.includes(domain.split('.')[0])) {\n      score += 8;\n      findings.push(`Domain mismatch: Text says \"${link.anchor_text}\" but URL is ${domain}`);\n      suspiciousUrls.push(link.href);\n    }\n    \n    // 4. Check for typosquatting (mock - would call reputation API)\n    const commonBanks = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook'];\n    const isDomainRelated = commonBanks.some(bank => domain.includes(bank));\n    if (isDomainRelated && !commonBanks.some(bank => domain === `${bank}.com`)) {\n      score += 10;\n      findings.push(`Possible typosquatting: ${domain}`);\n      suspiciousUrls.push(link.href);\n    }\n    \n  } catch (error) {\n    console.log('Error parsing URL:', link.href, error);\n  }\n});\n\n// Cap at 25\nscore = Math.min(score, 25);\n\nreturn {\n  agent: 'url_intelligence',\n  score: score,\n  findings: findings,\n  suspicious_urls: suspiciousUrls,\n  total_urls: links.length\n};\n"
  }
}
```

#### Agent 5: Content Analysis Agent (LLM)

```json
{
  "name": "Content Analysis Agent",
  "type": "n8n-nodes-base.openaiChat",
  "position": [500, 300],
  "parameters": {
    "messages": [\n      {\n        \"role\": \"system\",\n        \"content\": \"You are a phishing email detection expert. Analyze the provided email content for phishing indicators. Return a JSON object with findings and a risk score (0-25). Look for: urgency language, credential harvesting attempts, financial requests, impersonation, social engineering tactics.\"\n      },\n      {\n        \"role\": \"user\",\n        \"content\": \"Analyze this email:\\n\\nSubject: {{$json.email.subject}}\\n\\nBody: {{$json.email.body}}\\n\\nProvide JSON response with fields: score (0-25), urgency_language (boolean), credential_harvesting (boolean), financial_request (boolean), impersonation (boolean), social_engineering (boolean), findings (array of strings).\"\n      }\n    ],\n    \"model\": \"gpt-4o\",\n    \"temperature\": 0.3,\n    \"maxTokens\": 1000\n  }
}
```

**Note**: Also supports Gemini by changing node type to `n8n-nodes-base.geminiChat`

#### Agent 6: Header Analysis Agent

```json
{
  "name": \"Header Analysis Agent\",\n  \"type\": \"n8n-nodes-base.code\",\n  \"position\": [500, 400],\n  \"parameters\": {\n    \"jsCode\": \"// Email Header Authentication Analysis\nconst headers = $input.first().json.email.message_headers || {};\n\nlet score = 0;\nlet findings = [];\n\n// SPF Analysis\nconst spf = headers.spf || 'none';\nif (spf === 'fail') {\n  score += 5;\n  findings.push('SPF check FAILED - Email may be spoofed');\n} else if (spf === 'softfail') {\n  score += 2;\n  findings.push('SPF check SOFTFAIL - Email failed SPF with soft failure');\n} else if (spf === 'pass') {\n  findings.push('SPF check PASSED');\n}\n\n// DKIM Analysis\nconst dkim = headers.dkim || 'none';\nif (dkim === 'fail') {\n  score += 4;\n  findings.push('DKIM signature FAILED - Email may be forged');\n} else if (dkim === 'pass') {\n  findings.push('DKIM signature PASSED');\n}\n\n// DMARC Analysis\nconst dmarc = headers.dmarc || 'none';\nif (dmarc === 'fail') {\n  score += 3;\n  findings.push('DMARC policy FAILED - Email failed sender domain policy');\n} else if (dmarc === 'pass') {\n  findings.push('DMARC policy PASSED');\n}\n\nif (score === 0) {\n  findings.push('Email authentication checks passed');\n}\n\n// Cap at 10\nscore = Math.min(score, 10);\n\nreturn {\n  agent: 'header_analysis',\n  score: score,\n  findings: findings,\n  spf_status: spf,\n  dkim_status: dkim,\n  dmarc_status: dmarc\n};\n\"\n  }\n}\n```\n\n#### Agent 7: Attachment Risk Agent\n\n```json\n{\n  \"name\": \"Attachment Risk Agent\",\n  \"type\": \"n8n-nodes-base.code\",\n  \"position\": [500, 500],\n  \"parameters\": {\n    \"jsCode\": \"// Attachment Risk Analysis\nconst attachments = $input.first().json.attachments || [];\n\nlet score = 0;\nlet findings = [];\nlet riskAttachments = [];\n\nconst dangerousExtensions = {\n  'exe': 15, 'bat': 15, 'scr': 15, 'vbs': 15, 'com': 15, 'pif': 15, 'msi': 15,\n  'docm': 12, 'xlsm': 12, 'pptm': 12,  // Macro-enabled Office\n  'zip': 8, 'rar': 8, 'gz': 8,          // Archives (could contain executables)\n  'dll': 10, 'sys': 10, 'drv': 10,      // System files\n  'scf': 12, 'lnk': 12                  // Windows shortcuts\n};\n\nattachments.forEach((att) => {\n  const parts = att.name.split('.');\n  const ext = parts[parts.length - 1].toLowerCase();\n  \n  if (dangerousExtensions[ext]) {\n    const attScore = dangerousExtensions[ext];\n    score += attScore;\n    findings.push(`Dangerous file type detected: .${ext} (${att.name})`);\n    riskAttachments.push(att.name);\n  }\n  \n  // Check for double extensions (e.g., invoice.pdf.exe)\n  if (parts.length > 2) {\n    const firstExt = parts[parts.length - 2].toLowerCase();\n    if (dangerousExtensions[firstExt]) {\n      score += 5;\n      findings.push(`Double extension detected: ${att.name}`);\n    }\n  }\n  \n  // Check file size (>5MB might be suspicious)\n  if (att.size && att.size > 5000000) {\n    score += 3;\n    findings.push(`Large file detected: ${att.name} (${(att.size / 1000000).toFixed(1)}MB)`);\n  }\n});\n\n// Cap at 15\nscore = Math.min(score, 15);\n\nif (attachments.length === 0) {\n  findings.push('No attachments found');\n}\n\nreturn {\n  agent: 'attachment_risk',\n  score: score,\n  findings: findings,\n  risk_attachments: riskAttachments,\n  total_attachments: attachments.length\n};\n\"\n  }\n}\n```\n\n### 8. Merge Results (Combine Parallel Outputs)\n\n```json\n{\n  \"name\": \"Merge Analysis Results\",\n  \"type\": \"n8n-nodes-base.merge\",\n  \"position\": [750, 300],\n  \"parameters\": {\n    \"mode\": \"waitForInput\",\n    \"output\": \"object\"\n  }\n}\n```\n\n### 9. Risk Scoring Engine\n\n```json\n{\n  \"name\": \"Risk Scoring Engine\",\n  \"type\": \"n8n-nodes-base.code\",\n  \"position\": [950, 300],\n  \"parameters\": {\n    \"jsCode\": \"// Aggregate scores and calculate final risk level\nconst data = $input.first().json;\n\nconst senderScore = data[0]?.score || 0;     // 0-25\nconst urlScore = data[1]?.score || 0;         // 0-25\nconst contentScore = data[2]?.score || 0;     // 0-25 (LLM)\nconst headerScore = data[3]?.score || 0;      // 0-10\nconst attachmentScore = data[4]?.score || 0;  // 0-15\n\nconst totalRiskScore = senderScore + contentScore + urlScore + attachmentScore + headerScore;\n\nlet riskLevel = 'SAFE';\nif (totalRiskScore > 60) {\n  riskLevel = 'HIGH_RISK';\n} else if (totalRiskScore > 30) {\n  riskLevel = 'SUSPICIOUS';\n}\n\nconst colorIndicator = riskLevel === 'HIGH_RISK' ? 'red' : (riskLevel === 'SUSPICIOUS' ? 'yellow' : 'green');\n\nconst allFindings = [\n  ...(data[0]?.findings || []),\n  ...(data[1]?.findings || []),\n  ...(data[2]?.findings || []),\n  ...(data[3]?.findings || []),\n  ...(data[4]?.findings || [])\n];\n\nreturn {\n  risk_score: totalRiskScore,\n  risk_level: riskLevel,\n  color_indicator: colorIndicator,\n  \n  breakdown: {\n    sender_risk: senderScore,\n    content_risk: contentScore,\n    url_risk: urlScore,\n    attachment_risk: attachmentScore,\n    auth_risk: headerScore\n  },\n  \n  detailed_findings: {\n    sender_analysis: data[0],\n    url_analysis: data[1],\n    content_analysis: data[2],\n    header_analysis: data[3],\n    attachment_analysis: data[4]\n  },\n  \n  all_findings: allFindings,\n  \n  recommendations: generateRecommendations(riskLevel, allFindings),\n  \n  summary: generateSummary(riskLevel, totalRiskScore)\n};\n\nfunction generateRecommendations(level, findings) {\n  const recs = [];\n  \n  if (level === 'HIGH_RISK') {\n    recs.push('Do not click any links in this email');\n    recs.push('Do not download or open attachments');\n    recs.push('Do not enter any personal or financial information');\n    recs.push('Delete this email immediately');\n    recs.push('Report as phishing to your email provider');\n  } else if (level === 'SUSPICIOUS') {\n    recs.push('Be cautious with this email');\n    recs.push('Verify sender through other means before clicking links');\n    recs.push('Do not open attachments unless expected');\n  }\n  \n  return recs;\n}\n\nfunction generateSummary(level, score) {\n  const levelDescriptions = {\n    'HIGH_RISK': 'Email shows strong indicators of phishing or malicious intent',\n    'SUSPICIOUS': 'Email contains some suspicious characteristics that warrant caution',\n    'SAFE': 'Email appears to be legitimate based on analysis'\n  };\n  return `${levelDescriptions[level]} (Risk Score: ${score}/100)`;\n}\n\"\n  }\n}\n```\n\n### 10. Database Storage\n\n```json\n{\n  \"name\": \"Store in PostgreSQL\",\n  \"type\": \"n8n-nodes-base.postgres\",\n  \"position\": [1150, 200],\n  \"parameters\": {\n    \"host\": \"{{$env.DB_HOST}}\",\n    \"database\": \"{{$env.DB_NAME}}\",\n    \"user\": \"{{$env.DB_USER}}\",\n    \"password\": \"{{$env.DB_PASSWORD}}\",\n    \"port\": 5432,\n    \"query\": \"INSERT INTO email_analyses (email_message_id, user_email, sender_email, sender_domain, subject, risk_score, risk_level, sender_risk, content_risk, url_risk, attachment_risk, auth_risk, findings, recommendations, summary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id;\",\n    \"queryParameters\": [\n      \"={{$json.metadata.message_id}}\",\n      \"={{$json.metadata.user_email}}\",\n      \"={{$json.email.sender.email}}\",\n      \"={{$json.email.sender.email.split('@')[1]}}\",\n      \"={{$json.email.subject}}\",\n      \"={{$json.risk_score}}\",\n      \"={{$json.risk_level}}\",\n      \"={{$json.breakdown.sender_risk}}\",\n      \"={{$json.breakdown.content_risk}}\",\n      \"={{$json.breakdown.url_risk}}\",\n      \"={{$json.breakdown.attachment_risk}}\",\n      \"={{$json.breakdown.auth_risk}}\",\n      \"={{JSON.stringify($json.detailed_findings)}}\",\n      \"={{JSON.stringify($json.recommendations)}}\",\n      \"={{$json.summary}}\"\n    ]\n  }\n}\n```\n\n### 11. Response Builder\n\n```json\n{\n  \"name\": \"Build Response\",\n  \"type\": \"n8n-nodes-base.respondToWebhook\",\n  \"position\": [1350, 300],\n  \"parameters\": {\n    \"responseCode\": \"={{$json.analysis_id ? 200 : 500}}\",\n    \"responseBody\": \"={{JSON.stringify({\\\"success\\\": true, \\\"data\\\": $json})}}\"\n  }\n}\n```\n\n---\n\n## Environment Variables Required\n\n```bash\n# OpenAI or Google\nOPENAI_API_KEY=sk-xxxx...\nGEMINI_API_KEY=xxxx...\n\n# PostgreSQL\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=phishguard_ai\nDB_USER=postgres\nDB_PASSWORD=secure_password\n\n# Optional External APIs\nVIRUSTOTAL_API_KEY=xxxx...\nGOOGLE_SAFE_BROWSING_KEY=xxxx...\n```\n\n---\n\n## Workflow Export/Import\n\nTo import this workflow into n8n:\n\n1. Go to n8n Dashboard\n2. Click \"Import Workflow\"\n3. Paste the workflow JSON\n4. Configure environment variables\n5. Activate the workflow\n\n