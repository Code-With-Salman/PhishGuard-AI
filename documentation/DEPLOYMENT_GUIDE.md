# PhishGuard AI - Deployment Guide

## Production Deployment Instructions

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Backend Deployment](#backend-deployment)
4. [Extension Deployment](#extension-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Technical Requirements

- [ ] All tests passing (unit, integration, end-to-end)
- [ ] Security audit completed
- [ ] Performance testing completed (target: <5s response time)
- [ ] Database backups tested
- [ ] Disaster recovery plan documented
- [ ] SSL certificates obtained and validated
- [ ] DNS records configured
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (if applicable)
- [ ] API keys rotated
- [ ] Rate limiting configured
- [ ] Monitoring & alerting set up

### Documentation

- [ ] API documentation updated
- [ ] Setup guide finalized
- [ ] Runbooks created for common operations
- [ ] Incident response plan documented
- [ ] Change log updated

### Compliance & Legal

- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] GDPR compliance verified
- [ ] Data processing agreement in place
- [ ] Security policy documented

---

## Infrastructure Setup

### AWS Deployment Example

#### 1. Create VPC & Security Groups

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create security group
aws ec2 create-security-group \
  --group-name phishguard-sg \
  --description "PhishGuard AI security group" \
  --vpc-id vpc-12345678

# Open required ports
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp --port 5432 --cidr 10.0.0.0/16
```

#### 2. Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.large \
  --key-name your-key-pair \
  --security-group-ids sg-12345678 \
  --monitoring Enabled=true
```

Install Docker and clone the project:

```bash
apt-get update
apt-get install -y docker.io docker-compose git

git clone https://github.com/yourusername/PhishGuard-AI.git
cd PhishGuard-AI

docker-compose -f backend/docker-compose.yml up -d
```

#### 3. PostgreSQL Database

For production environments, PostgreSQL can be deployed using Docker or a managed database such as AWS RDS.

```bash
aws rds create-db-instance \
  --db-instance-identifier phishguard-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --master-username postgres \
  --master-user-password $STRONG_PASSWORD \
  --allocated-storage 100 \
  --storage-encrypted \
  --backup-retention-period 30
```

---

## Backend Deployment

### Environment Configuration

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Update the production credentials inside `.env`.

Never commit the production `.env` file to GitHub.

### Start Services

```bash
docker-compose -f backend/docker-compose.yml pull
docker-compose -f backend/docker-compose.yml up -d
```

Verify:

```bash
docker-compose -f backend/docker-compose.yml ps
```

View n8n logs:

```bash
docker-compose -f backend/docker-compose.yml logs -f n8n
```

### Database Backup

```bash
docker-compose -f backend/docker-compose.yml exec postgres \
  pg_dump -U postgres phishguard_ai > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Nginx Configuration

A reverse proxy can be used to expose the n8n webhook securely over HTTPS.

Example configuration:

```nginx
events {
    worker_connections 2048;
}

http {
    upstream n8n {
        server n8n:5678;
    }

    server {
        listen 80;
        server_name your-domain.com;

        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        location /webhook/ {
            proxy_pass http://n8n;
            proxy_http_version 1.1;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Extension Deployment

### Prepare Release

Update the extension version inside:

```text
extension/manifest.json
```

Example:

```json
{
  "version": "1.0.1"
}
```

Create a release ZIP:

```bash
zip -r phishguard-ai-1.0.1.zip extension/
```

### Chrome Web Store

For public deployment:

1. Prepare extension screenshots and icons.
2. Create a Chrome Web Store developer account.
3. Upload the extension package.
4. Add the extension description and privacy information.
5. Submit the extension for review.
6. Publish after approval.

---

## Security Configuration

### HTTPS

Production webhook communication should use HTTPS.

SSL certificates can be generated using Let's Encrypt:

```bash
certbot certonly --standalone \
  -d your-domain.com \
  --email admin@example.com
```

Test certificate renewal:

```bash
certbot renew --dry-run
```

### API Keys

API keys must be stored in environment variables.

Do not place real credentials inside:

```text
manifest.json
popup.js
constants.js
docker-compose.yml
```

Production secrets should be stored securely using environment variables or a secret-management service.

### Database Security

Recommended practices:

- Use strong database passwords.
- Restrict PostgreSQL access to trusted hosts.
- Enable encrypted connections.
- Keep regular backups.
- Do not expose PostgreSQL directly to the public internet.

---

## Monitoring & Maintenance

Important metrics to monitor:

- API response time
- n8n workflow failures
- Database availability
- Error rate
- Phishing analysis processing time
- Server CPU and memory usage

Check Docker services:

```bash
docker-compose -f backend/docker-compose.yml ps
```

Check logs:

```bash
docker-compose -f backend/docker-compose.yml logs
```

---

## Backup & Recovery

Create regular PostgreSQL backups:

```bash
pg_dump -U postgres phishguard_ai > phishguard_backup.sql
```

Restore:

```bash
psql -U postgres phishguard_ai < phishguard_backup.sql
```

Backups should be stored separately from the production server.

---

## Rollback Procedure

If a deployment causes problems:

```bash
docker-compose -f backend/docker-compose.yml down
```

Checkout the previous stable version:

```bash
git checkout <previous-version>
```

Restart:

```bash
docker-compose -f backend/docker-compose.yml up -d
```

If required, restore the previous database backup.

---

## Post-Deployment Verification

Check the API health endpoint:

```bash
curl -f https://your-domain.com/health
```

Verify:

- PostgreSQL container is running.
- n8n is running.
- Phishing-analysis workflow is active.
- Webhook accepts requests.
- Chrome extension can communicate with the webhook.
- Gmail email extraction works.
- Analysis results appear correctly in the extension.

Once all checks pass, the PhishGuard AI deployment is ready for use.
