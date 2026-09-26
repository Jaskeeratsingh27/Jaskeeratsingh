$ErrorActionPreference = "Stop"

$MarketplaceName = "jaskeeratsingh-tools"
$Source = "Jaskeeratsingh27/Jaskeeratsingh"

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "Codex CLI is not installed or not on PATH. Install/open Codex first, then rerun this script."
}

Write-Host "Checking configured plugin marketplaces..."
$list = (& codex plugin marketplace list 2>&1 | Out-String)

if ($list -match [regex]::Escape($MarketplaceName)) {
    Write-Host "Marketplace already exists. Refreshing $MarketplaceName..."
    & codex plugin marketplace upgrade $MarketplaceName
    if ($LASTEXITCODE -ne 0) { throw "Marketplace refresh failed." }
} else {
    Write-Host "Adding GitHub marketplace $Source..."
    & codex plugin marketplace add $Source --ref main
    if ($LASTEXITCODE -ne 0) { throw "Marketplace add failed." }
}

Write-Host ""
Write-Host "Configured marketplaces:"
& codex plugin marketplace list
if ($LASTEXITCODE -ne 0) { throw "Could not verify marketplace list." }

Write-Host ""
Write-Host "Marketplace setup passed."
Write-Host "Next: restart ChatGPT desktop -> Plugins -> Jaskeeratsingh Tools -> install Personal Skill Library -> start a new regular ChatGPT chat."
