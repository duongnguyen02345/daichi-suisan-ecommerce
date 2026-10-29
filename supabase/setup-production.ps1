param(
  [string]$AllowedOrigins = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001'
)

$ErrorActionPreference = 'Stop'

function New-FreshMartSecret {
  $bytes = New-Object byte[] 32
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  }
  finally {
    $generator.Dispose()
  }

  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Read-SecretFile {
  param([string]$Path)

  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith('#')) {
      continue
    }

    $parts = $line.Split('=', 2)
    if ($parts.Count -eq 2) {
      $values[$parts[0].Trim()] = $parts[1].Trim()
    }
  }

  return $values
}

$secretPath = Join-Path $PSScriptRoot '.env'
$secrets = Read-SecretFile -Path $secretPath

if (-not $secrets.ContainsKey('SEPAY_WEBHOOK_SECRET') -or [string]::IsNullOrWhiteSpace($secrets['SEPAY_WEBHOOK_SECRET'])) {
  $secrets['SEPAY_WEBHOOK_SECRET'] = New-FreshMartSecret
}

if (-not $secrets.ContainsKey('FRESHMART_ADMIN_SETUP_KEY') -or [string]::IsNullOrWhiteSpace($secrets['FRESHMART_ADMIN_SETUP_KEY'])) {
  $secrets['FRESHMART_ADMIN_SETUP_KEY'] = New-FreshMartSecret
}

$secrets['ALLOWED_ORIGINS'] = $AllowedOrigins

$content = @(
  "SEPAY_WEBHOOK_SECRET=$($secrets['SEPAY_WEBHOOK_SECRET'])"
  "FRESHMART_ADMIN_SETUP_KEY=$($secrets['FRESHMART_ADMIN_SETUP_KEY'])"
  "ALLOWED_ORIGINS=$($secrets['ALLOWED_ORIGINS'])"
)

[System.IO.File]::WriteAllLines($secretPath, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host 'Dang nap Edge Function secrets len Supabase...'
& npx.cmd supabase secrets set --env-file $secretPath --agent no
if ($LASTEXITCODE -ne 0) {
  throw 'Khong the nap Supabase secrets.'
}

Write-Host 'Dang deploy FreshMart Edge Functions...'
& npx.cmd supabase functions deploy create-order order-status report-payment bank-settings sepay-webhook --use-api --agent no
if ($LASTEXITCODE -ne 0) {
  throw 'Khong the deploy Supabase Edge Functions.'
}

Write-Host 'Da deploy xong. Gia tri secrets chi duoc luu trong supabase/.env (da gitignore).'
