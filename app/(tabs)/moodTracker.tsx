import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MoodTracker = ({ navigation }) => {
  const [moodData, setMoodData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);

  // Mood options with values for chart
  const moodOptions = [
    { emoji: '😢', label: 'Very Sad', value: 1, color: '#FF4444' },
    { emoji: '😞', label: 'Sad', value: 2, color: '#FF8844' },
    { emoji: '😐', label: 'Neutral', value: 3, color: '#FFAA44' },
    { emoji: '😊', label: 'Happy', value: 4, color: '#88DD44' },
    { emoji: '😄', label: 'Very Happy', value: 5, color: '#44DD44' },
  ];

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('moodData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setMoodData(data);
        calculateStreaks(data);
        setTotalEntries(data.length);
      }
    } catch (error) {
      console.error('Error loading mood data:', error);
    }
  };

  const saveMoodData = async (data) => {
    try {
      await AsyncStorage.setItem('moodData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving mood data:', error);
    }
  };

  const calculateStreaks = (data) => {
    if (data.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let current = 0;
    let longest = 0;
    let temp = 1;

    const today = new Date();
    const lastEntry = new Date(sortedData[sortedData.length - 1].date);
    
    // Check if last entry was today or yesterday
    const daysDiff = Math.floor((today - lastEntry) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      current = 1;
      
      // Calculate current streak
      for (let i = sortedData.length - 2; i >= 0; i--) {
        const currentDate = new Date(sortedData[i + 1].date);
        const prevDate = new Date(sortedData[i].date);
        const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
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
      const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
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

  const addMoodEntry = async (mood) => {
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = moodData.find(entry => entry.date === today);

    if (existingEntry) {
      Alert.alert('Already Logged', 'You have already logged your mood for today!');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      date: today,
      mood: mood.value,
      moodLabel: mood.label,
      emoji: mood.emoji,
    };

    const updatedData = [...moodData, newEntry];
    setMoodData(updatedData);
    await saveMoodData(updatedData);
    calculateStreaks(updatedData);
    setTotalEntries(updatedData.length);
    setSelectedMood(null);
  };

  const getChartData = () => {
    if (moodData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [3] }],
      };
    }

    // Get last 7 days of data
    const last7Days = moodData
      .slice(-7)
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood,
      }));

    return {
      labels: last7Days.map(entry => entry.date),
      datasets: [
        {
          data: last7Days.map(entry => entry.mood),
          color: (opacity = 1) => `rgba(68, 221, 68, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const getAverageMood = () => {
    if (moodData.length === 0) return 0;
    const sum = moodData.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / moodData.length).toFixed(1);
  };

  const getMoodColor = (value) => {
    const mood = moodOptions.find(m => m.value === Math.round(value));
    return mood ? mood.color : '#CCCCCC';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mood Tracker</Text>
        <Text style={styles.subtitle}>Track your daily mood and maintain streaks</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statEmoji}>🔥</Text>
        </View>
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
          <Text style={[styles.averageMoodNumber, { color: getMoodColor(getAverageMood()) }]}>
            {getAverageMood()}
          </Text>
          <Text style={styles.averageMoodScale}>/5.0</Text>
        </View>
      </View>

      {/* Mood Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mood Trend (Last 7 Days)</Text>
        <LineChart
          data={getChartData()}
          width={width - 40}
          height={220}
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(68, 221, 68, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#44DD44',
            },
          }}
          bezier
          style={styles.chart}
          fromZero
          segments={4}
          yAxisSuffix=""
          yAxisMin={1}
          yAxisMax={5}
        />
      </View>

      {/* Mood Input */}
      <View style={styles.moodInputContainer}>
        <Text style={styles.moodInputTitle}>How are you feeling today?</Text>
        <View style={styles.moodOptions}>
          {moodOptions.map((mood, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.moodOption,
                selectedMood === mood && styles.selectedMoodOption,
              ]}
              onPress={() => setSelectedMood(mood)}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
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
          moodData.slice(-5).reverse().map((entry) => (
            <View key={entry.id} style={styles.recentEntry}>
              <Text style={styles.recentEntryEmoji}>{entry.emoji}</Text>
              <View style={styles.recentEntryInfo}>
                <Text style={styles.recentEntryLabel}>{entry.moodLabel}</Text>
                <Text style={styles.recentEntryDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginTop: 4,
  },
  averageMoodContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageMoodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
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
    color: '#6c757d',
    marginLeft: 4,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  moodInputContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
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
  },
  selectedMoodOption: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentEntriesContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentEntriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
  },
  recentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
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
    color: '#212529',
  },
  recentEntryDate: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MoodTracker;