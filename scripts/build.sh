#!/usr/bin/env bash
set -e
CYAN='\033[36m'; YELLOW='\033[33m'; GREEN='\033[32m'; RED='\033[31m'; NC='\033[0m'
fail() { echo -e "${RED}✗ $1 failed${NC}"; exit 1; }

echo -e "${CYAN}▶ Safree production build${NC}"

echo -e "${CYAN}[1/5] TypeScript type check…${NC}"
npx tsc --noEmit || fail "Type check"

echo -e "${CYAN}[2/5] ESLint…${NC}"
npm run lint || fail "Lint"

echo -e "${CYAN}[3/5] Unit tests…${NC}"
npx vitest run || fail "Unit tests"

echo -e "${GREEN}[4/5] Next.js build…${NC}"
npx next build || fail "Build"

echo -e "${GREEN}[5/5] Documentation…${NC}"
node scripts/generate-docs.mjs || fail "Docs"

# Report
PAGES=$(grep -c "├\|└" <(npx next build 2>/dev/null) 2>/dev/null || echo "n/a")
echo -e "\n${GREEN}✓ Build complete${NC}"
if [ -d .next ]; then
  SIZE=$(du -sh .next 2>/dev/null | cut -f1)
  echo -e "  Build size (.next): ${SIZE}"
fi
echo -e "  See route table above for page count and any warnings."
