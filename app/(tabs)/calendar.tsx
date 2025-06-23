import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  
  // Sample data for calendar marking
  const markedDates = {
    '2023-10-15': { marked: true, dotColor: '#f7c5a8' },
    '2023-10-14': { marked: true, dotColor: '#f7c5a8' },
    '2023-10-10': { marked: true, dotColor: '#f7c5a8' },
    '2023-10-05': { marked: true, dotColor: '#f7c5a8' },
  };
  
  // Add the selected date to marked dates
  const allMarkedDates = {
    ...markedDates,
    ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#f7c5a8' } } : {}),
  };
  
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    // You could fetch entries for this date here
  };
  
  const theme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: Colors[colorScheme ?? 'light'].text,
    textSectionTitleDisabledColor: '#d9e1e8',
    selectedDayBackgroundColor: '#f7c5a8',
    selectedDayTextColor: '#4b3621',
    todayTextColor: '#f7c5a8',
    dayTextColor: Colors[colorScheme ?? 'light'].text,
    textDisabledColor: '#d9e1e8',
    dotColor: '#f7c5a8',
    selectedDotColor: '#4b3621',
    arrowColor: '#f7c5a8',
    disabledArrowColor: '#d9e1e8',
    monthTextColor: Colors[colorScheme ?? 'light'].text,
    indicatorColor: '#f7c5a8',
    textDayFontFamily: 'Inter-Regular',
    textMonthFontFamily: 'PlayfairDisplay-Regular',
    textDayHeaderFontFamily: 'Inter-Medium',
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
      </View>
      
      <GlassCard style={styles.calendarCard}>
        <Calendar
          theme={theme}
          markedDates={allMarkedDates}
          onDayPress={handleDayPress}
          enableSwipeMonths
          hideExtraDays
        />
      </GlassCard>
      
      {selectedDate && (
        <View style={styles.entriesSection}>
          <ThemedText type="subtitle" style={styles.entriesTitle}>
            Entries for {new Date(selectedDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </ThemedText>
          
          <GlassCard style={styles.entrySummary}>
            <TouchableOpacity 
              onPress={() => router.push(`/entry/1`)}
              activeOpacity={0.8}
            >
              <ThemedText type="journalTitle">Morning Reflections</ThemedText>
              <ThemedText numberOfLines={2} style={styles.previewText}>
                Today I woke up feeling refreshed and ready to tackle the day...
              </ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
  },
  calendarCard: {
    marginBottom: 20,
  },
  entriesSection: {
    marginTop: 16,
  },
  entriesTitle: {
    marginBottom: 12,
  },
  entrySummary: {
    marginBottom: 12,
  },
  previewText: {
    marginTop: 8,
    opacity: 0.8,
  },
});