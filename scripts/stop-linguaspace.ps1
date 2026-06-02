$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root ".runtime"
foreach ($name in "api.pid","web.pid") {
  $path = Join-Path $runtime $name
  if (Test-Path $path) {
    $pidValue = Get-Content $path
    Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
    Remove-Item $path -Force
  }
}

# npm.cmd may exit before its Vite child. Clear only LinguaSpace's standard
# development ports so a subsequent start is deterministic.
foreach ($port in (@(8000) + (5173..5190))) {
  Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

& docker compose -f (Join-Path $root "docker-compose.yml") down
Write-Host "LinguaSpace stopped, Docker infrastructure stopped"
