# Indian Cinema Hub 🎬

A React-based Android app for browsing Indian movies and TV shows using The Movie Database (TMDB) API.

## Features

- 🎥 Browse Indian movies and TV shows
- 🌐 Filter by languages (Hindi, Tamil, Telugu, Malayalam, Kannada, etc.)
- 📺 Filter by streaming platforms (Netflix, Prime Video, Disney+ Hotstar, etc.)
- ⭐ Sort by popularity, rating, or release date
- 📅 Year range filtering
- 🔍 Search functionality
- 📱 Mobile-optimized responsive design
- ♾️ Infinite scrolling

## Tech Stack

- **Frontend**: React, TypeScript, Ant Design
- **Build Tool**: Vite
- **Mobile Framework**: Capacitor
- **API**: TMDB (The Movie Database)

## Prerequisites

- Node.js (v18 or later)
- Java JDK 11 or higher
- Git
- TMDB API Key (get one from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

## Quick Start

1. **Clone the repository**
   ```bash
   git clone [your-repo-url] tmdb
   cd tmdb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your TMDB API key:
   ```
   VITE_TMDB_API_KEY=your-actual-api-key-here
   ```

4. **Build the web app**
   ```bash
   npm run build
   ```

5. **Sync with Android**
   ```bash
   npx cap sync android
   ```

6. **Build the APK**
   
   For first-time setup, see **[ANDROID_BUILD.md](ANDROID_BUILD.md)** for detailed instructions.
   
   ```bash
   cd android
   ./gradlew assembleDebug  # macOS/Linux
   gradlew.bat assembleDebug  # Windows
   ```

   The APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Development

### Run in development mode
```bash
npm run dev
```

### Run as PWA
```bash
npm run build
npm run serve-pwa
```

## Building for Android

For detailed Android build instructions, including environment setup and troubleshooting, see:
- **[ANDROID_BUILD.md](ANDROID_BUILD.md)** - Full guide with Android Studio
- **[ANDROID_BUILD_MINIMAL.md](ANDROID_BUILD_MINIMAL.md)** - Lightweight setup without Android Studio

### Quick Build (if environment is already set up)
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug  # macOS/Linux
gradlew.bat assembleDebug  # Windows
```

The APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### SSL Certificate Issues

If you encounter SSL certificate errors during the Android build:

**Symptoms:**
```
PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: 
unable to find valid certification path to requested target
```

**Common Causes:**
- Corporate proxy/firewall intercepting SSL connections
- VPN software interfering with certificates
- Java keystore missing certificates
- Security software on your machine

**Solutions:**

1. **Check your network:**
   - Disable VPN if connected
   - Try on a different network (e.g., mobile hotspot)
   - Check with IT if on corporate network

2. **Verify Java certificates:**
   ```bash
   # Check certificate count (should be 100+)
   keytool -list -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit | grep "Entry" | wc -l
   ```

3. **Test connectivity:**
   ```bash
   curl -I https://repo1.maven.org/maven2/
   ```
   If this works but Gradle fails, it's a Java-specific issue

4. **Try these workarounds:**
   - Build with Android Studio (sometimes handles certs better)
   - Create `android/gradle.properties` with:
     ```
     systemProp.java.net.useSystemProxies=true
     ```

5. **Alternative solutions:**
   - Build on a different machine
   - Use GitHub Actions or CI/CD
   - Ask a colleague to build the APK
   - Use the PWA version instead

6. **For persistent issues:**
   - Contact your IT department about SSL interception
   - Check for corporate security software
   - Consider using a personal machine

### Java Version Issues
Ensure Java 11+ is installed and JAVA_HOME is set:
```bash
java -version  # Should show 11 or higher
echo $JAVA_HOME  # Should point to Java installation
```

### Build Failures
1. Clean the build: `cd android && ./gradlew clean`
2. Clear Gradle cache: `rm -rf ~/.gradle/caches/`
3. Re-sync: `cd .. && npx cap sync android`

## Project Structure

```
tmdb/
├── src/                    # React source code
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── public/                # Static assets
├── android/               # Android project
├── dist/                  # Built web assets
└── package.json          # Node dependencies
```

## Environment Variables

The app uses a hardcoded TMDB API key. For production, consider using environment variables:

```javascript
// src/services/api.ts
const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'your-api-key';
```

## License

This project is for educational purposes.
