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
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getJournal, updateJournal, deleteJournal, unlockProtectedEntry, protectJournalEntry, unprotectJournalEntry } from '@/services/journalService';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { UnlockModal } from '../../components/UnlockModal';

const { width, height } = Dimensions.get('window');

// Custom color theme for the journal detail screen - matching other screens
const journalTheme = {
  // Warm, earthy brown and beige colors inspired by the image
  headerBrown: '#8B6B4C', // Rich brown for header
  warmBeige: '#F7F3ED', // Very light warm beige background
  cardBeige: '#F0E8D8', // Light cream for cards and sections
  controlBeige: '#E8DCC8', // Warm beige for control panels
  darkBrown: '#5D4E37', // Dark brown for text
  mediumBrown: '#8B7355', // Medium brown for secondary text
  warmAccent: '#B8956A', // Warm accent for highlights
  navBrown: '#6B5B4F', // Dark brown for navigation
  lightBrown: '#D4C4B0', // Light brown for borders
  // Additional properties needed for compatibility
  background: '#F7F3ED', // Same as warmBeige
  text: '#5D4E37', // Same as darkBrown
  tint: '#E8DCC8', // Same as controlBeige
  cardBackground: '#F0E8D8', // Same as cardBeige
  tabIconDefault: '#8B7355', // Same as mediumBrown
  pastelPink: '#F0E8D8', // Same as cardBeige
  pastelBlue: '#E8DCC8', // Same as controlBeige
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
  const journalId = params.id as string;
  
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
  
  const textInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  
  const colorScheme = useColorScheme();
  const theme = journalTheme;

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

  // Fetch journal data
  useEffect(() => {
    if (journalId) {
      fetchJournal();
    }
  }, [journalId]);

  // Check if entry is protected and show unlock modal
  useEffect(() => {
    if (journal && journal.isProtected && !isUnlocked) {
      console.log('Protected journal detected, showing unlock modal');
      setShowUnlockModal(true);
    } else if (journal && !journal.isProtected) {
      console.log('Non-protected journal, unlocking automatically');
      setIsUnlocked(true);
    }
  }, [journal, isUnlocked]);

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
  const handleUnlock = async (password: string, useBiometrics: boolean) => {
    try {
      if (!journalId) return;
      console.log('Attempting to unlock journal:', journalId, 'with password:', password ? '***' : 'biometrics');
      
      const response = await unlockProtectedEntry(journalId, password || undefined, useBiometrics);
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

  const handleProtectEntry = async (password: string, useBiometrics: boolean) => {
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

  if (!journal) {
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
        <StatusBar barStyle="dark-content" backgroundColor={theme.tint} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.tint }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isEditing ? 'Edit Entry' : 'View Entry'}
            </Text>
          </View>
          
          <View style={styles.headerControls}>
            {!isEditing && (
              <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.pastelPink }]} onPress={() => setIsEditing(true)}>
                <Text style={[styles.editButtonText, { color: theme.text }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {isEditing && (
              <>
                <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                  <Text style={[styles.headerButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: theme.pastelPink }]} 
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: theme.text }]}>Save</Text>
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
          contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 100 : 20 }}
        >
          {/* Journal Info */}
          <View style={[styles.journalInfo, { borderBottomColor: theme.pastelPink }]}>
            <Text style={[styles.dateText, { color: theme.tabIconDefault }]}>
              {formatDate(journal.createdAt)}
            </Text>
            {journal.updatedAt !== journal.createdAt && (
              <Text style={[styles.updatedText, { color: theme.tabIconDefault }]}>
                Last updated: {formatDate(journal.updatedAt)}
              </Text>
            )}
          </View>

          {/* Category Display */}
          <View style={[styles.categoryContainer, { borderBottomColor: theme.pastelPink }]}>
            <Text style={[styles.categoryLabel, { color: theme.text }]}>Category</Text>
            {isEditing ? (
              <TouchableOpacity 
                style={[styles.categorySelector, { backgroundColor: theme.pastelPink }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.categoryDisplay}>
                  <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                  <Text style={[styles.categoryText, { color: theme.text }]}>{categoryInfo.label}</Text>
                </View>
                <Text style={[styles.categoryChevron, { color: theme.tint }]}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.categoryDisplay, { backgroundColor: theme.pastelPink, padding: 12, borderRadius: 8 }]}>
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={[styles.categoryText, { color: theme.text }]}>{categoryInfo.label}</Text>
              </View>
            )}
          </View>

          {/* Privacy Toggle - Only show when editing */}
          {isEditing && (
            <View style={[styles.privacyContainer, { borderBottomColor: theme.pastelPink }]}>
              <Text style={[styles.privacyLabel, { color: theme.text }]}>Privacy</Text>
              <View style={styles.compactPrivacyToggle}>
                <Text style={[styles.compactPrivacyLabel, { color: theme.text }]}>🔒</Text>
                <TouchableOpacity 
                  style={[
                    styles.compactToggleButton, 
                    { backgroundColor: isProtected ? theme.tint : theme.pastelPink }
                  ]}
                  onPress={() => {
                    if (isProtected) {
                      Alert.prompt(
                        'Unprotect Entry',
                        'Enter the password to unprotect this entry:',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Unprotect', 
                            onPress: (password) => {
                              if (password === entryPassword) {
                                handleUnprotectEntry(password);
                              } else {
                                Alert.alert('Error', 'Incorrect password');
                              }
                            }
                          }
                        ],
                        'secure-text'
                      );
                    } else {
                      // Show password input modal for protection
                      Alert.prompt(
                        'Protect Entry',
                        'Enter a password to protect this entry:',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Protect', 
                            onPress: (password) => {
                              if (password && password.length >= 6) {
                                handleProtectEntry(password, false);
                              } else {
                                Alert.alert('Error', 'Password must be at least 6 characters long');
                              }
                            }
                          }
                        ],
                        'secure-text'
                      );
                    }
                  }}
                >
                  <Text style={[styles.compactToggleText, { color: theme.text }]}>
                    {isProtected ? 'Protected' : 'Public'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Text Input Area - Only show if not protected or if unlocked */}
          {(!journal.isProtected || isUnlocked) ? (
            <View style={styles.textInputContainer}>
              <TextInput
                ref={textInputRef}
                style={[styles.titleInput, { color: theme.text }]}
                placeholder="Title"
                placeholderTextColor={theme.tabIconDefault}
                value={title}
                onChangeText={setTitle}
                multiline
                editable={isEditing}
              />
              
              <TextInput
                ref={contentInputRef}
                style={[styles.contentInput, { color: theme.text }]}
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
            <View style={styles.protectedContentPlaceholder}>
              <Text style={[styles.protectedPlaceholderText, { color: theme.tabIconDefault }]}>
                🔒 This entry is protected. Enter the password to view content.
              </Text>
            </View>
          )}

          {/* Photo Gallery - Only show if not protected or if unlocked */}
          {photos.length > 0 && (!journal.isProtected || isUnlocked) && (
            <View style={styles.photoGallery}>
              <Text style={[styles.photoGalleryTitle, { color: theme.text }]}>Photos ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((photo, index) => (
                  <TouchableOpacity key={index} onPress={() => handleImageClick(photo.uri)}>
                    <View style={styles.photoItem}>
                      <Image source={{ uri: photo.uri }} style={styles.photoImage} />
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
                  <TouchableOpacity style={[styles.addPhotoButton, { backgroundColor: theme.background, borderColor: theme.tint }]} onPress={handleImageLibrary}>
                    <Text style={[styles.addPhotoText, { color: theme.tint }]}>+</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Location Display - Only show if not protected or if unlocked */}
          {location && (!journal.isProtected || isUnlocked) && (
            <View style={[styles.locationContainer, { backgroundColor: theme.pastelPink }]}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={[styles.locationText, { color: theme.text }]}>{location}</Text>
            </View>
          )}

          {/* Delete Button */}
          {!isEditing && (
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: '#E74C3C' }]} 
              onPress={handleDelete}
            >
              <Text style={[styles.deleteButtonText, { color: '#FFFFFF' }]}>Delete Entry</Text>
            </TouchableOpacity>
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
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    lineHeight: 26,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  journalInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  updatedText: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    lineHeight: 24,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    lineHeight: 24,
  },
  categoryChevron: {
    fontSize: 20,
    fontWeight: '600',
  },
  categoryIcon: {
    fontSize: 20,
  },
  privacyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  privacyLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    lineHeight: 24,
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleInput: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    minHeight: 40,
    lineHeight: 34,
  },
  contentInput: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    lineHeight: 28,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  protectedContentPlaceholder: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedPlaceholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  photoGallery: {
    marginTop: 20,
    marginBottom: 20,
  },
  photoGalleryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  photoItem: {
    position: 'relative',
    marginLeft: 16,
    marginRight: 8,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 36,
    fontWeight: '300',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 43, 43, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 111, 71, 0.15)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryList: {
    marginTop: 16,
    marginBottom: 24,
  },
  categoryOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategoryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  categorySelectedIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalConfirmButton: {
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
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
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageViewerCloseButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullScreenImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
}); 