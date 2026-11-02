#!/usr/bin/env bash
set -e
CYAN='\033[36m'; GREEN='\033[32m'; NC='\033[0m'
VERSION=$(node -p "require('./package.json').version")
echo -e "${CYAN}▶ Generating Safree docs (v${VERSION})…${NC}"
node scripts/generate-docs.mjs
echo -e "${GREEN}✓ Done. Output in /docs${NC}"
