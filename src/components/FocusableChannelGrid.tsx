import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { XtremeChannel } from '../services/xtremeCodesAPI';

interface FocusableChannelGridProps {
  channels: XtremeChannel[];
  onSelectChannel: (channel: XtremeChannel) => void;
  numColumns?: number;
}

export const FocusableChannelGrid: React.FC<FocusableChannelGridProps> = ({
  channels,
  onSelectChannel,
  numColumns = 4,
}) => {
  const [focusedId, setFocusedId] = useState<number | null>(null);

  const renderItem = useCallback(
    ({ item, index }: { item: XtremeChannel; index: number }) => {
      const isFocused =
        focusedId === item.id || (focusedId === null && index === 0);

      return (
        <TouchableOpacity
          style={[styles.card, isFocused && styles.cardFocused]}
          focusable={true}
          hasTVPreferredFocus={index === 0}
          onFocus={() => setFocusedId(item.id)}
          onBlur={() => {
            if (focusedId === item.id) setFocusedId(null);
          }}
          onPress={() => onSelectChannel(item)}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.stream_type?.toUpperCase?.() ?? 'LIVE'}
          </Text>
        </TouchableOpacity>
      );
    },
    [focusedId, onSelectChannel],
  );

  return (
    <FlatList
      data={channels}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      numColumns={numColumns}
      contentContainerStyle={styles.grid}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    flex: 1,
    margin: 8,
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
    padding: 12,
    justifyContent: 'center',
  },
  cardFocused: {
    borderColor: '#ffcc33',
    backgroundColor: '#222',
    transform: [{ scale: 1.03 }],
    shadowColor: '#ffcc33',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardMeta: {
    color: '#aaa',
    fontSize: 12,
  },
});
