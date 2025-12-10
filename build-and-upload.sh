#!/bin/bash

# Xtreme Stream Player - Build and Upload Script
# This script builds the APK and helps you upload it to sharing services

set -e

echo "🚀 Xtreme Stream Player - Build & Upload Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from project root."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java JDK 17+ first:"
    echo "   - Windows: winget install Oracle.JavaRuntimeEnvironment"
    echo "   - Mac: brew install openjdk@17"
    echo "   - Linux: sudo apt install openjdk-17-jdk"
    exit 1
fi

# Check if Android SDK is available
if [ ! -d "$ANDROID_HOME" ] && [ ! -d "$HOME/Android/Sdk" ]; then
    echo "❌ Android SDK not found. Please install Android Studio first:"
    echo "   Download from: https://developer.android.com/studio"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build/
rm -rf android/build/

# Navigate to Android directory
cd android

# Clean Gradle build
echo "🧹 Cleaning Gradle build..."
./gradlew clean

# Build release APK
echo "🔨 Building release APK..."
echo "   This may take 5-10 minutes..."
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    
    # Get APK info
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    echo "📱 APK Details:"
    echo "   Location: $APK_PATH"
    echo "   Size: $APK_SIZE"
    
    # Create a copy with timestamp
    cp "$APK_PATH" "../XtremeStreamPlayer_${TIMESTAMP}.apk"
    echo "📋 Backup created: XtremeStreamPlayer_${TIMESTAMP}.apk"
    
    echo ""
    echo "🎉 APK is ready for upload!"
    echo ""
    echo "📤 Upload Options:"
    echo ""
    echo "1. Dropbox Desktop:"
    echo "   - Copy APK to your Dropbox folder"
    echo "   - Right-click → Share → Create link"
    echo ""
    echo "2. Dropbox Web:"
    echo "   - Go to https://www.dropbox.com"
    echo "   - Upload the APK file"
    echo "   - Create shareable link"
    echo ""
    echo "3. Google Drive:"
    echo "   - Upload to Google Drive"
    echo "   - Share with 'Anyone with link can view'"
    echo ""
    echo "4. Direct Hosting:"
    echo "   - Transfer.sh: curl --upload-file '$APK_PATH' https://transfer.sh/XtremeStreamPlayer.apk"
    echo ""
    echo "🔗 Create Short Link:"
    echo "   - Use Bitly: https://bitly.com"
    echo "   - Use TinyURL: https://tinyurl.com"
    echo ""
    echo "📺 Fire Stick Installation:"
    echo "   1. Enable 'Apps from Unknown Sources' in Settings"
    echo "   2. Install Downloader app from Amazon Store"
    echo "   3. Enter your short link in Downloader"
    echo "   4. Install and enjoy!"
    echo ""
    echo "📱 APK File: $(pwd)/$APK_PATH"
    
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

cd ..