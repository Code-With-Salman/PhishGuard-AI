# PhishGuard AI - Database Setup Script
# This script creates PostgreSQL database and user automatically

Write-Host "🚀 PhishGuard AI - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$postgresUser = "postgres"
$postgresPassword = "postgres"  # Change this to your PostgreSQL admin password!
$phishguardUser = "phishguard"
$phishguardPassword = "secure_password_123"
$databaseName = "phishguard_ai"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  PostgreSQL Admin: $postgresUser"
Write-Host "  PhishGuard User: $phishguardUser"
Write-Host "  Database: $databaseName"
Write-Host ""

# Check if psql is available
Write-Host "🔍 Checking PostgreSQL installation..." -ForegroundColor Cyan
try {
    $psqlVersion = psql --version 2>$null
    if ($?) {
        Write-Host "✅ PostgreSQL found: $psqlVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL not found. Please install PostgreSQL 14+" -ForegroundColor Red
        Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ Error checking PostgreSQL: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Creating database and user..." -ForegroundColor Cyan

# Check if user already exists
$userExists = psql -U $postgresUser -t -c "SELECT 1 FROM pg_user WHERE usename = '$phishguardUser';" 2>$null
if ($userExists -match "1") {
    Write-Host "⚠️  User '$phishguardUser' already exists. Skipping user creation." -ForegroundColor Yellow
} else {
    # Create user
    try {
        psql -U $postgresUser -c "CREATE USER $phishguardUser WITH PASSWORD '$phishguardPassword';" 2>$null
        if ($?) {
            Write-Host "✅ User created: $phishguardUser" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  Could not create user (may already exist)" -ForegroundColor Yellow
    }
}

# Grant privileges
try {
    psql -U $postgresUser -c "ALTER ROLE $phishguardUser WITH CREATEDB;" 2>$null
    Write-Host "✅ Privileges granted" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Error granting privileges" -ForegroundColor Yellow
}

# Check if database already exists
$dbExists = psql -U $postgresUser -t -c "SELECT 1 FROM pg_database WHERE datname = '$databaseName';" 2>$null
if ($dbExists -match "1") {
    Write-Host "⚠️  Database '$databaseName' already exists. Skipping database creation." -ForegroundColor Yellow
} else {
    # Create database
    try {
        psql -U $postgresUser -c "CREATE DATABASE $databaseName OWNER $phishguardUser;" 2>$null
        if ($?) {
            Write-Host "✅ Database created: $databaseName" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Error creating database: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Applying database schema..." -ForegroundColor Cyan

$schemaFile = ".\backend\database\schema.sql"
if (Test-Path $schemaFile) {
    try {
        psql -U $phishguardUser -d $databaseName -f $schemaFile 2>$null
        if ($?) {
            Write-Host "✅ Schema applied successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Some schema statements may have failed (tables may already exist)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Error applying schema: $_" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Install n8n: npm install -g n8n"
Write-Host "  2. Run n8n: .\run-n8n.ps1"
Write-Host "  3. Open browser: http://localhost:5678"
Write-Host "  4. Import workflow: backend/n8n-workflows/phishing-analysis-main.json"
Write-Host "  5. Load extension in Chrome: chrome://extensions (unpacked)"
Write-Host ""
Write-Host "💡 Connection String: postgresql://$phishguardUser:$phishguardPassword@localhost:5432/$databaseName" -ForegroundColor Cyan

