@echo off
echo Indian Cinema Hub - Setup Script
echo ====================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js v18 or later from nodejs.org
    pause
    exit /b 1
)

echo OK: Node.js version:
node -v

:: Check for Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed. Please install Java 11 or later
    pause
    exit /b 1
)

echo OK: Java version:
java -version

:: Check for .env file
if not exist .env (
    echo.
    echo WARNING: .env file not found!
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo WARNING: Please edit .env and add your TMDB API key!
        echo Get your API key from: https://www.themoviedb.org/settings/api
        echo.
        echo Press any key to continue after adding your API key...
        pause >nul
    ) else (
        echo ERROR: .env.example not found. Please create .env with VITE_TMDB_API_KEY=your-api-key
        pause
        exit /b 1
    )
)

:: Install dependencies
echo.
echo Installing dependencies...
call npm install

:: Build the web app
echo.
echo Building web app...
call npm run build

:: Sync with Android
echo.
echo Syncing with Android...
call npx cap sync android

:: Build APK
echo.
echo Building Android APK...
cd android
call gradlew.bat assembleDebug

if %errorlevel% equ 0 (
    echo.
    echo BUILD SUCCESSFUL!
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on your phone:
    echo 1. Enable Developer Options and USB Debugging
    echo 2. Connect via USB and run: adb install app\build\outputs\apk\debug\app-debug.apk
    echo 3. Or transfer the APK to your phone and install directly
) else (
    echo.
    echo BUILD FAILED! Please check the error messages above.
    echo.
    echo Common solutions:
    echo - Run: gradlew clean
    echo - Check Java version: java -version (should be 11+)
    echo - Use Android Studio for better error handling
)

pause 