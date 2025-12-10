import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
  BackHandler,
  Alert,
  Modal,
} from 'react-native';
import Video, { VideoRef, ResizeMode } from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { XtremeChannel } from '../services/xtremeCodesAPI';
import EPG from './EPG';
import { useRemoteControl } from '../hooks/useRemoteControl';

const { width, height } = Dimensions.get('window');

interface StreamingPlayerProps {
  channel: XtremeChannel;
  streamUrl: string;
  onClose: () => void;
  onChannelChange?: (direction: 'next' | 'prev') => void;
  showControls?: boolean;
  autoPlay?: boolean;
}

const StreamingPlayer: React.FC<StreamingPlayerProps> = ({
  channel,
  streamUrl,
  onClose,
  onChannelChange,
  showControls = true,
  autoPlay = true,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.CONTAIN);
  const [showEPG, setShowEPG] = useState(false);

  // Enhanced remote control support
  useRemoteControl({
    enabled: true,
    onUp: () => {
      if (onChannelChange) onChannelChange('prev');
    },
    onDown: () => {
      if (onChannelChange) onChannelChange('next');
    },
    onLeft: () => {
      // Seek backward for VOD
      if (channel.stream_type !== 'live' && currentTime > 10) {
        seekTo(currentTime - 10);
      }
    },
    onRight: () => {
      // Seek forward for VOD
      if (channel.stream_type !== 'live' && currentTime < duration - 10) {
        seekTo(currentTime + 10);
      }
    },
    onEnter: () => {
      setIsPlaying(!isPlaying);
    },
    onBack: () => {
      if (showEPG) {
        setShowEPG(false);
      } else {
        onClose();
      }
    },
    onMenu: () => {
      setShowEPG(!showEPG);
    },
    onPlayPause: () => {
      setIsPlaying(!isPlaying);
    },
    onFastForward: () => {
      if (channel.stream_type !== 'live') {
        const newRate = Math.min(playbackRate + 0.5, 2.0);
        setPlaybackRate(newRate);
      }
    },
    onRewind: () => {
      if (channel.stream_type !== 'live') {
        const newRate = Math.max(playbackRate - 0.5, 0.5);
        setPlaybackRate(newRate);
      }
    },
    onVolumeUp: () => {
      // Volume control would require audio manager integration
    },
    onVolumeDown: () => {
      // Volume control would require audio manager integration
    },
    onMute: () => {
      toggleMute();
    },
    onChannelUp: () => {
      if (onChannelChange) onChannelChange('next');
    },
    onChannelDown: () => {
      if (onChannelChange) onChannelChange('prev');
    },
  });

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    if (showControlsOverlay && isPlaying) {
      const timer = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showControlsOverlay, isPlaying]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showEPG) {
        setShowEPG(false);
        return true;
      }
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [onClose, showEPG]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoad = (data: any) => {
    setIsLoading(false);
    setDuration(data.duration);
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setError('Failed to load stream. Please check your connection.');
    console.error('Video error:', error);
  };

  const handleEnd = () => {
    if (channel.stream_type === 'live') {
      // For live streams, restart playback
      videoRef.current?.seek(0);
      setIsPlaying(true);
    } else {
      // For VOD, stop playback
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleControls = () => {
    setShowControlsOverlay(!showControlsOverlay);
  };

  const cycleResizeMode = () => {
    const modes = [ResizeMode.CONTAIN, ResizeMode.COVER, ResizeMode.STRETCH];
    const currentIndex = modes.indexOf(resizeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setResizeMode(modes[nextIndex]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const seekTo = (position: number) => {
    videoRef.current?.seek(position);
    setCurrentTime(position);
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        resizeMode={resizeMode}
        controls={false}
        paused={!isPlaying}
        muted={isMuted}
        repeat={channel.stream_type === 'live'}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
        rate={playbackRate}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        onEnd={handleEnd}
        onProgress={(data) => setCurrentTime(data.currentTime)}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
        preferredForwardBufferDuration={30}
        textTracks={[
          {
            language: 'en',
            title: 'English',
            type: 'text/vtt',
            uri: '', // Add subtitle URL if available
          },
        ]}
        selectedTextTrack={{
          type: 'index',
          value: 0,
        }}
        audioOnly={false}
        poster={channel.stream_icon || undefined}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Icon name="hourglass-empty" size={50} color="#ffffff" />
          <Text style={styles.loadingText}>Loading Stream...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setIsPlaying(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls Overlay */}
      {showControls && showControlsOverlay && !isLoading && !error && (
        <View style={styles.controlsOverlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Icon name="arrow-back" size={30} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.channelInfo}>
              <Image
                source={{ uri: channel.stream_icon }}
                style={styles.channelLogo}
                defaultSource={require('../assets/images/default-channel.png')}
              />
              <Text style={styles.channelName} numberOfLines={1}>
                {channel.name}
              </Text>
            </View>

            <View style={styles.topRightControls}>
              {/* EPG Button for live channels */}
              {channel.stream_type === 'live' && (
                <TouchableOpacity
                  style={styles.epgButton}
                  onPress={() => setShowEPG(true)}
                >
                  <Icon name="tv-guide" size={30} color="#ffffff" />
                </TouchableOpacity>
              )}
              
              {onChannelChange && (
                <View style={styles.channelControls}>
                  <TouchableOpacity
                    style={styles.channelButton}
                    onPress={() => onChannelChange('prev')}
                  >
                    <Icon name="keyboard-arrow-up" size={30} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.channelButton}
                    onPress={() => onChannelChange('next')}
                  >
                    <Icon name="keyboard-arrow-down" size={30} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Center Play/Pause Button */}
          <TouchableOpacity style={styles.centerPlayButton} onPress={togglePlayPause}>
            <Icon
              name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
              size={80}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* Bottom Controls */}
          {channel.stream_type !== 'live' && (
            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(currentTime / duration) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.bottomButtons}>
                <TouchableOpacity onPress={toggleMute}>
                  <Icon
                    name={isMuted ? 'volume-off' : 'volume-up'}
                    size={30}
                    color="#ffffff"
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={cycleResizeMode}>
                  <Icon name="fullscreen" size={30} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Live Indicator */}
          {channel.stream_type === 'live' && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      )}

      {/* Touch to show controls */}
      <TouchableOpacity style={styles.touchOverlay} onPress={toggleControls} />

      {/* EPG Modal */}
      <Modal
        visible={showEPG}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <EPG
          channel={channel}
          onClose={() => setShowEPG(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    width: width,
    height: height,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  channelInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  channelLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
  },
  channelName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  epgButton: {
    padding: 10,
    marginRight: 10,
  },
  channelControls: {
    flexDirection: 'column',
  },
  channelButton: {
    padding: 5,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    marginHorizontal: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 5,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default StreamingPlayer;