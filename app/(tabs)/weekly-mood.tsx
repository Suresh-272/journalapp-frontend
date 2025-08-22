import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { getJournals } from '../../services/journalService';
import WeeklyMoodGraph from '../../components/WeeklyMoodGraph';
import { 
  getCurrentWeekMoodData, 
  getPreviousWeekMoodData, 
  getNextWeekMoodData,
  formatWeekRange,
  getWeekStart,
  getWeekEnd,
  WeeklyMoodData 
} from '../../utils/moodDataProcessor';
import { JournalEntry } from '../../types/journal';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

// Custom color theme for the weekly mood screen - matching index.tsx theme
const weeklyMoodTheme = {
  // Warm, earthy brown and beige colors inspired by the journal theme
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

const WeeklyMoodTracker: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = weeklyMoodTheme;
  
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyMoodData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'previous' | 'current' | 'next'>('current');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadJournalEntries();
  }, []);

  useEffect(() => {
    if (journalEntries.length > 0) {
      updateWeekData();
    }
  }, [journalEntries, selectedWeek, selectedDate]);

  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      const response = await getJournals(1, 1000); // Get all entries
      
      if (response.success && response.data) {
        setJournalEntries(response.data);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const updateWeekData = () => {
    let weekData: WeeklyMoodData;
    
    switch (selectedWeek) {
      case 'previous':
        weekData = getPreviousWeekMoodData(journalEntries);
        break;
      case 'next':
        weekData = getNextWeekMoodData(journalEntries);
        break;
      default:
        weekData = getCurrentWeekMoodData(journalEntries);
        break;
    }
    
    setCurrentWeekData(weekData);
  };

  const handlePointPress = (day: string, mood: number, type: 'professional' | 'personal') => {
    Alert.alert(
      `${day} ${type.charAt(0).toUpperCase() + type.slice(1)} Mood`,
      `Mood Level: ${mood}/10`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'View Entries', 
          onPress: () => {
            // Here you could navigate to filtered entries for this day and type
            Alert.alert('Feature', 'This would show journal entries for this day and category');
          }
        }
      ]
    );
  };

  const getWeekRangeText = () => {
    const date = selectedWeek === 'previous' 
      ? new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      : selectedWeek === 'next'
      ? new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : selectedDate;
    
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(date);
    return formatWeekRange(weekStart, weekEnd);
  };

  const switchWeek = (week: 'previous' | 'current' | 'next') => {
    setSelectedWeek(week);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.warmAccent} />
        <ThemedText style={[styles.loadingText, { color: theme.tabIconDefault }]}>
          Loading journal entries...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: theme.text }]}>Weekly Mood Analysis</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Track your professional and personal mood trends
          </ThemedText>
        </View>

        {/* Week Navigation */}
        <View style={[styles.weekNavigation, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'previous' && { backgroundColor: theme.warmAccent }
            ]}
            onPress={() => switchWeek('previous')}
          >
            <ThemedText style={[
              styles.weekButtonText,
              { color: selectedWeek === 'previous' ? theme.text : theme.mediumBrown }
            ]}>
              Previous
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'current' && { backgroundColor: theme.warmAccent }
            ]}
            onPress={() => switchWeek('current')}
          >
            <ThemedText style={[
              styles.weekButtonText,
              { color: selectedWeek === 'current' ? theme.text : theme.mediumBrown }
            ]}>
              Current
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'next' && { backgroundColor: theme.warmAccent }
            ]}
            onPress={() => switchWeek('next')}
          >
            <ThemedText style={[
              styles.weekButtonText,
              { color: selectedWeek === 'next' ? theme.text : theme.mediumBrown }
            ]}>
              Next
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Week Range Display */}
        <View style={[styles.weekRangeContainer, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.weekRangeText, { color: theme.text }]}>
            {getWeekRangeText()}
          </ThemedText>
        </View>

        {/* Weekly Mood Graph */}
        {currentWeekData && (
          <WeeklyMoodGraph
            data={currentWeekData}
            onPointPress={handlePointPress}
          />
        )}

        {/* Data Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.summaryTitle, { color: theme.text }]}>Data Summary</ThemedText>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>
              Total Journal Entries:
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
              {journalEntries.length}
            </ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>
              Professional Entries:
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
              {journalEntries.filter(entry => entry.category === 'professional').length}
            </ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>
              Personal Entries:
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
              {journalEntries.filter(entry => entry.category === 'personal').length}
            </ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>
              Entries with Mood:
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
              {journalEntries.filter(entry => entry.mood && entry.mood !== 'other').length}
            </ThemedText>
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsContainer, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.instructionsTitle, { color: theme.text }]}>How to Use</ThemedText>
          <ThemedText style={[styles.instructionsText, { color: theme.tabIconDefault }]}>
            • Tap on any point in the graph to see detailed mood information{'\n'}
            • The blue line represents professional mood trends{'\n'}
            • The green line represents personal mood trends{'\n'}
            • Use the week navigation to view different time periods{'\n'}
            • The graph automatically calculates averages for days with multiple entries
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'DancingScript-Bold',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  weekNavigation: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.08)',
  },
  weekButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  weekButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  weekRangeContainer: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.08)',
  },
  weekRangeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 20,
  },
  summaryContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.08)',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 15,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
  },
  instructionsContainer: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 111, 71, 0.08)',
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 15,
    lineHeight: 24,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});

export default WeeklyMoodTracker;
