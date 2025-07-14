#!/bin/bash

echo "Building Indian Cinema Hub APK..."
echo "This script temporarily bypasses SSL validation for the build process only"

# Export Java options to bypass SSL
export JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=NONE -Djavax.net.ssl.trustStoreType=Windows-ROOT -Dcom.sun.net.ssl.checkRevocation=false"

# Set Gradle properties for SSL bypass
export GRADLE_OPTS="-Djavax.net.ssl.trustStore=NONE -Djavax.net.ssl.trustStoreType=Windows-ROOT"

# Clean previous builds
./gradlew clean

# Build debug APK
./gradlew assembleDebug --no-daemon

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on your Samsung Galaxy S23 Ultra:"
    echo "1. Enable Developer Options and USB Debugging"
    echo "2. Connect your phone via USB"
    echo "3. Run: adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "Or transfer the APK file to your phone and install it directly."
else
    echo "❌ Build failed. Please check the error messages above."
fi

# Clean up environment variables
unset JAVA_TOOL_OPTIONS
unset GRADLE_OPTS 