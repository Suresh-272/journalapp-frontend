import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [entries, setEntries] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [theme, setTheme] = useState('default');
  const [newEntry, setNewEntry] = useState({ text: '', photo: null });

  // Sample data for demonstration
  useEffect(() => {
    const sampleEntries = {
      '2024-01-15': [
        { id: 1, text: 'Morning workout', photo: null, time: '08:00' },
        { id: 2, text: 'Team meeting', photo: null, time: '14:00' }
      ],
      '2024-01-20': [
        { id: 3, text: 'Dinner with friends', photo: null, time: '19:00' }
      ],
      '2024-01-25': [
        { id: 4, text: 'Project deadline', photo: null, time: '17:00' }
      ]
    };
    setEntries(sampleEntries);
  }, []);

  const themes = {
    default: {
      primary: '#B8956A',
      secondary: '#F7F5F3',
      text: '#4A4A4A',
      accent: '#F0EBE6',
      highlight: '#D4AF7A'
    },
    warm: {
      primary: '#A67C52',
      secondary: '#F5F1ED',
      text: '#3C3C3C',
      accent: '#E8DDD4',
      highlight: '#C9966B'
    },
    cream: {
      primary: '#9B7B5C',
      secondary: '#FAF8F6',
      text: '#2D2D2D',
      accent: '#F2ECE4',
      highlight: '#B8956A'
    }
  };

  const currentTheme = themes[theme];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDateKey = (date, day) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const hasEntriesForDate = (date, day) => {
    const dateKey = formatDateKey(date, day);
    return entries[dateKey] && entries[dateKey].length > 0;
  };

  const getEntriesForDate = (date, day) => {
    const dateKey = formatDateKey(date, day);
    return entries[dateKey] || [];
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDatePress = (day) => {
    if (day) {
      const dateKey = formatDateKey(currentDate, day);
      setSelectedDate({ date: currentDate, day, dateKey });
      setShowDateModal(true);
    }
  };

  const addEntry = () => {
    if (newEntry.text.trim() && selectedDate) {
      const entry = {
        id: Date.now(),
        text: newEntry.text,
        photo: newEntry.photo,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setEntries(prev => ({
        ...prev,
        [selectedDate.dateKey]: [...(prev[selectedDate.dateKey] || []), entry]
      }));
      
      setNewEntry({ text: '', photo: null });
      setShowAddEntryModal(false);
    }
  };

  const deleteEntry = (entryId) => {
    if (selectedDate) {
      setEntries(prev => ({
        ...prev,
        [selectedDate.dateKey]: prev[selectedDate.dateKey].filter(entry => entry.id !== entryId)
      }));
    }
  };

  const searchEntries = () => {
    if (!searchQuery.trim()) return [];
    
    const results = [];
    Object.keys(entries).forEach(dateKey => {
      entries[dateKey].forEach(entry => {
        if (entry.text.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ ...entry, date: dateKey });
        }
      });
    });
    return results;
  };

  const renderCalendarDay = (day, index) => {
    const hasEntries = day && hasEntriesForDate(currentDate, day);
    const dayEntries = day ? getEntriesForDate(currentDate, day) : [];
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { backgroundColor: currentTheme.secondary },
          hasEntries && { backgroundColor: currentTheme.accent }
        ]}
        onPress={() => handleDatePress(day)}
        disabled={!day}
      >
        {day && (
          <>
            <Text style={[styles.dayText, { color: currentTheme.text }]}>
              {day}
            </Text>
            {hasEntries && (
              <View style={styles.entryPreview}>
                <View style={[styles.entryDot, { backgroundColor: currentTheme.highlight }]} />
                {dayEntries.length > 1 && (
                  <Text style={[styles.entryCount, { color: currentTheme.text }]}>
                    +{dayEntries.length - 1}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderListView = () => {
    const allEntries = [];
    Object.keys(entries).forEach(dateKey => {
      entries[dateKey].forEach(entry => {
        allEntries.push({ ...entry, date: dateKey });
      });
    });
    
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return (
      <FlatList
        data={allEntries}
        keyExtractor={(item) => `${item.date}-${item.id}`}
        renderItem={({ item }) => (
          <View style={[styles.listItem, { backgroundColor: currentTheme.secondary }]}>
            <Text style={[styles.listDate, { color: currentTheme.primary }]}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.listText, { color: currentTheme.text }]}>
              {item.text}
            </Text>
            <Text style={[styles.listTime, { color: currentTheme.text }]}>
              {item.time}
            </Text>
          </View>
        )}
      />
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.primary }]}>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Calendar</Text>
        
        {/* Theme Selector */}
        <View style={styles.themeContainer}>
          {Object.keys(themes).map(themeKey => (
            <TouchableOpacity
              key={themeKey}
              style={[
                styles.themeButton,
                { backgroundColor: themes[themeKey].primary },
                theme === themeKey && styles.selectedTheme
              ]}
              onPress={() => setTheme(themeKey)}
            />
          ))}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: currentTheme.secondary, color: currentTheme.text }]}
          placeholder="Search entries..."
          placeholderTextColor={currentTheme.text + '80'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Results */}
      {searchQuery.trim() && (
        <ScrollView style={styles.searchResults}>
          {searchEntries().map((entry, index) => (
            <View key={index} style={[styles.searchResult, { backgroundColor: currentTheme.secondary }]}>
              <Text style={[styles.searchResultDate, { color: currentTheme.primary }]}>
                {entry.date}
              </Text>
              <Text style={[styles.searchResultText, { color: currentTheme.text }]}>
                {entry.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            { backgroundColor: viewMode === 'calendar' ? currentTheme.primary : currentTheme.secondary }
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.viewModeText, { color: viewMode === 'calendar' ? '#FFFFFF' : currentTheme.text }]}>
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            { backgroundColor: viewMode === 'list' ? currentTheme.primary : currentTheme.secondary }
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.viewModeText, { color: viewMode === 'list' ? '#FFFFFF' : currentTheme.text }]}>
            List
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? (
        <>
          {/* Calendar Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => navigateMonth(-1)}
            >
              <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>{'<'}</Text>
            </TouchableOpacity>
            
            <Text style={[styles.monthYear, { color: currentTheme.text }]}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => navigateMonth(1)}
            >
              <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map(day => (
              <Text key={day} style={[styles.weekDay, { color: currentTheme.text }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentDate).map((day, index) => renderCalendarDay(day, index))}
          </View>
        </>
      ) : (
        renderListView()
      )}

      {/* Date Detail Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.secondary }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              {selectedDate && `${monthNames[selectedDate.date.getMonth()]} ${selectedDate.day}, ${selectedDate.date.getFullYear()}`}
            </Text>
            
            <ScrollView style={styles.entriesContainer}>
              {selectedDate && getEntriesForDate(selectedDate.date, selectedDate.day).map(entry => (
                <View key={entry.id} style={[styles.entryItem, { backgroundColor: currentTheme.accent }]}>
                  <Text style={[styles.entryTime, { color: currentTheme.primary }]}>
                    {entry.time}
                  </Text>
                  <Text style={[styles.entryText, { color: currentTheme.text }]}>
                    {entry.text}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteEntry(entry.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => setShowAddEntryModal(true)}
              >
                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>Add Entry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: currentTheme.secondary }]}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddEntryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.secondary }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Add New Entry</Text>
            
            <TextInput
              style={[styles.entryInput, { backgroundColor: currentTheme.accent, color: currentTheme.text }]}
              placeholder="Enter your journal entry..."
              placeholderTextColor={currentTheme.text + '80'}
              value={newEntry.text}
              onChangeText={(text) => setNewEntry(prev => ({ ...prev, text }))}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
                onPress={addEntry}
              >
                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>Save Entry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: currentTheme.secondary }]}
                onPress={() => setShowAddEntryModal(false)}
              >
                <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  selectedTheme: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 150,
    paddingHorizontal: 20,
  },
  searchResult: {
    padding: 10,
    marginBottom: 5,
    borderRadius: 8,
  },
  searchResultDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResultText: {
    fontSize: 14,
    marginTop: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  viewModeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dayCell: {
    width: (width - 40) / 7,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD4',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryPreview: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  entryCount: {
    fontSize: 10,
    marginLeft: 2,
  },
  listItem: {
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
  },
  listDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listText: {
    fontSize: 16,
    marginTop: 5,
  },
  listTime: {
    fontSize: 12,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  entriesContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  entryItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  entryText: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
});

export default CalendarScreen;