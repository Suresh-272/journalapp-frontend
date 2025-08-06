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

// Warm color theme inspired by the realtor website
const WarmColors = {
  primary: '#B8956A', // Warm brown from the website
  secondary: '#8B6F47', // Darker brown
  accent: '#D4B896', // Light tan
  background: '#F5F0E8', // Cream background
  cardBackground: '#FFFFFF', // White for cards
  textPrimary: '#3D2914', // Dark brown for text
  textSecondary: '#6B5B4F', // Medium brown for secondary text
  textMuted: '#9B8A7A', // Muted brown
  shadow: '#8B6F47', // Brown shadow
  buttonText: '#FFFFFF',
  moodBackground: 'rgba(212, 185, 150, 0.3)', // Light tan with opacity
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

  // In the renderJournalEntry function, update the return statement to include a lock icon for protected entries
  
  const renderJournalEntry = ({ item }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  
    return (
      <TouchableOpacity 
        style={styles.entryContainer}
        onPress={() => {
          // If entry is protected, show unlock screen first
          if (item.isProtected) {
            handleProtectedEntryAccess(item);
          } else {
            // Otherwise, navigate directly to the entry
            router.push(`/entry/${item.id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <GlassCard style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.titleContainer}>
              {item.isProtected && (
                <Text style={styles.lockIcon}>🔒</Text>
              )}
              <ThemedText type="journalTitle" style={styles.titleText}>
                {item.title}
              </ThemedText>
            </View>
            <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
          </View>
          
          <ThemedText numberOfLines={2} style={styles.previewText}>
            {item.isProtected ? "This entry is protected. Tap to unlock." : item.preview}
          </ThemedText>
          
          <View style={styles.entryFooter}>
            <View style={styles.moodContainer}>
              <ThemedText style={styles.moodEmoji}>
                {moodEmojis[item.mood] || '😐'}
              </ThemedText>
            </View>
            
            <View style={styles.mediaIcons}>
              {item.hasPhoto && (
                <IconSymbol name="photo" size={18} color={WarmColors.secondary} />
              )}
              {item.hasAudio && (
                <IconSymbol name="mic" size={18} color={WarmColors.secondary} />
              )}
              {item.hasVideo && (
                <IconSymbol name="video" size={18} color={WarmColors.secondary} />
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  // Add a function to handle protected entry access
  const handleProtectedEntryAccess = (entry) => {
    // Determine protection type
    if (entry.protectionType === 'biometric') {
      // Use biometric authentication
      handleBiometricAuth(entry);
    } else {
      // Show password prompt
      showPasswordPrompt(entry);
    }
  };

  // Add these functions to handle authentication
  const handleBiometricAuth = async (entry) => {
    try {
      const result = await unlockProtectedEntry(entry.id, null, true);
      if (result.success) {
        router.push(`/entry/${entry.id}`);
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Authentication Failed', 'Unable to authenticate using biometrics. Would you like to try password instead?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use Password', onPress: () => showPasswordPrompt(entry) }
      ]);
    }
  };

  const showPasswordPrompt = (entry) => {
    // Show a modal or alert with password input
    Alert.prompt(
      'Protected Entry',
      'Enter password to unlock this entry',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlock', 
          onPress: async (password) => {
            if (!password) return;
            
            try {
              const result = await unlockProtectedEntry(entry.id, password, false);
              if (result.success) {
                router.push(`/entry/${entry.id}`);
              }
            } catch (error) {
              console.error('Password unlock error:', error);
              Alert.alert('Authentication Failed', 'Incorrect password. Please try again.');
            }
          } 
        }
      ],
      'secure-text'
    );
  };

  // Add these styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      backgroundColor: WarmColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    headerTitle: {
      color: WarmColors.textPrimary,
      fontWeight: '700',
      fontSize: 28,
    },
    inspireButton: {
      backgroundColor: WarmColors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 25,
      shadowColor: WarmColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    inspireButtonText: {
      color: WarmColors.buttonText,
      fontWeight: '600',
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
      backgroundColor: WarmColors.cardBackground,
      shadowColor: WarmColors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(184, 149, 106, 0.1)',
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    titleText: {
      color: WarmColors.textPrimary,
      fontWeight: '600',
      fontSize: 18,
    },
    dateText: {
      fontSize: 14,
      color: WarmColors.textMuted,
      fontWeight: '500',
    },
    previewText: {
      marginBottom: 12,
      color: WarmColors.textSecondary,
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
      backgroundColor: WarmColors.moodBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(184, 149, 106, 0.2)',
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
      backgroundColor: WarmColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: WarmColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 8,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lockIcon: {
      fontSize: 16,
      marginRight: 8,
    },
  });
}