import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
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
  isProtected?: boolean;
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



export default function EntriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const fabOpacity = useRef(new Animated.Value(1)).current;
  
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
                        onPress={() => router.push(`/journal/detail?id=${item._id}` as any)}
        activeOpacity={0.8}
      >
        <GlassCard style={[styles.entryCard, { backgroundColor: theme.cardBackground }] as any}>
          <View style={styles.entryHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <ThemedText type="journalTitle" style={[styles.titleText, { color: theme.text }]}>
                  {item.title}
                </ThemedText>
                {item.isProtected && (
                  <Text style={styles.lockIcon}>Locked</Text>
                )}
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: theme.pastelPink }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: theme.mediumBrown }]}>
                  {item.category}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.dateText, { color: theme.tabIconDefault }]}>{formattedDate}</ThemedText>
          </View>
          
          <ThemedText numberOfLines={2} style={[styles.previewText, { color: theme.text }]}>
            {item.content}
          </ThemedText>
          
          {/* <View style={styles.entryFooter}>
            <View style={[styles.moodContainer, { backgroundColor: theme.pastelPink }]}>
              <ThemedText style={styles.moodText}>
                {item.mood || 'neutral'}
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
          </View> */}
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
          style={[styles.profileButton, { backgroundColor: theme.pastelPink }]}
          onPress={() => router.push('/profile')}
        >
          <IconSymbol name="person.circle" size={24} color={theme.text} />
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
      
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[
            styles.fab, 
            { 
              backgroundColor: theme.warmAccent,
              shadowColor: theme.darkBrown,
            }
          ]}
          onPress={handleAddEntry}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus" size={30} color={theme.cardBackground} />
        </TouchableOpacity>
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 80,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'DancingScript-Bold',
    fontSize: 32,
    lineHeight: 40,
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
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    lineHeight: 26,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  listContainer: {
    padding: 16,
  },
  entryContainer: {
    marginBottom: 16,
  },
  entryCard: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 111, 71, 0.12)',
    backgroundColor: '#FFFFFF',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
    color: '#3D2F22',
  },
  lockIcon: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 111, 71, 0.15)',
    color: '#6B5643',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 111, 71, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#8B7355',
    textAlign: 'right',
  },
  previewText: {
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    color: '#5D4E37',
    opacity: 0.85,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 111, 71, 0.08)',
  },
  moodContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 111, 71, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    minWidth: 70,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 111, 71, 0.05)',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Increased bottom margin to avoid tab bar
    zIndex: 1000, // Ensure it's above other elements
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
});