#!/bin/bash

echo "📱 Minimal Android SDK Setup Script"
echo "==================================="
echo ""

# Detect OS
OS_TYPE=""
SDK_URL=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="mac"
    SDK_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
else
    echo "❌ This script only supports macOS and Linux. For Windows, see ANDROID_BUILD_MINIMAL.md"
    exit 1
fi

# Check prerequisites
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 21 LTS:"
    echo "   macOS: brew install openjdk@21"
    echo "   Other: https://adoptium.net/"
    exit 1
fi

echo "✅ Java found: $(java -version 2>&1 | head -n 1)"

# Check Java version compatibility
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -gt 23 ]; then
    echo "⚠️  Warning: Java $JAVA_VERSION detected. Gradle 8.11.1 supports up to Java 23."
    echo "   Consider using Java 21 LTS for better compatibility:"
    echo "   macOS: brew install openjdk@21 && export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/*/libexec/openjdk.jdk/Contents/Home"
fi

# Set up directories
ANDROID_HOME="$HOME/Android/sdk"
echo ""
echo "📁 Setting up Android SDK in: $ANDROID_HOME"
mkdir -p "$ANDROID_HOME/cmdline-tools"

# Download command line tools
echo ""
echo "📥 Downloading Android command line tools..."
TEMP_ZIP="/tmp/android-cmdline-tools.zip"
curl -L "$SDK_URL" -o "$TEMP_ZIP"

# Extract
echo "📦 Extracting tools..."
cd "$ANDROID_HOME/cmdline-tools"
unzip -q "$TEMP_ZIP"
mv cmdline-tools latest
rm "$TEMP_ZIP"

# Set up environment variables
echo ""
echo "🔧 Setting up environment variables..."
SHELL_RC="$HOME/.bashrc"
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
fi

# Check if already set
if ! grep -q "ANDROID_HOME" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# Android SDK" >> "$SHELL_RC"
    echo "export ANDROID_HOME=$ANDROID_HOME" >> "$SHELL_RC"
    echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> "$SHELL_RC"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_RC"
fi

# Source the file
export ANDROID_HOME="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

# Accept licenses and install packages
echo ""
echo "📜 Accepting licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1

echo "📦 Installing required SDK packages..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo ""
echo "✅ Android SDK setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart your terminal or run: source $SHELL_RC"
echo "2. Verify with: sdkmanager --list"
echo "3. Build your app: npm run build && npx cap sync android && cd android && ./gradlew assembleDebug"
echo ""
echo "📍 SDK Location: $ANDROID_HOME" 