# Fix the secret in commit 2137575
$commitToFix = "2137575"
$parentCommit = git rev-parse "$commitToFix^"

# Checkout the problematic commit
git checkout $commitToFix

# Fix the .env.example file
if (Test-Path .env.example) {
    $content = Get-Content .env.example -Raw
    $content = $content -replace 'sk_live_x+', 'your_paystack_secret_key_here'
    $content = $content -replace 'pk_live_x+', 'your_paystack_public_key_here'
    $content | Set-Content .env.example -NoNewline
    
    # Amend the commit
    git add .env.example
    git commit --amend --no-edit
}

# Return to main
git checkout main

# Rebase main onto the fixed commit
git rebase --onto HEAD $commitToFix main

Write-Host "Secret fixed in commit history"
