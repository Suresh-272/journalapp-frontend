import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Animated } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Sample journal entries for demonstration
const sampleEntries = [
  {
    id: '1',
    date: '2023-10-15',
    title: 'Morning Reflections',
    preview: 'Today I woke up feeling refreshed and ready to tackle the day...',
    mood: 'happy',
    hasPhoto: true,
    hasAudio: false,
    hasVideo: false,
  },
  {
    id: '2',
    date: '2023-10-14',
    title: 'Evening Thoughts',
    preview: 'As the day comes to a close, I find myself reflecting on...',
    mood: 'thoughtful',
    hasPhoto: false,
    hasAudio: true,
    hasVideo: false,
  },
  // Add more sample entries
];

// Mood emoji mapping
const moodEmojis = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  thoughtful: '🤔',
  excited: '🎉',
  calm: '😌',
};

export default function EntriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [showFAB, setShowFAB] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const fabOpacity = new Animated.Value(1);

  const handleScroll = (event) => {
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

  const renderJournalEntry = ({ item }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => router.push(`/entry/${item.id}`)}
        activeOpacity={0.8}
      >
        <GlassCard style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <ThemedText type="journalTitle">{item.title}</ThemedText>
            <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
          </View>
          
          <ThemedText numberOfLines={2} style={styles.previewText}>
            {item.preview}
          </ThemedText>
          
          <View style={styles.entryFooter}>
            <View style={styles.moodContainer}>
              <ThemedText style={styles.moodEmoji}>
                {moodEmojis[item.mood] || '😐'}
              </ThemedText>
            </View>
            
            <View style={styles.mediaIcons}>
              {item.hasPhoto && (
                <IconSymbol name="photo" size={18} color={Colors[colorScheme ?? 'light'].icon} />
              )}
              {item.hasAudio && (
                <IconSymbol name="mic" size={18} color={Colors[colorScheme ?? 'light'].icon} />
              )}
              {item.hasVideo && (
                <IconSymbol name="video" size={18} color={Colors[colorScheme ?? 'light'].icon} />
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

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Journal</ThemedText>
        <TouchableOpacity 
          style={styles.inspireButton}
          onPress={handleInspireMe}
        >
          <ThemedText style={styles.inspireButtonText}>Inspire Me</ThemedText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sampleEntries}
        renderItem={renderJournalEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      
      <Animated.View style={[styles.fabContainer, { opacity: fabOpacity }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddEntry}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
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
  inspireButton: {
    backgroundColor: '#f7c5a8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inspireButtonText: {
    color: '#4b3621',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  entryContainer: {
    marginBottom: 16,
  },
  entryCard: {
    borderRadius: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  previewText: {
    marginBottom: 12,
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
    backgroundColor: 'rgba(255, 228, 225, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  mediaIcons: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: '#f7c5a8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
