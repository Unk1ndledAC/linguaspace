$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root ".runtime"
New-Item -ItemType Directory -Force $runtime | Out-Null
$backendOut = Join-Path $runtime "backend.out.log"
$backendErr = Join-Path $runtime "backend.err.log"
$frontendOut = Join-Path $runtime "frontend.out.log"
$frontendErr = Join-Path $runtime "frontend.err.log"

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($name, "Process"))) {
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
      }
    }
  }
}

if ([string]::IsNullOrWhiteSpace($env:MYSQL_PORT)) { $env:MYSQL_PORT = "3307" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_URL)) { $env:MYSQL_URL = "mysql+pymysql://linguaspace:linguaspace@127.0.0.1:$($env:MYSQL_PORT)/linguaspace" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_HOST)) { $env:MYSQL_HOST = "127.0.0.1" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_USER)) { $env:MYSQL_USER = "linguaspace" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_PASSWORD)) { $env:MYSQL_PASSWORD = "linguaspace" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_DATABASE)) { $env:MYSQL_DATABASE = "linguaspace" }
if ([string]::IsNullOrWhiteSpace($env:MYSQL_ROOT_PASSWORD)) { $env:MYSQL_ROOT_PASSWORD = "linguaspace-root" }

function Test-CommandExists($command) {
  return $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
}

function Get-FreePort($startPort, $endPort) {
  for ($port = $startPort; $port -le $endPort; $port++) {
    $inUse = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if (-not $inUse) {
      return $port
    }
  }
  throw "No free port found between ${startPort} and ${endPort}."
}

function Wait-Tcp($name, $hostName, $port, $timeoutSeconds = 90) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $async = $client.BeginConnect($hostName, $port, $null, $null)
      if ($async.AsyncWaitHandle.WaitOne(1000, $false)) {
        $client.EndConnect($async)
        $client.Close()
        Write-Host "$name ready at ${hostName}:${port}"
        return
      }
      $client.Close()
    } catch {}
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  throw "$name is not ready at ${hostName}:${port}"
}

function Wait-Ollama($timeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  do {
    try {
      Invoke-RestMethod -Uri "$($env:OLLAMA_BASE_URL -replace '/$','')/api/tags" -TimeoutSec 5 | Out-Null
      Write-Host "Ollama ready at ${env:OLLAMA_BASE_URL}"
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)
  throw "Ollama is not ready at ${env:OLLAMA_BASE_URL}"
}

function Assert-OllamaModel($model) {
  if ([string]::IsNullOrWhiteSpace($model)) { return }
  $tags = Invoke-RestMethod -Uri "$($env:OLLAMA_BASE_URL -replace '/$','')/api/tags" -TimeoutSec 5
  $available = @($tags.models | ForEach-Object { $_.name })
  if ($available -notcontains $model) {
    throw "Ollama model '$model' is not installed. Run: ollama pull $model"
  }
}

function Test-MySqlAppAccount {
  $python = Join-Path $root "backend\.venv\Scripts\python.exe"
  if (-not (Test-Path $python)) { return $false }
  $probe = @"
import os
import pymysql
connection = pymysql.connect(
    host=os.environ["MYSQL_HOST"],
    port=int(os.environ["MYSQL_PORT"]),
    user=os.environ["MYSQL_USER"],
    password=os.environ["MYSQL_PASSWORD"],
    database=os.environ["MYSQL_DATABASE"],
    connect_timeout=3,
)
with connection, connection.cursor() as cursor:
    cursor.execute("SELECT 1")
"@
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $probe | & $python - *> $null
    return $LASTEXITCODE -eq 0
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

if (-not (Test-CommandExists "docker")) { throw "Docker is required for LinguaSpace acceptance startup." }
if (-not (Test-CommandExists "ollama")) { throw "Ollama is required for LinguaSpace acceptance startup." }
if ([string]::IsNullOrWhiteSpace($env:OLLAMA_BASE_URL)) { $env:OLLAMA_BASE_URL = "http://127.0.0.1:11434" }
if ([string]::IsNullOrWhiteSpace($env:OLLAMA_MODEL)) { $env:OLLAMA_MODEL = "qwen3.5:9b" }
if ([string]::IsNullOrWhiteSpace($env:OLLAMA_VISION_MODEL)) { $env:OLLAMA_VISION_MODEL = "qwen3-vl:4b" }

Write-Host "Starting Docker infrastructure..."
& docker compose -f (Join-Path $root "docker-compose.yml") up -d --wait

Wait-Tcp "MySQL" "127.0.0.1" ([int]$env:MYSQL_PORT)
Wait-Tcp "PostgreSQL/pgvector" "127.0.0.1" 5432
Wait-Tcp "Redis" "127.0.0.1" 6379
Wait-Tcp "MinIO" "127.0.0.1" 9000
Wait-Tcp "Neo4j" "127.0.0.1" 7687
Wait-Ollama
Assert-OllamaModel $env:OLLAMA_MODEL
Assert-OllamaModel $env:OLLAMA_VISION_MODEL

$compose = Join-Path $root "docker-compose.yml"
$alterSql = "ALTER USER '$($env:MYSQL_USER)'@'%' IDENTIFIED WITH mysql_native_password BY '$($env:MYSQL_PASSWORD)'; FLUSH PRIVILEGES;"
if (Test-MySqlAppAccount) {
  Write-Host "MySQL application account is ready"
} else {
  Write-Host "MySQL application account needs repair; trying root credentials..."
  $exitCode = 0
  if ([string]::IsNullOrWhiteSpace($env:MYSQL_ROOT_PASSWORD)) {
    & docker compose -f $compose exec -T mysql mysql -uroot -e $alterSql
    $exitCode = $LASTEXITCODE
  } else {
    & docker compose -f $compose exec -T mysql mysql -uroot -p$env:MYSQL_ROOT_PASSWORD -e $alterSql
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      & docker compose -f $compose exec -T mysql mysql -uroot -e $alterSql
      $exitCode = $LASTEXITCODE
    }
  }
  if ($exitCode -ne 0 -or -not (Test-MySqlAppAccount)) {
    throw "MySQL application account '$($env:MYSQL_USER)' is unavailable and automatic repair failed. Set MYSQL_ROOT_PASSWORD and retry."
  }
}

if (-not (Test-Path (Join-Path $root "backend\.venv\Scripts\python.exe"))) {
  python -m venv (Join-Path $root "backend\.venv")
}
$python = Join-Path $root "backend\.venv\Scripts\python.exe"
& $python -m pip install -q -r (Join-Path $root "backend\requirements.txt")
& $python -m pip install -q -r (Join-Path $root "backend\requirements-infra.txt")
& $python -m pip install -q -r (Join-Path $root "backend\requirements-asr.txt")
& $python (Join-Path $root "scripts\bootstrap_mysql.py")

$api = Start-Process $python -ArgumentList "-m","uvicorn","app.main:app","--host","0.0.0.0","--port","8000" -WorkingDirectory (Join-Path $root "backend") -WindowStyle Hidden -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr -PassThru
$api.Id | Set-Content (Join-Path $runtime "api.pid")

Push-Location (Join-Path $root "frontend")
if (-not (Test-Path "node_modules")) { npm install }
$webPort = Get-FreePort 5173 5190
$web = Start-Process "npm.cmd" -ArgumentList "run","dev","--","--host","0.0.0.0","--port","$webPort" -WorkingDirectory (Join-Path $root "frontend") -WindowStyle Hidden -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr -PassThru
$web.Id | Set-Content (Join-Path $runtime "web.pid")
Pop-Location

Write-Host "LinguaSpace started with required Docker infrastructure and Ollama models"
Write-Host "Brand page: http://localhost:$webPort"
Write-Host "API health: http://localhost:8000/api/health"
