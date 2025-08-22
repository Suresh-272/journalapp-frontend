# WeeklyMoodGraph Component

A React Native component for displaying weekly mood tracking data with dual-line charts showing professional and personal mood trends.

## Features

- **Dual-line Chart**: Shows professional and personal mood trends on the same graph
- **Interactive Points**: Tap on any point to see detailed mood information
- **Smooth Animations**: Beautiful entry animations using React Native Reanimated
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Matches your app's color scheme (light/dark mode)
- **Trend Analysis**: Visual indicators showing mood improvement/decline
- **Weekly Summary**: Displays averages for both categories
- **Empty State Handling**: Graceful handling of missing data
- **Touch Interactions**: Detailed information on point press

## Installation

The component uses the following dependencies:
- `react-native-chart-kit` for the chart rendering
- `react-native-reanimated` for animations
- `react-native-svg` (required by react-native-chart-kit)

Make sure these are installed in your project.

## Usage

### Basic Usage

```tsx
import WeeklyMoodGraph from './components/WeeklyMoodGraph';

const MyComponent = () => {
  const moodData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    professionalMood: [7, 6, 8, 5, 9, 3, 6], // Scale 1-10
    personalMood: [8, 7, 6, 9, 7, 8, 9]      // Scale 1-10
  };

  const handlePointPress = (day: string, mood: number, type: 'professional' | 'personal') => {
    console.log(`${day} ${type} mood: ${mood}/10`);
  };

  return (
    <WeeklyMoodGraph
      data={moodData}
      onPointPress={handlePointPress}
    />
  );
};
```

### With Real Journal Data

```tsx
import { getCurrentWeekMoodData } from '../utils/moodDataProcessor';
import { getJournals } from '../services/journalService';

const MyComponent = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await getJournals(1, 1000);
      if (response.success) {
        setJournalEntries(response.data);
        const weekMoodData = getCurrentWeekMoodData(response.data);
        setWeekData(weekMoodData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePointPress = (day: string, mood: number, type: 'professional' | 'personal') => {
    // Navigate to filtered entries or show detailed view
    navigation.navigate('JournalList', { 
      filter: { day, category: type } 
    });
  };

  return (
    <WeeklyMoodGraph
      data={weekData}
      onPointPress={handlePointPress}
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `WeeklyMoodData` | Required | The mood data to display |
| `width` | `number` | `screen width - 40` | Custom width for the chart |
| `height` | `number` | `280` | Custom height for the chart |
| `theme` | `'light' \| 'dark'` | Auto-detected | Override theme |
| `onPointPress` | `function` | Optional | Callback when a point is pressed |

## Data Structure

```typescript
interface WeeklyMoodData {
  days: string[];           // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  professionalMood: number[]; // [7, 6, 8, 5, 9, 3, 6] - Scale 1-10
  personalMood: number[];     // [8, 7, 6, 9, 7, 8, 9] - Scale 1-10
}
```

## Utility Functions

The component works with utility functions from `moodDataProcessor.ts`:

- `getCurrentWeekMoodData(entries)` - Get current week data
- `getPreviousWeekMoodData(entries)` - Get previous week data
- `getNextWeekMoodData(entries)` - Get next week data
- `processWeeklyMoodData(entries, date)` - Process data for specific date
- `analyzeMoodTrend(moodData)` - Analyze mood trends

## Styling

The component uses your app's theme colors from `Colors.ts`:

- **Professional Mood**: `#7A8471` (warm blue-green)
- **Personal Mood**: `#9B8F7A` (warm brown)
- **Background**: Matches your app's card background
- **Text**: Uses your app's text colors
- **Borders**: Uses your app's border colors

## Features in Detail

### Interactive Points
- Tap any point to see mood details
- Shows both professional and personal mood if both exist
- Allows navigation to detailed views

### Trend Analysis
- Automatically calculates mood trends
- Shows visual indicators (📈📉➡️)
- Color-coded trend indicators

### Weekly Summary
- Professional average
- Personal average
- Overall average
- Displays in a clean card format

### Empty State
- Handles weeks with no data
- Shows encouraging message
- Maintains component structure

### Animations
- Smooth chart entry animation
- Legend fade-in with delay
- Scale and opacity transitions

## Example Screens

1. **WeeklyMoodDemo.tsx** - Full demo with real data integration
2. **WeeklyMoodGraphExample.tsx** - Simple example with sample data

## Integration with Journal App

The component is designed to work seamlessly with your journal app:

1. **Data Processing**: Uses `moodDataProcessor.ts` to convert journal entries to chart data
2. **Theme Integration**: Automatically uses your app's color scheme
3. **Navigation**: Can integrate with your app's navigation for detailed views
4. **Real-time Updates**: Updates when new journal entries are added

## Customization

You can customize the component by:

1. **Colors**: Modify the color constants in the component
2. **Animations**: Adjust animation parameters in `useEffect`
3. **Styling**: Modify the `styles` object
4. **Chart Configuration**: Adjust `chartConfig` in the LineChart component

## Performance

- Efficient data processing
- Optimized animations
- Minimal re-renders
- Handles large datasets gracefully

## Accessibility

- Proper contrast ratios
- Readable text sizes
- Touch-friendly interaction areas
- Screen reader compatible

## Troubleshooting

### Chart not showing
- Ensure `react-native-chart-kit` and `react-native-svg` are installed
- Check that data structure matches `WeeklyMoodData` interface
- Verify theme colors are properly defined

### Animations not working
- Ensure `react-native-reanimated` is properly configured
- Check that animations are enabled in your app

### Data not updating
- Verify that `data` prop is changing
- Check that utility functions are processing data correctly
- Ensure journal entries have proper `category` and `mood` fields
