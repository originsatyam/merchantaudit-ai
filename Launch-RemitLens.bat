@echo off
setlocal enabledelayedexpansion
title RemitLens - One-Click Launcher
color 0B

echo ===============================================================================
echo               REMITLENS : CROSS-BORDER PAYMENT RECONCILIATION
echo               Indian B2B Exporters ^& Agencies (Invoices - PG - Bank)
echo ===============================================================================
echo.
echo  [1] Open Local App           (http://localhost:3000) [Default in 3s]
echo  [2] Open Live Cloud App      (https://merchantaudit-app.vercel.app)
echo  [3] Open Design System ^& PRD (design system\remitlens-design-system.html)
echo  [4] Run Automated Unit Tests (npm test - 9 deterministic test cases)
echo.
echo ===============================================================================

choice /C 1234 /D 1 /T 3 /M "Select option (Auto-launching Local App in 3s)"
set CHOICE_VAL=%ERRORLEVEL%

if "%CHOICE_VAL%"=="1" goto LAUNCH_LOCAL
if "%CHOICE_VAL%"=="2" goto LAUNCH_CLOUD
if "%CHOICE_VAL%"=="3" goto LAUNCH_DESIGN
if "%CHOICE_VAL%"=="4" goto RUN_TESTS
goto LAUNCH_LOCAL

:LAUNCH_LOCAL
echo.
echo [*] Checking local server status...
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo [*] RemitLens server is already running on port 3000!
    echo [*] Launching browser to http://localhost:3000 ...
    start http://localhost:3000
    goto FINISH
)

echo [*] Starting local Next.js dev server on http://localhost:3000 ...
cd /d "%~dp0merchantaudit-app"
start "RemitLens Dev Server (port 3000)" cmd /k "npm run dev"
echo [*] Waiting 3 seconds for server spin up...
ping 127.0.0.1 -n 4 >nul
echo [*] Opening RemitLens in your default browser...
start http://localhost:3000
goto FINISH

:LAUNCH_CLOUD
echo.
echo [*] Opening Live Cloud Deployment...
start https://merchantaudit-app.vercel.app
goto FINISH

:LAUNCH_DESIGN
echo.
echo [*] Opening Standalone Design System ^& PRD Showcase...
start "" "%~dp0design system\remitlens-design-system.html"
goto FINISH

:RUN_TESTS
echo.
echo [*] Executing RemitLens financial deterministic unit tests...
cd /d "%~dp0merchantaudit-app"
call npm test
echo.
pause
goto FINISH

:FINISH
echo.
echo ===============================================================================
echo  RemitLens is active! You can keep this window or close it anytime.
echo ===============================================================================
ping 127.0.0.1 -n 4 >nul
exit /b 0
