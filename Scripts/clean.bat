@echo off
REM Batch script to clean node_modules, cache, and build files for SmartService FE (React Native/Expo)
setlocal enabledelayedexpansion

REM Change to project root directory
cd /d "%~dp0\.."

powershell -Command "Write-Host '=== Cleaning SmartService FE ===' -ForegroundColor DarkCyan"
echo.

REM Stop node and metro processes to unlock files
powershell -Command "Write-Host '=== Unlocking files ===' -ForegroundColor DarkCyan"
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

REM Clean node_modules, .expo, and build folders
powershell -Command "Write-Host '=== Removing build and cache folders ===' -ForegroundColor DarkCyan"
echo.

REM Remove node_modules
if exist "node_modules" (
    powershell -Command "Write-Host 'Removing node_modules folder...' -ForegroundColor DarkCyan"
    rd /s /q "node_modules" 2>nul
    echo Removed node_modules
) else (
    echo No node_modules folder found
)

REM Remove .expo folder
if exist ".expo" (
    powershell -Command "Write-Host 'Removing .expo folder...' -ForegroundColor DarkCyan"
    rd /s /q ".expo" 2>nul
    echo Removed .expo folder
) else (
    echo No .expo folder found
)

REM Remove android/app/build folder
if exist "android\app\build" (
    powershell -Command "Write-Host 'Removing android/app/build folder...' -ForegroundColor DarkCyan"
    rd /s /q "android\app\build" 2>nul
    echo Removed android build folder
)

REM Remove android/.gradle folder
if exist "android\.gradle" (
    powershell -Command "Write-Host 'Removing android/.gradle folder...' -ForegroundColor DarkCyan"
    rd /s /q "android\.gradle" 2>nul
    echo Removed android gradle cache
)

REM Remove ios/build folder
if exist "ios\build" (
    powershell -Command "Write-Host 'Removing ios/build folder...' -ForegroundColor DarkCyan"
    rd /s /q "ios\build" 2>nul
    echo Removed ios build folder
)

REM Remove ios/Pods folder
if exist "ios\Pods" (
    powershell -Command "Write-Host 'Removing ios/Pods folder...' -ForegroundColor DarkCyan"
    rd /s /q "ios\Pods" 2>nul
    echo Removed ios Pods folder
)

echo.
powershell -Command "Write-Host '=== Cleaning Metro bundler cache ===' -ForegroundColor DarkCyan"
del /q /f /s "%TMP%\metro-cache-*" 2>nul
del /q /f /s "%TMP%\haste-map-*" 2>nul
echo Metro cache cleared.

echo.
powershell -Command "Write-Host 'Clean completed successfully!' -ForegroundColor DarkGreen"
exit /b 0
