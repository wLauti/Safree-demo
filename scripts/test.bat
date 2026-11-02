@echo off
setlocal
cd /d "%~dp0.."
if not exist reports\coverage mkdir reports\coverage

echo [36m^> Unit + integration tests (Vitest) with coverage...[0m
call npx vitest run --coverage --coverage.reportsDirectory=reports/coverage --reporter=json --outputFile=reports/test-results.json
set TEST_RESULT=%errorlevel%

if defined SUPABASE_SERVICE_ROLE_KEY (
  echo [33m^> RLS policy audit...[0m
  call node scripts/rls-audit.mjs
  if errorlevel 1 set RLS_RESULT=1
) else (
  echo [33m- Skipping RLS audit (set Supabase staging env vars)[0m
)

call node scripts/results-to-html.mjs

if %TEST_RESULT% NEQ 0 ( echo [31mx Tests failed[0m & exit /b 1 )
if defined RLS_RESULT ( echo [31mx RLS audit failed[0m & exit /b 1 )
echo [32mv All tests passed. Reports in \reports[0m
