import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJournals, getMoodAnalytics } from '../../services/journalService';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  interpolate,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// TypeScript interfaces
interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  moodLabel: string;
  emoji: string;
  value: number;
}

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

interface MoodOption {
  emoji: string;
  label: string;
  value: number;
  color: string;
  mood: string;
}

interface MoodTrackerProps {
  navigation: any;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({ navigation }) => {
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [averageMood, setAverageMood] = useState(0);
  const [mostFrequentMood, setMostFrequentMood] = useState<string>('');

  // Animation values
  const streakScale = useSharedValue(1);
  const streakRotation = useSharedValue(0);
  const moodSelectionScale = useSharedValue(1);
  const chartOpacity = useSharedValue(0);

  // Mood options with values for chart - updated colors to match earth theme
  const moodOptions: MoodOption[] = [
    { emoji: '😢', label: 'Very Sad', value: 1, color: '#B85450', mood: 'sad' },
    { emoji: '😞', label: 'Sad', value: 2, color: '#C67B5C', mood: 'sad' },
    { emoji: '😐', label: 'Neutral', value: 3, color: '#D4A574', mood: 'neutral' },
    { emoji: '😊', label: 'Happy', value: 4, color: '#9B8F7A', mood: 'happy' },
    { emoji: '😄', label: 'Very Happy', value: 5, color: '#7A8471', mood: 'excited' },
  ];

  useEffect(() => {
    loadMoodData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchMoodDataFromBackend();
    }
  }, [timeFilter]);

  // Animated styles
  const streakAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: streakScale.value },
        { rotate: `${streakRotation.value}deg` }
      ]
    };
  });

  const moodSelectionAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: moodSelectionScale.value }]
    };
  });

  const chartAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: chartOpacity.value
    };
  });

  // Animate streak badge when streak changes
  useEffect(() => {
    if (currentStreak > 0) {
      streakScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 8, stiffness: 100 })
      );
      streakRotation.value = withSequence(
        withSpring(10, { damping: 8, stiffness: 100 }),
        withSpring(-10, { damping: 8, stiffness: 100 }),
        withSpring(0, { damping: 8, stiffness: 100 })
      );
    }
  }, [currentStreak]);

  // Animate chart on load
  useEffect(() => {
    if (!loading && moodData.length > 0) {
      chartOpacity.value = withSpring(1, { damping: 12, stiffness: 80 });
    }
  }, [loading, moodData.length]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      
      // Load from AsyncStorage first
      const storedData = await AsyncStorage.getItem('moodData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setMoodData(data);
        calculateStreaks(data);
        setTotalEntries(data.length);
        calculateAverageMood(data);
        calculateMostFrequentMood(data);
      }

      // Fetch from backend
      await fetchMoodDataFromBackend();
    } catch (error) {
      console.error('Error loading mood data:', error);
      Alert.alert('Error', 'Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodDataFromBackend = async () => {
    try {
      // Fetch mood analytics from backend
      const analyticsResponse = await getMoodAnalytics(timeFilter);
      
      if (analyticsResponse.success && analyticsResponse.data) {
        const analytics = analyticsResponse.data;
        
        // Update analytics data
        setCurrentStreak(analytics.currentStreak);
        setLongestStreak(analytics.longestStreak);
        setTotalEntries(analytics.totalEntries);
        setAverageMood(analytics.averageMood);
        setMostFrequentMood(analytics.mostFrequentMood || '');
        
        // Convert chart data to mood entries format
        const moodEntries: MoodEntry[] = analytics.chartData.map((item: any) => {
          const moodOption = moodOptions.find(m => m.mood === item.label);
          return {
            id: item.date,
            date: item.date,
            mood: item.label,
            moodLabel: moodOption?.label || item.label,
            emoji: moodOption?.emoji || '😐',
            value: item.mood,
          };
        });

        // Merge with local data and remove duplicates
        const mergedData = mergeMoodData(moodEntries);
        setMoodData(mergedData);
        await saveMoodData(mergedData);
      }
    } catch (error) {
      console.error('Error fetching mood analytics from backend:', error);
      // Fallback to fetching journal entries if analytics endpoint fails
      try {
        const response = await getJournals(1, 1000);
        
        if (response.success && response.data) {
          const entries = response.data;
          setJournalEntries(entries);
          
          // Convert journal entries to mood data format
          const moodEntries: MoodEntry[] = entries
            .filter((entry: JournalEntry) => entry.mood && entry.mood !== 'other')
            .map((entry: JournalEntry) => {
              const moodOption = moodOptions.find(m => m.mood === entry.mood);
              return {
                id: entry._id,
                date: new Date(entry.createdAt).toISOString().split('T')[0],
                mood: entry.mood,
                moodLabel: moodOption?.label || entry.mood,
                emoji: moodOption?.emoji || '😐',
                value: moodOption?.value || 3,
              };
            });

          // Merge with local data and remove duplicates
          const mergedData = mergeMoodData(moodEntries);
          setMoodData(mergedData);
          await saveMoodData(mergedData);
          calculateStreaks(mergedData);
          setTotalEntries(mergedData.length);
          calculateAverageMood(mergedData);
          calculateMostFrequentMood(mergedData);
        }
      } catch (fallbackError) {
        console.error('Error fetching journal entries as fallback:', fallbackError);
      }
    }
  };

  const mergeMoodData = (backendData: MoodEntry[]): MoodEntry[] => {
    const localData = moodData;
    const merged = [...localData];
    
    backendData.forEach(backendEntry => {
      const existingIndex = merged.findIndex(local => local.date === backendEntry.date);
      if (existingIndex === -1) {
        merged.push(backendEntry);
      } else {
        // Prefer backend data if it's more recent
        merged[existingIndex] = backendEntry;
      }
    });
    
    // Sort by date
    return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const saveMoodData = async (data: MoodEntry[]) => {
    try {
      await AsyncStorage.setItem('moodData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving mood data:', error);
    }
  };

  const calculateStreaks = (data: MoodEntry[]) => {
    if (data.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let current = 0;
    let longest = 0;
    let temp = 1;

    const today = new Date();
    const lastEntry = new Date(sortedData[sortedData.length - 1].date);
    
    // Check if last entry was today or yesterday
    const daysDiff = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      current = 1;
      
      // Calculate current streak
      for (let i = sortedData.length - 2; i >= 0; i--) {
        const currentDate = new Date(sortedData[i + 1].date);
        const prevDate = new Date(sortedData[i].date);
        const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
          current++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].date);
      const prevDate = new Date(sortedData[i - 1].date);
      const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        temp++;
      } else {
        longest = Math.max(longest, temp);
        temp = 1;
      }
    }
    longest = Math.max(longest, temp);

    setCurrentStreak(current);
    setLongestStreak(longest);
  };

  const calculateAverageMood = (data: MoodEntry[]) => {
    if (data.length === 0) {
      setAverageMood(0);
      return;
    }
    const sum = data.reduce((acc, entry) => acc + entry.value, 0);
    setAverageMood(Number((sum / data.length).toFixed(1)));
  };

  const calculateMostFrequentMood = (data: MoodEntry[]) => {
    if (data.length === 0) {
      setMostFrequentMood('');
      return;
    }
    
    const moodCounts: { [key: string]: number } = {};
    data.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    const mostFrequent = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );
    
    const moodOption = moodOptions.find(m => m.mood === mostFrequent);
    setMostFrequentMood(moodOption?.label || mostFrequent);
  };

  const addMoodEntry = async (mood: MoodOption) => {
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = moodData.find(entry => entry.date === today);

    if (existingEntry) {
      Alert.alert('Already Logged', 'You have already logged your mood for today!');
      return;
    }

    // Animate mood selection
    moodSelectionScale.value = withSequence(
      withSpring(0.9, { damping: 8, stiffness: 100 }),
      withSpring(1.1, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 })
    );

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: today,
      mood: mood.mood,
      moodLabel: mood.label,
      emoji: mood.emoji,
      value: mood.value,
    };

    const updatedData = [...moodData, newEntry];
    setMoodData(updatedData);
    await saveMoodData(updatedData);
    calculateStreaks(updatedData);
    setTotalEntries(updatedData.length);
    calculateAverageMood(updatedData);
    calculateMostFrequentMood(updatedData);
    setSelectedMood(null);
  };

  const getChartData = () => {
    if (moodData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [3] }],
      };
    }

    let filteredData = [...moodData];
    
    // Apply time filter
    const now = new Date();
    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = filteredData.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredData = filteredData.filter(entry => new Date(entry.date) >= monthAgo);
    }

    // Get last entries based on filter
    const chartData = filteredData
      .slice(-10) // Show last 10 entries
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.value,
      }));

    return {
      labels: chartData.map(entry => entry.date),
      datasets: [
        {
          data: chartData.map(entry => entry.mood),
          color: (opacity = 1) => `rgba(122, 132, 113, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const getMoodColor = (value: number) => {
    const mood = moodOptions.find(m => m.value === Math.round(value));
    return mood ? mood.color : '#9B8F7A';
  };

  const getMoodInsights = () => {
    if (moodData.length < 2) return null;
    
    const recentData = moodData.slice(-7);
    const avgRecent = recentData.reduce((acc, entry) => acc + entry.value, 0) / recentData.length;
    const avgOverall = averageMood;
    
    if (avgRecent < avgOverall - 0.5) {
      return {
        type: 'warning',
        message: 'Your mood has been lower than usual recently. Consider writing about what might be affecting you.',
        emoji: '📉'
      };
    } else if (avgRecent > avgOverall + 0.5) {
      return {
        type: 'positive',
        message: 'Great! Your mood has been better than usual. Keep up the positive energy!',
        emoji: '📈'
      };
    }
    
    return null;
  };

  const getJournalPrompts = () => {
    const insights = getMoodInsights();
    if (!insights) return null;
    
    if (insights.type === 'warning') {
      return [
        'What has been challenging for you lately?',
        'Is there something specific that\'s been on your mind?',
        'What would help you feel better right now?'
      ];
    } else {
      return [
        'What\'s been going well for you recently?',
        'What are you grateful for today?',
        'What positive changes have you noticed in your life?'
      ];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B8F7A" />
        <Text style={styles.loadingText}>Loading mood data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mood Tracker</Text>
        <Text style={styles.subtitle}>Track your daily mood and maintain streaks</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Animated.View style={[styles.statCard, streakAnimatedStyle]}>
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statEmoji}>🔥</Text>
        </Animated.View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statEmoji}>🏆</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statEmoji}>📊</Text>
        </View>
      </View>

      {/* Average Mood */}
      <View style={styles.averageMoodContainer}>
        <Text style={styles.averageMoodTitle}>Average Mood</Text>
        <View style={styles.averageMoodValue}>
          <Text style={[styles.averageMoodNumber, { color: getMoodColor(averageMood) }]}>
            {averageMood}
          </Text>
          <Text style={styles.averageMoodScale}>/5.0</Text>
        </View>
        {mostFrequentMood && (
          <Text style={styles.mostFrequentMood}>
            Most frequent: {mostFrequentMood}
          </Text>
        )}
      </View>

      {/* Mood Insights */}
      {getMoodInsights() && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsEmoji}>{getMoodInsights()?.emoji}</Text>
          <Text style={styles.insightsText}>{getMoodInsights()?.message}</Text>
        </View>
      )}

      {/* Journal Prompts */}
      {getJournalPrompts() && (
        <View style={styles.promptsContainer}>
          <Text style={styles.promptsTitle}>Suggested Journal Prompts</Text>
          {getJournalPrompts()?.map((prompt, index) => (
            <Text key={index} style={styles.promptText}>• {prompt}</Text>
          ))}
        </View>
      )}

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Time Period</Text>
        <View style={styles.filterButtons}>
          {(['week', 'month', 'all'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                timeFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setTimeFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                timeFilter === filter && styles.activeFilterButtonText,
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mood Chart */}
      <Animated.View style={[styles.chartContainer, chartAnimatedStyle]}>
        <Text style={styles.chartTitle}>Mood Trend</Text>
        <LineChart
          data={getChartData()}
          width={width - 40}
          height={220}
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#F5F2E8',
            backgroundGradientFrom: '#F5F2E8',
            backgroundGradientTo: '#F5F2E8',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(122, 132, 113, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(106, 90, 75, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#7A8471',
            },
          }}
          bezier
          style={styles.chart}
          fromZero
          segments={4}
          yAxisSuffix=""
        />
      </Animated.View>

      {/* Mood Input */}
      <View style={styles.moodInputContainer}>
        <Text style={styles.moodInputTitle}>How are you feeling today?</Text>
        <View style={styles.moodOptions}>
          {moodOptions.map((mood, index) => (
            <Animated.View
              key={index}
              style={[
                styles.moodOption,
                selectedMood === mood && styles.selectedMoodOption,
                moodSelectionAnimatedStyle
              ]}
            >
              <TouchableOpacity
                style={styles.moodOptionTouchable}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        {selectedMood && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => addMoodEntry(selectedMood)}
          >
            <Text style={styles.submitButtonText}>Log Mood</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Entries */}
      <View style={styles.recentEntriesContainer}>
        <Text style={styles.recentEntriesTitle}>Recent Entries</Text>
        {moodData.length > 0 ? (
          <FlatList
            data={moodData.slice(-5).reverse()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.recentEntry}>
                <Text style={styles.recentEntryEmoji}>{item.emoji}</Text>
                <View style={styles.recentEntryInfo}>
                  <Text style={styles.recentEntryLabel}>{item.moodLabel}</Text>
                  <Text style={styles.recentEntryDate}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noDataText}>No mood entries yet. Start tracking your mood!</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DCC6', // Warm beige background like the journal app
    paddingTop: 50, // Add top margin to prevent full screen takeover
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8DCC6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6A5A4B',
  },
  header: {
    padding: 20,
    backgroundColor: '#F5F2E8', // Light warm beige
    borderBottomWidth: 1,
    borderBottomColor: '#D4C4A0',
  },
  title: {
    fontSize: 32,
    fontFamily: 'DancingScript-Bold',
    color: '#6A5A4B', // Dark brown text
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Caveat-Regular',
    color: '#8B7B6B', // Medium brown
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F2E8', // Light warm beige
    padding: 15,
    marginHorizontal: 5,
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
  statNumber: {
    fontSize: 26,
    fontFamily: 'AmaticSC-Bold',
    color: '#6A5A4B', // Dark brown
    marginBottom: 4,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'PatrickHand-Regular',
    color: '#8B7B6B', // Medium brown
    textAlign: 'center',
    lineHeight: 18,
  },
  statEmoji: {
    fontSize: 20,
    marginTop: 4,
  },
  averageMoodContainer: {
    backgroundColor: '#F5F2E8', // Light warm beige
    margin: 20,
    marginTop: 10,
    padding: 20,
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
  averageMoodTitle: {
    fontSize: 20,
    fontFamily: 'Handlee-Regular',
    color: '#6A5A4B', // Dark brown
    marginBottom: 10,
    lineHeight: 26,
  },
  averageMoodValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  averageMoodNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  averageMoodScale: {
    fontSize: 18,
    color: '#8B7B6B', // Medium brown
    marginLeft: 4,
  },
  mostFrequentMood: {
    fontSize: 14,
    color: '#8B7B6B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  insightsContainer: {
    backgroundColor: '#F5F2E8',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  insightsEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  insightsText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Caveat-Regular',
    color: '#6A5A4B',
    lineHeight: 24,
  },
  promptsContainer: {
    backgroundColor: '#F5F2E8',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  promptsTitle: {
    fontSize: 18,
    fontFamily: 'Handlee-Regular',
    color: '#6A5A4B',
    marginBottom: 10,
    lineHeight: 24,
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'Caveat-Regular',
    color: '#6A5A4B',
    marginBottom: 5,
    lineHeight: 24,
  },
  filterContainer: {
    backgroundColor: '#F5F2E8',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A5A4B',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E8DCC6',
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#9B8F7A',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6A5A4B',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#F5F2E8',
  },
  chartContainer: {
    backgroundColor: '#F5F2E8', // Light warm beige
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A5A4B', // Dark brown
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  moodInputContainer: {
    backgroundColor: '#F5F2E8', // Light warm beige
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
  moodInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A5A4B', // Dark brown
    marginBottom: 15,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#E8DCC6', // Warm beige
  },
  moodOptionTouchable: {
    alignItems: 'center',
    width: '100%',
  },
  selectedMoodOption: {
    backgroundColor: '#D4C4A0', // Darker warm beige when selected
    borderWidth: 2,
    borderColor: '#B8A082', // Brown border
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: '#6A5A4B', // Dark brown
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#9B8F7A', // Warm brown button
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  submitButtonText: {
    color: '#F5F2E8', // Light text on dark button
    fontSize: 16,
    fontWeight: '600',
  },
  recentEntriesContainer: {
    backgroundColor: '#F5F2E8', // Light warm beige
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
  recentEntriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A5A4B', // Dark brown
    marginBottom: 15,
  },
  recentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC6',
  },
  recentEntryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  recentEntryInfo: {
    flex: 1,
  },
  recentEntryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6A5A4B', // Dark brown
  },
  recentEntryDate: {
    fontSize: 14,
    color: '#8B7B6B', // Medium brown
    marginTop: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#8B7B6B', // Medium brown
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MoodTracker;