#!/usr/bin/env bash
set -e
CYAN='\033[36m'; YELLOW='\033[33m'; GREEN='\033[32m'; RED='\033[31m'; NC='\033[0m'

# 1. Node >= 18
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 18 ]; then echo -e "${RED}✗ Node.js >= 18 required${NC}"; exit 1; fi
echo -e "${GREEN}✓ Node $(node -v)${NC}"

# 2. Env var check (warn only)
if [ -f .env.local ]; then
  MISSING=0
  while IFS= read -r line; do
    case "$line" in ''|\#*) continue;; esac
    key="${line%%=*}"
    if ! grep -q "^${key}=." .env.local 2>/dev/null; then
      echo -e "${YELLOW}⚠ Missing/empty env var: ${key}${NC}"; MISSING=$((MISSING+1))
    fi
  done < .env.local.example
  [ "$MISSING" -eq 0 ] && echo -e "${GREEN}✓ All env vars present${NC}"
else
  echo -e "${YELLOW}⚠ No .env.local — run scripts/install.sh first${NC}"
fi

# 3+4. Supabase local (if CLI present) + Next dev, in parallel
OPEN_CMD="sleep 4 && (command -v open >/dev/null && open http://localhost:3000 || xdg-open http://localhost:3000 || true)"
if command -v supabase >/dev/null 2>&1; then
  npx concurrently -n "db,web,open" -c "yellow,cyan,green" \
    "supabase start" "next dev" "$OPEN_CMD"
else
  echo -e "${YELLOW}• Supabase CLI not found — starting web only${NC}"
  npx concurrently -n "web,open" -c "cyan,green" "next dev" "$OPEN_CMD"
fi
