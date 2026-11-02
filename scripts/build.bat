@echo off
setlocal
cd /d "%~dp0.."
echo [36m^> Safree production build[0m

echo [36m[1/5] TypeScript type check...[0m
call npx tsc --noEmit
if errorlevel 1 ( echo [31mx Type check failed[0m & exit /b 1 )

echo [36m[2/5] ESLint...[0m
call npm run lint
if errorlevel 1 ( echo [31mx Lint failed[0m & exit /b 1 )

echo [36m[3/5] Unit tests...[0m
call npx vitest run
if errorlevel 1 ( echo [31mx Unit tests failed[0m & exit /b 1 )

echo [32m[4/5] Next.js build...[0m
call npx next build
if errorlevel 1 ( echo [31mx Build failed[0m & exit /b 1 )

echo [32m[5/5] Documentation...[0m
call node scripts/generate-docs.mjs
if errorlevel 1 ( echo [31mx Docs failed[0m & exit /b 1 )

echo.
echo [32mv Build complete. See route table above for page count and warnings.[0m
