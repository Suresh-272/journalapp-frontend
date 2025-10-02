import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Animated, Alert, RefreshControl, ScrollView, Text, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getJournals, unlockProtectedEntry } from '@/services/journalService';

// Enhanced dual-theme design for Personal and Professional sections
const personalTheme = {
  primary: '#A9745A', // Caramel Brown - Main ribbon/notebook color
  secondary: '#8B5E3C', // Chestnut Brown - Gradient highlight
  background: '#F5EDE1', // Light Beige - Clean background tone
  cardBackground: '#FFFFFF',
  accent: '#A9745A', // Caramel Brown accent
  text: '#4B2E2A', // Espresso Brown - For main text
  textSecondary: '#8B5E3C', // Chestnut Brown for secondary text
  border: '#D4C0A8', // Lighter brown border
  highlight: '#F0E6D7', // Very light warm highlight
  shadow: 'rgba(75, 46, 42, 0.15)', // Espresso Brown shadow
  gradient: {
    start: '#A9745A', // Caramel Brown
    middle: '#8B5E3C', // Chestnut Brown  
    end: '#4B2E2A' // Espresso Brown
  },
};

const professionalTheme = {
  primary: '#6B4E3D', // Deep professional brown - darker than personal
  secondary: '#8B6F47', // Rich brown secondary
  background: '#F8F5F1', // Professional light beige
  cardBackground: '#FFFFFF',
  accent: '#9B7B5A', // Professional brown accent
  text: '#3D2B1F', // Very dark brown for professional text
  textSecondary: '#6B4E3D', // Deep brown for secondary text
  border: '#D1C7B8', // Professional light brown border
  highlight: '#F2EDE5', // Professional light highlight
  shadow: 'rgba(61, 43, 31, 0.15)', // Professional dark brown shadow
  success: '#7A8471', // Muted green-brown for completed tasks
  warning: '#B8956A', // Warm brown for pending tasks
  gradient: {
    start: '#9B7B5A', // Professional brown
    middle: '#8B6F47', // Rich brown
    end: '#6B4E3D' // Deep brown
  },
};

// TypeScript interfaces
interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  location?: string;
  category: string;
  isProtected?: boolean;
  media: Array<{
    _id: string;
    type: 'image' | 'audio' | 'video';
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function EntriesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Main section state
  const [activeSection, setActiveSection] = useState<'personal' | 'professional'>('personal');
  const sectionAnimation = useRef(new Animated.Value(0)).current;
  
  // State for journal data
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Professional section state
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Complete quarterly report', completed: false, priority: 'high' },
    { id: 2, text: 'Schedule team meeting', completed: true, priority: 'medium' },
    { id: 3, text: 'Review project proposals', completed: false, priority: 'high' },
    { id: 4, text: 'Update LinkedIn profile', completed: false, priority: 'low' },
  ]);
  const [newTodo, setNewTodo] = useState('');
  
  // Protection feature state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedProtectedEntry, setSelectedProtectedEntry] = useState<JournalEntry | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Get current theme colors based on active section
  const theme = activeSection === 'personal' ? personalTheme : professionalTheme;

  // Filter journals by active section
  const filteredJournals = journals.filter(journal => journal.category === activeSection);
  
  // Animation for section switching
  const switchSection = (section: 'personal' | 'professional') => {
    setActiveSection(section);
    Animated.spring(sectionAnimation, {
      toValue: section === 'personal' ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };
  
  // Todo management functions
  const addTodo = () => {
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        priority: 'medium'
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
    }
  };
  
  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Fetch journal entries
  const fetchJournals = async () => {
    try {
      setError(null);
      const response = await getJournals();
      
      if (response.success) {
        setJournals(response.data || []);
      } else {
        setError(response.message || 'Failed to load journal entries');
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournals();
    setRefreshing(false);
  };

  // Initialize data
  useEffect(() => {
    fetchJournals();
  }, []);

  // Mood emoji helper
  const getMoodEmoji = (mood: string) => {
    const moodMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      excited: '🤩',
      calm: '😌',
      anxious: '😰',
      grateful: '🙏',
      neutral: '😐'
    };
    return moodMap[mood] || '😐';
  };

  // Handle unlock modal
  const handleUnlock = async (password: string) => {
    if (!selectedProtectedEntry) return;
    
    setIsUnlocking(true);
    try {
      const response = await unlockProtectedEntry(selectedProtectedEntry._id, password as any);
      if (response.success) {
        router.push({
          pathname: '/journal/detail',
          params: {
            id: selectedProtectedEntry._id,
            unlocked: 'true',
            title: response.data.title || '',
            content: response.data.content || '',
            category: response.data.category || '',
            location: response.data.location || '',
            mood: response.data.mood || '',
            tags: JSON.stringify(response.data.tags || []),
            media: JSON.stringify(response.data.media || []),
            createdAt: response.data.createdAt || '',
            updatedAt: response.data.updatedAt || ''
          }
        });
        setShowUnlockModal(false);
        setSelectedProtectedEntry(null);
        setUnlockPassword('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid password');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Render functions
  const renderPersonalJournalItem = (item: JournalEntry) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const handleEntryPress = () => {
      if (item.isProtected) {
        setSelectedProtectedEntry(item);
        setShowUnlockModal(true);
      } else {
        router.push(`/journal/detail?id=${item._id}`);
      }
    };

    return (
      <TouchableOpacity key={item._id} onPress={handleEntryPress} activeOpacity={0.7} style={styles.journalItemContainer}>
        <View style={[styles.personalJournalItem, { backgroundColor: personalTheme.highlight, borderColor: personalTheme.border }]}>
          <View style={styles.journalItemHeader}>
            <View style={[styles.journalDateBadge, { backgroundColor: personalTheme.primary }]}>
              <ThemedText style={[styles.journalDateText, { color: '#FFFFFF' }]}>{formattedDate}</ThemedText>
            </View>
            {item.isProtected && (
              <Text style={styles.protectedIcon}>🔒</Text>
            )}
          </View>
          
          <ThemedText style={[styles.journalItemTitle, { color: personalTheme.text }]}>
            {item.title || 'Untitled Memory'}
          </ThemedText>
          
          <ThemedText 
            style={[styles.journalItemContent, { color: personalTheme.textSecondary }]} 
            numberOfLines={2}
          >
            {item.isProtected ? '🔒 This memory is protected' : (item.content || 'No content')}
          </ThemedText>
          
        </View>
      </TouchableOpacity>
    );
  };

  const renderProfessionalJournalItem = (item: JournalEntry) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const handleEntryPress = () => {
      if (item.isProtected) {
        setSelectedProtectedEntry(item);
        setShowUnlockModal(true);
      } else {
        router.push(`/journal/detail?id=${item._id}`);
      }
    };

    return (
      <TouchableOpacity key={item._id} onPress={handleEntryPress} activeOpacity={0.7} style={styles.journalItemContainer}>
        <View style={[styles.professionalJournalItem, { backgroundColor: professionalTheme.highlight, borderColor: professionalTheme.border }]}>
          <View style={styles.journalItemHeader}>
            <View style={[styles.journalDateBadge, { backgroundColor: professionalTheme.primary }]}>
              <ThemedText style={[styles.journalDateText, { color: '#FFFFFF' }]}>{formattedDate}</ThemedText>
            </View>
            {item.isProtected && (
              <Text style={styles.protectedIcon}>🔒</Text>
            )}
          </View>
          
          <ThemedText style={[styles.journalItemTitle, { color: professionalTheme.text }]}>
            {item.title || 'Work Reflection'}
          </ThemedText>
          
          <ThemedText 
            style={[styles.journalItemContent, { color: professionalTheme.textSecondary }]} 
            numberOfLines={2}
          >
            {item.isProtected ? '🔒 This entry is protected' : (item.content || 'No content')}
          </ThemedText>
          
          <View style={styles.professionalBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: professionalTheme.secondary }]}>
              <Text style={styles.categoryIcon}>💼</Text>
              <ThemedText style={[styles.categoryText, { color: '#FFFFFF' }]}>Work</ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: 60 + insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={[styles.headerTitle, { 
              color: theme.text,
              textShadowColor: theme.shadow,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }]}>
              {activeSection === 'personal' ? 'My Personal Space' : 'Professional Hub'}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {activeSection === 'personal' ? 'Your thoughts, memories & moments' : 'Goals, tasks & growth'}
            </ThemedText>
          </View>
        <TouchableOpacity 
          style={[styles.profileButton, { 
            backgroundColor: theme.highlight,
            borderWidth: 1,
            borderColor: theme.border,
          }]}
          onPress={() => router.push('/profile')}
        >
          <Text style={[styles.profileIcon, { color: theme.primary }]}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Section Toggle */}
      <View style={[styles.sectionToggle, { 
        backgroundColor: theme.cardBackground,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      }]}>
        <TouchableOpacity 
          style={[
            styles.sectionButton,
            activeSection === 'personal' && { 
              backgroundColor: personalTheme.primary,
              shadowColor: personalTheme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
          onPress={() => switchSection('personal')}
        >
          <Text style={[styles.sectionIcon, activeSection === 'personal' && { transform: [{ scale: 1.2 }] }]}>✨</Text>
          <ThemedText style={[
            styles.sectionButtonText,
            { color: activeSection === 'personal' ? '#FFFFFF' : theme.textSecondary }
          ]}>
            Personal
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.sectionButton,
            activeSection === 'professional' && { 
              backgroundColor: professionalTheme.primary,
              shadowColor: professionalTheme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
          onPress={() => switchSection('professional')}
        >
          <Text style={[styles.sectionIcon, activeSection === 'professional' && { transform: [{ scale: 1.2 }] }]}>💼</Text>
          <ThemedText style={[
            styles.sectionButtonText,
            { color: activeSection === 'professional' ? '#FFFFFF' : theme.textSecondary }
          ]}>
            Professional
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {activeSection === 'personal' ? (
          <View style={styles.personalSection}>
            {/* Personal Stats */}
            <View style={[styles.statsCard, { 
              backgroundColor: personalTheme.cardBackground, 
              shadowColor: personalTheme.shadow,
              borderLeftWidth: 4,
              borderLeftColor: personalTheme.primary,
            }]}>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { 
                  backgroundColor: personalTheme.highlight,
                  borderWidth: 1,
                  borderColor: personalTheme.border,
                }]}>
                  <Text style={styles.statEmoji}>📝</Text>
                  <ThemedText style={[styles.statNumber, { color: personalTheme.text }]}>{filteredJournals.length}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: personalTheme.textSecondary }]}>Memories</ThemedText>
                </View>
                <View style={[styles.statItem, { 
                  backgroundColor: personalTheme.highlight,
                  borderWidth: 1,
                  borderColor: personalTheme.border,
                }]}>
                  <Text style={styles.statEmoji}>🌟</Text>
                  <ThemedText style={[styles.statNumber, { color: personalTheme.text }]}>7</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: personalTheme.textSecondary }]}>Day Streak</ThemedText>
                </View>
                <View style={[styles.statItem, { 
                  backgroundColor: personalTheme.highlight,
                  borderWidth: 1,
                  borderColor: personalTheme.border,
                }]}>
                  <Text style={styles.statEmoji}>💭</Text>
                  <ThemedText style={[styles.statNumber, { color: personalTheme.text }]}>24</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: personalTheme.textSecondary }]}>This Month</ThemedText>
                </View>
              </View>
            </View>

            {/* Recent Personal Journals */}
            <View style={[styles.sectionCard, { backgroundColor: personalTheme.cardBackground }]}>
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: personalTheme.text }]}>Recent Memories</ThemedText>
                <TouchableOpacity onPress={() => router.push('/new-entry?category=personal')}>
                  <Text style={[styles.addButton, { color: personalTheme.primary }]}>+ Add Memory</Text>
                </TouchableOpacity>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={personalTheme.primary} />
                </View>
              ) : filteredJournals.length > 0 ? (
                filteredJournals.slice(0, 3).map((item) => renderPersonalJournalItem(item))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🌸</Text>
                  <ThemedText style={[styles.emptyTitle, { color: personalTheme.text }]}>Your personal space awaits</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: personalTheme.textSecondary }]}>Start capturing your thoughts and memories</ThemedText>
                </View>
              )}
            </View>

          </View>
        ) : (
          <View style={styles.professionalSection}>
            {/* Professional Dashboard */}
            <View style={[styles.dashboardCard, { 
              backgroundColor: professionalTheme.cardBackground,
              borderLeftWidth: 4,
              borderLeftColor: professionalTheme.primary,
              shadowColor: professionalTheme.shadow,
            }]}>
              <View style={styles.dashboardHeader}>
                <ThemedText style={[styles.dashboardTitle, { 
                  color: professionalTheme.text,
                  textShadowColor: professionalTheme.shadow,
                  textShadowOffset: { width: 0.5, height: 0.5 },
                  textShadowRadius: 1,
                }]}>Today's Focus</ThemedText>
                <View style={[styles.progressBadge, { 
                  backgroundColor: professionalTheme.success,
                  shadowColor: professionalTheme.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }]}>
                  <ThemedText style={styles.progressText}>75%</ThemedText>
                </View>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: professionalTheme.highlight }]}>
                <View style={[styles.progressFill, { 
                  backgroundColor: professionalTheme.success, 
                  width: '75%',
                  shadowColor: professionalTheme.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                }]} />
              </View>
              
              <ThemedText style={[styles.progressLabel, { color: professionalTheme.textSecondary }]}>3 of 4 tasks completed</ThemedText>
            </View>

            {/* Todo List */}
            <View style={[styles.sectionCard, { backgroundColor: professionalTheme.cardBackground }]}>
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: professionalTheme.text }]}>Tasks & Goals</ThemedText>
                <TouchableOpacity onPress={() => router.push('/new-entry?category=professional')}>
                  <Text style={[styles.addButton, { color: professionalTheme.primary }]}>+ Add Entry</Text>
                </TouchableOpacity>
              </View>
              
              {/* Add Todo Input */}
              <View style={[styles.addTodoContainer, { backgroundColor: professionalTheme.highlight }]}>
                <TextInput
                  style={[styles.todoInput, { color: professionalTheme.text }]}
                  placeholder="Add a new task..."
                  placeholderTextColor={professionalTheme.textSecondary}
                  value={newTodo}
                  onChangeText={setNewTodo}
                  onSubmitEditing={addTodo}
                />
                <TouchableOpacity onPress={addTodo} style={[styles.addTodoButton, { backgroundColor: professionalTheme.primary }]}>
                  <Text style={styles.addTodoIcon}>+</Text>
                </TouchableOpacity>
              </View>
              
              {todos.map((todo) => (
                <View key={todo.id} style={[styles.todoItem, { borderColor: professionalTheme.border }]}>
                  <TouchableOpacity onPress={() => toggleTodo(todo.id)} style={styles.todoCheckbox}>
                    <View style={[
                      styles.checkbox, 
                      { borderColor: professionalTheme.border },
                      todo.completed && { backgroundColor: professionalTheme.success }
                    ]}>
                      {todo.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.todoContent}>
                    <ThemedText style={[
                      styles.todoText, 
                      { color: todo.completed ? professionalTheme.textSecondary : professionalTheme.text },
                      todo.completed && styles.todoCompleted
                    ]}>
                      {todo.text}
                    </ThemedText>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: todo.priority === 'high' ? '#FEE2E2' : todo.priority === 'medium' ? '#FEF3C7' : '#F0FDF4'
                    }]}>
                      <ThemedText style={[styles.priorityText, {
                        color: todo.priority === 'high' ? '#DC2626' : todo.priority === 'medium' ? '#D97706' : '#16A34A'
                      }]}>
                        {todo.priority}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <TouchableOpacity onPress={() => deleteTodo(todo.id)} style={styles.deleteButton}>
                    <Text style={[styles.deleteIcon, { color: professionalTheme.textSecondary }]}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Professional Journal Entries */}
            <View style={[styles.sectionCard, { backgroundColor: professionalTheme.cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: professionalTheme.text }]}>Work Reflections</ThemedText>
              {filteredJournals.length > 0 ? (
                filteredJournals.slice(0, 2).map((item) => renderProfessionalJournalItem(item))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📊</Text>
                  <ThemedText style={[styles.emptyTitle, { color: professionalTheme.text }]}>Track your professional growth</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: professionalTheme.textSecondary }]}>Document achievements, learnings, and goals</ThemedText>
                </View>
              )}
            </View>

            {/* Professional Tools */}
            <View style={[styles.toolsCard, { backgroundColor: professionalTheme.cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: professionalTheme.text }]}>Growth Tools</ThemedText>
              <View style={styles.toolsGrid}>
                <TouchableOpacity style={[styles.toolItem, { backgroundColor: professionalTheme.highlight }]}>
                  <Text style={styles.toolEmoji}>📈</Text>
                  <ThemedText style={[styles.toolText, { color: professionalTheme.text }]}>Analytics</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolItem, { backgroundColor: professionalTheme.highlight }]}>
                  <Text style={styles.toolEmoji}>🎯</Text>
                  <ThemedText style={[styles.toolText, { color: professionalTheme.text }]}>Goals</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolItem, { backgroundColor: professionalTheme.highlight }]}>
                  <Text style={styles.toolEmoji}>📅</Text>
                  <ThemedText style={[styles.toolText, { color: professionalTheme.text }]}>Schedule</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolItem, { backgroundColor: professionalTheme.highlight }]}>
                  <Text style={styles.toolEmoji}>💡</Text>
                  <ThemedText style={[styles.toolText, { color: professionalTheme.text }]}>Ideas</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.shadow,
              borderWidth: 2,
              borderColor: activeSection === 'personal' ? personalTheme.secondary : professionalTheme.secondary,
            }
          ]}
          onPress={() => router.push(`/new-entry?category=${activeSection}`)}
          activeOpacity={0.7}
        >
          <Text style={[styles.fabIcon, { 
            color: '#FFFFFF',
            textShadowColor: theme.shadow,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Unlock Modal */}
      <Modal
        visible={showUnlockModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowUnlockModal(false);
          setSelectedProtectedEntry(null);
          setUnlockPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Protected Entry
              </ThemedText>
              <TouchableOpacity 
                onPress={() => {
                  setShowUnlockModal(false);
                  setSelectedProtectedEntry(null);
                  setUnlockPassword('');
                }}
              >
                <Text style={[styles.modalCloseIcon, { color: theme.text }]}>×</Text>
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              This journal entry is protected. Please enter the password to view it.
            </ThemedText>

            <TextInput
              style={[styles.passwordInput, { 
                backgroundColor: theme.highlight,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Enter password"
              placeholderTextColor={theme.textSecondary}
              value={unlockPassword}
              onChangeText={setUnlockPassword}
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.border }]}
                onPress={() => {
                  setShowUnlockModal(false);
                  setSelectedProtectedEntry(null);
                  setUnlockPassword('');
                }}
              >
                <ThemedText style={[styles.modalButtonText, { color: theme.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.unlockButton, { backgroundColor: theme.primary }]}
                onPress={() => handleUnlock(unlockPassword)}
                disabled={isUnlocking || !unlockPassword.trim()}
              >
                {isUnlocking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Unlock</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'DancingScript-Bold',
    lineHeight: 36,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    opacity: 0.8,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  sectionToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  personalSection: {
    gap: 20,
  },
  professionalSection: {
    gap: 20,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  journalItemContainer: {
    marginBottom: 12,
  },
  personalJournalItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  professionalJournalItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  journalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journalDateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  journalDateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  protectedIcon: {
    fontSize: 16,
  },
  journalItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  journalItemContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  professionalBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  dashboardCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  addTodoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  todoInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  addTodoButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTodoIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  todoCheckbox: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
    gap: 4,
  },
  todoText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toolsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  toolItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  toolEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  toolText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 130,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  modalCloseIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    lineHeight: 24,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {},
  unlockButton: {},
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
});