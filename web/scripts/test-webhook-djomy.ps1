# Simule l'appel HTTP que Djomy ferait sur /api/webhooks/djomy (paiement réussi).
# Prérequis : npm run dev, .env.local avec SUPABASE_SERVICE_ROLE_KEY (+ RESEND_API_KEY pour l'email),
#             NEXT_PUBLIC_SITE_URL cohérent, et un produit publié dont le slug correspond à -Slug.
#
# Configuration réelle Djomy : collez dans leur back-office l'URL affichée dans le tableau de bord admin
# (carte « Webhook Djomy »), ou : https://<votre-domaine>/api/webhooks/djomy
#
# Usage :
#   .\scripts\test-webhook-djomy.ps1
#   .\scripts\test-webhook-djomy.ps1 -Slug "mon-produit" -CustomerEmail "moi@email.com"
#   .\scripts\test-webhook-djomy.ps1 -BaseUrl "https://ton-app.vercel.app"

param(
  [string] $BaseUrl = "http://localhost:3000",
  [string] $Slug = "REMPLACE_PAR_TON_SLUG",
  [string] $CustomerEmail = "REMPLACE_PAR_TON_EMAIL",
  [string] $CustomerName = "Test webhook",
  [int] $Amount = 1000,
  [string] $Currency = "GNF",
  [string] $TransactionId = ""
)

if ($Slug -eq "REMPLACE_PAR_TON_SLUG" -or $CustomerEmail -eq "REMPLACE_PAR_TON_EMAIL") {
  Write-Host "Édite les paramètres -Slug et -CustomerEmail (ou modifie les valeurs par défaut en haut du script)." -ForegroundColor Yellow
  exit 1
}

if (-not $TransactionId) {
  $TransactionId = "test-wh-{0}" -f ([Guid]::NewGuid().ToString("N").Substring(0, 12))
}

$payload = @{
  status           = "completed"
  transaction_id   = $TransactionId
  amount           = $Amount
  currency         = $Currency
  customer         = @{
    email = $CustomerEmail
    name  = $CustomerName
  }
  metadata         = @{
    slug = $Slug
  }
} | ConvertTo-Json -Depth 5

$uri = "{0}/api/webhooks/djomy" -f ($BaseUrl.TrimEnd("/"))
Write-Host "POST $uri" -ForegroundColor Cyan
Write-Host $payload

try {
  $res = Invoke-RestMethod -Method Post -Uri $uri -Body $payload -ContentType "application/json; charset=utf-8"
  Write-Host "Réponse :" -ForegroundColor Green
  $res | ConvertTo-Json
  Write-Host "`nÀ vérifier : Supabase → table sales (is_delivered, delivery_error) + boîte $CustomerEmail" -ForegroundColor Green
} catch {
  Write-Host "Erreur : $_" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  }
  exit 1
}
