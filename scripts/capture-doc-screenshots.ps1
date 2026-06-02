param(
  [string]$BaseUrl = "http://127.0.0.1:5173"
)

$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path -LiteralPath $chrome)) {
  throw "Chrome was not found at $chrome"
}

$root = Split-Path -Parent $PSScriptRoot
$docsRoot = Join-Path $root "docs"
$figuresRoot = Get-ChildItem -LiteralPath $docsRoot -Directory |
  ForEach-Object { Join-Path $_.FullName "figures" } |
  Where-Object { Test-Path -LiteralPath $_ } |
  Select-Object -First 1
if (-not $figuresRoot) {
  throw "Could not locate the documentation figures directory under $docsRoot"
}
$output = Join-Path $figuresRoot "screenshots"
New-Item -ItemType Directory -Force -Path $output | Out-Null

$pages = [ordered]@{
  "portal-overview"     = "/intro/overview"
  "tourist-home"        = "/tourist/home"
  "tourist-chat"        = "/tourist/chat"
  "tourist-voice"       = "/tourist/voice"
  "tourist-image"       = "/tourist/image"
  "tourist-routes"      = "/tourist/routes"
  "student-home"        = "/student/home"
  "student-scenarios"   = "/student/scenarios"
  "student-training"    = "/student/training"
  "student-reports"     = "/student/reports"
  "guide-dashboard"     = "/guide/dashboard"
  "guide-sessions"      = "/guide/sessions"
  "guide-takeover"      = "/guide/takeover"
  "guide-corrections"   = "/guide/corrections"
  "system-dashboard"    = "/system/dashboard"
  "system-users"        = "/system/users"
  "knowledge-documents" = "/knowledge/documents"
  "knowledge-review"    = "/knowledge/review"
  "knowledge-terms"     = "/knowledge/terms"
  "knowledge-graph"     = "/knowledge/graph"
  "system-logs"         = "/system/logs"
  "system-health"       = "/system/health"
}

foreach ($name in $pages.Keys) {
  $target = Join-Path $output "$name.png"
  $url = "$BaseUrl$($pages[$name])"
  Write-Host "Capturing $name from $url"
  & $chrome `
    --headless `
    --disable-gpu `
    --hide-scrollbars `
    --disable-extensions `
    --disable-background-networking `
    --run-all-compositor-stages-before-draw `
    --virtual-time-budget=3500 `
    --window-size=1600,1100 `
    "--screenshot=$target" `
    $url | Out-Null
  if (-not (Test-Path -LiteralPath $target)) {
    throw "Screenshot was not created: $target"
  }
}

Write-Host "Captured $($pages.Count) screenshots in $output"
