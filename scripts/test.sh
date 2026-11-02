#!/usr/bin/env bash
set -e
CYAN='\033[36m'; YELLOW='\033[33m'; GREEN='\033[32m'; RED='\033[31m'; NC='\033[0m'

mkdir -p reports/coverage

echo -e "${CYAN}▶ Unit + integration tests (Vitest) with coverage…${NC}"
npx vitest run --coverage \
  --coverage.reportsDirectory=reports/coverage \
  --reporter=json --outputFile=reports/test-results.json || TEST_FAILED=1

# 3. RLS policy tests (staging only)
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${YELLOW}▶ RLS policy audit…${NC}"
  node scripts/rls-audit.mjs || RLS_FAILED=1
else
  echo -e "${YELLOW}⊘ Skipping RLS audit (set Supabase staging env vars)${NC}"
fi

# 5. Test results HTML
node scripts/results-to-html.mjs || true

# 6. Summary
node -e "try{const r=require('./reports/test-results.json');const t=r.numTotalTests??0,p=r.numPassedTests??0,f=r.numFailedTests??0;console.log('\x1b[32m'+p+' passed\x1b[0m, '+(f?'\x1b[31m':'')+f+' failed\x1b[0m, '+t+' total')}catch(e){console.log('summary unavailable')}"

if [ -n "$TEST_FAILED" ] || [ -n "$RLS_FAILED" ]; then
  echo -e "${RED}✗ Tests failed${NC}"; exit 1
fi
echo -e "${GREEN}✓ All tests passed. Reports in /reports${NC}"
