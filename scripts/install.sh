#!/usr/bin/env bash
set -e
CYAN='\033[36m'; YELLOW='\033[33m'; GREEN='\033[32m'; RED='\033[31m'; DIM='\033[2m'; NC='\033[0m'

echo -e "${CYAN}▶ Safree install${NC}"

# 1. Node >= 18
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 18 ]; then echo -e "${RED}✗ Node.js >= 18 required (found $(node -v 2>/dev/null))${NC}"; exit 1; fi
echo -e "${GREEN}✓ Node $(node -v)${NC}"

# 2. npm >= 9
NPM_MAJOR=$(npm -v | cut -d. -f1)
if [ "$NPM_MAJOR" -lt 9 ]; then echo -e "${RED}✗ npm >= 9 required (found $(npm -v))${NC}"; exit 1; fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# 3. Install deps
echo -e "${YELLOW}▶ Installing dependencies…${NC}"
npm install --legacy-peer-deps

# 4. Scaffold .env.local
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo -e "${GREEN}✓ Created .env.local from example${NC}"
else
  echo -e "${DIM}• .env.local already exists — left untouched${NC}"
fi

# 5. Instructions
echo -e "\n${CYAN}Next steps:${NC}"
echo "  1. Fill in your .env.local file"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
