import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Custom color theme matching the app
const journalTheme = {
  // Warm, earthy brown and beige colors inspired by the image
  headerBrown: '#E8DCC8', // Rich brown for header
  warmBeige: '#F7F3ED', // Very light warm beige background
  cardBeige: '#F0E8D8', // Light cream for cards and sections
  controlBeige: '#E8DCC8', // Warm beige for control panels
  darkBrown: '#5D4E37', // Dark brown for text
  mediumBrown: '#8B7355', // Medium brown for secondary text
  warmAccent: '#B8956A', // Warm accent for highlights
  navBrown: '#6B5B4F', // Dark brown for navigation
  lightBrown: '#D4C4B0', // Light brown for borders
  // Additional properties needed for compatibility
  background: '#F7F3ED', // Same as warmBeige
  text: '#5D4E37', // Same as darkBrown
  tint: '#E8DCC8', // Same as controlBeige
  cardBackground: '#F0E8D8', // Same as cardBeige
  tabIconDefault: '#8B7355', // Same as mediumBrown
  pastelPink: '#F0E8D8', // Same as cardBeige
  pastelBlue: '#E8DCC8', // Same as controlBeige
};

// Mock data structure for journal entries
interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
}

const CalendarScreen = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load journal entries from AsyncStorage
  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('journalEntries');
      if (storedEntries) {
        setJournalEntries(JSON.parse(storedEntries));
      } else {
        // Initialize with sample data
        const sampleEntries: JournalEntry[] = [
          {
            id: '1',
            date: '2024-01-15',
            title: 'Morning Coffee',
            content: 'Started the day with a perfect cup of coffee',
            images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=150&h=150&fit=crop'],
            createdAt: '2024-01-15T08:00:00Z'
          },
          {
            id: '2',
            date: '2024-01-15',
            title: 'Sunset Walk',
            content: 'Beautiful evening walk in the park',
            images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop'],
            createdAt: '2024-01-15T18:30:00Z'
          },
          {
            id: '3',
            date: '2024-01-20',
            title: 'Garden Visit',
            content: 'Visited the botanical gardens today',
            images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop'],
            createdAt: '2024-01-20T14:00:00Z'
          },
          {
            id: '4',
            date: '2024-01-25',
            title: 'Book Reading',
            content: 'Spent the afternoon reading my favorite book',
            images: [],
            createdAt: '2024-01-25T16:00:00Z'
          },
          {
            id: '5',
            date: '2024-01-28',
            title: 'Cooking Adventure',
            content: 'Tried a new recipe today',
            images: [
              'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150&h=150&fit=crop',
              'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=150&h=150&fit=crop'
            ],
            createdAt: '2024-01-28T19:00:00Z'
          }
        ];
        setJournalEntries(sampleEntries);
        await AsyncStorage.setItem('journalEntries', JSON.stringify(sampleEntries));
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDateKey = (date: Date, day: number) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getEntriesForDate = (date: Date, day: number) => {
    const dateKey = formatDateKey(date, day);
    return journalEntries.filter(entry => entry.date === dateKey);
  };

  const hasEntriesForDate = (date: Date, day: number) => {
    const entries = getEntriesForDate(date, day);
    return entries.length > 0;
  };

  const hasImagesForDate = (date: Date, day: number) => {
    const entries = getEntriesForDate(date, day);
    return entries.some(entry => entry.images.length > 0);
  };

  const getFirstImageForDate = (date: Date, day: number) => {
    const entries = getEntriesForDate(date, day);
    for (const entry of entries) {
      if (entry.images.length > 0) {
        return entry.images[0];
      }
    }
    return null;
  };

  const isToday = (date: Date, day: number) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear() && 
           day === today.getDate();
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleDatePress = (day: number) => {
    if (day) {
      const dateKey = formatDateKey(currentDate, day);
      setSelectedDate(dateKey);
    }
  };

  const handleEntryPress = (entry: JournalEntry) => {
    // Navigate to journal detail screen
    router.push(`/journal-detail?id=${entry.id}` as any);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const hasEntries = hasEntriesForDate(currentDate, day);
    const hasImages = hasImagesForDate(currentDate, day);
    const firstImage = getFirstImageForDate(currentDate, day);
    const isTodayDate = isToday(currentDate, day);
    const entries = getEntriesForDate(currentDate, day);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { backgroundColor: journalTheme.cardBackground },
          hasEntries && { backgroundColor: journalTheme.pastelPink },
          isTodayDate && { borderColor: journalTheme.warmAccent, borderWidth: 2 }
        ]}
        onPress={() => handleDatePress(day)}
      >
        <Text style={[
          styles.dayText, 
          { color: journalTheme.text },
          isTodayDate && { color: journalTheme.warmAccent, fontWeight: 'bold' }
        ]}>
          {day}
        </Text>
        
        {hasImages && firstImage && (
          <View style={styles.imageThumbnail}>
            <Image 
              source={{ uri: firstImage }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        {hasEntries && !hasImages && (
          <View style={styles.entryIndicator}>
            <View style={[styles.entryDot, { backgroundColor: journalTheme.warmAccent }]} />
            {entries.length > 1 && (
              <Text style={[styles.entryCount, { color: journalTheme.text }]}>
                +{entries.length - 1}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSelectedDateEntries = () => {
    if (!selectedDate) return null;

    const entries = journalEntries.filter(entry => entry.date === selectedDate);
    const selectedDateObj = new Date(selectedDate);

    return (
      <View style={[styles.selectedDateContainer, { backgroundColor: journalTheme.cardBackground }]}>
        <View style={styles.selectedDateHeader}>
          <Text style={[styles.selectedDateTitle, { color: journalTheme.text }]}>
            {monthNames[selectedDateObj.getMonth()]} {selectedDateObj.getDate()}, {selectedDateObj.getFullYear()}
          </Text>
          <Text style={[styles.entryCountText, { color: journalTheme.mediumBrown }]}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.entryCard, { backgroundColor: journalTheme.background }]}
              onPress={() => handleEntryPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.entryHeader}>
                <Text style={[styles.entryTitle, { color: journalTheme.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.entryTime, { color: journalTheme.mediumBrown }]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              
              <Text style={[styles.entryContent, { color: journalTheme.text }]} numberOfLines={2}>
                {item.content}
              </Text>
              
              {item.images.length > 0 && (
                <View style={styles.entryImages}>
                  {item.images.slice(0, 3).map((image, index) => (
                    <Image 
                      key={index}
                      source={{ uri: image }} 
                      style={styles.entryImage}
                      resizeMode="cover"
                    />
                  ))}
                  {item.images.length > 3 && (
                    <View style={[styles.moreImagesOverlay, { backgroundColor: journalTheme.warmAccent }]}>
                      <Text style={[styles.moreImagesText, { color: journalTheme.text }]}>
                        +{item.images.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: journalTheme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: journalTheme.text }]}>
            Loading calendar...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: journalTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: journalTheme.headerBrown }]}>
        <Text style={[styles.title, { color: journalTheme.text }]}>Calendar</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          {/* Calendar Navigation */}
          <View style={[styles.navigation, { backgroundColor: journalTheme.cardBackground }]}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: journalTheme.warmAccent }]}
              onPress={() => navigateMonth(-1)}
            >
              <Text style={[styles.navButtonText, { color: journalTheme.text }]}>{'‹'}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.monthYear, { color: journalTheme.text }]}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: journalTheme.warmAccent }]}
              onPress={() => navigateMonth(1)}
            >
              <Text style={[styles.navButtonText, { color: journalTheme.text }]}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={[styles.weekDaysContainer, { backgroundColor: journalTheme.cardBackground }]}>
            {weekDays.map(day => (
              <Text key={day} style={[styles.weekDay, { color: journalTheme.text }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={[styles.calendarGrid, { backgroundColor: journalTheme.cardBackground }]}>
            {getDaysInMonth(currentDate).map((day, index) => renderCalendarDay(day, index))}
          </View>
        </View>

        {/* Selected Date Entries */}
        {renderSelectedDateEntries()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  calendarSection: {
    flexShrink: 0,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 280, // Fixed height for 4-5 weeks with smaller cells
  },
  dayCell: {
    width: (width - 40) / 7,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD4',
    position: 'relative',
    borderRadius: 8,
    margin: 1,
  },
  emptyDay: {
    width: (width - 40) / 7,
    height: 60,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  imageThumbnail: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  entryIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  entryCount: {
    fontSize: 10,
    marginLeft: 2,
  },
  selectedDateContainer: {
    flex: 1,
    marginTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  entryCountText: {
    fontSize: 14,
  },
  entryCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  entryTime: {
    fontSize: 12,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  entryImages: {
    flexDirection: 'row',
    gap: 8,
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
});

export default CalendarScreen;