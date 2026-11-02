@echo off
setlocal
cd /d "%~dp0.."
for /f %%v in ('node -p "require('./package.json').version"') do set VERSION=%%v
echo [36m^> Generating Safree docs (v%VERSION%)...[0m
call node scripts/generate-docs.mjs
if errorlevel 1 exit /b 1
echo [32mv Done. Output in \docs[0m
