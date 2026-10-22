#!/usr/bin/env bash
# ==============================================================================
# scripts/scan-secrets.sh
# Scans git repository and build artifacts for accidentally committed secrets,
# high-entropy tokens, service-role keys, and unmasked environment variables.
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo " Running Secrets & Credential Leakage Scanner     "
echo "=================================================="

EXIT_CODE=0

# Patterns that should NEVER be committed
PATTERNS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "AI_PROVIDER_API_KEY=[a-zA-Z0-9_\-]{10,}"
  "eyJhbGciOi[a-zA-Z0-9_\.\-]{50,}"
  "sk-[a-zA-Z0-9]{20,}"
  "postgres://.*:.*@"
  "postgresql://.*:.*@"
)

# 1. Check for real .env files accidentally tracked or present in git
echo "Checking git tracked files for .env files..."
TRACKED_ENVS=$(git ls-files | grep -E "(^|/)\.env(\..+)?$" | grep -v "\.env\.example" || true)

if [ -n "$TRACKED_ENVS" ]; then
  echo "❌ ERROR: Found committed .env file(s):"
  echo "$TRACKED_ENVS"
  EXIT_CODE=1
else
  echo "✅ No .env files are tracked by git."
fi

# 2. Grep tracked files for secret patterns
echo "Scanning tracked files for potential secret patterns..."
for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(git grep -E -I -n "$pattern" -- ':!.env.example' ':!docs/*' ':!ARCHITECTURE.md' ':!README.md' || true)
  if [ -n "$MATCHES" ]; then
    echo "❌ ERROR: Detected potential leaked secret matching pattern '$pattern':"
    echo "$MATCHES"
    EXIT_CODE=1
  fi
done

# 3. Scan frontend built bundle if it exists
if [ -d "frontend/dist" ]; then
  echo "Scanning frontend production bundle (frontend/dist)..."
  if grep -rn "SUPABASE_SERVICE_ROLE_KEY" frontend/dist/ > /dev/null 2>&1; then
    echo "❌ ERROR: Found service-role key reference in frontend production build!"
    EXIT_CODE=1
  else
    echo "✅ Frontend production bundle does not contain service-role keys."
  fi
fi

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "=================================================="
  echo "✅ SCAN PASSED: No leaked secrets detected.       "
  echo "=================================================="
else
  echo "=================================================="
  echo "❌ SCAN FAILED: Please remove detected secrets!   "
  echo "=================================================="
fi

exit $EXIT_CODE
