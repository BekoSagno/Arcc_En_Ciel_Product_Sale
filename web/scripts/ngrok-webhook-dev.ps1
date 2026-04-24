# Développement : exposer Next.js (port 3000) avec ngrok pour que Djomy appelle le webhook.
#
# ngrok peut être :
#   - à la racine du dossier web : web\ngrok.exe (pratique si vous avez extrait le ZIP là)
#   - ou dans le PATH (winget : Ngrok.Ngrok)
#
# Authtoken (une fois) : ngrok config add-authtoken VOTRE_TOKEN
#
# Étapes :
#   1. Terminal A : cd web ; npm run dev
#   2. Terminal B : cd web ; .\scripts\ngrok-webhook-dev.ps1
#   3. Copiez l’URL HTTPS affichée (ex. https://abc123.ngrok-free.app)
#   4. Dans web/.env.local : NEXT_PUBLIC_WEBHOOK_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
#   5. Redémarrez npm run dev ; dans /admin copiez l’URL webhook pour Djomy.

$ErrorActionPreference = "Stop"

$webRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$localExe = Join-Path $webRoot "ngrok.exe"

Write-Host ""
Write-Host "=== Arc en Ciel — ngrok vers localhost:3000 ===" -ForegroundColor Cyan
Write-Host "Assurez-vous que Next tourne déjà (npm run dev)." -ForegroundColor Yellow
Write-Host ""

if (Test-Path $localExe) {
  Write-Host "Utilisation de : $localExe" -ForegroundColor Green
  Push-Location $webRoot
  try {
    & $localExe http 3000
  } finally {
    Pop-Location
  }
  exit $LASTEXITCODE
}

$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokCmd) {
  Write-Host "Utilisation de ngrok (PATH) : $($ngrokCmd.Source)" -ForegroundColor Green
  & ngrok http 3000
  exit $LASTEXITCODE
}

Write-Host "ngrok introuvable." -ForegroundColor Red
Write-Host "  Option A : placez ngrok.exe à la racine du dossier web : $webRoot" -ForegroundColor Yellow
Write-Host "  Option B : winget install Ngrok.Ngrok puis rouvrez le terminal" -ForegroundColor Yellow
Write-Host "  Téléchargement : https://ngrok.com/download" -ForegroundColor Yellow
exit 1
