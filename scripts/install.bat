@echo off
setlocal
cd /d "%~dp0.."
echo [36m^> Safree install[0m

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 ( echo [31mx Node.js ^>= 18 required[0m & exit /b 1 )
echo [32mv Node OK[0m

for /f "tokens=1 delims=." %%v in ('npm -v') do set NPM_MAJOR=%%v
if %NPM_MAJOR% LSS 9 ( echo [31mx npm ^>= 9 required[0m & exit /b 1 )
echo [32mv npm OK[0m

echo [33m^> Installing dependencies...[0m
call npm install --legacy-peer-deps
if errorlevel 1 exit /b 1

if not exist .env.local (
  copy .env.local.example .env.local >nul
  echo [32mv Created .env.local from example[0m
) else (
  echo - .env.local already exists
)

echo.
echo [36mNext steps:[0m
echo   1. Fill in your .env.local file
echo   2. Run: npm run dev
echo   3. Open: http://localhost:3000
