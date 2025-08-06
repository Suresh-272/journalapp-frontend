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
import { getJournal, updateJournal, deleteJournal } from '@/services/journalService';

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
  media: Array<{
    _id: string;
    type: 'image' | 'audio' | 'video';
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

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
                      styles.categoryLabel,
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

  const fetchJournal = async () => {
    try {
      const response = await getJournal(journalId);
      
      if (response.success) {
        setJournal(response.data);
        setTitle(response.data.title);
        setContent(response.data.content);
        setCategory(response.data.category || 'personal');
        setLocation(response.data.location || '');
        
        // Convert media to photos format
        const journalPhotos: Photo[] = response.data.media
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

          {/* Text Input Area */}
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

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <View style={styles.photoGallery}>
              <Text style={[styles.photoGalleryTitle, { color: theme.text }]}>Photos ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
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
                ))}
                {isEditing && (
                  <TouchableOpacity style={[styles.addPhotoButton, { backgroundColor: theme.background, borderColor: theme.tint }]} onPress={handleImageLibrary}>
                    <Text style={[styles.addPhotoText, { color: theme.tint }]}>+</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Location Display */}
          {location && (
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
    fontFamily: 'DancingScript-SemiBold',
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
    fontFamily: 'Caveat-Medium',
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
    fontFamily: 'Handlee-Regular',
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
  textInputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleInput: {
    fontSize: 26,
    fontFamily: 'Caveat-Bold',
    marginBottom: 20,
    minHeight: 40,
    lineHeight: 34,
  },
  contentInput: {
    fontSize: 18,
    fontFamily: 'Caveat-Regular',
    lineHeight: 28,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  photoGallery: {
    marginTop: 20,
    marginBottom: 20,
  },
  photoGalleryTitle: {
    fontSize: 18,
    fontFamily: 'Handlee-Regular',
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
  categoryLabel: {
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
}); 