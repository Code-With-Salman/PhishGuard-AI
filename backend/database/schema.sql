-- PhishGuard AI - PostgreSQL Database Schema
-- Version: 1.0
-- Created: 2026-06-07

-- ============================================================================
-- TABLE: email_analyses
-- Purpose: Store main phishing analysis results
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_analyses (
    id BIGSERIAL PRIMARY KEY,
    
    -- Email Metadata
    email_message_id VARCHAR(500) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Sender Information
    sender_name VARCHAR(255),
    sender_email VARCHAR(255) NOT NULL,
    sender_domain VARCHAR(255) NOT NULL,
    
    -- Email Content
    subject VARCHAR(500),
    subject_hash VARCHAR(64),
    body_preview TEXT,
    body_hash VARCHAR(64),
    
    -- Email Structure
    recipient_email VARCHAR(255),
    cc_recipients TEXT,
    bcc_recipients TEXT,
    is_reply BOOLEAN DEFAULT FALSE,
    is_forwarded BOOLEAN DEFAULT FALSE,
    
    -- Risk Assessment
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')),
    
    -- Detailed Risk Breakdown
    sender_risk INTEGER CHECK (sender_risk >= 0 AND sender_risk <= 25),
    content_risk INTEGER CHECK (content_risk >= 0 AND content_risk <= 25),
    url_risk INTEGER CHECK (url_risk >= 0 AND url_risk <= 25),
    attachment_risk INTEGER CHECK (attachment_risk >= 0 AND attachment_risk <= 15),
    auth_risk INTEGER CHECK (auth_risk >= 0 AND auth_risk <= 10),
    
    -- Analysis Findings
    findings JSONB,
    recommendations TEXT[],
    summary TEXT,
    
    -- URLs and Attachments
    url_count INTEGER DEFAULT 0,
    attachment_count INTEGER DEFAULT 0,
    suspicious_urls TEXT[],
    attachment_names TEXT[],
    
    -- Email Headers
    spf_status VARCHAR(20),
    dkim_status VARCHAR(20),
    dmarc_status VARCHAR(20),
    message_id VARCHAR(500),
    original_date TIMESTAMP,
    
    -- User Actions & Feedback
    user_verdict VARCHAR(50),
    user_feedback TEXT,
    is_whitelisted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(email_message_id, user_email)
);

-- ============================================================================
-- TABLE: email_senders
-- Purpose: Track sender reputation and history
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_senders (
    id SERIAL PRIMARY KEY,
    
    sender_email VARCHAR(255) UNIQUE NOT NULL,
    sender_domain VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    
    -- Reputation Metrics
    total_emails_received INTEGER DEFAULT 0,
    phishing_count INTEGER DEFAULT 0,
    legitimate_count INTEGER DEFAULT 0,
    suspicious_count INTEGER DEFAULT 0,
    user_whitelisted BOOLEAN DEFAULT FALSE,
    
    -- Domain Info
    domain_registration_date DATE,
    domain_age_days INTEGER,
    is_known_brand BOOLEAN DEFAULT FALSE,
    brand_name VARCHAR(255),
    
    -- Authentication
    has_spf BOOLEAN DEFAULT FALSE,
    has_dkim BOOLEAN DEFAULT FALSE,
    has_dmarc BOOLEAN DEFAULT FALSE,
    
    -- Threat Intelligence
    is_in_blacklist BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    threat_level VARCHAR(20),
    
    -- Metadata
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confidence_score NUMERIC(3, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: analyzed_urls
-- Purpose: Cache URL analysis results
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyzed_urls (
    id SERIAL PRIMARY KEY,
    
    url TEXT NOT NULL,
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    
    -- URL Analysis Results
    domain VARCHAR(255),
    is_shortened BOOLEAN DEFAULT FALSE,
    is_ip_based BOOLEAN DEFAULT FALSE,
    ip_address INET,
    
    -- Threat Assessment
    is_suspicious BOOLEAN DEFAULT FALSE,
    threat_indicators TEXT[],
    
    -- Domain Analysis
    domain_reputation VARCHAR(50),
    domain_registrar VARCHAR(255),
    domain_registration_date DATE,
    domain_age_days INTEGER,
    
    -- Typosquatting Analysis
    typosquatting_detected BOOLEAN DEFAULT FALSE,
    similar_domains TEXT[],
    
    -- Phishing Indicators
    typosquatting_score NUMERIC(3, 2),
    credential_harvesting_score NUMERIC(3, 2),
    
    -- Cache Management
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(url_hash)
);

-- ============================================================================
-- TABLE: url_analysis_details
-- Purpose: Store detailed findings for each URL
-- ============================================================================
CREATE TABLE IF NOT EXISTS url_analysis_details (
    id SERIAL PRIMARY KEY,
    
    analyzed_url_id INTEGER NOT NULL REFERENCES analyzed_urls(id) ON DELETE CASCADE,
    email_analysis_id BIGINT REFERENCES email_analyses(id) ON DELETE CASCADE,
    
    -- URL Context
    anchor_text VARCHAR(500),
    actual_url TEXT,
    url_mismatch BOOLEAN DEFAULT FALSE,
    
    -- Analysis Data
    redirect_chain TEXT[],
    redirect_count INTEGER DEFAULT 0,
    final_destination_url TEXT,
    
    -- Findings
    is_malicious BOOLEAN DEFAULT FALSE,
    finding_type VARCHAR(100),
    finding_details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: attachment_analysis
-- Purpose: Store attachment risk assessment
-- ============================================================================
CREATE TABLE IF NOT EXISTS attachment_analysis (
    id SERIAL PRIMARY KEY,
    
    email_analysis_id BIGINT NOT NULL REFERENCES email_analyses(id) ON DELETE CASCADE,
    
    -- File Information
    file_name VARCHAR(500) NOT NULL,
    file_extension VARCHAR(50),
    file_size BIGINT,
    file_hash VARCHAR(64),
    
    -- Risk Assessment
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_indicators TEXT[],
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- File Type Analysis
    file_type_category VARCHAR(100),
    has_macro BOOLEAN DEFAULT FALSE,
    contains_obfuscated_code BOOLEAN DEFAULT FALSE,
    
    -- Known Threats
    is_known_malware BOOLEAN DEFAULT FALSE,
    malware_name VARCHAR(255),
    malware_family VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: whitelisted_senders
-- Purpose: User-whitelisted senders
-- ============================================================================
CREATE TABLE IF NOT EXISTS whitelisted_senders (
    id SERIAL PRIMARY KEY,
    
    user_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(500),
    
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_email, sender_email)
);

-- ============================================================================
-- TABLE: user_settings
-- Purpose: Store user preferences and configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    
    user_email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Analysis Preferences
    enable_analysis BOOLEAN DEFAULT TRUE,
    include_body_analysis BOOLEAN DEFAULT TRUE,
    include_attachment_analysis BOOLEAN DEFAULT TRUE,
    sensitivity_level VARCHAR(20) CHECK (sensitivity_level IN ('LOW', 'MEDIUM', 'HIGH')),
    
    -- Notification Preferences
    notify_high_risk BOOLEAN DEFAULT TRUE,
    notify_suspicious BOOLEAN DEFAULT FALSE,
    notification_method VARCHAR(50),
    
    -- Data Preferences
    auto_report_phishing BOOLEAN DEFAULT TRUE,
    share_telemetry BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 90,
    
    -- API Configuration
    api_key VARCHAR(255),
    
    -- UI Preferences
    theme VARCHAR(20) DEFAULT 'auto',
    language VARCHAR(10) DEFAULT 'en',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: analysis_cache
-- Purpose: Cache analysis results for identical emails
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_cache (
    id SERIAL PRIMARY KEY,
    
    body_hash VARCHAR(64) UNIQUE NOT NULL,
    subject_hash VARCHAR(64),
    sender_domain VARCHAR(255),
    
    cached_analysis JSONB NOT NULL,
    risk_score INTEGER,
    risk_level VARCHAR(20),
    
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(body_hash, sender_domain)
);

-- ============================================================================
-- TABLE: analysis_audit_log
-- Purpose: Audit trail for compliance and troubleshooting
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    email_analysis_id BIGINT REFERENCES email_analyses(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    
    action VARCHAR(100) NOT NULL,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_details JSONB,
    
    error_message TEXT,
    error_stack_trace TEXT,
    
    execution_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: content_analysis_findings
-- Purpose: Detailed content analysis results
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_analysis_findings (
    id SERIAL PRIMARY KEY,
    
    email_analysis_id BIGINT NOT NULL REFERENCES email_analyses(id) ON DELETE CASCADE,
    
    finding_category VARCHAR(100),
    finding_type VARCHAR(100),
    finding_description TEXT,
    finding_confidence NUMERIC(3, 2),
    
    evidence_text TEXT,
    finding_position INTEGER,
    
    risk_contribution INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_email_analyses_user_email ON email_analyses(user_email);
CREATE INDEX idx_email_analyses_sender_email ON email_analyses(sender_email);
CREATE INDEX idx_email_analyses_risk_score ON email_analyses(risk_score);
CREATE INDEX idx_email_analyses_risk_level ON email_analyses(risk_level);
CREATE INDEX idx_email_analyses_timestamp ON email_analyses(analysis_timestamp DESC);
CREATE INDEX idx_email_analyses_created_at ON email_analyses(created_at DESC);
CREATE INDEX idx_email_analyses_verdict ON email_analyses(user_verdict);

CREATE INDEX idx_email_senders_domain ON email_senders(sender_domain);
CREATE INDEX idx_email_senders_threat_level ON email_senders(threat_level);
CREATE INDEX idx_email_senders_blacklist ON email_senders(is_in_blacklist);

CREATE INDEX idx_analyzed_urls_domain ON analyzed_urls(domain);
CREATE INDEX idx_analyzed_urls_suspicious ON analyzed_urls(is_suspicious);
CREATE INDEX idx_analyzed_urls_threat_reputation ON analyzed_urls(domain_reputation);

CREATE INDEX idx_attachment_analysis_email_id ON attachment_analysis(email_analysis_id);
CREATE INDEX idx_attachment_analysis_risk ON attachment_analysis(risk_score);

CREATE INDEX idx_whitelisted_senders_user ON whitelisted_senders(user_email);
CREATE INDEX idx_whitelisted_senders_active ON whitelisted_senders(user_email, is_active);

CREATE INDEX idx_user_settings_email ON user_settings(user_email);

CREATE INDEX idx_analysis_cache_expires ON analysis_cache(expires_at);
CREATE INDEX idx_analysis_cache_hash ON analysis_cache(body_hash);

CREATE INDEX idx_audit_log_email_id ON analysis_audit_log(email_analysis_id);
CREATE INDEX idx_audit_log_timestamp ON analysis_audit_log(action_timestamp DESC);

CREATE INDEX idx_content_findings_email_id ON content_analysis_findings(email_analysis_id);
CREATE INDEX idx_content_findings_category ON content_analysis_findings(finding_category);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW high_risk_emails_by_user AS
SELECT 
    user_email,
    COUNT(*) as high_risk_count,
    MAX(analysis_timestamp) as most_recent
FROM email_analyses
WHERE risk_level = 'HIGH_RISK'
AND analysis_timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY high_risk_count DESC;

CREATE OR REPLACE VIEW sender_reputation_summary AS
SELECT 
    sender_email,
    sender_domain,
    total_emails_received,
    ROUND(
        (
            CASE
                WHEN total_emails_received > 0
                THEN (phishing_count::numeric / total_emails_received * 100)
                ELSE 0
            END
        ),
        2
    ) AS phishing_percentage,
    threat_level,
    is_in_blacklist
FROM email_senders
ORDER BY phishing_percentage DESC;

CREATE OR REPLACE VIEW recent_suspicious_domains AS
SELECT 
    domain,
    COUNT(*) as occurrence_count,
    domain_reputation,
    MAX(last_checked) as last_checked,
    ARRAY_AGG(DISTINCT url) as sample_urls
FROM analyzed_urls
WHERE is_suspicious = TRUE
GROUP BY domain, domain_reputation
ORDER BY occurrence_count DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_email_analyses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER email_analyses_updated_at_trigger
BEFORE UPDATE ON email_analyses
FOR EACH ROW
EXECUTE FUNCTION update_email_analyses_timestamp();

CREATE TRIGGER email_senders_updated_at_trigger
BEFORE UPDATE ON email_senders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER analyzed_urls_updated_at_trigger
BEFORE UPDATE ON analyzed_urls
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_settings_updated_at_trigger
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER whitelisted_senders_updated_at_trigger
BEFORE UPDATE ON whitelisted_senders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_analyses IS 'Main table storing all email analysis results and risk assessments';
COMMENT ON TABLE email_senders IS 'Sender reputation tracking and history';
COMMENT ON TABLE analyzed_urls IS 'Cached URL analysis results for performance';
COMMENT ON TABLE attachment_analysis IS 'Detailed attachment risk assessment';
COMMENT ON TABLE whitelisted_senders IS 'User-trusted senders (whitelist)';
COMMENT ON TABLE user_settings IS 'User preferences and configuration settings';

COMMENT ON COLUMN email_analyses.risk_score IS
'Total risk score 0-100 (0=Safe, 100=High Risk)';

COMMENT ON COLUMN email_analyses.findings IS
'JSON containing detailed findings from all analysis agents';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
