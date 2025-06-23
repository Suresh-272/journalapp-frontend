import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Dimensions } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Sample media items for demonstration
const sampleMedia = [
  {
    id: '1',
    type: 'photo',
    uri: 'https://picsum.photos/id/237/300/300',
    title: 'Morning Walk',
    date: '2023-10-15',
    entryId: '1',
  },
  {
    id: '2',
    type: 'audio',
    uri: 'audio-file-path.mp3',
    duration: 120, // in seconds
    title: 'Voice Note',
    date: '2023-10-14',
    entryId: '2',
  },
  {
    id: '3',
    type: 'video',
    uri: 'video-file-path.mp4',
    duration: 45, // in seconds
    title: 'Beach Sunset',
    date: '2023-10-13',
    entryId: '3',
  },
  {
    id: '4',
    type: 'photo',
    uri: 'https://picsum.photos/id/1005/300/300',
    title: 'Coffee Shop',
    date: '2023-10-12',
    entryId: '4',
  },
  {
    id: '5',
    type: 'photo',
    uri: 'https://picsum.photos/id/1015/300/300',
    title: 'Mountain View',
    date: '2023-10-11',
    entryId: '5',
  },
  {
    id: '6',
    type: 'audio',
    uri: 'audio-file-path-2.mp3',
    duration: 90, // in seconds
    title: 'Thoughts',
    date: '2023-10-10',
    entryId: '6',
  },
  {
    id: '7',
    type: 'video',
    uri: 'video-file-path-2.mp4',
    duration: 60, // in seconds
    title: 'City Lights',
    date: '2023-10-09',
    entryId: '7',
  },
  {
    id: '8',
    type: 'photo',
    uri: 'https://picsum.photos/id/1025/300/300',
    title: 'My Dog',
    date: '2023-10-08',
    entryId: '8',
  },
];

// Format seconds to MM:SS
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function MediaScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filteredMedia = activeFilter === 'all' 
    ? sampleMedia 
    : sampleMedia.filter(item => item.type === activeFilter);

  const renderMediaItem = ({ item }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity 
        style={styles.mediaItem}
        onPress={() => router.push(`/entry/${item.entryId}`)}
        activeOpacity={0.8}
      >
        <GlassCard style={styles.mediaCard}>
          <View style={styles.thumbnailContainer}>
            {item.type === 'photo' && (
              <Image
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            )}
            
            {item.type === 'video' && (
              <>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                <View style={styles.videoBadge}>
                  <IconSymbol name="play.fill" size={16} color="#fff" />
                </View>
                <View style={styles.durationBadge}>
                  <ThemedText style={styles.durationText}>
                    {formatDuration(item.duration)}
                  </ThemedText>
                </View>
              </>
            )}
            
            {item.type === 'audio' && (
              <View style={styles.audioContainer}>
                <IconSymbol name="mic" size={32} color={Colors[colorScheme ?? 'light'].icon} />
                <View style={styles.durationBadge}>
                  <ThemedText style={styles.durationText}>
                    {formatDuration(item.duration)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.mediaInfo}>
            <ThemedText style={styles.mediaTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.mediaDate}>
              {formattedDate}
            </ThemedText>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Media</ThemedText>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setActiveFilter('all')}
        >
          <ThemedText 
            style={[
              styles.filterText, 
              activeFilter === 'all' && styles.activeFilterText
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setActiveFilter('photo')}
        >
          <ThemedText 
            style={[
              styles.filterText, 
              activeFilter === 'photo' && styles.activeFilterText
            ]}
          >
            Photos
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setActiveFilter('video')}
        >
          <ThemedText 
            style={[
              styles.filterText, 
              activeFilter === 'video' && styles.activeFilterText
            ]}
          >
            Videos
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setActiveFilter('audio')}
        >
          <ThemedText 
            style={[
              styles.filterText, 
              activeFilter === 'audio' && styles.activeFilterText
            ]}
          >
            Audio
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredMedia}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.mediaGrid}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap between items (16)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterOption: {
    marginRight: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 16,
    opacity: 0.6,
  },
  activeFilterText: {
    fontWeight: '600',
    opacity: 1,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
  },
  mediaGrid: {
    padding: 16,
  },
  mediaItem: {
    width: itemWidth,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  mediaCard: {
    padding: 0,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: itemWidth,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  audioContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(247, 197, 168, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
  },
  mediaInfo: {
    padding: 12,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  mediaDate: {
    fontSize: 12,
    opacity: 0.7,
  },
});