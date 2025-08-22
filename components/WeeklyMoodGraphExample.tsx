import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import WeeklyMoodGraph from './WeeklyMoodGraph';

const WeeklyMoodGraphExample: React.FC = () => {
  // Sample data for demonstration
  const sampleData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    professionalMood: [7, 6, 8, 5, 9, 3, 6], // Scale 1-10
    personalMood: [8, 7, 6, 9, 7, 8, 9]      // Scale 1-10
  };

  const handlePointPress = (day: string, mood: number, type: 'professional' | 'personal') => {
    Alert.alert(
      `${day} ${type.charAt(0).toUpperCase() + type.slice(1)} Mood`,
      `Mood Level: ${mood}/10\n\nThis is a sample data point. In a real app, this would show detailed information about your journal entries for this day.`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'View Details', 
          onPress: () => {
            Alert.alert(
              'Sample Feature',
              'This would navigate to a detailed view showing all journal entries for this day and category, with mood analysis and insights.'
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Mood Graph Example</Text>
      <Text style={styles.subtitle}>
        This shows how the WeeklyMoodGraph component works with sample data
      </Text>
      
      <WeeklyMoodGraph
        data={sampleData}
        onPointPress={handlePointPress}
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features Demonstrated:</Text>
        <Text style={styles.infoText}>
          • Dual-line chart showing professional vs personal mood{'\n'}
          • Interactive touch points with detailed information{'\n'}
          • Smooth animations and modern styling{'\n'}
          • Responsive design that adapts to screen size{'\n'}
          • Trend analysis with visual indicators{'\n'}
          • Weekly summary with averages{'\n'}
          • Empty state handling for missing data
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F2',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DancingScript-Bold',
    color: '#5D4E37',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  infoContainer: {
    backgroundColor: '#F5F0E8',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#5D4E37',
    marginBottom: 12,
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8B7355',
    lineHeight: 20,
  },
});

export default WeeklyMoodGraphExample;
