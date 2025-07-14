#!/bin/bash

echo "🎬 Indian Cinema Hub - Setup Script"
echo "===================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or later from nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 11 or later"
    exit 1
fi

echo "✅ Java version:"
java -version

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found!"
    if [ -f .env.example ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please edit .env and add your TMDB API key!"
        echo "   Get your API key from: https://www.themoviedb.org/settings/api"
        echo ""
        echo "Press Enter to continue after adding your API key..."
        read
    else
        echo "❌ .env.example not found. Please create .env with VITE_TMDB_API_KEY=your-api-key"
        exit 1
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build the web app
echo ""
echo "🔨 Building web app..."
npm run build

# Sync with Android
echo ""
echo "📱 Syncing with Android..."
npx cap sync android

# Build APK
echo ""
echo "🚀 Building Android APK..."
cd android

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    ./gradlew.bat assembleDebug
else
    # macOS/Linux
    ./gradlew assembleDebug
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on your phone:"
    echo "1. Enable Developer Options and USB Debugging"
    echo "2. Connect via USB and run: adb install app/build/outputs/apk/debug/app-debug.apk"
    echo "3. Or transfer the APK to your phone and install directly"
else
    echo ""
    echo "❌ Build failed! Please check the error messages above."
    echo ""
    echo "Common solutions:"
    echo "- Run: ./gradlew clean"
    echo "- Check Java version: java -version (should be 11+)"
    echo "- Use Android Studio for better error handling"
fi 