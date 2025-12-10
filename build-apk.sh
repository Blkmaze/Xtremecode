#!/bin/bash

# Xtreme Stream Player - Build Script for Android APK
# This script builds a production APK compatible with Fire Stick and other Android devices

set -e

echo "🚀 Building Xtreme Stream Player APK..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Android SDK is available
if ! command -v adb &> /dev/null; then
    echo "⚠️  Warning: ADB not found. Make sure Android SDK is installed for testing."
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build/
rm -rf android/build/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Navigate to Android directory
cd android

# Clean Gradle build
echo "🧹 Cleaning Gradle build..."
./gradlew clean

# Build release APK
echo "🔨 Building release APK..."
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Build successful!"
    echo "📱 APK Location: android/app/build/outputs/apk/release/app-release.apk"
    
    # Get APK info
    APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
    echo "📊 APK Size: $APK_SIZE"
    
    # Create a copy with timestamp
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp app/build/outputs/apk/release/app-release.apk "XtremeStreamPlayer_${TIMESTAMP}.apk"
    echo "📋 Backup created: XtremeStreamPlayer_${TIMESTAMP}.apk"
    
    echo ""
    echo "🎉 Xtreme Stream Player APK is ready!"
    echo ""
    echo "📋 Installation Instructions:"
    echo "1. Enable 'Install from Unknown Sources' on your Android device"
    echo "2. Transfer the APK to your device (USB, ADB, or cloud storage)"
    echo "3. Install the APK and enjoy!"
    echo ""
    echo "🔥 Fire Stick Installation:"
    echo "1. Enable Apps from Unknown Sources in Settings > My Fire TV > Developer Options"
    echo "2. Use Apps2Fire or send via ADB: adb install XtremeStreamPlayer.apk"
    echo ""
    echo "📺 Features:"
    echo "✅ Live TV streaming with HLS/DASH support"
    echo "✅ Video on Demand (VOD) playback"
    echo "✅ Series streaming"
    echo "✅ Electronic Program Guide (EPG)"
    echo "✅ Full remote control support"
    echo "✅ D-pad navigation"
    echo "✅ Optimized for Fire Stick and Android TV"
    
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

cd ..