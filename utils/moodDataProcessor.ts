import { JournalEntry } from '../types/journal';

// Mood value mapping (1-10 scale)
const moodValueMap: { [key: string]: number } = {
  'sad': 2,
  'anxious': 3,
  'neutral': 5,
  'calm': 7,
  'happy': 8,
  'excited': 9,
};

export interface WeeklyMoodData {
  days: string[];
  professionalMood: number[];
  personalMood: number[];
}

/**
 * Get the start of the week (Monday) for a given date
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Get the end of the week (Sunday) for a given date
 */
export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
};

/**
 * Convert mood string to numeric value (1-10 scale)
 */
export const moodToValue = (mood: string): number => {
  return moodValueMap[mood] || 5; // Default to neutral (5) if mood not found
};

/**
 * Get day of week index (0 = Monday, 6 = Sunday)
 */
export const getDayOfWeekIndex = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to 6, others to 0-5
};

/**
 * Process journal entries to create weekly mood data
 */
export const processWeeklyMoodData = (
  journalEntries: JournalEntry[],
  targetDate: Date = new Date()
): WeeklyMoodData => {
  const weekStart = getWeekStart(targetDate);
  const weekEnd = getWeekEnd(targetDate);
  
  // Initialize arrays for the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const professionalMood: (number | null)[] = new Array(7).fill(null);
  const personalMood: (number | null)[] = new Array(7).fill(null);
  
  // Filter entries for the target week
  const weekEntries = journalEntries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });
  
  // Group entries by day and category
  const dailyMoods: { [key: string]: { professional: number[], personal: number[] } } = {};
  
  weekEntries.forEach(entry => {
    const entryDate = new Date(entry.createdAt);
    const dayIndex = getDayOfWeekIndex(entryDate);
    const dayKey = days[dayIndex];
    
    if (!dailyMoods[dayKey]) {
      dailyMoods[dayKey] = { professional: [], personal: [] };
    }
    
    const moodValue = moodToValue(entry.mood);
    
    if (entry.category === 'professional') {
      dailyMoods[dayKey].professional.push(moodValue);
    } else if (entry.category === 'personal') {
      dailyMoods[dayKey].personal.push(moodValue);
    }
  });
  
  // Calculate average mood for each day and category
  days.forEach((day, index) => {
    const dayData = dailyMoods[day];
    
    if (dayData?.professional.length > 0) {
      const avgProfessional = dayData.professional.reduce((sum, mood) => sum + mood, 0) / dayData.professional.length;
      professionalMood[index] = Math.round(avgProfessional * 10) / 10; // Round to 1 decimal
    }
    
    if (dayData?.personal.length > 0) {
      const avgPersonal = dayData.personal.reduce((sum, mood) => sum + mood, 0) / dayData.personal.length;
      personalMood[index] = Math.round(avgPersonal * 10) / 10; // Round to 1 decimal
    }
  });
  
  return {
    days,
    professionalMood,
    personalMood
  };
};

/**
 * Get weekly mood data for the current week
 */
export const getCurrentWeekMoodData = (journalEntries: JournalEntry[]): WeeklyMoodData => {
  return processWeeklyMoodData(journalEntries, new Date());
};

/**
 * Get weekly mood data for a specific week
 */
export const getWeekMoodData = (journalEntries: JournalEntry[], date: Date): WeeklyMoodData => {
  return processWeeklyMoodData(journalEntries, date);
};

/**
 * Get weekly mood data for the previous week
 */
export const getPreviousWeekMoodData = (journalEntries: JournalEntry[]): WeeklyMoodData => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return processWeeklyMoodData(journalEntries, lastWeek);
};

/**
 * Get weekly mood data for the next week
 */
export const getNextWeekMoodData = (journalEntries: JournalEntry[]): WeeklyMoodData => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return processWeeklyMoodData(journalEntries, nextWeek);
};

/**
 * Format date range for display
 */
export const formatWeekRange = (startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  
  return `${start} - ${end}`;
};

/**
 * Check if a week has any mood data
 */
export const hasWeekData = (data: WeeklyMoodData): boolean => {
  return data.professionalMood.some(mood => mood !== null) || 
         data.personalMood.some(mood => mood !== null);
};

/**
 * Get mood trend analysis
 */
export const analyzeMoodTrend = (moodData: number[]): {
  trend: 'improving' | 'declining' | 'stable';
  change: number;
  emoji: string;
  color: string;
} => {
  const validData = moodData.filter(mood => mood !== null);
  
  if (validData.length < 2) {
    return {
      trend: 'stable',
      change: 0,
      emoji: '➡️',
      color: '#9B8F7A'
    };
  }
  
  const firstHalf = validData.slice(0, Math.ceil(validData.length / 2));
  const secondHalf = validData.slice(Math.ceil(validData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, mood) => sum + mood, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, mood) => sum + mood, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  
  if (change > 0.5) {
    return {
      trend: 'improving',
      change: Math.round(change * 10) / 10,
      emoji: '📈',
      color: '#7A8471'
    };
  } else if (change < -0.5) {
    return {
      trend: 'declining',
      change: Math.round(change * 10) / 10,
      emoji: '📉',
      color: '#B85450'
    };
  } else {
    return {
      trend: 'stable',
      change: Math.round(change * 10) / 10,
      emoji: '➡️',
      color: '#9B8F7A'
    };
  }
};
