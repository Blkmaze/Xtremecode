import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import xtremeCodesAPI, { XtremeEPGItem, XtremeChannel } from '../services/xtremeCodesAPI';

const { width, height } = Dimensions.get('window');

interface EPGProps {
  channel: XtremeChannel;
  onClose: () => void;
  onProgramSelect?: (program: XtremeEPGItem) => void;
}

const EPG: React.FC<EPGProps> = ({ channel, onClose, onProgramSelect }) => {
  const [epgData, setEpgData] = useState<XtremeEPGItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<XtremeEPGItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadEPGData();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [channel.id]);

  const loadEPGData = async () => {
    setIsLoading(true);
    try {
      const epg = await xtremeCodesAPI.getEPG(channel.id, 50);
      setEpgData(epg);
    } catch (error) {
      console.error('Error loading EPG data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (start: number, end: number) => {
    const duration = Math.floor((end - start) / 60);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isProgramLive = (start: number, end: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= start && now <= end;
  };

  const isProgramPast = (end: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now > end;
  };

  const getProgramProgress = (start: number, end: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < start || now > end) return 0;
    return ((now - start) / (end - start)) * 100;
  };

  const groupProgramsByDate = (programs: XtremeEPGItem[]) => {
    const groups: { [date: string]: XtremeEPGItem[] } = {};
    
    programs.forEach(program => {
      const date = formatDate(program.start);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(program);
    });

    return Object.entries(groups).map(([date, programs]) => ({
      date,
      programs: programs.sort((a, b) => a.start - b.start),
    }));
  };

  const renderProgram = ({ item }: { item: XtremeEPGItem }) => {
    const isLive = isProgramLive(item.start, item.end);
    const isPast = isProgramPast(item.end);
    const progress = getProgramProgress(item.start, item.end);

    return (
      <TouchableOpacity
        style={[
          styles.programItem,
          selectedProgram?.id === item.id && styles.selectedProgramItem,
          isLive && styles.liveProgramItem,
          isPast && styles.pastProgramItem,
        ]}
        onPress={() => {
          setSelectedProgram(item);
          onProgramSelect?.(item);
        }}
      >
        <View style={styles.programTime}>
          <Text style={[
            styles.programTimeText,
            isLive && styles.liveTimeText,
            isPast && styles.pastTimeText,
          ]}>
            {formatTime(item.start)}
          </Text>
          <Text style={styles.programDuration}>
            {formatDuration(item.start, item.end)}
          </Text>
        </View>

        <View style={styles.programContent}>
          <View style={styles.programHeader}>
            <Text style={[
              styles.programTitle,
              isLive && styles.liveTitleText,
              isPast && styles.pastTitleText,
            ]} numberOfLines={2}>
              {item.title}
            </Text>
            {isLive && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          <Text style={[
            styles.programDescription,
            isPast && styles.pastDescriptionText,
          ]} numberOfLines={3}>
            {item.description}
          </Text>

          {isLive && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }: { item: { date: string; programs: XtremeEPGItem[] } }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{item.date}</Text>
      <FlatList
        data={item.programs}
        renderItem={renderProgram}
        keyExtractor={(program) => program.id}
        scrollEnabled={false}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="hourglass-empty" size={50} color="#666666" />
        <Text style={styles.loadingText}>Loading Program Guide...</Text>
      </View>
    );
  }

  const groupedPrograms = groupProgramsByDate(epgData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Icon name="arrow-back" size={30} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.channelInfo}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          <Text style={styles.epgTitle}>Program Guide</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={loadEPGData}>
          <Icon name="refresh" size={30} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Current Time Indicator */}
      <View style={styles.currentTimeContainer}>
        <Icon name="access-time" size={20} color="#007AFF" />
        <Text style={styles.currentTimeText}>
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </Text>
      </View>

      {/* EPG Content */}
      {groupedPrograms.length > 0 ? (
        <FlatList
          data={groupedPrograms}
          renderItem={renderDateGroup}
          keyExtractor={(group) => group.date}
          style={styles.epgList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Icon name="tv-off" size={50} color="#666666" />
          <Text style={styles.noDataText}>No program data available</Text>
          <Text style={styles.noDataSubText}>
            Program guide information is not available for this channel
          </Text>
        </View>
      )}

      {/* Program Details Modal */}
      {selectedProgram && (
        <View style={styles.programDetailsOverlay}>
          <View style={styles.programDetails}>
            <View style={styles.programDetailsHeader}>
              <Text style={styles.programDetailsTitle}>
                {selectedProgram.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedProgram(null)}>
                <Icon name="close" size={30} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.programDetailsInfo}>
              <Text style={styles.programDetailsTime}>
                {formatDate(selectedProgram.start)} • {formatTime(selectedProgram.start)} - {formatTime(selectedProgram.end)}
              </Text>
              <Text style={styles.programDetailsDuration}>
                Duration: {formatDuration(selectedProgram.start, selectedProgram.end)}
              </Text>
            </View>
            
            <ScrollView style={styles.programDetailsDescription}>
              <Text style={styles.programDetailsDescriptionText}>
                {selectedProgram.description || 'No description available'}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 10,
  },
  channelInfo: {
    flex: 1,
    marginHorizontal: 20,
  },
  channelName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  epgTitle: {
    color: '#666666',
    fontSize: 14,
    marginTop: 2,
  },
  refreshButton: {
    padding: 10,
  },
  currentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  currentTimeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  epgList: {
    flex: 1,
    padding: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  programItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#333333',
  },
  selectedProgramItem: {
    backgroundColor: '#007AFF20',
    borderLeftColor: '#007AFF',
  },
  liveProgramItem: {
    backgroundColor: '#ff444420',
    borderLeftColor: '#ff4444',
  },
  pastProgramItem: {
    opacity: 0.6,
  },
  programTime: {
    width: 80,
    alignItems: 'flex-start',
  },
  programTimeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  liveTimeText: {
    color: '#ff4444',
  },
  pastTimeText: {
    color: '#666666',
  },
  programDuration: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  programContent: {
    flex: 1,
    marginLeft: 15,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  programTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  liveTitleText: {
    color: '#ff4444',
  },
  pastTitleText: {
    color: '#999999',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 5,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  programDescription: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 18,
  },
  pastDescriptionText: {
    color: '#666666',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#333333',
    borderRadius: 1.5,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff4444',
    borderRadius: 1.5,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  noDataSubText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  programDetailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  programDetails: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: height * 0.8,
    width: width * 0.9,
  },
  programDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  programDetailsTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  programDetailsInfo: {
    marginBottom: 15,
  },
  programDetailsTime: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 5,
  },
  programDetailsDuration: {
    color: '#666666',
    fontSize: 14,
  },
  programDetailsDescription: {
    maxHeight: 200,
  },
  programDetailsDescriptionText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EPG;