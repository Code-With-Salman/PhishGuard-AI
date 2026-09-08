# PhishGuard AI - Run n8n Script
# This script starts n8n with PostgreSQL backend

Write-Host "🚀 PhishGuard AI - Starting n8n" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$n8nPort = 5678
$postgresHost = "localhost"
$postgresPort = 5432
$postgresUser = "phishguard"
$postgresPassword = "secure_password_123"
$postgresDatabase = "phishguard_ai"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  n8n Port: $n8nPort"
Write-Host "  PostgreSQL: $postgresHost:$postgresPort/$postgresDatabase"
Write-Host "  n8n URL: http://localhost:$n8nPort"
Write-Host "  Username: admin"
Write-Host "  Password: admin123"
Write-Host ""

# Check if n8n is installed
Write-Host "🔍 Checking n8n installation..." -ForegroundColor Cyan
try {
    $n8nVersion = n8n --version 2>$null
    if ($?) {
        Write-Host "✅ n8n found: $n8nVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ n8n not found globally. Installing now..." -ForegroundColor Yellow
        Write-Host ""
        npm install -g n8n
        if ($?) {
            Write-Host "✅ n8n installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install n8n" -ForegroundColor Red
            exit 1
        }
    }
}
catch {
    Write-Host "⚠️  Could not verify n8n installation, attempting to start anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Verifying PostgreSQL connection..." -ForegroundColor Cyan
try {
    $pgConnection = psql -U $postgresUser -d $postgresDatabase -c "SELECT version();" 2>$null
    if ($?) {
        Write-Host "✅ Connected to PostgreSQL" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot connect to PostgreSQL. Make sure:" -ForegroundColor Red
        Write-Host "   1. PostgreSQL is installed and running"
        Write-Host "   2. Database '$postgresDatabase' exists"
        Write-Host "   3. User '$postgresUser' exists with correct password"
        Write-Host ""
        Write-Host "   Run first: .\setup-database.ps1" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "⚠️  Could not verify PostgreSQL, will attempt to start n8n anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Starting n8n..." -ForegroundColor Cyan
Write-Host "   (This may take 30-60 seconds...)" -ForegroundColor Gray
Write-Host ""
Write-Host "   When you see 'n8n ready on 0.0.0.0:5678', open:" -ForegroundColor Cyan
Write-Host "   http://localhost:$n8nPort" -ForegroundColor Green
Write-Host ""
Write-Host "   Press Ctrl+C to stop n8n" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start n8n with PostgreSQL backend
& n8n `
  --db=postgresdb `
  --dbPostgresHost=$postgresHost `
  --dbPostgresPort=$postgresPort `
  --dbPostgresUser=$postgresUser `
  --dbPostgresPassword=$postgresPassword `
  --dbPostgresDatabase=$postgresDatabase `
  --port=$n8nPort

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ n8n stopped" -ForegroundColor Green

