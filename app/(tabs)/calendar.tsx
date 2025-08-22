import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Image, 
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getJournals } from '@/services/journalService';

const { width } = Dimensions.get('window');

// Warm, earthy color theme
const journalTheme = {
  headerBrown: '#E8DCC8',
  warmBeige: '#FAF7F2',
  cardBeige: '#F0E8D8',
  controlBeige: '#E8DCC8',
  darkBrown: '#5D4E37',
  mediumBrown: '#8B7355',
  warmAccent: '#B8956A',
  navBrown: '#6B5B4F',
  lightBrown: '#D4C4B0',
  background: '#FAF7F2',
  text: '#5D4E37',
  tint: '#E8DCC8',
  cardBackground: '#F0E8D8',
  tabIconDefault: '#8B7355',
  pastelPink: '#F0E8D8',
  pastelBlue: '#E8DCC8',
};

// Journal entry interface matching backend model
interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  category: 'personal' | 'professional';
  mood: string;
  tags: string[];
  location?: string;
  media: Array<{
    _id: string;
    type: 'image' | 'audio' | 'video';
    url: string;
    caption?: string;
  }>;
  user: string;
  createdAt: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load journal entries from backend
  const loadJournalEntries = async () => {
    try {
      setError(null);
      const response = await getJournals(1, 1000); // Get all entries for calendar
      if (response.success && response.data) {
        setJournalEntries(response.data);
      } else {
        setError('Failed to load journal entries');
      }
    } catch (error: any) {
      console.error('Error loading journal entries:', error);
      setError(error.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournalEntries();
    setRefreshing(false);
  };

  useEffect(() => {
    loadJournalEntries();
  }, []);

  // Get entries for a specific date
  const getEntriesForDate = (date: string) => {
    return journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      return entryDate === date;
    });
  };

  // Check if date has entries
  const hasEntriesForDate = (date: string) => {
    return getEntriesForDate(date).length > 0;
  };

  // Get first image for a date
  const getFirstImageForDate = (date: string) => {
    const entries = getEntriesForDate(date);
    for (const entry of entries) {
      const imageMedia = entry.media.find(media => media.type === 'image');
      if (imageMedia) {
        return imageMedia.url;
      }
    }
    return null;
  };

  // Create marked dates object for calendar
  const createMarkedDates = () => {
    const marked: any = {};
    
    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      const entriesForDate = getEntriesForDate(entryDate);
      const hasImages = entriesForDate.some(e => e.media.some(m => m.type === 'image'));
      
      marked[entryDate] = {
        marked: true,
        customStyles: {
          container: {
            backgroundColor: hasImages ? journalTheme.pastelPink : journalTheme.lightBrown,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: journalTheme.lightBrown,
            position: 'relative',
          },
          text: {
            color: journalTheme.darkBrown,
            fontWeight: 'bold',
            fontSize: 14,
          }
        }
      };
    });

    // Add selected date styling
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: journalTheme.warmAccent,
        customStyles: {
          ...marked[selectedDate].customStyles,
          container: {
            ...marked[selectedDate].customStyles.container,
            backgroundColor: journalTheme.warmAccent,
            borderColor: journalTheme.darkBrown,
            borderWidth: 2,
          },
          text: {
            color: journalTheme.warmBeige,
            fontWeight: 'bold',
            fontSize: 14,
          }
        }
      };
    } else if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: journalTheme.controlBeige,
        customStyles: {
          container: {
            backgroundColor: journalTheme.controlBeige,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: journalTheme.lightBrown,
          },
          text: {
            color: journalTheme.darkBrown,
            fontWeight: 'bold',
            fontSize: 14,
          }
        }
      };
    }

    return marked;
  };

  // Custom day component to show images and entries
  const renderCustomDay = (day: any) => {
    if (!day) return null;
    
    const dateString = day.dateString;
    const entriesForDate = getEntriesForDate(dateString);
    const firstImage = getFirstImageForDate(dateString);
    const isSelected = selectedDate === dateString;
    const hasEntries = entriesForDate.length > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.customDayContainer,
          hasEntries && { backgroundColor: journalTheme.pastelPink },
          isSelected && { backgroundColor: journalTheme.warmAccent, borderColor: journalTheme.darkBrown, borderWidth: 2 }
        ]}
        onPress={() => handleDayPress(day)}
      >
        <ThemedText style={[
          styles.customDayText,
          { color: isSelected ? journalTheme.warmBeige : journalTheme.darkBrown }
        ]}>
          {day.day}
        </ThemedText>
        
        {/* Show image thumbnail if exists */}
        {firstImage && (
          <Image 
            source={{ uri: firstImage }} 
            style={styles.dayImageThumbnail}
            resizeMode="cover"
          />
        )}
        
        {/* Show entry indicator if no image but has entries */}
        {hasEntries && !firstImage && (
          <View style={styles.dayEntryIndicator}>
            <View style={[styles.dayEntryDot, { backgroundColor: journalTheme.warmAccent }]} />
            {entriesForDate.length > 1 && (
              <ThemedText style={[styles.dayEntryCount, { color: journalTheme.darkBrown }]}>
                {entriesForDate.length}
              </ThemedText>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Handle date press
  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  // Handle entry press - navigate to journal detail
  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/journal/detail?id=${entry._id}` as any);
  };

  // Calendar theme
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: journalTheme.text,
    textSectionTitleDisabledColor: journalTheme.mediumBrown,
    selectedDayBackgroundColor: journalTheme.warmAccent,
    selectedDayTextColor: journalTheme.warmBeige,
    todayTextColor: journalTheme.warmAccent,
    dayTextColor: journalTheme.text,
    textDisabledColor: journalTheme.mediumBrown,
    dotColor: journalTheme.warmAccent,
    selectedDotColor: journalTheme.warmBeige,
    arrowColor: journalTheme.warmAccent,
    disabledArrowColor: journalTheme.mediumBrown,
    monthTextColor: journalTheme.text,
    indicatorColor: journalTheme.warmAccent,
    textDayFontFamily: 'Inter-Regular',
    textMonthFontFamily: 'Inter-Bold',
    textDayHeaderFontFamily: 'Inter-Medium',
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'transparent',
      },
      monthText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: journalTheme.text,
        textAlign: 'center',
      },
      dayHeader: {
        width: 32,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: journalTheme.text,
        backgroundColor: 'transparent',
      },
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        paddingVertical: 8,
      }
    },
    'stylesheet.day.basic': {
      base: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: journalTheme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={journalTheme.warmAccent} />
          <ThemedText style={[styles.loadingText, { color: journalTheme.text }]}>
            Loading calendar...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: journalTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: journalTheme.headerBrown }]}>
        <ThemedText type="title" style={[styles.title, { color: journalTheme.text }]}>
          Calendar
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[journalTheme.warmAccent]}
            tintColor={journalTheme.warmAccent}
          />
        }
      >
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { color: '#D32F2F' }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {/* Calendar Card */}
        <GlassCard style={styles.calendarCard}>
          <Calendar
            theme={calendarTheme}
            markedDates={createMarkedDates()}
            onDayPress={handleDayPress}
            enableSwipeMonths
            hideExtraDays
            markingType="custom"
            style={styles.calendar}
            dayComponent={({ date, state }) => renderCustomDay(date)}
            renderArrow={(direction) => (
              <View style={[styles.arrowContainer, { backgroundColor: journalTheme.warmAccent }]}>
                <ThemedText style={[styles.arrowText, { color: journalTheme.warmBeige }]}>
                  {direction === 'left' ? '‹' : '›'}
                </ThemedText>
              </View>
            )}
          />
        </GlassCard>

        {/* Selected Date Entries */}
        {selectedDate && (
          <View style={styles.entriesSection}>
            <ThemedText type="subtitle" style={[styles.entriesTitle, { color: journalTheme.text }]}>
              {(() => {
                const date = new Date(selectedDate);
                const entries = getEntriesForDate(selectedDate);
                return `${date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })} - ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
              })()}
            </ThemedText>

            {getEntriesForDate(selectedDate).length > 0 ? (
              <FlatList
                data={getEntriesForDate(selectedDate)}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <GlassCard style={styles.entrySummary}>
                    <TouchableOpacity 
                      onPress={() => handleEntryPress(item)}
                      activeOpacity={0.8}
                      style={styles.entryTouchable}
                    >
                      <View style={styles.entryHeader}>
                        <ThemedText type="journalTitle" style={[styles.entryTitle, { color: journalTheme.text }]}>
                          {item.title}
                        </ThemedText>
                        <ThemedText style={[styles.entryTime, { color: journalTheme.mediumBrown }]}>
                          {new Date(item.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </ThemedText>
                      </View>
                      
                      <ThemedText numberOfLines={2} style={[styles.previewText, { color: journalTheme.text }]}>
                        {item.content}
                      </ThemedText>

                      {/* Entry Images */}
                      {item.media.filter(m => m.type === 'image').length > 0 && (
                        <View style={styles.entryImages}>
                          {item.media
                            .filter(m => m.type === 'image')
                            .slice(0, 3)
                            .map((media, index) => (
                              <Image 
                                key={media._id}
                                source={{ uri: media.url }} 
                                style={styles.entryImage}
                                resizeMode="cover"
                              />
                            ))}
                          {item.media.filter(m => m.type === 'image').length > 3 && (
                            <View style={[styles.moreImagesOverlay, { backgroundColor: journalTheme.warmAccent }]}>
                              <ThemedText style={[styles.moreImagesText, { color: journalTheme.warmBeige }]}>
                                +{item.media.filter(m => m.type === 'image').length - 3}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  </GlassCard>
                )}
                scrollEnabled={false}
              />
            ) : (
              <GlassCard style={styles.entrySummary}>
                <ThemedText style={[styles.noEntriesText, { color: journalTheme.mediumBrown }]}>
                  No journal entries for this date
                </ThemedText>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: 'DancingScript-Bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: journalTheme.cardBackground,
  },
  calendar: {
    borderRadius: 8,
  },
  entriesSection: {
    marginTop: 8,
  },
  entriesTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 26,
  },
  entrySummary: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: journalTheme.cardBackground,
  },
  entryTouchable: {
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    lineHeight: 24,
  },
  entryTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  previewText: {
    marginTop: 8,
    opacity: 0.8,
    lineHeight: 20,
  },
  entryImages: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  entryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  moreImagesOverlay: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noEntriesText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  // Custom day component styles
  customDayContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: journalTheme.lightBrown,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  customDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayImageThumbnail: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dayEntryIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayEntryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayEntryCount: {
    fontSize: 8,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  // Arrow styles
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});