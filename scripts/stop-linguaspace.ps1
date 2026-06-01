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
& docker compose -f (Join-Path $root "docker-compose.yml") down
Write-Host "LinguaSpace stopped, Docker infrastructure stopped"
