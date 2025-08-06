# Mood Tracker Implementation

## Overview
The Mood Tracker is a comprehensive feature in the Memory Journal app that allows users to track their daily moods, view analytics, and maintain journaling streaks.

## Features Implemented

### 🔘 Mood Tracking
- **Mood Selection**: Users can select from 5 mood options (Very Sad, Sad, Neutral, Happy, Very Happy)
- **Daily Logging**: Prevents duplicate entries for the same day
- **Backend Integration**: Mood data is saved to MongoDB through the journal entries
- **Local Storage**: Uses AsyncStorage for offline caching and sync with backend

### 📊 Mood Analytics
- **Line Chart Visualization**: Uses `react-native-chart-kit` to display mood trends
- **Time Filters**: Toggle between weekly, monthly, and all-time views
- **Mood Mapping**: Converts string moods to numeric values (1-5) for chart display
- **Real-time Updates**: Chart updates when time filter changes

### 📅 Journal Streaks & Insights
- **Current Streak**: Tracks consecutive days of journal entries
- **Longest Streak**: Records the user's best streak
- **Animated Badge**: Streak counter animates when updated using `react-native-reanimated`
- **Streak Calculation**: Smart logic to handle gaps and calculate accurate streaks

### 📘 Mood Summary
- **Average Mood**: Calculates and displays average mood score
- **Most Frequent Mood**: Shows the user's most common mood
- **Mood Insights**: Provides contextual feedback based on mood trends
- **Journal Prompts**: Suggests writing prompts based on mood patterns

### ⚙️ Optimization & UI
- **FlatList**: Efficient rendering of recent mood entries
- **AsyncStorage Caching**: Local data storage with backend sync
- **Responsive Design**: Adapts to different screen sizes
- **Earth Theme**: Consistent warm color palette matching the app design

### 🎨 Animations
- **Streak Badge Animation**: Scale and rotation effects when streak updates
- **Mood Selection Animation**: Spring animations for mood button interactions
- **Chart Fade-in**: Smooth opacity transition when chart loads
- **React Native Reanimated**: Hardware-accelerated animations for smooth performance

## Technical Implementation

### Frontend (React Native + TypeScript)
- **File**: `journalapp-frontend/app/(tabs)/moodTracker.tsx`
- **Dependencies**: 
  - `react-native-chart-kit` for chart visualization
  - `react-native-reanimated` for animations
  - `@react-native-async-storage/async-storage` for local storage
  - `axios` for API calls

### Backend (Node.js + Express + MongoDB)
- **Controller**: `journalapp-backend/controllers/journals.js`
- **Route**: `journalapp-backend/routes/journals.js`
- **Endpoint**: `GET /api/journals/mood-analytics`
- **Features**:
  - Time-based filtering (week/month/all)
  - Streak calculation
  - Mood analytics (average, most frequent)
  - Chart data preparation

### Data Flow
1. **Load**: Component loads cached data from AsyncStorage
2. **Fetch**: Backend API call retrieves latest mood analytics
3. **Merge**: Local and backend data are merged, removing duplicates
4. **Update**: UI updates with new analytics and chart data
5. **Cache**: Updated data is saved to AsyncStorage

### API Integration
- **Service**: `journalapp-frontend/services/journalService.js`
- **Function**: `getMoodAnalytics(timeFilter)`
- **Fallback**: Falls back to `getJournals()` if analytics endpoint fails
- **Error Handling**: Comprehensive error handling with user feedback

## Usage

### For Users
1. Navigate to the Mood Tracker tab
2. View current stats (streaks, total entries, average mood)
3. Select a mood for today using the mood buttons
4. View mood trends in the chart
5. Use time filters to see different periods
6. Read insights and suggested journal prompts

### For Developers
1. **Adding New Moods**: Update `moodOptions` array and backend enum
2. **Modifying Analytics**: Edit `getMoodAnalytics` controller function
3. **Customizing Animations**: Modify animation values and styles
4. **Styling**: Update the StyleSheet object for visual changes

## Data Structure

### MoodEntry Interface
```typescript
interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  moodLabel: string;
  emoji: string;
  value: number;
}
```

### Backend Response
```javascript
{
  success: true,
  data: {
    totalEntries: number,
    averageMood: number,
    mostFrequentMood: string,
    currentStreak: number,
    longestStreak: number,
    moodCounts: object,
    chartData: array,
    timeFilter: string
  }
}
```

## Performance Optimizations
- **Efficient Rendering**: FlatList for large datasets
- **Caching Strategy**: AsyncStorage with backend sync
- **Animation Performance**: Hardware-accelerated animations
- **API Optimization**: Single endpoint for all analytics data
- **Memory Management**: Proper cleanup and state management

## Future Enhancements
- **Mood Reminders**: Push notifications for daily mood logging
- **Advanced Analytics**: Mood correlation with activities/events
- **Export Features**: Data export for external analysis
- **Social Features**: Anonymous mood sharing with friends
- **AI Insights**: Machine learning for mood pattern recognition 