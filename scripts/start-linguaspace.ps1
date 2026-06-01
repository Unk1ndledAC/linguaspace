$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root ".runtime"
New-Item -ItemType Directory -Force $runtime | Out-Null

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

if (-not (Test-Path (Join-Path $root "backend\\.venv\\Scripts\\python.exe"))) {
  python -m venv (Join-Path $root "backend\\.venv")
}
$python = Join-Path $root "backend\\.venv\\Scripts\\python.exe"
& $python -m pip install -q -r (Join-Path $root "backend\\requirements.txt")
if ($env:ENABLE_SERVER_ASR -eq "true") {
  & $python -m pip install -q -r (Join-Path $root "backend\\requirements-asr.txt")
}
if ($env:ENABLE_INFRA_ADAPTERS -eq "true") {
  & $python -m pip install -q -r (Join-Path $root "backend\\requirements-infra.txt")
}
try {
  & $python (Join-Path $root "scripts\\bootstrap_mysql.py")
} catch {
  Write-Host "MySQL bootstrap skipped: $($_.Exception.Message)"
}

$api = Start-Process $python -ArgumentList "-m","uvicorn","app.main:app","--host","0.0.0.0","--port","8000" -WorkingDirectory (Join-Path $root "backend") -WindowStyle Hidden -PassThru
$api.Id | Set-Content (Join-Path $runtime "api.pid")

Push-Location (Join-Path $root "frontend")
if (-not (Test-Path "node_modules")) { npm install }
$web = Start-Process "npm.cmd" -ArgumentList "run","dev","--","--host","0.0.0.0","--port","5173" -WorkingDirectory (Join-Path $root "frontend") -WindowStyle Hidden -PassThru
$web.Id | Set-Content (Join-Path $runtime "web.pid")
Pop-Location

Write-Host "LinguaSpace started"
Write-Host "Brand page: http://localhost:5173"
Write-Host "API health: http://localhost:8000/api/health"
