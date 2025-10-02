import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Image,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getJournal, updateJournal, deleteJournal, unlockProtectedEntry, protectJournalEntry, unprotectJournalEntry } from '@/services/journalService';
import { IOSStylePrivacyToggle } from '../../components/IOSStylePrivacyToggle';
import { UnlockModal } from '../../components/UnlockModal';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallDevice = width < 375;

// Enhanced dual-theme design matching home screen
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
  // Compatibility properties
  tint: '#D4C0A8',
  tabIconDefault: '#8B5E3C',
  pastelPink: '#F0E6D7',
  pastelBlue: '#D4C0A8',
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
  // Compatibility properties
  tint: '#D1C7B8',
  tabIconDefault: '#6B4E3D',
  pastelPink: '#F2EDE5',
  pastelBlue: '#D1C7B8',
};

// Legacy theme for backward compatibility
const journalTheme = {
  headerBrown: '#8B6B4C',
  warmBeige: '#F7F3ED',
  cardBeige: '#F0E8D8',
  controlBeige: '#E8DCC8',
  darkBrown: '#5D4E37',
  mediumBrown: '#8B7355',
  warmAccent: '#B8956A',
  navBrown: '#6B5B4F',
  lightBrown: '#D4C4B0',
  background: '#F7F3ED',
  text: '#5D4E37',
  tint: '#E8DCC8',
  cardBackground: '#F0E8D8',
  tabIconDefault: '#8B7355',
  pastelPink: '#F0E8D8',
  pastelBlue: '#E8DCC8',
};

// Type definitions
interface Photo {
  uri: string;
  type: string;
  timestamp: number;
  fileName: string;
}

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

// Image Viewer Modal Component
const ImageViewerModal = ({ visible, imageUri, onClose }: {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}) => {
  const theme = journalTheme;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerOverlay}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Close button positioned above everything */}
        <TouchableOpacity 
          style={styles.imageViewerCloseButton} 
          onPress={onClose}
          activeOpacity={0.7}
        >
          <View style={styles.imageViewerCloseButtonInner}>
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </View>
        </TouchableOpacity>
        
        {/* Image with touch to close functionality */}
        <TouchableOpacity 
          style={styles.fullScreenImageContainer} 
          onPress={onClose}
          activeOpacity={1}
        >
          <Image 
            source={{ uri: imageUri }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Category Selection Modal Component
const CategoryModal = ({ visible, onClose, onSelect, selectedCategory }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  selectedCategory: string;
}) => {
  const colorScheme = useColorScheme();
  const theme = journalTheme;
  
  const categories = [
    { key: 'personal', label: 'Personal', icon: '👤', description: 'Personal thoughts, feelings, and experiences' },
    { key: 'professional', label: 'Professional', icon: '💼', description: 'Work-related notes, ideas, and reflections' }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
            <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: theme.pastelPink }]} onPress={onClose}>
              <Text style={[styles.modalCloseText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryOption,
                  { backgroundColor: theme.pastelPink, borderColor: theme.pastelPink },
                  selectedCategory === category.key && { borderColor: theme.tint, backgroundColor: theme.pastelBlue }
                ]}
                onPress={() => {
                  onSelect(category.key);
                  onClose();
                }}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.modalCategoryLabel,
                      { color: theme.text },
                      selectedCategory === category.key && { color: theme.text, fontWeight: '700' }
                    ]}>
                      {category.label}
                    </Text>
                  </View>
                  {selectedCategory === category.key && (
                    <Text style={[styles.categorySelectedIcon, { color: theme.text }]}>✓</Text>
                  )}
                </View>
                <Text style={[styles.categoryDescription, { color: theme.tabIconDefault }]}>{category.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={[styles.modalConfirmButton, { backgroundColor: theme.tint }]} onPress={onClose}>
            <Text style={[styles.modalConfirmText, { color: theme.text }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function JournalDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const journalId = params.id as string;
  const isPreUnlocked = params.unlocked === 'true';
  
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal');
  const [location, setLocation] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [entryPassword, setEntryPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const textInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  
  const colorScheme = useColorScheme();
  
  // Get theme based on journal category
  const getTheme = () => {
    if (!journal) return personalTheme;
    return journal.category === 'professional' ? professionalTheme : personalTheme;
  };
  
  const theme = getTheme();

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initialize journal data
  useEffect(() => {
    if (isPreUnlocked && params.title && params.content) {
      console.log('Setting pre-unlocked journal data from params');
      try {
        const preUnlockedJournal: JournalEntry = {
          _id: journalId,
          title: params.title as string,
          content: params.content as string,
          category: (params.category as string) || 'personal',
          location: (params.location as string) || '',
          mood: (params.mood as string) || 'neutral',
          tags: params.tags ? JSON.parse(params.tags as string) : [],
          isProtected: true,
          media: params.media ? JSON.parse(params.media as string) : [],
          createdAt: (params.createdAt as string) || new Date().toISOString(),
          updatedAt: (params.updatedAt as string) || new Date().toISOString()
        };
        
        setJournal(preUnlockedJournal);
        setTitle(preUnlockedJournal.title);
        setContent(preUnlockedJournal.content);
        setCategory(preUnlockedJournal.category);
        setLocation(preUnlockedJournal.location || '');
        setIsProtected(true);
        setIsUnlocked(true);
        
        // Convert media to photos format
        const journalPhotos: Photo[] = preUnlockedJournal.media
          .filter((m: any) => m.type === 'image')
          .map((m: any) => ({
            uri: m.url,
            type: 'photo',
            timestamp: Date.now(),
            fileName: `photo_${Date.now()}.jpg`
          }));
        setPhotos(journalPhotos);
        setIsInitializing(false);
        
      } catch (error) {
        console.error('Error parsing pre-unlocked journal data:', error);
        // Fallback to fetching from API
        fetchJournal();
      }
    } else if (journalId && !isPreUnlocked) {
      fetchJournal();
    }
  }, [journalId, isPreUnlocked]);

  // Check if entry is protected and show unlock modal
  useEffect(() => {
    if (isPreUnlocked) {
      // Journal is already unlocked from home screen
      return;
    }
    
    if (journal && journal.isProtected && !isUnlocked) {
      console.log('Protected journal detected, showing unlock modal');
      setShowUnlockModal(true);
    } else if (journal && !journal.isProtected) {
      console.log('Non-protected journal, unlocking automatically');
      setIsUnlocked(true);
    }
  }, [journal, isUnlocked, isPreUnlocked]);

  // Reset protection state for each new entry
  useEffect(() => {
    if (journal) {
      setIsProtected(journal.isProtected || false);
    }
  }, [journal]);

  const fetchJournal = async () => {
    try {
      const response = await getJournal(journalId);
      
      if (response.success) {
        const journalData = response.data;
        console.log('Fetched journal data:', {
          id: journalData._id,
          title: journalData.title,
          isProtected: journalData.isProtected,
          content: journalData.content?.substring(0, 50) + '...'
        });
        
        setJournal(journalData);
        setTitle(journalData.title);
        setContent(journalData.content);
        setCategory(journalData.category || 'personal');
        setLocation(journalData.location || '');
        setIsProtected(journalData.isProtected || false);
        
        // Reset unlock state for new journal
        setIsUnlocked(false);
        
        // Convert media to photos format
        const journalPhotos: Photo[] = journalData.media
          .filter((m: any) => m.type === 'image')
          .map((m: any) => ({
            uri: m.url,
            type: 'photo',
            timestamp: Date.now(),
            fileName: `photo_${Date.now()}.jpg`
          }));
        setPhotos(journalPhotos);
      }
    } catch (error) {
      console.error('Error fetching journal:', error);
      Alert.alert('Error', 'Failed to load journal entry');
    } finally {
      setIsInitializing(false);
    }
  };

  // Get category display info
  const getCategoryInfo = (categoryKey: string) => {
    const categoryMap: Record<string, { label: string; icon: string }> = {
      personal: { label: 'Personal', icon: '👤' },
      professional: { label: 'Professional', icon: '💼' }
    };
    return categoryMap[categoryKey] || categoryMap.personal;
  };

  // Dismiss keyboard function
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
    contentInputRef.current?.blur();
  };

  // Handle image click to view larger
  const handleImageClick = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setShowImageViewer(true);
  };

  // Privacy handling functions
  const handleUnlock = async (password: string) => {
    try {
      if (!journalId) return;
      console.log('Attempting to unlock journal:', journalId, 'with password:', password ? '***' : 'empty');
      
      const response = await unlockProtectedEntry(journalId, password as any, false);
      if (response.success) {
        const unlockedJournal = response.data;
        console.log('Successfully unlocked journal:', {
          id: unlockedJournal._id,
          title: unlockedJournal.title,
          contentLength: unlockedJournal.content?.length
        });
        
        setJournal(unlockedJournal);
        setContent(unlockedJournal.content);
        setTitle(unlockedJournal.title);
        setCategory(unlockedJournal.category || 'personal');
        setLocation(unlockedJournal.location || '');
        setIsUnlocked(true);
        setShowUnlockModal(false);
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      throw error;
    }
  };

  const handleProtectEntry = async (password: string) => {
    try {
      if (!journalId) return;
      await protectJournalEntry(journalId, password);
      setIsProtected(true);
      setEntryPassword(password);
      if (journal) {
        setJournal({ ...journal, isProtected: true });
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleUnprotectEntry = async (password: string) => {
    try {
      if (!journalId) return;
      const response = await unprotectJournalEntry(journalId, password);
      if (response.success) {
        setIsProtected(false);
        setEntryPassword('');
        setJournal(response.data);
        setContent(response.data.content);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Entry', 'Please add some content to your journal entry.');
      return;
    }

    setIsSaving(true);
    dismissKeyboard();

    try {
      const journalData = {
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
        location: location || '',
        category: category,
        mood: journal?.mood || 'neutral',
        tags: journal?.tags || []
      };
      
      const response = await updateJournal(journalId, journalData);
      
      if (response.success) {
        setJournal(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Journal entry updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update journal');
      }
    } catch (error) {
      console.error('Error updating journal:', error);
      Alert.alert('Error', 'Failed to update journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              // Reset to original values
              if (journal) {
                setTitle(journal.title);
                setContent(journal.content);
                setCategory(journal.category || 'personal');
                setLocation(journal.location || '');
              }
              setIsEditing(false);
              dismissKeyboard();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Journal Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteJournal(journalId);
              
              if (response.success) {
                Alert.alert('Success', 'Journal entry deleted successfully!', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                throw new Error(response.message || 'Failed to delete journal');
              }
            } catch (error) {
              console.error('Error deleting journal:', error);
              Alert.alert('Error', 'Failed to delete journal entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo: Photo = {
          uri: result.assets[0].uri,
          type: 'photo',
          timestamp: Date.now(),
          fileName: `photo_${Date.now()}.jpg`
        };
        setPhotos(prev => [...prev, photo]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setPhotos(prev => prev.filter((_, i) => i !== index))
        }
      ]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isInitializing || !journal) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.tint} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading journal entry...</Text>
        </View>
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(category);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: theme.background,
          paddingTop: insets.top + 16,
          paddingHorizontal: isTablet ? 32 : 20
        }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.highlight }]} onPress={handleCancel}>
              <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { 
                color: theme.text,
                fontSize: isTablet ? 24 : 20
              }]}>
                {isEditing ? 'Edit Entry' : (journal?.category === 'professional' ? 'Work Reflection' : 'Memory')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {journal?.category === 'professional' ? 'Professional Growth' : 'Personal Moment'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerControls}>
            {!isEditing && (
              <>
                <TouchableOpacity 
                  style={[styles.deleteIconButton, { backgroundColor: theme.highlight }]} 
                  onPress={handleDelete}
                >
                  <Text style={[styles.deleteIconText, { color: '#E74C3C' }]}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary }]} onPress={() => setIsEditing(true)}>
                  <Text style={[styles.editButtonText, { color: '#FFFFFF' }]}>✏️</Text>
                </TouchableOpacity>
              </>
            )}
            {isEditing && (
              <>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.border }]} onPress={handleCancel}>
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>💾</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Content Area */}
        <ScrollView 
          style={[styles.contentContainer, { backgroundColor: theme.background }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ 
            paddingBottom: isKeyboardVisible ? Math.max(100, insets.bottom + 60) : Math.max(insets.bottom + 20, 40),
            paddingHorizontal: isTablet ? Math.max(32, width * 0.04) : 0,
            maxWidth: isTablet ? Math.min(800, width * 0.9) : '100%',
            alignSelf: isTablet ? 'center' : 'stretch',
            width: isTablet ? '100%' : 'auto'
          }}
        >
          {/* Journal Info */}
          <View style={[styles.journalInfo, { 
            borderBottomColor: theme.pastelPink,
            paddingHorizontal: isTablet ? 0 : Math.max(16, width * 0.04),
            paddingVertical: Math.max(12, height * 0.015)
          }]}>
            <Text style={[styles.dateText, { 
              color: theme.tabIconDefault,
              fontSize: Math.max(isSmallDevice ? 13 : 14, width * 0.035)
            }]}>
              {formatDate(journal.createdAt)}
            </Text>
            {journal.updatedAt !== journal.createdAt && (
              <Text style={[styles.updatedText, { 
                color: theme.tabIconDefault,
                fontSize: Math.max(isSmallDevice ? 11 : 12, width * 0.03)
              }]}>
                Last updated: {formatDate(journal.updatedAt)}
              </Text>
            )}
          </View>

          {/* Category Display */}
          <View style={[styles.categoryContainer, { 
            borderBottomColor: theme.pastelPink,
            paddingHorizontal: isTablet ? 0 : Math.max(16, width * 0.04),
            paddingVertical: Math.max(12, height * 0.015)
          }]}>
            <Text style={[styles.categoryLabel, { 
              color: theme.text,
              fontSize: Math.max(isTablet ? 20 : 18, width * 0.045)
            }]}>Category</Text>
            {isEditing ? (
              <TouchableOpacity 
                style={[styles.categorySelector, { backgroundColor: theme.pastelPink }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.categoryDisplay}>
                  <Text style={[styles.categoryIcon, { fontSize: isTablet ? 24 : 20 }]}>{categoryInfo.icon}</Text>
                  <Text style={[styles.categoryText, { 
                    color: theme.text,
                    fontSize: isTablet ? 20 : 18
                  }]}>{categoryInfo.label}</Text>
                </View>
                <Text style={[styles.categoryChevron, { 
                  color: theme.tint,
                  fontSize: isTablet ? 24 : 20
                }]}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.categoryDisplay, { 
                backgroundColor: theme.pastelPink, 
                padding: isTablet ? 16 : 12, 
                borderRadius: 8 
              }]}>
                <Text style={[styles.categoryIcon, { fontSize: isTablet ? 24 : 20 }]}>{categoryInfo.icon}</Text>
                <Text style={[styles.categoryText, { 
                  color: theme.text,
                  fontSize: isTablet ? 20 : 18
                }]}>{categoryInfo.label}</Text>
              </View>
            )}
          </View>

          {/* Privacy Toggle - Only show when editing */}
          {isEditing && (
            <View style={[styles.privacyContainer, { 
              borderBottomColor: theme.pastelPink,
              paddingHorizontal: isTablet ? 0 : 16
            }]}>
              <Text style={[styles.privacyLabel, { 
                color: theme.text,
                fontSize: isTablet ? 20 : 18
              }]}>Privacy</Text>
              <IOSStylePrivacyToggle
                isProtected={isProtected}
                onProtect={handleProtectEntry}
                onUnprotect={handleUnprotectEntry}
              />
            </View>
          )}

          {/* Text Input Area - Only show if not protected or if unlocked */}
          {(!journal.isProtected || isUnlocked) ? (
            <View style={[styles.textInputContainer, {
              paddingHorizontal: isTablet ? 0 : Math.max(16, width * 0.04),
              paddingTop: Math.max(20, height * 0.025)
            }]}>
              <TextInput
                ref={textInputRef}
                style={[styles.titleInput, { 
                  color: theme.text,
                  fontSize: Math.max(isTablet ? 32 : (isSmallDevice ? 24 : 26), width * 0.065),
                  lineHeight: Math.max(isTablet ? 42 : (isSmallDevice ? 32 : 34), width * 0.085),
                  marginBottom: Math.max(20, height * 0.025)
                }]}
                placeholder="Title"
                placeholderTextColor={theme.tabIconDefault}
                value={title}
                onChangeText={setTitle}
                multiline
                editable={isEditing}
              />
              
              <TextInput
                ref={contentInputRef}
                style={[styles.contentInput, { 
                  color: theme.text,
                  fontSize: Math.max(isTablet ? 20 : (isSmallDevice ? 16 : 18), width * 0.045),
                  lineHeight: Math.max(isTablet ? 32 : (isSmallDevice ? 24 : 28), width * 0.065),
                  minHeight: Math.max(isTablet ? 300 : (isSmallDevice ? 150 : 200), height * 0.25)
                }]}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.tabIconDefault}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                editable={isEditing}
              />
            </View>
          ) : (
            <View style={[styles.protectedContentPlaceholder, {
              paddingHorizontal: isTablet ? 0 : 16
            }]}>
              <Text style={[styles.protectedPlaceholderText, { 
                color: theme.tabIconDefault,
                fontSize: isTablet ? 18 : 16
              }]}>
                🔒 This entry is protected. Enter the password to view content.
              </Text>
            </View>
          )}

          {/* Photo Gallery - Only show if not protected or if unlocked */}
          {photos.length > 0 && (!journal.isProtected || isUnlocked) && (
            <View style={styles.photoGallery}>
              <Text style={[styles.photoGalleryTitle, { 
                color: theme.text,
                fontSize: isTablet ? 20 : 18,
                marginLeft: isTablet ? 0 : 16
              }]}>Photos ({photos.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: isTablet ? 0 : 16,
                  paddingRight: isTablet ? 0 : 16
                }}
              >
                {photos.map((photo, index) => (
                  <TouchableOpacity key={index} onPress={() => handleImageClick(photo.uri)}>
                    <View style={[styles.photoItem, {
                      marginLeft: isTablet ? (index === 0 ? 0 : 16) : 0,
                      marginRight: isTablet ? 0 : 8
                    }]}>
                      <Image source={{ uri: photo.uri }} style={[styles.photoImage, {
                        width: isTablet ? 160 : (isSmallDevice ? 100 : 120),
                        height: isTablet ? 160 : (isSmallDevice ? 100 : 120)
                      }]} />
                      {isEditing && (
                        <TouchableOpacity 
                          style={[styles.removePhotoButton, { backgroundColor: theme.tint }]}
                          onPress={() => handleRemovePhoto(index)}
                        >
                          <Text style={[styles.removePhotoText, { color: theme.text }]}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {isEditing && (
                  <TouchableOpacity style={[styles.addPhotoButton, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.tint,
                    width: isTablet ? 160 : (isSmallDevice ? 100 : 120),
                    height: isTablet ? 160 : (isSmallDevice ? 100 : 120),
                    marginLeft: isTablet ? 16 : 8
                  }]} onPress={handleImageLibrary}>
                    <Text style={[styles.addPhotoText, { 
                      color: theme.tint,
                      fontSize: isTablet ? 42 : (isSmallDevice ? 30 : 36)
                    }]}>+</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Location Display - Only show if not protected or if unlocked */}
          {location && (!journal.isProtected || isUnlocked) && (
            <View style={[styles.locationContainer, { 
              backgroundColor: theme.pastelPink,
              marginHorizontal: isTablet ? 0 : 16
            }]}>
              <Text style={[styles.locationIcon, {
                fontSize: isTablet ? 18 : 16
              }]}>📍</Text>
              <Text style={[styles.locationText, { 
                color: theme.text,
                fontSize: isTablet ? 16 : 14
              }]}>{location}</Text>
            </View>
          )}

        </ScrollView>

        {/* Category Selection Modal */}
        <CategoryModal
          visible={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSelect={setCategory}
          selectedCategory={category}
        />

        {/* Unlock Modal for Protected Entries */}
        <UnlockModal
          visible={showUnlockModal}
          onUnlock={handleUnlock}
          onCancel={() => {
            setShowUnlockModal(false);
            router.back();
          }}
          entryTitle={journal?.title || 'Protected Entry'}
        />

        {/* Image Viewer Modal */}
        <ImageViewerModal
          visible={showImageViewer}
          imageUri={selectedImageUri}
          onClose={() => setShowImageViewer(false)}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    paddingBottom: 16,
    minHeight: isTablet ? 120 : 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: isTablet ? 12 : 8,
    marginRight: isTablet ? 16 : 12,
    minWidth: isTablet ? 48 : 40,
    minHeight: isTablet ? 48 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isTablet ? 24 : 20,
  },
  backButtonText: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    lineHeight: isTablet ? 32 : 26,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    opacity: 0.8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 16 : 12,
  },
  headerButton: {
    padding: isTablet ? 12 : 8,
    minWidth: isTablet ? 44 : 36,
    minHeight: isTablet ? 44 : 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 22 : 18,
    minWidth: isTablet ? 48 : 40,
    minHeight: isTablet ? 48 : 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: isTablet ? 18 : 16,
  },
  deleteIconButton: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 22 : 18,
    minWidth: isTablet ? 48 : 40,
    minHeight: isTablet ? 48 : 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(231, 76, 60, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteIconText: {
    fontSize: isTablet ? 18 : 16,
  },
  cancelButton: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: isTablet ? 20 : 16,
    minWidth: isTablet ? 70 : 60,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 8,
    borderRadius: isTablet ? 24 : 20,
    minWidth: isTablet ? 80 : 70,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  journalInfo: {
    paddingVertical: isTablet ? 16 : 12,
    borderBottomWidth: 1,
  },
  dateText: {
    fontWeight: '500',
  },
  updatedText: {
    marginTop: 4,
  },
  categoryContainer: {
    paddingVertical: isTablet ? 16 : 12,
    borderBottomWidth: 1,
  },
  categoryLabel: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: isTablet ? 12 : 8,
    lineHeight: isTablet ? 28 : 24,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontFamily: 'Inter-Regular',
    marginLeft: isTablet ? 16 : 12,
    lineHeight: isTablet ? 28 : 24,
  },
  categoryChevron: {
    fontWeight: '600',
  },
  categoryIcon: {},
  // Icon sizes are handled inline in the component
  privacyContainer: {
    paddingVertical: isTablet ? 16 : 12,
    borderBottomWidth: 1,
  },
  privacyLabel: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: isTablet ? 12 : 8,
    lineHeight: isTablet ? 28 : 24,
  },
  compactPrivacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactPrivacyLabel: {
    fontSize: 16,
  },
  compactToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  compactToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  textInputContainer: {
    flex: 1,
    paddingTop: isTablet ? 28 : 20,
  },
  titleInput: {
    fontFamily: 'Inter-Bold',
    marginBottom: isTablet ? 28 : 20,
    minHeight: isTablet ? 50 : 40,
  },
  contentInput: {
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
  },
  protectedContentPlaceholder: {
    paddingVertical: isTablet ? 60 : 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedPlaceholderText: {
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: isTablet ? 28 : 24,
  },
  photoGallery: {
    marginTop: isTablet ? 28 : 20,
    marginBottom: isTablet ? 28 : 20,
  },
  photoGalleryTitle: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: isTablet ? 16 : 12,
    lineHeight: isTablet ? 28 : 24,
  },
  photoItem: {
    position: 'relative',
  },
  photoImage: {
    borderRadius: isTablet ? 16 : 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: isTablet ? -12 : -8,
    right: isTablet ? -12 : -8,
    width: isTablet ? 32 : 24,
    height: isTablet ? 32 : 24,
    borderRadius: isTablet ? 16 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: '600',
  },
  addPhotoButton: {
    borderRadius: isTablet ? 16 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontWeight: '300',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isTablet ? 20 : 16,
    padding: isTablet ? 16 : 12,
    borderRadius: isTablet ? 12 : 8,
  },
  locationIcon: {
    marginRight: isTablet ? 12 : 8,
  },
  locationText: {},
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 43, 43, 0.5)',
    justifyContent: isTablet ? 'center' : 'flex-end',
    alignItems: isTablet ? 'center' : 'stretch',
  },
  modalContent: {
    borderTopLeftRadius: isTablet ? 25 : 25,
    borderTopRightRadius: isTablet ? 25 : 25,
    borderBottomLeftRadius: isTablet ? 25 : 0,
    borderBottomRightRadius: isTablet ? 25 : 0,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingTop: isTablet ? 24 : 16,
    paddingBottom: isTablet ? 24 : 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: isTablet ? 500 : '100%',
    width: isTablet ? '90%' : '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 111, 71, 0.15)',
  },
  modalTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: isTablet ? 36 : 30,
    height: isTablet ? 36 : 30,
    borderRadius: isTablet ? 18 : 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  categoryList: {
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 32 : 24,
  },
  categoryOption: {
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 20 : 16,
    marginBottom: isTablet ? 16 : 12,
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 12 : 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategoryLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  categorySelectedIcon: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
  },
  categoryDescription: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
  },
  modalConfirmButton: {
    borderRadius: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 16 : 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  // Image Viewer Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: isTablet ? 80 : 60,
    right: isTablet ? 32 : 20,
    width: isTablet ? 60 : 50,
    height: isTablet ? 60 : 50,
    borderRadius: isTablet ? 30 : 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageViewerCloseButtonInner: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    fontSize: isTablet ? 28 : 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullScreenImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 40 : 20,
    paddingVertical: isTablet ? 40 : 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: isTablet ? '90%' : '100%',
    maxHeight: isTablet ? '90%' : '100%',
  },
}); 