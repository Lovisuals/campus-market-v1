# 🔐 Security Token Generator
# Run this script to generate secure random tokens for JWT_SECRET and ENCRYPTION_KEY

Write-Host "🔐 Generating Secure Tokens for Campus Market P2P" -ForegroundColor Cyan
Write-Host "=" * 60

# Generate JWT Secret (32 bytes = 44 characters base64)
$jwtBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)

Write-Host "`n✅ JWT_SECRET (copy this to .env.local):" -ForegroundColor Green
Write-Host $jwtSecret -ForegroundColor Yellow

# Generate Encryption Key (32 bytes = 44 characters base64)
$encBytes = New-Object byte[] 32
$rng.GetBytes($encBytes)
$encKey = [Convert]::ToBase64String($encBytes)

Write-Host "`n✅ ENCRYPTION_KEY (copy this to .env.local):" -ForegroundColor Green
Write-Host $encKey -ForegroundColor Yellow

Write-Host "`n" + ("=" * 60)
Write-Host "⚠️  IMPORTANT: Keep these tokens secret and never commit to Git!" -ForegroundColor Red
Write-Host "⚠️  Save these in a password manager (1Password, Bitwarden, etc.)" -ForegroundColor Red

# Optionally copy to clipboard
Write-Host "`n📋 JWT_SECRET copied to clipboard (paste into .env.local)" -ForegroundColor Cyan
Set-Clipboard -Value $jwtSecret

Read-Host "`nPress Enter to copy ENCRYPTION_KEY to clipboard"
Set-Clipboard -Value $encKey
Write-Host "📋 ENCRYPTION_KEY copied to clipboard (paste into .env.local)" -ForegroundColor Cyan
