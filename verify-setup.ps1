# PhishGuard AI - Verification & Status Script
# Run this to check if everything is properly configured

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       PhishGuard AI - System Verification              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# ===== Check 1: Node.js =====
Write-Host "1️⃣  Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "      Download: https://nodejs.org/" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""

# ===== Check 2: PostgreSQL =====
Write-Host "2️⃣  Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>$null
    if ($?) {
        Write-Host "   ✅ PostgreSQL: $psqlVersion" -ForegroundColor Green
        
        # Try to connect
        $connection = psql -U phishguard -d phishguard_ai -c "SELECT 1;" 2>$null
        if ($?) {
            Write-Host "   ✅ Connected to database 'phishguard_ai'" -ForegroundColor Green
            
            # Check tables
            $tableCount = psql -U phishguard -d phishguard_ai -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
            Write-Host "   ✅ Database tables: $tableCount" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  Cannot connect to database 'phishguard_ai'" -ForegroundColor Yellow
            Write-Host "      Run: .\setup-database.ps1" -ForegroundColor Gray
            $allGood = $false
        }
    }
    else {
        Write-Host "   ❌ PostgreSQL not found!" -ForegroundColor Red
        Write-Host "      Download: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        $allGood = $false
    }
}
catch {
    Write-Host "   ❌ Error checking PostgreSQL: $_" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# ===== Check 3: n8n =====
Write-Host "3️⃣  Checking n8n..." -ForegroundColor Yellow
try {
    $n8nVersion = n8n --version 2>$null
    if ($?) {
        Write-Host "   ✅ n8n: $n8nVersion" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  n8n not installed globally" -ForegroundColor Yellow
        Write-Host "      Run: npm install -g n8n" -ForegroundColor Gray
        $allGood = $false
    }
}
catch {
    Write-Host "   ⚠️  n8n not found" -ForegroundColor Yellow
    Write-Host "      Run: npm install -g n8n" -ForegroundColor Gray
    $allGood = $false
}

# Check if n8n is running
Write-Host "   Checking if n8n is running on port 5678..." -ForegroundColor Gray
try {
    $response = curl -s -m 2 http://localhost:5678 2>$null
    if ($response) {
        Write-Host "   ✅ n8n is running" -ForegroundColor Green
    }
    else {
        Write-Host "   ℹ️  n8n is not running (this is OK if you haven't started it yet)" -ForegroundColor Cyan
        Write-Host "      Run: .\run-n8n.ps1" -ForegroundColor Gray
    }
}
catch {
    Write-Host "   ℹ️  n8n is not running (this is OK if you haven't started it yet)" -ForegroundColor Cyan
    Write-Host "      Run: .\run-n8n.ps1" -ForegroundColor Gray
}

Write-Host ""

# ===== Check 4: Project Files =====
Write-Host "4️⃣  Checking project files..." -ForegroundColor Yellow
$files = @(
    ".\extension\src\manifest.json",
    ".\extension\src\background.js",
    ".\extension\src\content.js",
    ".\backend\database\schema.sql",
    ".\backend\n8n-workflows\phishing-analysis-main.json"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# ===== Check 5: Extension =====
Write-Host "5️⃣  Checking Chrome Extension..." -ForegroundColor Yellow
$extDir = ".\extension\src"
if (Test-Path $extDir) {
    $files = Get-ChildItem $extDir -Filter "*.js", "*.html", "*.css", "*.json"
    Write-Host "   ✅ Extension folder: $($files.Count) files" -ForegroundColor Green
    
    if (Test-Path ".\extension\src\manifest.json") {
        Write-Host "   ✅ manifest.json found" -ForegroundColor Green
    }
}
else {
    Write-Host "   ❌ Extension folder not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($allGood) {
    Write-Host ""
    Write-Host "✅ All systems ready! Next steps:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   1. Start n8n:" -ForegroundColor Cyan
    Write-Host "      .\run-n8n.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "   2. Import workflow at: http://localhost:5678" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   3. Load extension in Chrome:" -ForegroundColor Cyan
    Write-Host "      chrome://extensions → Load unpacked → select 'extension/src'" -ForegroundColor White
    Write-Host ""
    Write-Host "   4. Test in Gmail: https://mail.google.com" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "⚠️  Some components need setup. Follow the instructions above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📚 Full guide: MANUAL_SETUP.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
