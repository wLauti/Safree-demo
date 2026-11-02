@echo off
setlocal
cd /d "%~dp0.."
for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 ( echo [31mx Node.js ^>= 18 required[0m & exit /b 1 )
echo [32mv Node OK[0m

if exist .env.local (
  echo [32mv .env.local found[0m
) else (
  echo [33m! No .env.local - run scripts\install.bat first[0m
)

where supabase >nul 2>nul
if %errorlevel%==0 (
  call npx concurrently -n "db,web,open" -c "yellow,cyan,green" "supabase start" "next dev" "timeout /t 4 >nul && start http://localhost:3000"
) else (
  echo [33m- Supabase CLI not found - starting web only[0m
  call npx concurrently -n "web,open" -c "cyan,green" "next dev" "timeout /t 4 >nul && start http://localhost:3000"
)

pause
