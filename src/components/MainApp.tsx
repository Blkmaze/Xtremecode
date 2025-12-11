import { FocusableChannelGrid } from './FocusableChannelGrid';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StreamingPlayer from './StreamingPlayer';
import xtremeCodesAPI, { XtremeChannel, XtremeCategory } from '../services/xtremeCodesAPI';

const { width, height } = Dimensions.get('window');

// Configuration Screen
const ConfigScreen: React.FC<{ onConfigured: () => void }> = ({ onConfigured }) => {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = async () => {
    if (!url || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await xtremeCodesAPI.setConfig({ url, username, password });
      const isAuthenticated = await xtremeCodesAPI.authenticate();
      
      if (isAuthenticated) {
        onConfigured();
      } else {
        Alert.alert('Error', 'Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Please check your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.configContainer}>
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Xtreme Stream Player Setup</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Server URL</Text>
          <TextInput
            style={styles.textInput}
            value={url}
            onChangeText={setUrl}
            placeholder="http://your-server.com"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.textInput}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#666666"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#666666"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveConfig}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Channel List Component
const ChannelList: React.FC<{
  channels: XtremeChannel[];
  onChannelSelect: (channel: XtremeChannel) => void;
  selectedChannelId?: number;
}> = ({ channels, onChannelSelect, selectedChannelId }) => {
  const renderChannel = ({ item }: { item: XtremeChannel }) => (
    <TouchableOpacity
      style={[
        styles.channelItem,
        selectedChannelId === item.id && styles.selectedChannelItem,
      ]}
      onPress={() => onChannelSelect(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.stream_icon }}
        style={styles.channelLogo}
        defaultSource={require('../assets/images/default-channel.png')}
      />
      <View style={styles.channelInfo}>
        <Text style={styles.channelName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.channelType}>
          {item.stream_type.toUpperCase()}
        </Text>
      </View>
      {selectedChannelId === item.id && (
        <Icon name="play-arrow" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={channels}
      renderItem={renderChannel}
      keyExtractor={(item) => item.id.toString()}
      style={styles.channelList}
      showsVerticalScrollIndicator={false}
    />
  );
};

// Category Tabs
const CategoryTabs: React.FC<{
  categories: XtremeCategory[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}> = ({ categories, selectedCategory, onCategorySelect }) => {
  const allCategories = [{ category_id: 0, category_name: 'All', parent_id: 0 }, ...categories];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}
    >
      {allCategories.map((category) => (
        <TouchableOpacity
          key={category.category_id}
          style={[
            styles.categoryTab,
            selectedCategory === category.category_id && styles.selectedCategoryTab,
          ]}
          onPress={() => onCategorySelect(
            category.category_id === 0 ? null : category.category_id
          )}
        >
          <Text
            style={[
              styles.categoryTabText,
              selectedCategory === category.category_id && styles.selectedCategoryTabText,
            ]}
          >
            {category.category_name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Main App Component
const MainApp: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<XtremeChannel | null>(null);
  const [channels, setChannels] = useState<XtremeChannel[]>([]);
  const [categories, setCategories] = useState<XtremeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [streamType, setStreamType] = useState<'live' | 'vod' | 'series'>('live');
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Load configuration on app start
  useEffect(() => {
    const loadConfig = async () => {
      const config = await xtremeCodesAPI.loadConfig();
      if (config) {
        const isAuthenticated = await xtremeCodesAPI.authenticate();
        if (isAuthenticated) {
          setIsConfigured(true);
          loadData();
        }
      }
    };
    loadConfig();
  }, []);

  // Load data based on stream type
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let categoriesData: XtremeCategory[] = [];
      let channelsData: XtremeChannel[] = [];

      switch (streamType) {
        case 'live':
          categoriesData = await xtremeCodesAPI.getLiveCategories();
          channelsData = await xtremeCodesAPI.getLiveStreams(selectedCategory || undefined);
          break;
        case 'vod':
          categoriesData = await xtremeCodesAPI.getVodCategories();
          channelsData = await xtremeCodesAPI.getVodStreams(selectedCategory || undefined);
          break;
        case 'series':
          categoriesData = await xtremeCodesAPI.getSeriesCategories();
          channelsData = await xtremeCodesAPI.getSeriesStreams(selectedCategory || undefined);
          break;
      }

      setCategories(categoriesData);
      setChannels(channelsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  }, [streamType, selectedCategory]);

  // Reload data when stream type or category changes
  useEffect(() => {
    if (isConfigured) {
      loadData();
    }
  }, [loadData, isConfigured]);

  const handleChannelSelect = async (channel: XtremeChannel) => {
    try {
      const url = await xtremeCodesAPI.getStreamUrl(channel.id, channel.stream_type);
      setStreamUrl(url);
      setCurrentChannel(channel);
      setShowPlayer(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get stream URL');
    }
  };

  const handleChannelChange = async (direction: 'next' | 'prev') => {
    const currentIndex = channels.findIndex(ch => ch.id === currentChannel?.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1;
    }

    const newChannel = channels[newIndex];
    if (newChannel) {
      await handleChannelSelect(newChannel);
    }
  };

  const handlePlayerClose = () => {
    setShowPlayer(false);
    setCurrentChannel(null);
    setStreamUrl('');
  };

  if (!isConfigured) {
    return <ConfigScreen onConfigured={() => setIsConfigured(true)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xtreme Stream Player</Text>
        
        {/* Stream Type Selector */}
        <View style={styles.streamTypeSelector}>
          {(['live', 'vod', 'series'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.streamTypeButton,
                streamType === type && styles.selectedStreamTypeButton,
              ]}
              onPress={() => {
                setStreamType(type);
                setSelectedCategory(null);
              }}
            >
              <Text
                style={[
                  styles.streamTypeButtonText,
                  streamType === type && styles.selectedStreamTypeButtonText,
                ]}
              >
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Channel List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Icon name="hourglass-empty" size={50} color="#666666" />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      ) : (
        <ChannelList
          channels={channels}
          onChannelSelect={handleChannelSelect}
          selectedChannelId={currentChannel?.id}
        />
      )}

      {/* Player Modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {currentChannel && (
          <StreamingPlayer
            channel={currentChannel}
            streamUrl={streamUrl}
            onClose={handlePlayerClose}
            onChannelChange={handleChannelChange}
          />
        )}
      </Modal>
    </View>
  );
};

export default MainApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  configContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  configCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  configTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  streamTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  streamTypeButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectedStreamTypeButton: {
    backgroundColor: '#007AFF',
  },
  streamTypeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedStreamTypeButtonText: {
    color: '#ffffff',
  },
  categoryTabs: {
    backgroundColor: '#2a2a2a',
    maxHeight: 60,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryTab: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
  },
  selectedCategoryTab: {
    backgroundColor: '#007AFF',
  },
  categoryTabText: {
    color: '#ffffff',
    fontSize: 14,
  },
  selectedCategoryTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  channelList: {
    flex: 1,
    padding: 20,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedChannelItem: {
    backgroundColor: '#007AFF20',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  channelLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3a3a3a',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 15,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  channelType: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
});