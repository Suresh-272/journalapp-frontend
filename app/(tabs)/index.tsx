import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Animated, Alert, RefreshControl, ScrollView, Text } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getJournals } from '@/services/journalService';

// Custom color theme for the journal entries screen - matching new-entry theme
const journalTheme = {
  // Warm, earthy brown and beige colors inspired by the image
  headerBrown: '#8B6B4C', // Rich brown for header
  warmBeige: '#F7F3ED', // Very light warm beige background
  cardBeige: '#FFFFFF', // Pure white for cards - lighter container
  controlBeige: '#E8DCC8', // Warm beige for control panels
  darkBrown: '#3D2F22', // Darker brown for better text contrast
  mediumBrown: '#6B5643', // Medium brown for secondary text - darker
  warmAccent: '#B8956A', // Warm accent for highlights
  navBrown: '#6B5B4F', // Dark brown for navigation
  lightBrown: '#D4C4B0', // Light brown for borders
  // Additional properties needed for compatibility
  background: '#F7F3ED', // Same as warmBeige
  text: '#3D2F22', // Same as darkBrown - darker for better contrast
  tint: '#E8DCC8', // Same as controlBeige
  cardBackground: '#FFFFFF', // Pure white for better contrast
  tabIconDefault: '#6B5643', // Darker for better visibility
  pastelPink: '#F5F1EC', // Very light beige for mood container
  pastelBlue: '#E8DCC8', // Same as controlBeige
};

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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'personal' | 'professional'>('all');

  // Get current theme colors
  const theme = journalTheme;

  // Filter journals by selected category
  const filteredJournals = selectedCategory === 'all' 
    ? journals 
    : journals.filter(journal => journal.category === selectedCategory);

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
        onPress={() => router.push(`/journal-detail?id=${item._id}` as any)}
        activeOpacity={0.8}
      >
        <GlassCard style={[styles.entryCard, { backgroundColor: theme.cardBackground }] as any}>
          <View style={styles.entryHeader}>
            <View style={styles.titleContainer}>
              <ThemedText type="journalTitle" style={[styles.titleText, { color: theme.text }]}>
                {item.title}
              </ThemedText>
              <View style={[styles.categoryBadge, { backgroundColor: theme.pastelPink }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: theme.mediumBrown }]}>
                  {item.category === 'personal' ? '👤' : '💼'} {item.category}
                </ThemedText>
              </View>
            </View>
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

      {/* Category Filter */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterScroll}>
          <TouchableOpacity 
            style={[
              styles.categoryFilterButton, 
              { backgroundColor: selectedCategory === 'all' ? theme.warmAccent : theme.cardBackground },
              { borderColor: theme.lightBrown }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <ThemedText style={[
              styles.categoryFilterText, 
              { color: selectedCategory === 'all' ? theme.text : theme.mediumBrown }
            ]}>
              All
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryFilterButton, 
              { backgroundColor: selectedCategory === 'personal' ? theme.warmAccent : theme.cardBackground },
              { borderColor: theme.lightBrown }
            ]}
            onPress={() => setSelectedCategory('personal')}
          >
            <ThemedText style={styles.categoryFilterIcon}>👤</ThemedText>
            <ThemedText style={[
              styles.categoryFilterText, 
              { color: selectedCategory === 'personal' ? theme.text : theme.mediumBrown }
            ]}>
              Personal
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryFilterButton, 
              { backgroundColor: selectedCategory === 'professional' ? theme.warmAccent : theme.cardBackground },
              { borderColor: theme.lightBrown }
            ]}
            onPress={() => setSelectedCategory('professional')}
          >
            <ThemedText style={styles.categoryFilterIcon}>💼</ThemedText>
            <ThemedText style={[
              styles.categoryFilterText, 
              { color: selectedCategory === 'professional' ? theme.text : theme.mediumBrown }
            ]}>
              Professional
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
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
        data={filteredJournals}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.08)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewText: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 20,
    opacity: 0.85,
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
    borderColor: 'rgba(139, 111, 71, 0.15)',
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
  categoryFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryFilterScroll: {
    paddingHorizontal: 0,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  categoryFilterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});