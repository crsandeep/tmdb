# Android Build Guide 🤖

This guide will walk you through building the Android APK from a fresh clone of the repository.

## Prerequisites

### 1. System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 10GB free space

### 2. Required Software

#### Node.js (v18 or later)
- Download from: https://nodejs.org/
- Verify installation: `node --version`

#### Java JDK 17
- Download from: https://adoptium.net/
- After installation, verify: `java -version`
- Set JAVA_HOME environment variable:
  - **Windows**: Add to System Environment Variables
  - **macOS/Linux**: Add to `~/.bashrc` or `~/.zshrc`:
    ```bash
    export JAVA_HOME=/path/to/jdk
    export PATH=$JAVA_HOME/bin:$PATH
    ```

#### Android SDK (Choose One Option)

**Option 1: Android Studio** (Easier for beginners)
- Download from: https://developer.android.com/studio
- During installation, make sure to install:
  - Android SDK
  - Android SDK Platform-Tools
  - Android SDK Build-Tools
  - Android Emulator (optional)

**Option 2: Command Line Tools Only** (Lightweight - see [ANDROID_BUILD_MINIMAL.md](ANDROID_BUILD_MINIMAL.md))
- No IDE needed, just SDK tools
- Much smaller download (~200MB vs ~1GB)
- Perfect for CI/CD or minimal setups

#### Git
- Download from: https://git-scm.com/
- Verify installation: `git --version`

## Environment Setup

### 1. Android SDK Configuration

After installing Android Studio:

1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Note the **Android SDK Location** (you'll need this path)
4. Under **SDK Platforms** tab, install:
   - Android 14 (API 34)
   - Android 13 (API 33)
5. Under **SDK Tools** tab, install:
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools

### 2. Set Environment Variables

Add these to your system environment variables:

**Windows (PowerShell as Administrator):**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourName\AppData\Local\Android\Sdk', 'User')
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin', 'User')
```

**macOS/Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk        # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Restart your terminal after setting environment variables.

### 3. Verify Setup
Run these commands to verify everything is set up correctly:
```bash
node --version      # Should show v18.x.x or higher
java -version       # Should show version 17.x.x
adb --version       # Should show Android Debug Bridge version
```

## Building the APK

### Step 1: Clone the Repository
```bash
git clone [your-repo-url] tmdb
cd tmdb
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your TMDB API key
# Use any text editor (nano, vim, notepad, etc.)
```

Edit `.env` and add:
```
VITE_TMDB_API_KEY=your-actual-api-key-here
```

> **Note**: Get your API key from https://www.themoviedb.org/settings/api

### Step 4: Build the Web App
```bash
npm run build
```

### Step 5: Sync with Capacitor
```bash
npx cap sync android
```

### Step 6: Build the APK

**Option 1: Using Command Line (Recommended)**

```bash
cd android

# For Windows
gradlew.bat assembleDebug

# For macOS/Linux
./gradlew assembleDebug
```

**Option 2: Using Android Studio**

1. Open Android Studio
2. Click **File** → **Open**
3. Navigate to `tmdb/android` folder and open it
4. Wait for Gradle sync to complete
5. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

### Step 7: Find Your APK

The debug APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Building a Release APK (Optional)

For a production-ready APK:

### 1. Generate a Signing Key
```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing
Create `android/keystore.properties`:
```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=my-key-alias
storeFile=app/my-release-key.keystore
```

### 3. Build Release APK
```bash
cd android
./gradlew assembleRelease  # macOS/Linux
gradlew.bat assembleRelease  # Windows
```

Release APK location:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Quick Build Script

For convenience, you can use the provided setup scripts:

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

## Troubleshooting

### Common Issues

#### 1. "ANDROID_HOME is not set"
- Make sure you've set the environment variables correctly
- Restart your terminal/command prompt
- Run `echo $ANDROID_HOME` (macOS/Linux) or `echo %ANDROID_HOME%` (Windows) to verify

#### 2. "SDK location not found"
- Create a file `android/local.properties` with:
  ```
  sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk  # Windows
  sdk.dir=/Users/YourName/Library/Android/sdk                # macOS
  sdk.dir=/home/YourName/Android/Sdk                         # Linux
  ```

#### 3. "Failed to install the following Android SDK packages"
- Open Android Studio
- Go to SDK Manager
- Install the missing packages mentioned in the error

#### 4. Build fails with "Could not determine java version"
- Make sure Java 17 is installed
- Set JAVA_HOME correctly
- Run `java -version` to verify

#### 5. "Capacitor sync failed"
- Make sure you've run `npm run build` first
- Check that the `dist` folder exists
- Try running `npx cap sync android` again

### Clean Build
If you encounter issues, try a clean build:
```bash
# Clean everything
cd android
./gradlew clean  # or gradlew.bat clean on Windows
cd ..
rm -rf node_modules
rm -rf android/.gradle
rm -rf android/app/build

# Rebuild
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

## Installing the APK

### On Physical Device
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

### On Emulator
1. Start Android Emulator from Android Studio
2. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

### Direct Transfer
1. Copy the APK file to your device
2. Open the file on your device
3. Allow installation from unknown sources when prompted
4. Install the app

## Tips for Faster Builds

1. **Gradle Daemon**: Keeps Gradle running in background
   ```bash
   # Add to gradle.properties
   org.gradle.daemon=true
   ```

2. **Parallel Builds**: Use multiple CPU cores
   ```bash
   # Add to gradle.properties
   org.gradle.parallel=true
   ```

3. **Increase Heap Size**: For better performance
   ```bash
   # Add to gradle.properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
   ```

## Next Steps

- Test the app on different Android versions
- Configure app icons and splash screens
- Set up continuous integration for automated builds
- Submit to Google Play Store

## Need Help?

If you encounter any issues not covered here:
1. Check the [Capacitor documentation](https://capacitorjs.com/docs)
2. Review [Android Studio troubleshooting](https://developer.android.com/studio/troubleshoot)
3. Search for specific error messages online

Happy building! 🚀 