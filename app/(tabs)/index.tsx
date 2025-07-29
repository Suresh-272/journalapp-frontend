import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Animated, Alert, RefreshControl } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getJournals } from '@/services/journalService';

// TypeScript interfaces
interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  location?: string;
  category: string;
  media: Array<{
    _id: string;
    type: 'image' | 'audio' | 'video';
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface JournalResponse {
  success: boolean;
  count: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: JournalEntry[];
}

// Mood emoji mapping
const moodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  thoughtful: '🤔',
  excited: '🎉',
  calm: '😌',
  neutral: '😐',
};

export default function EntriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const fabOpacity = new Animated.Value(1);
  
  // State for journal data
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get current theme colors
  const theme = Colors[colorScheme ?? 'light'];

  // Fetch journal entries
  const fetchJournals = async (page = 1, isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const response: JournalResponse = await getJournals(page, 10);
      
      if (response.success) {
        if (page === 1 || isRefresh) {
          setJournals(response.data);
        } else {
          setJournals(prev => [...prev, ...response.data]);
        }
        
        setCurrentPage(page);
        setHasMore(!!response.pagination?.next);
      } else {
        setError('Failed to fetch journal entries');
      }
    } catch (err: any) {
      console.error('Error fetching journals:', err);
      setError(err.error || 'Failed to fetch journal entries');
      Alert.alert('Error', err.error || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load more journals
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchJournals(currentPage + 1);
    }
  };

  // Refresh journals
  const onRefresh = () => {
    fetchJournals(1, true);
  };

  // Initial load
  useEffect(() => {
    fetchJournals();
  }, []);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (currentScrollY > lastScrollY && showFAB) {
      // Scrolling down, hide FAB
      setShowFAB(false);
      Animated.timing(fabOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (currentScrollY < lastScrollY && !showFAB) {
      // Scrolling up, show FAB
      setShowFAB(true);
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    setLastScrollY(currentScrollY);
  };

  const renderJournalEntry = ({ item }: { item: JournalEntry }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Check for media types
    const hasPhoto = item.media.some(m => m.type === 'image');
    const hasAudio = item.media.some(m => m.type === 'audio');
    const hasVideo = item.media.some(m => m.type === 'video');

    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => router.push(`/entry/${item._id}` as any)}
        activeOpacity={0.8}
      >
        <GlassCard style={[styles.entryCard, { backgroundColor: theme.cardBackground }] as any}>
          <View style={styles.entryHeader}>
            <ThemedText type="journalTitle" style={[styles.titleText, { color: theme.text }]}>
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.dateText, { color: theme.tabIconDefault }]}>{formattedDate}</ThemedText>
          </View>
          
          <ThemedText numberOfLines={2} style={[styles.previewText, { color: theme.text }]}>
            {item.content}
          </ThemedText>
          
          <View style={styles.entryFooter}>
            <View style={[styles.moodContainer, { backgroundColor: theme.pastelPink }]}>
              <ThemedText style={styles.moodEmoji}>
                {moodEmojis[item.mood] || '😐'}
              </ThemedText>
            </View>
            
            <View style={styles.mediaIcons}>
              {hasPhoto && (
                <IconSymbol name="photo" size={18} color={theme.tabIconDefault} />
              )}
              {hasAudio && (
                <IconSymbol name="mic" size={18} color={theme.tabIconDefault} />
              )}
              {hasVideo && (
                <IconSymbol name="video" size={18} color={theme.tabIconDefault} />
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const handleAddEntry = () => {
    router.push('/new-entry');
  };

  const handleInspireMe = () => {
    // Show a random journal prompt
    const prompts = [
      "What secret dream do you carry but rarely speak about?",
      "Describe a moment today that made you feel alive.",
      "What's something you're grateful for right now?",
      "If you could change one thing about your day, what would it be?",
      "What's a small joy you experienced recently?"
    ];
    
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    // Show prompt in a modal or navigate to new entry with this prompt
  };

  if (loading && journals.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: theme.tabIconDefault }]}>Loading your journal entries...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.headerTitle, { color: theme.text }]}>My Journal</ThemedText>
        <TouchableOpacity 
          style={[styles.inspireButton, { backgroundColor: theme.tint }]}
          onPress={handleInspireMe}
        >
          <ThemedText style={[styles.inspireButtonText, { color: theme.text }]}>Inspire Me</ThemedText>
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.tint }]} onPress={() => fetchJournals(1, true)}>
            <ThemedText style={[styles.retryButtonText, { color: theme.text }]}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={journals}
        renderItem={renderJournalEntry}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.tint]}
            tintColor={theme.tint}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>No journal entries yet</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>Start writing your first entry!</ThemedText>
            </View>
          ) : null
        }
      />
      
      <Animated.View style={[styles.fabContainer, { opacity: fabOpacity }]}>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.tint }]}
          onPress={handleAddEntry}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={24} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 28,
  },
  inspireButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  inspireButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  entryContainer: {
    marginBottom: 16,
  },
  entryCard: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.1)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontWeight: '600',
    fontSize: 18,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewText: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.2)',
  },
  moodEmoji: {
    fontSize: 20,
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
});