
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
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { createJournalWithMedia } from '../../services/journalService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Custom color theme for the journal entry screen
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
  tint: '#E8DCC8', // Same as headerBrown
  cardBackground: '#F0E8D8', // Same as cardBeige
  tabIconDefault: '#8B7355', // Same as mediumBrown
  pastelPink: '#F0E8D8', // Same as cardBeige
  pastelBlue: '#E8DCC8', // Same as controlBeige
};

const { width, height } = Dimensions.get('window');

// Type definitions
interface Photo {
  uri: string;
  type: string;
  timestamp: number;
  fileName: string;
}

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  selectedCategory: string;
}

interface JournalEntryScreenProps {
  navigation?: any;
  onClose?: () => void;
}

// Camera Component with Updated Expo Camera
const CameraViewComponent = ({ onCapture, onClose }: { onCapture: (photo: Photo) => void; onClose: () => void }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  const theme = journalTheme;

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      
      const capturedPhoto: Photo = {
        uri: photo.uri,
        type: 'photo',
        timestamp: Date.now(),
        fileName: `photo_${Date.now()}.jpg`
      };
      
      onCapture(capturedPhoto);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const switchCamera = () => {
    setFacing(current => 
      current === 'back' ? 'front' : 'back'
    );
  };

  if (!permission) {
    return (
      <View style={[styles.cameraContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.cameraViewfinder}>
          <View style={styles.cameraOverlay}>
            <Text style={[styles.cameraText, { color: theme.text, backgroundColor: theme.cardBackground }]}>Requesting Camera Permission</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.cameraContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.cameraViewfinder}>
          <View style={styles.cameraOverlay}>
            <Text style={[styles.cameraText, { color: theme.text, backgroundColor: theme.cardBackground }]}>No Camera Access</Text>
            <Text style={[styles.cameraSubtext, { color: theme.tabIconDefault }]}>Camera permission is required</Text>
            <TouchableOpacity style={[styles.permissionButton, { backgroundColor: theme.tint }]} onPress={requestPermission}>
              <Text style={[styles.permissionButtonText, { color: theme.text }]}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity style={[styles.cameraControlButton, { backgroundColor: theme.tint }]} onPress={onClose}>
            <Text style={[styles.cameraControlText, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <CameraView 
        ref={cameraRef} 
        style={styles.cameraViewfinder} 
        facing={facing}
        ratio="16:9"
      >
        <View style={styles.cameraGrid}>
          <View style={[styles.gridLine, { backgroundColor: theme.tint }]} />
          <View style={[styles.gridLine, styles.gridLineVertical, { backgroundColor: theme.tint }]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal2, { backgroundColor: theme.tint }]} />
          <View style={[styles.gridLine, styles.gridLineVertical2, { backgroundColor: theme.tint }]} />
        </View>
        
        <View style={styles.cameraOverlay}>
          <Text style={[styles.cameraText, { color: theme.text, backgroundColor: theme.cardBackground }]}>Tap to capture</Text>
        </View>
      </CameraView>
      
      <View style={styles.cameraControls}>
        <TouchableOpacity style={[styles.cameraControlButton, { backgroundColor: theme.tint }]} onPress={onClose}>
          <Text style={[styles.cameraControlText, { color: theme.text }]}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.shutterButton, { backgroundColor: theme.tint, borderColor: theme.pastelPink }, isCapturing && styles.shutterButtonActive]} 
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={[styles.shutterButtonInner, { backgroundColor: theme.pastelPink }]} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.cameraControlButton, { backgroundColor: theme.tint }]} onPress={switchCamera}>
          <Text style={[styles.cameraControlText, { color: theme.text }]}>⟲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Category Selection Modal Component
const CategoryModal = ({ visible, onClose, onSelect, selectedCategory }: CategoryModalProps) => {
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

const JournalEntryScreen = ({ navigation, onClose }: JournalEntryScreenProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<Array<Photo>>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('personal'); // Default to personal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to add photos!');
      }
    })();
  }, []);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = () => {
      if (showCamera) {
        setShowCamera(false);
        return true;
      }
      if (showCategoryModal) {
        setShowCategoryModal(false);
        return true;
      }
      handleCancel();
      return true;
    };

    if (Platform.OS === 'android') {
      const backSubscription = require('react-native').BackHandler.addEventListener('hardwareBackPress', backHandler);
      return () => backSubscription.remove();
    }
  }, [showCamera, showCategoryModal, title, content, photos]);

  // Current date formatting
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
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

  const handlePhotoCapture = (photo: Photo) => {
    setPhotos(prev => [...prev, photo]);
    setShowCamera(false);
    setActiveTab('text');
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

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && photos.length === 0) {
      Alert.alert('Empty Entry', 'Please add some content to your journal entry.');
      return;
    }

    // Validate category
    if (!category || !['personal', 'professional'].includes(category)) {
      Alert.alert('Invalid Category', 'Please select a valid category (Personal or Professional).');
      return;
    }

    // Dismiss keyboard before saving
    dismissKeyboard();

    try {
      const journalData = {
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
        location: location || '',
        category: category, // Ensure category is properly set
        mood: 'neutral',
        tags: []
      };
      
      console.log('Saving journal with data:', journalData);
      console.log('Category being saved:', category);
      
      const response = await createJournalWithMedia(journalData, photos);
      
      console.log('Journal created successfully:', response);
      console.log('Saved category:', response.data?.category);
      
      Alert.alert('Success', 'Journal entry saved successfully!', [
        { text: 'OK', onPress: () => {
          // Reset all states
          setTitle('');
          setContent('');
          setPhotos([]);
          setLocation('');
          setCategory('personal');
          setActiveTab('text');
          
          // Close the screen
          if (onClose) {
            onClose();
          } else if (navigation) {
            navigation.goBack();
          }
        }}
      ]);
    } catch (error: any) {
      console.error('Error saving journal:', error);
      const errorMessage = error?.error || error?.message || 'Failed to save journal entry. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancel = () => {
    const hasContent = title.trim() || content.trim() || photos.length > 0;
    
    if (hasContent) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your journal entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              dismissKeyboard();
              // Reset all states
              setTitle('');
              setContent('');
              setPhotos([]);
              setLocation('');
              setCategory('personal');
              setActiveTab('text');
              
              // Close the screen
              if (onClose) {
                onClose();
              } else if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } else {
      dismissKeyboard();
      // Close without confirmation if no content
      if (onClose) {
        onClose();
      } else if (navigation) {
        navigation.goBack();
      }
    }
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
        setActiveTab('text');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleQuickPhotoAdd = () => {
    dismissKeyboard();
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: () => setShowCamera(true) },
        { text: 'Photo Library', onPress: handleImageLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Handle text input focus
  const handleTextInputFocus = (inputRef: 'content' | 'title') => {
    if (inputRef === 'content') {
      setTimeout(() => {
        contentInputRef.current?.focus();
      }, 100);
    } else if (inputRef === 'title') {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  if (showCamera) {
    return (
      <CameraViewComponent 
        onCapture={handlePhotoCapture}
        onClose={() => setShowCamera(false)}
      />
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
          <Text style={[styles.dateTime, { color: theme.text }]}>{getCurrentDate()}</Text>
          <View style={styles.headerControls}>
            {isKeyboardVisible && (
              <TouchableOpacity style={[styles.keyboardDismissButton, { backgroundColor: theme.pastelPink }]} onPress={dismissKeyboard}>
                <Text style={[styles.keyboardDismissText, { color: theme.text }]}>⌨️ ↓</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
              <Text style={[styles.headerButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.doneButton, { backgroundColor: theme.pastelPink }]} onPress={handleSave}>
              <Text style={[styles.doneButtonText, { color: theme.text }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView 
          style={[styles.contentContainer, { backgroundColor: theme.background }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 100 : 20 }}
        >
          {/* Journal Header */}
          <View style={[styles.journalHeader, { borderBottomColor: theme.pastelPink }]}>
            <Text style={[styles.journalTitle, { color: theme.text }]}>Journal</Text>
            <TouchableOpacity onPress={() => setLocation('Current Location')}>
              <Text style={[styles.addLocationText, { color: theme.tint }]}>Add location?</Text>
            </TouchableOpacity>
          </View>

          {/* Category Selection */}
          <View style={[styles.categoryContainer, { borderBottomColor: theme.pastelPink }]}>
            <Text style={[styles.categoryLabel, { color: theme.text }]}>Category</Text>
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
              returnKeyType="next"
              onSubmitEditing={() => handleTextInputFocus('content')}
              blurOnSubmit={false}
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
              returnKeyType="default"
              enablesReturnKeyAutomatically={false}
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
                    <TouchableOpacity 
                      style={[styles.removePhotoButton, { backgroundColor: theme.tint }]}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Text style={[styles.removePhotoText, { color: theme.text }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {/* Add more photos button */}
                <TouchableOpacity style={[styles.addPhotoButton, { backgroundColor: theme.background, borderColor: theme.tint }]} onPress={handleQuickPhotoAdd}>
                  <Text style={[styles.addPhotoText, { color: theme.tint }]}>+</Text>
                </TouchableOpacity>
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
        </ScrollView>

        {/* Bottom Controls - Hidden when keyboard is visible */}
        {!isKeyboardVisible && (
          <View style={[styles.bottomControls, { backgroundColor: theme.pastelBlue }]}>
            <View style={[styles.mediaControls, { backgroundColor: theme.pastelPink }]}>
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'photos' && { backgroundColor: theme.tint }]}
                onPress={() => {
                  setActiveTab('photos');
                  setShowCamera(true);
                }}
              >
                <Text style={styles.mediaButtonIcon}>📷</Text>
                <Text style={[styles.mediaButtonText, { color: theme.text }]}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'gallery' && { backgroundColor: theme.tint }]}
                onPress={() => {
                  setActiveTab('gallery');
                  handleImageLibrary();
                }}
              >
                <Text style={styles.mediaButtonIcon}>🖼️</Text>
                <Text style={[styles.mediaButtonText, { color: theme.text }]}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'templates' && { backgroundColor: theme.tint }]}
                onPress={() => setActiveTab('templates')}
              >
                <Text style={styles.mediaButtonIcon}>📝</Text>
                <Text style={[styles.mediaButtonText, { color: theme.text }]}>Templates</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'audio' && { backgroundColor: theme.tint }]}
                onPress={() => setActiveTab('audio')}
              >
                <Text style={styles.mediaButtonIcon}>🎤</Text>
                <Text style={[styles.mediaButtonText, { color: theme.text }]}>Audio</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.moreButton}>
              <Text style={[styles.moreButtonText, { color: theme.tint }]}>⌄ More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Keyboard Toolbar when keyboard is visible */}
        {isKeyboardVisible && (
          <View style={[styles.keyboardToolbar, { backgroundColor: theme.pastelPink, borderTopColor: theme.tint }]}>
            <TouchableOpacity style={[styles.keyboardToolbarButton, { backgroundColor: theme.tint }]} onPress={dismissKeyboard}>
              <Text style={[styles.keyboardToolbarText, { color: theme.text }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  keyboardDismissButton: {
    padding: 8,
    borderRadius: 15,
  },
  keyboardDismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  journalTitle: {
    fontSize: 22,
    fontFamily: 'DancingScript-Bold',
    lineHeight: 30,
  },
  addLocationText: {
    fontSize: 16,
    fontFamily: 'PatrickHand-Regular',
    textDecorationLine: 'underline',
    lineHeight: 22,
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
    fontSize: 16,
    fontFamily: 'PatrickHand-Regular',
    lineHeight: 22,
  },
  bottomControls: {
    paddingBottom: 34,
  },
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginHorizontal: 16,
    marginTop: 16,
  },
  mediaButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 15,
  },
  mediaButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mediaButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  moreButtonText: {
    fontSize: 16,
  },
  keyboardToolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  keyboardToolbarButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  keyboardToolbarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Category Modal Styles
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
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 18,
    fontFamily: 'Caveat-Medium',
    lineHeight: 24,
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
  // Category Selector in main screen
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
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
  // Camera Styles
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    zIndex: 9999,
  },
  cameraViewfinder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cameraGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    left: 0,
    right: 0,
    top: '33%',
  },
  gridLineHorizontal2: {
    top: '66%',
  },
  gridLineVertical: {
    height: '100%',
    width: 1,
    top: 0,
    left: '33%',
    right: 'auto',
  },
  gridLineVertical2: {
    height: '100%',
    width: 1,
    top: 0,
    left: '66%',
    right: 'auto',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  cameraText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraSubtext: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(107, 91, 76, 0.9)',
    zIndex: 3,
  },
  cameraControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControlText: {
    fontSize: 24,
    fontWeight: '600',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  shutterButtonActive: {
    opacity: 0.7,
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default JournalEntryScreen;