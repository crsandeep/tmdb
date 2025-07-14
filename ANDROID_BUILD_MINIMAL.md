# Minimal Android Build Guide (No Android Studio) 🚀

This guide shows how to build the Android APK using only command line tools, without installing Android Studio.

## Prerequisites

1. **Node.js** (v18+): https://nodejs.org/
2. **Java JDK 17**: https://adoptium.net/
3. **Git**: https://git-scm.com/

## Quick Setup (macOS/Linux)

Run the automated setup script:
```bash
chmod +x setup-minimal-sdk.sh
./setup-minimal-sdk.sh
```

This will download and configure everything automatically. Skip to "Building the APK" section after running this.

## Manual Setup (All Platforms)

### Install Android SDK Command Line Tools

### Step 1: Download Command Line Tools

Download the appropriate package for your OS from:
https://developer.android.com/studio#command-line-tools-only

- **Windows**: `commandlinetools-win-*.zip`
- **macOS**: `commandlinetools-mac-*.zip`
- **Linux**: `commandlinetools-linux-*.zip`

### Step 2: Set Up Android SDK

1. Create SDK directory:
```bash
# Windows
mkdir C:\Android\sdk

# macOS/Linux
mkdir -p ~/Android/sdk
```

2. Extract the downloaded zip into the SDK directory:
```bash
# The structure should be: sdk/cmdline-tools/latest/
# Windows example:
# C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat

# macOS/Linux example:
# ~/Android/sdk/cmdline-tools/latest/bin/sdkmanager
```

### Step 3: Set Environment Variables

**Windows (PowerShell as Admin):**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\sdk', 'User')
[System.Environment]::SetEnvironmentVariable('PATH', "$env:PATH;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools", 'User')
```

**macOS/Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
export ANDROID_HOME=$HOME/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Restart your terminal after setting these.

### Step 4: Install Required SDK Packages

```bash
# Accept licenses first
sdkmanager --licenses

# Install required packages
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## Building the APK

### 1. Clone and Setup
```bash
git clone [your-repo-url] tmdb
cd tmdb
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your TMDB API key
```

### 3. Build
```bash
npm run build
npx cap sync android
cd android

# Windows
gradlew.bat assembleDebug

# macOS/Linux
./gradlew assembleDebug
```

### 4. Find Your APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Advantages of This Approach

✅ **Lightweight**: ~200MB vs ~1GB+ for Android Studio  
✅ **Faster**: No IDE overhead  
✅ **CI/CD Friendly**: Perfect for automated builds  
✅ **Resource Efficient**: Uses less RAM and CPU  

## When You Might Want Android Studio

- Visual layout editing
- Debugging with breakpoints
- Emulator management
- Code completion for Java/Kotlin

But for just building APKs, command line tools are perfectly sufficient!

## Troubleshooting

### "sdkmanager: command not found"
- Check your PATH includes `$ANDROID_HOME/cmdline-tools/latest/bin`
- Make sure you extracted to the correct directory structure

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=C:\\Android\\sdk  # Windows
sdk.dir=/Users/YourName/Android/sdk  # macOS
sdk.dir=/home/YourName/Android/sdk  # Linux
```

### Build Errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
rm -rf node_modules android/.gradle android/app/build
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
``` 