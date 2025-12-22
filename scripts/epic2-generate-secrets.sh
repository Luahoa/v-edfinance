#!/bin/bash

# Epic 2: Production Deployment - Secret Generation Script
# Generates all production secrets securely

echo "🔐 Generating Production Secrets for V-EdFinance"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Generate secrets using OpenSSL
echo -e "${YELLOW}Generating JWT_SECRET_PROD...${NC}"
JWT_SECRET_PROD=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Generated${NC}"

echo -e "${YELLOW}Generating JWT_REFRESH_SECRET_PROD...${NC}"
JWT_REFRESH_SECRET_PROD=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Generated${NC}"

echo -e "${YELLOW}Generating ENCRYPTION_KEY_PROD...${NC}"
ENCRYPTION_KEY_PROD=$(openssl rand -hex 32)
echo -e "${GREEN}✓ Generated${NC}"

echo -e "${YELLOW}Generating POSTGRES_PASSWORD (if not set)...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo -e "${GREEN}✓ Generated${NC}"

echo ""
echo "=================================================="
echo "🎉 Secrets Generated Successfully!"
echo "=================================================="
echo ""
echo "⚠️  SAVE THESE IN YOUR PASSWORD MANAGER IMMEDIATELY!"
echo ""
echo "Production Environment Variables:"
echo "---------------------------------------------------"
echo ""
echo "# Database"
echo "POSTGRES_PASSWORD=\"${POSTGRES_PASSWORD}\""
echo ""
echo "# JWT Tokens"
echo "JWT_SECRET_PROD=\"${JWT_SECRET_PROD}\""
echo "JWT_REFRESH_SECRET_PROD=\"${JWT_REFRESH_SECRET_PROD}\""
echo ""
echo "# Encryption"
echo "ENCRYPTION_KEY_PROD=\"${ENCRYPTION_KEY_PROD}\""
echo ""
echo "# Cloudflare R2 (Get from Cloudflare Dashboard)"
echo "R2_ACCOUNT_ID=\"YOUR_CLOUDFLARE_ACCOUNT_ID\""
echo "R2_ACCESS_KEY_ID=\"YOUR_R2_ACCESS_KEY\""
echo "R2_SECRET_ACCESS_KEY=\"YOUR_R2_SECRET_KEY\""
echo "R2_BUCKET_NAME=\"v-edfinance-backup\""
echo ""
echo "# AI Service (Get from Google AI Studio)"
echo "GEMINI_API_KEY=\"YOUR_GEMINI_API_KEY\""
echo ""
echo "---------------------------------------------------"
echo ""

# Save to temporary file (encrypted)
TEMP_FILE=".secrets-prod-$(date +%Y%m%d-%H%M%S).txt"
echo "Saving to encrypted file: ${TEMP_FILE}.gpg"
echo ""

cat > "${TEMP_FILE}" << EOF
# V-EdFinance Production Secrets
# Generated: $(date)
# DO NOT COMMIT THIS FILE!

POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
JWT_SECRET_PROD="${JWT_SECRET_PROD}"
JWT_REFRESH_SECRET_PROD="${JWT_REFRESH_SECRET_PROD}"
ENCRYPTION_KEY_PROD="${ENCRYPTION_KEY_PROD}"

# Manual entries required:
R2_ACCOUNT_ID="<GET_FROM_CLOUDFLARE>"
R2_ACCESS_KEY_ID="<GET_FROM_CLOUDFLARE>"
R2_SECRET_ACCESS_KEY="<GET_FROM_CLOUDFLARE>"
R2_BUCKET_NAME="v-edfinance-backup"
GEMINI_API_KEY="<GET_FROM_GOOGLE_AI_STUDIO>"
EOF

# Encrypt file if GPG available
if command -v gpg &> /dev/null; then
    echo "Enter passphrase to encrypt secrets file:"
    gpg -c "${TEMP_FILE}"
    rm "${TEMP_FILE}"
    echo -e "${GREEN}✓ Secrets encrypted to ${TEMP_FILE}.gpg${NC}"
    echo ""
    echo "To decrypt later: gpg ${TEMP_FILE}.gpg"
else
    echo -e "${YELLOW}⚠ GPG not found. Secrets saved to ${TEMP_FILE} (UNENCRYPTED)${NC}"
    echo -e "${YELLOW}⚠ DELETE THIS FILE after copying to password manager!${NC}"
fi

echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo "1. Copy secrets to password manager (1Password, LastPass, etc.)"
echo "2. Get Cloudflare R2 credentials from dashboard"
echo "3. Get Gemini API key from Google AI Studio"
echo "4. Add all secrets to Dokploy environment variables"
echo "5. Run deployment: ./scripts/epic2-deploy-production.sh"
echo ""
