import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import api from '../../utils/api';
import { getJournals } from '@/services/journalService';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallDevice = width < 375;

// Enhanced color theme for the profile screen
const profileTheme = {
  headerBrown: '#8B6B4C',
  warmBeige: '#F7F3ED',
  cardBeige: '#FFFFFF',
  controlBeige: '#E8DCC8',
  darkBrown: '#3D2F22',
  mediumBrown: '#6B5643',
  warmAccent: '#B8956A',
  navBrown: '#6B5B4F',
  lightBrown: '#D4C4B0',
  background: '#F7F3ED',
  text: '#3D2F22',
  tint: '#E8DCC8',
  cardBackground: '#FFFFFF',
  tabIconDefault: '#6B5643',
  pastelPink: '#F5F1EC',
  pastelBlue: '#E8DCC8',
  // Additional gradient colors
  gradientStart: '#B8956A',
  gradientEnd: '#8B6B4C',
  statCardGradient: ['#F8F4F0', '#F0E8D8'],
  accentGradient: ['#B8956A', '#A67C52'],
};

interface UserData {
  _id: string;
  name: string;
  email: string;
  mobileno: string;
  createdAt: string;
}

interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  thisMonthEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  weeklyAverage: number;
  monthlyGoal: number;
  goalProgress: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = profileTheme;
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [journalStats, setJournalStats] = useState<JournalStats>({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    thisMonthEntries: 0,
    totalWords: 0,
    averageWordsPerEntry: 0,
    weeklyAverage: 0,
    monthlyGoal: 30,
    goalProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchJournalStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUserData(response.data.data);
        setEditingName(response.data.data.name);
        setEditingEmail(response.data.data.email);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalStats = async () => {
    try {
      const response = await getJournals();
      if (response.success) {
        const journals = response.data;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const thisWeek = getWeekNumber(now);

        // Calculate stats
        const totalEntries = journals.length;
        const thisMonthEntries = journals.filter(journal => {
          const journalDate = new Date(journal.createdAt);
          return journalDate.getMonth() === thisMonth && journalDate.getFullYear() === thisYear;
        }).length;

        const thisWeekEntries = journals.filter(journal => {
          const journalDate = new Date(journal.createdAt);
          return getWeekNumber(journalDate) === thisWeek && journalDate.getFullYear() === thisYear;
        }).length;

        const totalWords = journals.reduce((sum, journal) => {
          return sum + (journal.content ? journal.content.split(' ').length : 0);
        }, 0);

        const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
        const weeklyAverage = Math.round(thisWeekEntries);

        // Calculate streaks
        const sortedJournals = journals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        for (const journal of sortedJournals) {
          const journalDate = new Date(journal.createdAt);
          const dateString = journalDate.toDateString();

          if (!lastDate) {
            lastDate = journalDate;
            tempStreak = 1;
            currentStreak = 1;
          } else {
            const diffTime = Math.abs(lastDate.getTime() - journalDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              tempStreak++;
              if (tempStreak === 1) {
                currentStreak = tempStreak;
              }
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
            lastDate = journalDate;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        const goalProgress = Math.round((thisMonthEntries / journalStats.monthlyGoal) * 100);

        setJournalStats({
          totalEntries,
          currentStreak,
          longestStreak,
          thisMonthEntries,
          totalWords,
          averageWordsPerEntry,
          weeklyAverage,
          monthlyGoal: 30,
          goalProgress: Math.min(goalProgress, 100),
        });
      }
    } catch (error) {
      console.error('Error fetching journal stats:', error);
    }
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleUpdateProfile = async () => {
    if (!editingName.trim() || !editingEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        name: editingName.trim(),
        email: editingEmail.trim(),
      });

      if (response.data.success) {
        setUserData(response.data.data);
        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your journal entries will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/auth/account');
              if (response.data.success) {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                router.replace('/(auth)/login');
              }
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const renderStatCard = (icon: string, value: string | number, label: string, gradient?: boolean) => (
    <View style={[
      styles.statCard, 
      { 
        backgroundColor: gradient ? theme.cardBackground : theme.pastelPink,
        width: isTablet ? (width - 96) / 2 : (width - 64) / 2
      },
      gradient && styles.statCardGradient
    ]}>
      <View style={[styles.statIconContainer, { 
        backgroundColor: gradient ? theme.warmAccent : theme.pastelBlue,
        width: isTablet ? 64 : 52,
        height: isTablet ? 64 : 52,
        borderRadius: isTablet ? 32 : 26
      }]}>
        <Text style={[styles.statIcon, {
          fontSize: isTablet ? 28 : 24
        }]}>{icon}</Text>
      </View>
      <ThemedText style={[styles.statNumber, { 
        color: theme.text,
        fontSize: isTablet ? 30 : 26
      }]}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { 
        color: theme.tabIconDefault,
        fontSize: isTablet ? 15 : 13
      }]}>
        {label}
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.warmAccent} />
          <ThemedText style={[styles.loadingText, { color: theme.text }]}>
            Loading profile...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: theme.cardBackground,
        paddingTop: insets.top + 16,
        paddingHorizontal: isTablet ? 32 : 20
      }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.pastelPink }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { 
          color: theme.text,
          fontSize: isTablet ? 32 : 28
        }]}>Profile</ThemedText>
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: theme.pastelPink }]}
          onPress={() => Alert.alert('Settings', 'Settings coming soon!')}
        >
          <Text style={[styles.settingsIcon, { color: theme.text }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.content, {
          paddingHorizontal: isTablet ? 32 : 20
        }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          maxWidth: isTablet ? 800 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
          width: isTablet ? '100%' : 'auto'
        }}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileImageContainer, { 
              backgroundColor: theme.gradientStart,
              width: isTablet ? 100 : 80,
              height: isTablet ? 100 : 80,
              borderRadius: isTablet ? 50 : 40
            }]}>
              <Text style={[styles.profileInitial, {
                fontSize: isTablet ? 40 : 32
              }]}>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.profileName, { 
                color: theme.text,
                fontSize: isTablet ? 28 : 24
              }]}>
                {userData?.name || 'User'}
              </ThemedText>
              <ThemedText style={[styles.profileEmail, { 
                color: theme.tabIconDefault,
                fontSize: isTablet ? 18 : 16
              }]}>
                {userData?.email || 'user@example.com'}
              </ThemedText>
              <ThemedText style={[styles.profilePhone, { 
                color: theme.tabIconDefault,
                fontSize: isTablet ? 16 : 14
              }]}>
                {userData?.mobileno || '+91 0000000000'}
              </ThemedText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: theme.warmAccent }]}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={[styles.editProfileIcon, { color: '#FFFFFF' }]}>✏️</Text>
            <ThemedText style={[styles.editProfileText, {
              fontSize: isTablet ? 18 : 16
            }]}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Monthly Goal Progress */}
        <View style={[styles.goalSection, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.goalHeader}>
            <ThemedText style={[styles.sectionTitle, { 
              color: theme.text,
              fontSize: isTablet ? 24 : 20
            }]}>Monthly Goal</ThemedText>
            <ThemedText style={[styles.goalProgress, { 
              color: theme.warmAccent,
              fontSize: isTablet ? 20 : 18
            }]}>
              {journalStats.thisMonthEntries}/{journalStats.monthlyGoal}
            </ThemedText>
          </View>
          
          <View style={[styles.progressBar, { 
            backgroundColor: theme.pastelPink,
            height: isTablet ? 10 : 8
          }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: theme.warmAccent,
                  width: `${journalStats.goalProgress}%`,
                  borderRadius: isTablet ? 5 : 4
                }
              ]} 
            />
          </View>
          
          <ThemedText style={[styles.goalText, { 
            color: theme.tabIconDefault,
            fontSize: isTablet ? 16 : 14
          }]}>
            {journalStats.goalProgress >= 100 
              ? "🎉 Goal achieved! Keep up the great work!" 
              : `${journalStats.monthlyGoal - journalStats.thisMonthEntries} more entries to reach your goal`
            }
          </ThemedText>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { 
            color: theme.text,
            fontSize: isTablet ? 24 : 20
          }]}>Journaling Stats</ThemedText>
          
          <View style={[styles.statsGrid, {
            gap: isTablet ? 16 : 12
          }]}>
            {renderStatCard('📝', journalStats.totalEntries, 'Total Entries', true)}
            {renderStatCard('🔥', journalStats.currentStreak, 'Current Streak', true)}
            {renderStatCard('🏆', journalStats.longestStreak, 'Longest Streak', true)}
            {renderStatCard('📅', journalStats.thisMonthEntries, 'This Month', true)}
            {renderStatCard('📊', journalStats.totalWords.toLocaleString(), 'Total Words', true)}
            {renderStatCard('📈', journalStats.averageWordsPerEntry, 'Avg Words/Entry', true)}
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={[styles.weeklySection, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { 
            color: theme.text,
            fontSize: isTablet ? 24 : 20
          }]}>This Week</ThemedText>
          <View style={[styles.weeklyStats, {
            gap: isTablet ? 16 : 8
          }]}>
            <View style={[styles.weeklyCard, { backgroundColor: theme.pastelPink }]}>
              <Text style={[styles.weeklyIcon, {
                fontSize: isTablet ? 28 : 24
              }]}>📅</Text>
              <ThemedText style={[styles.weeklyNumber, { 
                color: theme.text,
                fontSize: isTablet ? 22 : 18
              }]}>
                {journalStats.weeklyAverage}
              </ThemedText>
              <ThemedText style={[styles.weeklyLabel, { 
                color: theme.tabIconDefault,
                fontSize: isTablet ? 14 : 12
              }]}>
                Entries This Week
              </ThemedText>
            </View>
            <View style={[styles.weeklyCard, { backgroundColor: theme.pastelPink }]}>
              <Text style={[styles.weeklyIcon, {
                fontSize: isTablet ? 28 : 24
              }]}>📈</Text>
              <ThemedText style={[styles.weeklyNumber, { 
                color: theme.text,
                fontSize: isTablet ? 22 : 18
              }]}>
                {journalStats.weeklyAverage > 0 ? 'On Track' : 'Start Writing'}
              </ThemedText>
              <ThemedText style={[styles.weeklyLabel, { 
                color: theme.tabIconDefault,
                fontSize: isTablet ? 14 : 12
              }]}>
                Weekly Status
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={[styles.menuSection, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { 
            color: theme.text,
            fontSize: isTablet ? 24 : 20
          }]}>Settings</ThemedText>
          
          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16
          }]}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: theme.pastelPink,
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: theme.text,
                fontSize: isTablet ? 24 : 20
              }]}>🔔</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: theme.text,
              fontSize: isTablet ? 18 : 16
            }]}>Notifications</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: theme.tabIconDefault,
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16
          }]}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: theme.pastelPink,
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: theme.text,
                fontSize: isTablet ? 24 : 20
              }]}>🔒</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: theme.text,
              fontSize: isTablet ? 18 : 16
            }]}>Privacy & Security</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: theme.tabIconDefault,
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16
          }]}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: theme.pastelPink,
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: theme.text,
                fontSize: isTablet ? 24 : 20
              }]}>❓</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: theme.text,
              fontSize: isTablet ? 18 : 16
            }]}>Help & Support</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: theme.tabIconDefault,
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16,
            borderBottomWidth: 0
          }]}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: theme.pastelPink,
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: theme.text,
                fontSize: isTablet ? 24 : 20
              }]}>ℹ️</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: theme.text,
              fontSize: isTablet ? 18 : 16
            }]}>About</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: theme.tabIconDefault,
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={[styles.accountSection, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { 
            color: theme.text,
            fontSize: isTablet ? 24 : 20
          }]}>Account</ThemedText>
          
          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16
          }]} onPress={handleLogout}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: '#FFE5E5',
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: '#E74C3C',
                fontSize: isTablet ? 24 : 20
              }]}>🚪</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: '#E74C3C',
              fontSize: isTablet ? 18 : 16
            }]}>Logout</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: '#E74C3C',
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { 
            paddingVertical: isTablet ? 20 : 16,
            borderBottomWidth: 0
          }]} onPress={handleDeleteAccount}>
            <View style={[styles.menuIconContainer, { 
              backgroundColor: '#FFE5E5',
              width: isTablet ? 48 : 40,
              height: isTablet ? 48 : 40,
              borderRadius: isTablet ? 24 : 20
            }]}>
              <Text style={[styles.menuIcon, { 
                color: '#E74C3C',
                fontSize: isTablet ? 24 : 20
              }]}>🗑️</Text>
            </View>
            <ThemedText style={[styles.menuText, { 
              color: '#E74C3C',
              fontSize: isTablet ? 18 : 16
            }]}>Delete Account</ThemedText>
            <Text style={[styles.chevronIcon, { 
              color: '#E74C3C',
              fontSize: isTablet ? 24 : 20
            }]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={[styles.modalCloseIcon, { 
                  color: theme.text,
                  fontSize: isTablet ? 28 : 24
                }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Name</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.pastelPink,
                  color: theme.text,
                  borderColor: theme.lightBrown
                }]}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Enter your name"
                placeholderTextColor={theme.tabIconDefault}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={[styles.inputLabel, { color: theme.text }]}>Email</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.pastelPink,
                  color: theme.text,
                  borderColor: theme.lightBrown
                }]}
                value={editingEmail}
                onChangeText={setEditingEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.lightBrown }]}
                onPress={() => setShowEditModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: theme.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.warmAccent }]}
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.modalButtonText}>Save</ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: isTablet ? 18 : 16,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 111, 71, 0.1)',
    minHeight: isTablet ? 100 : 80,
  },
  backButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: 'DancingScript-Bold',
    lineHeight: isTablet ? 42 : 36,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: isTablet ? 24 : 20,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    borderRadius: isTablet ? 24 : 20,
    padding: isTablet ? 28 : 20,
    marginBottom: isTablet ? 24 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 28 : 20,
  },
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitial: {
    fontFamily: 'DancingScript-Bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    marginBottom: isTablet ? 6 : 4,
    lineHeight: isTablet ? 36 : 30,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    marginBottom: isTablet ? 4 : 2,
    lineHeight: isTablet ? 26 : 22,
  },
  profilePhone: {
    fontFamily: 'Inter-Regular',
    lineHeight: isTablet ? 24 : 20,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 28 : 20,
    borderRadius: isTablet ? 30 : 25,
    gap: isTablet ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfileIcon: {
    fontSize: isTablet ? 20 : 16,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  goalSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalProgress: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    lineHeight: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    textAlign: 'center',
  },
  statsSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    lineHeight: 26,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%', // Two columns with some spacing
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(184, 149, 106, 0.2)',
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  weeklySection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  weeklyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  weeklyNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    lineHeight: 24,
  },
  weeklyLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 16,
  },
  menuSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 111, 71, 0.1)',
  },
  menuIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 20 : 16,
  },
  menuIcon: {
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    lineHeight: isTablet ? 26 : 22,
  },
  chevronIcon: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isTablet ? '70%' : '90%',
    maxWidth: isTablet ? 600 : 400,
    borderRadius: isTablet ? 24 : 20,
    padding: isTablet ? 28 : 20,
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
    marginBottom: isTablet ? 28 : 20,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontFamily: 'Inter-Bold',
    lineHeight: isTablet ? 32 : 26,
  },
  modalCloseIcon: {
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
    lineHeight: 22,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
