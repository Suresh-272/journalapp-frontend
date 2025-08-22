import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { useColorScheme } from '../hooks/useColorScheme';

const { width } = Dimensions.get('window');

// TypeScript interfaces
interface MoodGraphProps {
  data: {
    days: string[];
    professionalMood: number[];
    personalMood: number[];
  };
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  onPointPress?: (day: string, mood: number, type: 'professional' | 'personal') => void;
}

interface WeeklyMoodData {
  days: string[];
  professionalMood: number[];
  personalMood: number[];
}

const WeeklyMoodGraph: React.FC<MoodGraphProps> = ({
  data,
  width: customWidth = width - 40,
  height: customHeight = 280,
  theme: customTheme,
  onPointPress
}) => {
  const colorScheme = useColorScheme();
  const theme = customTheme || colorScheme;
  const colors = require('../constants/Colors').Colors[theme];
  
  const [selectedPoint, setSelectedPoint] = useState<{
    day: string;
    professionalMood: number;
    personalMood: number;
  } | null>(null);

  // Animation values
  const chartOpacity = useSharedValue(0);
  const chartScale = useSharedValue(0.8);
  const legendOpacity = useSharedValue(0);

  // Professional mood color (warm blue-green)
  const professionalColor = '#7A8471'; // From mood tracker theme
  // Personal mood color (warm brown)
  const personalColor = '#9B8F7A'; // From mood tracker theme

  useEffect(() => {
    // Animate chart entry
    chartOpacity.value = withSpring(1, { damping: 12, stiffness: 80 });
    chartScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    
    // Animate legend with delay
    setTimeout(() => {
      legendOpacity.value = withSpring(1, { damping: 12, stiffness: 80 });
    }, 300);
  }, []);

  // Animated styles
  const chartAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: chartOpacity.value,
      transform: [{ scale: chartScale.value }]
    };
  });

  const legendAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: legendOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            legendOpacity.value,
            [0, 1],
            [20, 0]
          )
        }
      ]
    };
  });

  // Process data to ensure we have 7 days
  const processData = (): WeeklyMoodData => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Fill missing data with null values for interpolation
    const professionalMood = days.map((day, index) => {
      return data.professionalMood[index] || null;
    });
    
    const personalMood = days.map((day, index) => {
      return data.personalMood[index] || null;
    });

    return {
      days,
      professionalMood,
      personalMood
    };
  };

  const processedData = processData();

  // Calculate averages
  const professionalAverage = processedData.professionalMood
    .filter(mood => mood !== null)
    .reduce((sum, mood) => sum + mood!, 0) / 
    processedData.professionalMood.filter(mood => mood !== null).length || 0;

  const personalAverage = processedData.personalMood
    .filter(mood => mood !== null)
    .reduce((sum, mood) => sum + mood!, 0) / 
    processedData.personalMood.filter(mood => mood !== null).length || 0;

  // Get chart data for react-native-chart-kit
  const getChartData = () => {
    return {
      labels: processedData.days,
      datasets: [
        {
          data: processedData.professionalMood.map(mood => mood || 0),
          color: (opacity = 1) => `rgba(122, 132, 113, ${opacity})`, // professionalColor
          strokeWidth: 3,
        },
        {
          data: processedData.personalMood.map(mood => mood || 0),
          color: (opacity = 1) => `rgba(155, 143, 122, ${opacity})`, // personalColor
          strokeWidth: 3,
        },
      ],
    };
  };

  // Handle point press
  const handlePointPress = (dataPoint: any, index: number) => {
    const day = processedData.days[index];
    const professionalMood = processedData.professionalMood[index];
    const personalMood = processedData.personalMood[index];
    
    setSelectedPoint({
      day,
      professionalMood: professionalMood || 0,
      personalMood: personalMood || 0
    });

    if (onPointPress) {
      // Determine which line was pressed based on data values
      if (professionalMood && personalMood) {
        // Both have data, show selection dialog
        Alert.alert(
          `${day} Mood Details`,
          `Professional: ${professionalMood}/10\nPersonal: ${personalMood}/10`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Professional', 
              onPress: () => onPointPress(day, professionalMood, 'professional')
            },
            { 
              text: 'Personal', 
              onPress: () => onPointPress(day, personalMood, 'personal')
            }
          ]
        );
      } else if (professionalMood) {
        onPointPress(day, professionalMood, 'professional');
      } else if (personalMood) {
        onPointPress(day, personalMood, 'personal');
      }
    }
  };

  // Get mood trend indicator
  const getTrendIndicator = (moodData: number[]) => {
    const validData = moodData.filter(mood => mood !== null);
    if (validData.length < 2) return null;
    
    const firstHalf = validData.slice(0, Math.ceil(validData.length / 2));
    const secondHalf = validData.slice(Math.ceil(validData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) {
      return { trend: 'improving', emoji: '📈', color: '#7A8471' };
    } else if (secondAvg < firstAvg - 0.5) {
      return { trend: 'declining', emoji: '📉', color: '#B85450' };
    } else {
      return { trend: 'stable', emoji: '➡️', color: '#9B8F7A' };
    }
  };

  const professionalTrend = getTrendIndicator(processedData.professionalMood);
  const personalTrend = getTrendIndicator(processedData.personalMood);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Mood Trends</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Professional vs Personal
        </Text>
      </View>

      {/* Chart */}
      <Animated.View style={[styles.chartContainer, chartAnimatedStyle]}>
        <LineChart
          data={getChartData()}
          width={customWidth}
          height={customHeight}
          yAxisInterval={2}
          chartConfig={{
            backgroundColor: colors.cardBackground,
            backgroundGradientFrom: colors.cardBackground,
            backgroundGradientTo: colors.cardBackground,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(106, 90, 75, ${opacity})`, // Dark brown for labels
            labelColor: (opacity = 1) => `rgba(106, 90, 75, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.cardBackground,
            },
            propsForBackgroundLines: {
              strokeDasharray: '', // Solid lines
              stroke: colors.borderColor,
              strokeWidth: 0.5,
            },
          }}
          bezier
          style={styles.chart}
          fromZero
          segments={4}
          yAxisSuffix=""
          onDataPointClick={handlePointPress}
        />
      </Animated.View>

      {/* Legend */}
      <Animated.View style={[styles.legendContainer, legendAnimatedStyle]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: professionalColor }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Professional</Text>
          <Text style={[styles.legendValue, { color: colors.tabIconDefault }]}>
            {professionalAverage.toFixed(1)}/10
          </Text>
          {professionalTrend && (
            <Text style={[styles.trendIndicator, { color: professionalTrend.color }]}>
              {professionalTrend.emoji}
            </Text>
          )}
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: personalColor }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Personal</Text>
          <Text style={[styles.legendValue, { color: colors.tabIconDefault }]}>
            {personalAverage.toFixed(1)}/10
          </Text>
          {personalTrend && (
            <Text style={[styles.trendIndicator, { color: personalTrend.color }]}>
              {personalTrend.emoji}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Weekly Summary */}
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Weekly Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
            Professional Average:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {professionalAverage.toFixed(1)}/10
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
            Personal Average:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {personalAverage.toFixed(1)}/10
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
            Overall Average:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {((professionalAverage + personalAverage) / 2).toFixed(1)}/10
          </Text>
        </View>
      </View>

      {/* Empty State */}
      {processedData.professionalMood.every(mood => mood === null) && 
       processedData.personalMood.every(mood => mood === null) && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.tabIconDefault }]}>
            No mood data available for this week
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.placeholderText }]}>
            Start tracking your daily moods to see trends
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#6A5A4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  legendValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginRight: 4,
  },
  trendIndicator: {
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#F5F2E8',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8DCC6',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WeeklyMoodGraph;
