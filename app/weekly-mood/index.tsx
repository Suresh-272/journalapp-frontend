import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';

const WeeklyMoodScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = require('../../constants/Colors').Colors[colorScheme];
  
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

  const handleBackPress = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading journal entries...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Weekly Mood Analysis</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Track your professional and personal mood trends
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Week Navigation */}
        <View style={[styles.weekNavigation, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'previous' && { backgroundColor: colors.tint }
            ]}
            onPress={() => switchWeek('previous')}
          >
            <Text style={[
              styles.weekButtonText,
              { color: selectedWeek === 'previous' ? colors.buttonText : colors.text }
            ]}>
              Previous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'current' && { backgroundColor: colors.tint }
            ]}
            onPress={() => switchWeek('current')}
          >
            <Text style={[
              styles.weekButtonText,
              { color: selectedWeek === 'current' ? colors.buttonText : colors.text }
            ]}>
              Current
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.weekButton,
              selectedWeek === 'next' && { backgroundColor: colors.tint }
            ]}
            onPress={() => switchWeek('next')}
          >
            <Text style={[
              styles.weekButtonText,
              { color: selectedWeek === 'next' ? colors.buttonText : colors.text }
            ]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Week Range Display */}
        <View style={[styles.weekRangeContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.weekRangeText, { color: colors.text }]}>
            {getWeekRangeText()}
          </Text>
        </View>

        {/* Weekly Mood Graph */}
        {currentWeekData && (
          <WeeklyMoodGraph
            data={currentWeekData}
            onPointPress={handlePointPress}
          />
        )}

        {/* Data Summary */}
        <View style={[styles.summaryContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Data Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
              Total Journal Entries:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {journalEntries.length}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
              Professional Entries:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {journalEntries.filter(entry => entry.category === 'professional').length}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
              Personal Entries:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {journalEntries.filter(entry => entry.category === 'personal').length}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
              Entries with Mood:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {journalEntries.filter(entry => entry.mood && entry.mood !== 'other').length}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use</Text>
          <Text style={[styles.instructionsText, { color: colors.tabIconDefault }]}>
            • Tap on any point in the graph to see detailed mood information{'\n'}
            • The blue line represents professional mood trends{'\n'}
            • The green line represents personal mood trends{'\n'}
            • Use the week navigation to view different time periods{'\n'}
            • The graph automatically calculates averages for days with multiple entries
          </Text>
        </View>
      </ScrollView>
    </View>
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
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC6',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DancingScript-Bold',
    marginBottom: 4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  weekButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  weekButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  weekRangeContainer: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
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
    borderRadius: 12,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
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
    borderRadius: 12,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
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

export default WeeklyMoodScreen;
