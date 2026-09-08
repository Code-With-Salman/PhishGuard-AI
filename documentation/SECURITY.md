# PhishGuard AI - Security Documentation

## Security Principles

PhishGuard AI is designed with **security-first** principles to protect user data and email privacy.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Data Privacy](#data-privacy)
3. [API Security](#api-security)
4. [Credential Management](#credential-management)
5. [Encryption](#encryption)
6. [Access Control](#access-control)
7. [Threat Model](#threat-model)
8. [Incident Response](#incident-response)
9. [Compliance](#compliance)
10. [Security Recommendations](#security-recommendations)

---

## Security Overview

### Core Security Properties

✅ **Email Bodies Never Logged** - Only hashed and anonymized

✅ **HTTPS Enforced** - All communication encrypted in transit

✅ **No Third-Party Tracking** - User data not shared with analytics services

✅ **Local Caching** - Optional, user-controllable

✅ **Rate Limited** - 20 requests/minute prevents abuse

✅ **Input Validation** - All data validated before processing

✅ **CORS Protected** - Cross-origin requests restricted

✅ **XSS Prevention** - Content Security Policy headers

✅ **SQL Injection Prevention** - Parameterized queries only

---

## Data Privacy

### What Data is Collected?

**Analyzed (sent to backend):**
- Email sender (name + address)
- Email recipient(s) and CC/BCC
- Email subject line
- Email body (plain text)
- Email headers (SPF/DKIM/DMARC status)
- Link URLs (but not user click data)
- Attachment metadata (name, size, type - NOT content)
- Email timestamp
- User email address

**NOT Collected:**
- ❌ Full email content (beyond anonymized analysis)
- ❌ User browsing history
- ❌ Local files or contacts
- ❌ Passwords or sensitive credentials
- ❌ User behavior analytics
- ❌ Third-party tracking

### Data Retention

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Analysis Results | 90 days | PostgreSQL |
| Sender Reputation | 1 year | PostgreSQL |
| User Settings | Until deletion | PostgreSQL |
| Cache | 7 days | Local (browser) |
| Logs | 30 days | Application logs |

### Data Deletion

Users can request deletion of:

```bash
# All personal analysis data
DELETE FROM email_analyses WHERE user_email = 'user@example.com';

# All settings
DELETE FROM user_settings WHERE user_email = 'user@example.com';

# Request via support: support@phishguard.example.com
```

---

## API Security

### Authentication

Extension authentication via request signing:

```javascript
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(JSON.stringify(payload) + timestamp)
  .digest('hex');

headers['X-Signature'] = signature;
headers['X-Timestamp'] = timestamp;
```

### Rate Limiting

```text
Request Limit: 20 per minute per user
Burst Limit: 5 additional requests allowed
Retry-After: Returned on 429 responses
Ban Duration: 1 hour for abuse
```

### Request Validation

```javascript
{
  "metadata": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "extension_version": "1.0.0",
    "user_email": "user@..."
  },
  "email": { ... }
}
```

### Response Security

```text
✓ All responses signed with HMAC-SHA256
✓ No sensitive data in response logs
✓ Error messages generic (no SQL details)
✓ Stack traces only in development
```

---

## Credential Management

### API Keys

**Security Requirements:**

```text
✓ Rotate every 90 days minimum
✓ Store in environment variables only
✓ Never commit to version control
✓ Use different keys per environment
✓ Revoke compromised keys immediately
```

**OpenAI API Key:**

```bash
export OPENAI_API_KEY="sk_live_xxxxx"

OPENAI_API_KEY_CREATED_DATE=$(date)
echo "Key rotation date: $OPENAI_API_KEY_CREATED_DATE"
```

**Database Credentials:**

```sql
CREATE USER phishguard_user WITH PASSWORD 'StrongPassword123!@#';
ALTER USER phishguard_user WITH ENCRYPTED PASSWORD 'StrongPassword123!@#';

ALTER SYSTEM SET listen_addresses = '127.0.0.1, 10.0.0.0/8';
```

**Extension Secrets:**

```javascript
// NEVER hardcode secrets
❌ const API_KEY = "sk_live_xxxxx"; // WRONG!

// Use environment variables only
✓ const API_KEY = process.env.OPENAI_API_KEY;
```

---

## Encryption

### In Transit

```text
Protocol: HTTPS/TLS 1.2+
Ciphers: AES-256-GCM or better
Certificate: Valid CA-signed certificate
HSTS: Enabled (1 year, includeSubDomains)
```

### Hashing

```text
Algorithm: SHA-256
Use Case: Email body fingerprinting
Never: User identification
```

---

## Access Control

### Database Access

```sql
CREATE ROLE read_only;
CREATE ROLE read_write;
CREATE ROLE admin;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO read_write;

ALTER USER phishguard_api IN ROLE read_write;
```

### API Permissions

```text
Extension Routes:
  /webhook/phishing-analysis     [POST] - Any user
  /webhook/report-feedback       [POST] - Any user

Admin Routes (restricted):
  /admin/stats                   [GET]  - Admins only
  /admin/users                   [GET]  - Admins only
  /admin/logs                    [GET]  - Admins only
```

---

## Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|-----------|
| Email body interception | Low | High | HTTPS + TLS 1.2+ |
| API key compromise | Medium | High | Secrets manager, rotation |
| Phishing false positive | Medium | Medium | User feedback, ML refinement |
| Database breach | Low | High | Encryption, access control, backups |
| XSS in popup | Medium | Medium | CSP headers, input escaping |
| SQL injection | Low | High | Parameterized queries |
| Rate limit bypass | Low | Medium | IP-based + user-based limits |
| Malicious extension clone | High | Medium | Chrome Web Store verification |

---

## Incident Response

### Incident Severity Levels

| Level | Response Time | Escalation |
|-------|-------------|-----------|
| **Critical** | < 1 hour | CEO + Security team |
| **High** | < 4 hours | Security team |
| **Medium** | < 24 hours | Engineering |
| **Low** | < 7 days | Standard process |

### Post-Incident

```text
1. Investigate root cause
2. Implement fix
3. Deploy fix to production
4. Notify affected users
5. Post-mortem review
6. Update security measures
```

---

## Compliance

### GDPR

✅ User consent for data collection  
✅ Right to access  
✅ Right to deletion  
✅ Data portability  
✅ Privacy policy

### CCPA

✅ Transparency on data use  
✅ Users can disable analysis  
✅ Data is never sold

### Standards

- ✅ OWASP Top 10 compliance
- ✅ CWE mitigation
- ✅ TLS 1.2+ standards
- ✅ NIST Cybersecurity Framework

---

## Security Recommendations

### For Deployment

1. Use HTTPS for all production communication.
2. Store credentials only in environment variables.
3. Use strong and unique database passwords.
4. Restrict database access to trusted hosts.
5. Keep regular encrypted backups.
6. Enable monitoring and audit logging.
7. Rotate API keys regularly.
8. Never commit `.env` files or real API keys to GitHub.

### For Users

1. Keep the extension updated.
2. Use strong passwords.
3. Enable two-factor authentication.
4. Review suspicious emails manually.
5. Verify sender addresses before clicking links.
6. Avoid opening unexpected attachments.

---

## Security Audit

Last Audit: June 2026  
Next Audit: December 2026

### Regular Security Activities

- ✅ Code reviews
- ✅ Dependency scanning
- ✅ Security testing
- ✅ Penetration testing
- ✅ Security audits

---

## Contact

**Security Team:** security@phishguard.example.com

**Responsible Disclosure:** Please allow 90 days for fixes before public disclosure.

---

*Last Updated: June 7, 2026*
