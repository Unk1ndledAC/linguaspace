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
Write-Host "LinguaSpace stopped"
