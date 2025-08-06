
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

const { width, height } = Dimensions.get('window');

// Camera Component with Updated Expo Camera
const CameraViewComponent = ({ onCapture, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

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
      
      const capturedPhoto = {
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
      <View style={styles.cameraContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F2EE" />
        <View style={styles.cameraViewfinder}>
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>Requesting Camera Permission</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F2EE" />
        <View style={styles.cameraViewfinder}>
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>No Camera Access</Text>
            <Text style={styles.cameraSubtext}>Camera permission is required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cameraControlButton} onPress={onClose}>
            <Text style={styles.cameraControlText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2EE" />
      <CameraView 
        ref={cameraRef} 
        style={styles.cameraViewfinder} 
        facing={facing}
        ratio="16:9"
      >
        <View style={styles.cameraGrid}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridLineVertical]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal2]} />
          <View style={[styles.gridLine, styles.gridLineVertical2]} />
        </View>
        
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraText}>Tap to capture</Text>
        </View>
      </CameraView>
      
      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.cameraControlButton} onPress={onClose}>
          <Text style={styles.cameraControlText}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.shutterButton, isCapturing && styles.shutterButtonActive]} 
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={styles.shutterButtonInner} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cameraControlButton} onPress={switchCamera}>
          <Text style={styles.cameraControlText}>⟲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Category Selection Modal Component
const CategoryModal = ({ visible, onClose, onSelect, selectedCategory }) => {
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
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.key && styles.selectedCategoryOption
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
                      selectedCategory === category.key && styles.selectedCategoryLabel
                    ]}>
                      {category.label}
                    </Text>
                  </View>
                  {selectedCategory === category.key && (
                    <Text style={styles.categorySelectedIcon}>✓</Text>
                  )}
                </View>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.modalConfirmButton} onPress={onClose}>
            <Text style={styles.modalConfirmText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const JournalEntryScreen = ({ navigation, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('personal'); // Default to personal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isProtected, setIsProtected] = useState(false); // New state for protection
  const [showProtectionModal, setShowProtectionModal] = useState(false); // Modal for password/biometrics
  const [entryPassword, setEntryPassword] = useState(''); // Password for protected entry
  const [usesBiometrics, setUsesBiometrics] = useState(false); // Whether to use biometrics
  const textInputRef = useRef(null);
  const contentInputRef = useRef(null);

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
    const options = { 
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
  const getCategoryInfo = (categoryKey) => {
    const categoryMap = {
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

  const handlePhotoCapture = (photo) => {
    setPhotos(prev => [...prev, photo]);
    setShowCamera(false);
    setActiveTab('text');
  };

  const handleRemovePhoto = (index) => {
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

  // Handle protection toggle
  const handleProtectionToggle = () => {
    if (!isProtected) {
      // If turning on protection, show the protection modal
      setShowProtectionModal(true);
    } else {
      // If turning off protection, just disable it
      setIsProtected(false);
      setEntryPassword('');
      setUsesBiometrics(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && photos.length === 0) {
      Alert.alert('Empty Entry', 'Please add some content to your journal entry.');
      return;
    }

    // Dismiss keyboard before saving
    dismissKeyboard();

    try {
      const journalData = {
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
        location: location || '',
        category: category,
        mood: 'neutral',
        isProtected: isProtected, // Add protection status
        protectionType: usesBiometrics ? 'biometric' : 'password', // Add protection type
        // Don't include the actual password in the request payload for security
        // It will be handled separately
      };
      
      // If entry is protected with password, encrypt the content
      let response;
      if (isProtected && entryPassword && !usesBiometrics) {
        response = await createJournalWithMedia(journalData, photos, entryPassword);
      } else {
        response = await createJournalWithMedia(journalData, photos);
      }
      
      console.log('Journal created successfully:', response);
      
      Alert.alert('Success', 'Journal entry saved successfully!', [
        { text: 'OK', onPress: () => {
          // Reset all states
          setTitle('');
          setContent('');
          setPhotos([]);
          setLocation('');
          setCategory('personal');
          setActiveTab('text');
          setIsProtected(false);
          setEntryPassword('');
          setUsesBiometrics(false);
          
          // Close the screen
          if (onClose) {
            onClose();
          } else if (navigation) {
            navigation.goBack();
          }
        }}
      ]);
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
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
        const photo = {
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
  const handleTextInputFocus = (inputRef) => {
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
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#C8A882" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateTime}>{getCurrentDate()}</Text>
          <View style={styles.headerControls}>
            {isKeyboardVisible && (
              <TouchableOpacity style={styles.keyboardDismissButton} onPress={dismissKeyboard}>
                <Text style={styles.keyboardDismissText}>⌨️ ↓</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleSave}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView 
          style={styles.contentContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 100 : 20 }}
        >
          {/* Journal Header */}
          <View style={styles.journalHeader}>
            <Text style={styles.journalTitle}>Journal</Text>
            <TouchableOpacity onPress={() => setLocation('Current Location')}>
              <Text style={styles.addLocationText}>Add location?</Text>
            </TouchableOpacity>
          </View>

          {/* Category and Protection Row */}
          <View style={styles.optionsContainer}>
            {/* Category Selection */}
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category</Text>
              <TouchableOpacity 
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.categoryDisplay}>
                  <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                  <Text style={styles.categoryText}>{categoryInfo.label}</Text>
                </View>
                <Text style={styles.categoryChevron}>›</Text>
              </TouchableOpacity>
            </View>
            
            {/* Protection Toggle */}
            <View style={styles.protectionContainer}>
              <Text style={styles.protectionLabel}>Protect Entry</Text>
              <TouchableOpacity 
                style={[styles.protectionToggle, isProtected && styles.protectionToggleActive]}
                onPress={handleProtectionToggle}
              >
                <View style={styles.protectionDisplay}>
                  <Text style={styles.protectionIcon}>{isProtected ? '🔒' : '🔓'}</Text>
                  <Text style={styles.protectionText}>{isProtected ? 'Protected' : 'Not Protected'}</Text>
                </View>
                {isProtected && (
                  <Text style={styles.protectionType}>
                    {usesBiometrics ? 'Biometric' : 'Password'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Input Area */}
          <View style={styles.textInputContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="#A68A68"
              value={title}
              onChangeText={setTitle}
              multiline
              returnKeyType="next"
              onSubmitEditing={() => handleTextInputFocus('content')}
              blurOnSubmit={false}
            />
            
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9C7F5F"
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
              <Text style={styles.photoGalleryTitle}>Photos ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {/* Add more photos button */}
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleQuickPhotoAdd}>
                  <Text style={styles.addPhotoText}>+</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Location Display */}
          {location && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Controls - Hidden when keyboard is visible */}
        {!isKeyboardVisible && (
          <View style={styles.bottomControls}>
            <View style={styles.mediaControls}>
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'photos' && styles.activeMediaButton]}
                onPress={() => {
                  setActiveTab('photos');
                  setShowCamera(true);
                }}
              >
                <Text style={styles.mediaButtonIcon}>📷</Text>
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'gallery' && styles.activeMediaButton]}
                onPress={() => {
                  setActiveTab('gallery');
                  handleImageLibrary();
                }}
              >
                <Text style={styles.mediaButtonIcon}>🖼️</Text>
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'templates' && styles.activeMediaButton]}
                onPress={() => setActiveTab('templates')}
              >
                <Text style={styles.mediaButtonIcon}>📝</Text>
                <Text style={styles.mediaButtonText}>Templates</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mediaButton, activeTab === 'audio' && styles.activeMediaButton]}
                onPress={() => setActiveTab('audio')}
              >
                <Text style={styles.mediaButtonIcon}>🎤</Text>
                <Text style={styles.mediaButtonText}>Audio</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>⌄ More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Keyboard Toolbar when keyboard is visible */}
        {isKeyboardVisible && (
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity style={styles.keyboardToolbarButton} onPress={dismissKeyboard}>
              <Text style={styles.keyboardToolbarText}>Done</Text>
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
        
        {/* Protection Modal */}
        <Modal
          visible={showProtectionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowProtectionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Protect This Entry</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setShowProtectionModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.protectionOptions}>
                <Text style={styles.protectionModalText}>
                  Add an extra layer of security to keep this entry private.
                </Text>
                
                {/* Password Protection Option */}
                <View style={styles.protectionOption}>
                  <View style={styles.protectionOptionHeader}>
                    <Text style={styles.protectionOptionTitle}>Password Protection</Text>
                    <TouchableOpacity 
                      style={[styles.protectionOptionToggle, !usesBiometrics && styles.protectionOptionToggleActive]}
                      onPress={() => setUsesBiometrics(false)}
                    >
                      <View style={styles.toggleIndicator} />
                    </TouchableOpacity>
                  </View>
                  
                  {!usesBiometrics && (
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Create a strong password"
                        placeholderTextColor="#9C7F5F"
                        value={entryPassword}
                        onChangeText={setEntryPassword}
                        secureTextEntry
                      />
                      <Text style={styles.passwordHint}>
                        Remember this password! If forgotten, you may not be able to access this entry again.
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Biometric Protection Option */}
                <View style={styles.protectionOption}>
                  <View style={styles.protectionOptionHeader}>
                    <Text style={styles.protectionOptionTitle}>Biometric Protection</Text>
                    <TouchableOpacity 
                      style={[styles.protectionOptionToggle, usesBiometrics && styles.protectionOptionToggleActive]}
                      onPress={() => setUsesBiometrics(true)}
                    >
                      <View style={styles.toggleIndicator} />
                    </TouchableOpacity>
                  </View>
                  
                  {usesBiometrics && (
                    <Text style={styles.biometricHint}>
                      Use your device's fingerprint or face recognition to unlock this entry.
                    </Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.protectionConfirmButton}
                onPress={() => {
                  // Validate password if using password protection
                  if (!usesBiometrics && (!entryPassword || entryPassword.length < 4)) {
                    Alert.alert('Weak Password', 'Please create a stronger password (at least 4 characters)');
                    return;
                  }
                  
                  // Enable protection and close modal
                  setIsProtected(true);
                  setShowProtectionModal(false);
                }}
              >
                <Text style={styles.protectionConfirmText}>Protect Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#C8A882',
  },
  dateTime: {
    color: '#2B2B2B',
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
    backgroundColor: '#8B6F47',
    borderRadius: 15,
  },
  keyboardDismissText: {
    color: '#F5F2EE',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#2B2B2B',
    fontSize: 20,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#8B6F47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#F5F2EE',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D7C6',
  },
  journalTitle: {
    color: '#6B5B4C',
    fontSize: 18,
    fontWeight: '600',
  },
  addLocationText: {
    color: '#8B6F47',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  textInputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleInput: {
    color: '#2B2B2B',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    minHeight: 40,
  },
  contentInput: {
    color: '#4A4A4A',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  photoGallery: {
    marginTop: 20,
    marginBottom: 20,
  },
  photoGalleryTitle: {
    color: '#6B5B4C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
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
    backgroundColor: '#E6D7C6',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#2B2B2B',
    fontSize: 16,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F5F2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#C8A882',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#8B6F47',
    fontSize: 36,
    fontWeight: '300',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E6D7C6',
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  bottomControls: {
    backgroundColor: '#F0E6D2',
    paddingBottom: 34,
  },
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#E6D7C6',
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
  activeMediaButton: {
    backgroundColor: '#C8A882',
  },
  mediaButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mediaButtonText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  moreButtonText: {
    color: '#8B6F47',
    fontSize: 16,
  },
  keyboardToolbar: {
    backgroundColor: '#E6D7C6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#C8A882',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  keyboardToolbarButton: {
    backgroundColor: '#8B6F47',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  keyboardToolbarText: {
    color: '#F5F2EE',
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
    backgroundColor: '#F5F2EE',
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
    borderBottomColor: '#E6D7C6',
  },
  modalTitle: {
    color: '#6B5B4C',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6D7C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#8B6F47',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryList: {
    marginTop: 16,
    marginBottom: 24,
  },
  categoryOption: {
    backgroundColor: '#E6D7C6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E6D7C6',
  },
  selectedCategoryOption: {
    borderColor: '#C8A882',
    backgroundColor: '#F0E6D2',
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
    color: '#6B5B4C',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCategoryLabel: {
    color: '#8B6F47',
    fontWeight: '700',
  },
  categorySelectedIcon: {
    color: '#8B6F47',
    fontSize: 18,
    fontWeight: '700',
  },
  categoryDescription: {
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 20,
  },
  modalConfirmButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#F5F2EE',
    fontSize: 16,
    fontWeight: '600',
  },
  // Category Selector in main screen
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D7C6',
  },
  protectionContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6D7C6',
  },
  protectionLabel: {
    color: '#6B5B4C',
    fontSize: 16,
    fontWeight: '500',
  },
  protectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6D7C6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#E6D7C6',
  },
  protectionToggleActive: {
    borderColor: '#C8A882',
    backgroundColor: '#F0E6D2',
  },
  protectionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  protectionText: {
    color: '#6B5B4C',
    fontSize: 16,
  },
  protectionType: {
    color: '#8B6F47',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#E6D7C6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  protectionOptions: {
    marginTop: 16,
    marginBottom: 24,
  },
  protectionModalText: {
    color: '#4A4A4A',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  protectionOption: {
    backgroundColor: '#E6D7C6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  protectionOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protectionOptionTitle: {
    color: '#6B5B4C',
    fontSize: 16,
    fontWeight: '600',
  },
  protectionOptionToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D4B896',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  protectionOptionToggleActive: {
    backgroundColor: '#8B6F47',
  },
  toggleIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F2EE',
  },
  passwordInputContainer: {
    marginTop: 8,
  },
  passwordInput: {
    backgroundColor: '#F5F2EE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#4A4A4A',
    fontSize: 16,
  },
  passwordHint: {
    color: '#8B6F47',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  biometricHint: {
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 20,
  },
  protectionConfirmButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  protectionConfirmText: {
    color: '#F5F2EE',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6D7C6',
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
    color: '#6B5B4C',
    fontSize: 16,
    marginLeft: 12,
  },
  categoryChevron: {
    color: '#8B6F47',
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
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(200, 168, 130, 0.4)',
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
    color: '#F5F2EE',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(107, 91, 76, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraSubtext: {
    color: '#C8A882',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#C8A882',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#2B2B2B',
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
    backgroundColor: '#8B6F47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControlText: {
    color: '#F5F2EE',
    fontSize: 24,
    fontWeight: '600',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B6F47',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#C8A882',
  },
  shutterButtonActive: {
    backgroundColor: '#6B5B4C',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C8A882',
  },
});

export default JournalEntryScreen;