# PhishGuard AI - API Design

## API Overview

This document describes the API communication between the PhishGuard AI Chrome Extension and the n8n backend.

---

## Email Analysis API

### Endpoint

```http
POST /webhook/phishing-analysis
```

### Base URL

```text
https://your-n8n-instance.com/webhook/phishing-analysis
```

The Chrome extension sends extracted Gmail data to this webhook for phishing analysis.

### Request Headers

```json
{
  "Content-Type": "application/json",
  "X-Client-Version": "1.0.0"
}
```

### Request Example

```json
{
  "metadata": {
    "request_id": "uuid-v4-string",
    "timestamp": "2026-06-07T10:30:45Z",
    "extension_version": "1.0.0",
    "user_email": "user@example.com"
  },
  "email": {
    "message_id": "gmail-message-id",
    "sender": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "recipient": "user@example.com",
    "subject": "Important: Verify Your Account",
    "body": "Full email body text...",
    "timestamp": "2026-06-07T10:25:00Z",
    "message_headers": {
      "spf": "pass",
      "dkim": "pass",
      "dmarc": "pass"
    }
  },
  "links": [
    {
      "href": "https://example.com/verify",
      "anchor_text": "Verify Account"
    }
  ],
  "attachments": [
    {
      "name": "document.pdf",
      "size": 512000,
      "mime_type": "application/pdf"
    }
  ]
}
```

---

## Analysis Response

A successful phishing analysis returns a risk assessment containing the overall risk score, verdict, findings, and recommendations.

### Response Example

```json
{
  "success": true,
  "data": {
    "risk_assessment": {
      "risk_score": 87,
      "risk_level": "HIGH_RISK",
      "summary": "Email shows strong indicators of a phishing attempt."
    },
    "breakdown": {
      "sender_risk": 18,
      "content_risk": 22,
      "url_risk": 24,
      "attachment_risk": 12,
      "auth_risk": 11
    },
    "recommendations": [
      "Do not click links in this email",
      "Do not open suspicious attachments",
      "Verify the sender independently",
      "Report the email as phishing"
    ]
  }
}
```

---

## Error Response

If analysis fails, the API returns an error response.

```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "Unable to analyze email"
  }
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_EMAIL_FORMAT | Email data is invalid |
| MISSING_BODY | Email body is missing |
| RATE_LIMIT_EXCEEDED | Too many requests |
| ANALYSIS_FAILED | Analysis engine failed |
| DATABASE_ERROR | Database operation failed |
| SERVICE_UNAVAILABLE | Backend service unavailable |

---

## Rate Limiting

The extension limits requests to prevent excessive API usage.

Default limit:

```text
20 requests per minute
```

---

## Request Timeout and Retry

The Chrome extension uses:

- Request timeout: 20 seconds
- Maximum retries: 2
- Exponential retry backoff for temporary failures

---

## Security

PhishGuard AI follows these API security practices:

- HTTPS should be used for production deployments.
- API keys and credentials should not be hardcoded in extension source code.
- Sensitive credentials should be stored in environment variables.
- Email input should be validated before analysis.
- Sensitive information should not be exposed in error messages.
- Production webhook endpoints should be protected appropriately.

---

## PhishGuard AI

The API connects the Gmail Chrome Extension with the n8n phishing-analysis workflow, allowing extracted email information to be processed by the system's phishing detection agents and returned as a risk assessment.
