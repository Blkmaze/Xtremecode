# Xtreme Stream Player

A comprehensive Android IPTV streaming application built with React Native, compatible with Fire Stick, Android TV, and all Android devices. Features Xtreme Codes API integration with adaptive streaming support.

## 🚀 Features

### Core Functionality
- **Live TV Streaming** - Watch live channels with HLS/DASH adaptive streaming
- **Video on Demand (VOD)** - Stream movies and on-demand content
- **Series Streaming** - Access TV series and multi-season content
- **Electronic Program Guide (EPG)** - View program schedules and information
- **Multi-Format Support** - HLS, DASH, MP4, TS, and more

### Device Compatibility
- **Amazon Fire Stick** (All generations)
- **Amazon Fire TV** (All models)
- **Android TV** (All versions)
- **Android Mobile & Tablet** (Android 5.0+)
- **Android TV Boxes** (All manufacturers)

### User Experience
- **Remote Control Support** - Full D-pad navigation and button mapping
- **Voice Control** - Compatible with Alexa and Google Assistant
- **Touch Support** - Works with touchscreen devices
- **Keyboard Navigation** - Full keyboard shortcut support
- **Responsive Design** - Optimized for all screen sizes

## 📱 Installation

### Method 1: Direct APK Installation
1. Download the latest APK from the releases section
2. Enable "Install from Unknown Sources" on your device
3. Install the APK and launch the app

### Method 2: Fire Stick Installation
1. Go to Settings > My Fire TV > Developer Options
2. Enable "Apps from Unknown Sources"
3. Use Apps2Fire app or ADB to install:
   ```bash
   adb install XtremeStreamPlayer.apk
   ```

### Method 3: Android TV Installation
1. Enable unknown sources in Settings > Device Preferences > Security
2. Transfer APK via USB or network sharing
3. Install using a file manager app

## ⚙️ Configuration

### First-Time Setup
1. Launch the app
2. Enter your Xtreme Codes server details:
   - **Server URL**: Your IPTV provider's portal URL
   - **Username**: Your IPTV account username
   - **Password**: Your IPTV account password
3. Click "Connect" to authenticate

### Server Requirements
- Xtreme Codes compatible IPTV service
- HTTP/HTTPS streaming endpoints
- Valid authentication credentials

## 🎮 Remote Control Guide

### Navigation
- **D-Pad Up/Down** - Channel switching
- **D-Pad Left/Right** - Seek (VOD only)
- **OK/Enter** - Play/Pause
- **Back** - Go back or exit
- **Menu** - Open EPG (Electronic Program Guide)

### Media Controls
- **Play/Pause** - Toggle playback
- **Fast Forward** - Increase playback speed (VOD)
- **Rewind** - Decrease playback speed (VOD)
- **Channel Up/Down** - Switch channels
- **Volume Up/Down** - Adjust volume
- **Mute** - Toggle audio mute

### Number Keys
- **0-9** - Direct channel selection (when supported)

## 🔧 Technical Specifications

### Streaming Technology
- **Adaptive Bitrate Streaming** - HLS and DASH support
- **Buffer Optimization** - Smart buffering for smooth playback
- **Multiple Codecs** - H.264, H.265, VP9, AV1
- **Audio Support** - AAC, AC3, DTS, MP3
- **Subtitle Support** - SRT, VTT, ASS formats

### Performance Features
- **Hardware Acceleration** - GPU-accelerated video decoding
- **Memory Management** - Optimized for low-memory devices
- **Network Adaptation** - Automatic quality adjustment
- **Background Playback** - Continue audio when app is backgrounded

### Security
- **Secure Streaming** - HTTPS and DRM support
- **Credential Protection** - Encrypted storage of login details
- **Network Security** - Certificate pinning support

## 📺 Screen Optimization

### Fire Stick (1080p)
- Optimized layout for remote control navigation
- Large, touch-friendly buttons
- High contrast UI for visibility

### Android TV (4K)
- Ultra HD interface scaling
- Enhanced graphics for large screens
- Multi-window support

### Mobile Devices
- Responsive touch interface
- Portrait and landscape support
- Gesture controls

## 🛠️ Development

### Build Requirements
- Node.js 16+
- React Native CLI
- Android Studio
- Android SDK (API 21+)

### Build Commands
```bash
# Install dependencies
npm install

# Build for Android
npm run android

# Build release APK
npm run build:android

# Build debug APK
npm run build:debug
```

### Project Structure
```
src/
├── components/
│   ├── MainApp.tsx          # Main application component
│   ├── StreamingPlayer.tsx   # Video player with controls
│   └── EPG.tsx             # Electronic Program Guide
├── services/
│   └── xtremeCodesAPI.ts    # API integration service
└── hooks/
    └── useRemoteControl.ts   # Remote control handler
```

## 🔍 Troubleshooting

### Common Issues

**Stream Not Loading**
- Check internet connection
- Verify server URL and credentials
- Ensure server supports external access

**Remote Control Not Working**
- Check device compatibility
- Restart the application
- Ensure D-pad navigation is enabled

**Audio Issues**
- Check device volume settings
- Try different audio tracks in settings
- Restart the stream

**EPG Not Showing**
- Verify EPG is enabled on your server
- Check internet connectivity
- Refresh EPG data from menu

### Performance Optimization

**Buffering Issues**
- Check internet speed (minimum 5 Mbps recommended)
- Close other applications
- Restart your router/modem

**Laggy Interface**
- Restart the application
- Clear app cache
- Check device storage space

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and feature requests:
- Create an issue on GitHub
- Check the troubleshooting section
- Contact your IPTV provider for server issues

---

**Note**: This application requires a compatible Xtreme Codes IPTV service. The app does not provide any content itself - it's a player that works with your existing IPTV subscription.