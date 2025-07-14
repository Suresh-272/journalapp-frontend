
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Audio from 'expo-audio';
import * as Video from 'expo-video';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createJournal, uploadMediaWithRetry } from '@/services/journalService';

export default function NewEntryScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
  // Audio recording states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef(null);
  
  // Camera states
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);
  
  // Video recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordingDuration, setVideoRecordingDuration] = useState(0);
  const videoTimer = useRef(null);

  // Mood options
  const moodOptions = [
    { value: 'happy', emoji: '😊' },
    { value: 'sad', emoji: '😢' },
    { value: 'angry', emoji: '😠' },
    { value: 'thoughtful', emoji: '🤔' },
    { value: 'excited', emoji: '🎉' },
    { value: 'calm', emoji: '😌' },
  ];

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
    
    return () => {
      // Clean up timers and recordings
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (videoTimer.current) clearInterval(videoTimer.current);
      if (recording) stopRecording();
    };
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    
    // If switching away from camera, hide it
    if (tab !== 'photo' && tab !== 'video') {
      setCameraVisible(false);
    }
    
    // If switching to camera, show it
    if ((tab === 'photo' || tab === 'video') && cameraPermission) {
      setCameraVisible(true);
    }
  };

  // Handle audio recording
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permissions to record audio.');
        return;
      }
      
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      // Stop recording
      await recording.stopAndUnloadAsync();
      clearInterval(recordingTimer.current);
      
      // Get recording URI
      const uri = recording.getURI();
      
      // Add to media files
      setMediaFiles(prev => [...prev, {
        uri,
        type: 'audio',
        duration: recordingDuration,
      }]);
      
      // Reset states
      setRecording(null);
      setIsRecording(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle photo capture
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync();
      
      // Add to media files
      setMediaFiles(prev => [...prev, {
        uri: photo.uri,
        type: 'photo',
      }]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Hide camera after taking picture
      setCameraVisible(false);
    } catch (error) {
      console.error('Failed to take picture', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // Handle video recording
  const startVideoRecording = async () => {
    if (!cameraRef.current) return;
    
    try {
      // Start recording
      await cameraRef.current.recordAsync();
      setIsRecordingVideo(true);
      setVideoRecordingDuration(0);
      
      // Start timer
      videoTimer.current = setInterval(() => {
        setVideoRecordingDuration(prev => prev + 1);
      }, 1000);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to start video recording', error);
      Alert.alert('Error', 'Failed to start video recording');
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current || !isRecordingVideo) return;
    
    try {
      // Stop recording
      const videoData = await cameraRef.current.stopRecording();
      clearInterval(videoTimer.current);
      
      // Add to media files
      setMediaFiles(prev => [...prev, {
        uri: videoData.uri,
        type: 'video',
        duration: videoRecordingDuration,
      }]);
      
      // Reset states
      setIsRecordingVideo(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Hide camera after recording
      setCameraVisible(false);
    } catch (error) {
      console.error('Failed to stop video recording', error);
      Alert.alert('Error', 'Failed to stop video recording');
    }
  };

  // Handle image picking from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Add to media files
        setMediaFiles(prev => [...prev, {
          uri: result.assets[0].uri,
          type: 'photo',
        }]);
      }
    } catch (error) {
      console.error('Failed to pick image', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // Handle video picking from gallery
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Get video duration
        const info = await FileSystem.getInfoAsync(result.assets[0].uri);
        
        // Add to media files
        setMediaFiles(prev => [...prev, {
          uri: result.assets[0].uri,
          type: 'video',
          duration: result.assets[0].duration || 0,
        }]);
      }
    } catch (error) {
      console.error('Failed to pick video', error);
      Alert.alert('Error', 'Failed to pick video from gallery');
    }
  };

  // Remove media file
  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Save journal entry
  const handleSave = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for your journal entry');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create journal entry
      const journalData = {
        title,
        content,
        mood,
        date: new Date().toISOString(),
      };
      
      const journal = await createJournal(journalData);
      
      // Upload media files
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => 
          uploadMediaWithRetry(file, journal.id)
        );
        
        await Promise.all(uploadPromises);
      }
      
      // Success
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate back to entries screen
      router.replace('/');
    } catch (error) {
      console.error('Failed to save journal entry', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    // Confirm if there's content to discard
    if (title.trim() || content.trim() || mediaFiles.length > 0) {
      Alert.alert(
        'Discard changes?',
        'Are you sure you want to discard your journal entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>New Entry</ThemedText>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.headerButton, styles.saveButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard style={styles.entryCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={Colors[colorScheme ?? 'light'].text + '80'}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <View style={styles.moodSelector}>
            <ThemedText style={styles.moodLabel}>How are you feeling?</ThemedText>
            <View style={styles.moodOptions}>
              {moodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.moodOption,
                    mood === option.value && styles.selectedMoodOption
                  ]}
                  onPress={() => setMood(option.value)}
                >
                  <ThemedText style={styles.moodEmoji}>{option.emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'text' && styles.activeTab]}
              onPress={() => handleTabChange('text')}
            >
              <IconSymbol 
                name="text.alignleft" 
                size={20} 
                color={activeTab === 'text' 
                  ? Colors[colorScheme ?? 'light'].tint 
                  : Colors[colorScheme ?? 'light'].tabIconDefault} 
              />
              <ThemedText 
                style={[
                  styles.tabText, 
                  activeTab === 'text' && styles.activeTabText
                ]}
              >
                Text
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'audio' && styles.activeTab]}
              onPress={() => handleTabChange('audio')}
            >
              <IconSymbol 
                name="mic" 
                size={20} 
                color={activeTab === 'audio' 
                  ? Colors[colorScheme ?? 'light'].tint 
                  : Colors[colorScheme ?? 'light'].tabIconDefault} 
              />
              <ThemedText 
                style={[
                  styles.tabText, 
                  activeTab === 'audio' && styles.activeTabText
                ]}
              >
                Audio
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'photo' && styles.activeTab]}
              onPress={() => handleTabChange('photo')}
            >
              <IconSymbol 
                name="camera" 
                size={20} 
                color={activeTab === 'photo' 
                  ? Colors[colorScheme ?? 'light'].tint 
                  : Colors[colorScheme ?? 'light'].tabIconDefault} 
              />
              <ThemedText 
                style={[
                  styles.tabText, 
                  activeTab === 'photo' && styles.activeTabText
                ]}
              >
                Photo
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'video' && styles.activeTab]}
              onPress={() => handleTabChange('video')}
            >
              <IconSymbol 
                name="video" 
                size={20} 
                color={activeTab === 'video' 
                  ? Colors[colorScheme ?? 'light'].tint 
                  : Colors[colorScheme ?? 'light'].tabIconDefault} 
              />
              <ThemedText 
                style={[
                  styles.tabText, 
                  activeTab === 'video' && styles.activeTabText
                ]}
              >
                Video
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {/* Text Tab Content */}
          {activeTab === 'text' && (
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts here..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].text + '80'}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          )}
          
          {/* Audio Tab Content */}
          {activeTab === 'audio' && (
            <View style={styles.audioContainer}>
              {isRecording ? (
                <View style={styles.recordingContainer}>
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <ThemedText style={styles.recordingText}>
                      Recording... {formatDuration(recordingDuration)}
                    </ThemedText>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.stopRecordingButton}
                    onPress={stopRecording}
                  >
                    <IconSymbol name="stop.fill" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.audioButtonsContainer}>
                  <TouchableOpacity
                    style={styles.recordButton}
                    onPress={startRecording}
                  >
                    <IconSymbol name="mic.fill" size={24} color="#fff" />
                    <ThemedText style={styles.recordButtonText}>Record Audio</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Photo Tab Content */}
          {activeTab === 'photo' && (
            <View style={styles.photoContainer}>
              {cameraVisible ? (
                <View style={styles.cameraContainer}>
                  <Camera
                    ref={cameraRef}
                    style={styles.camera}
                    type={cameraType}
                  />
                  
                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      style={styles.flipCameraButton}
                      onPress={() => setCameraType(
                        cameraType === Camera.Constants.Type.back
                          ? Camera.Constants.Type.front
                          : Camera.Constants.Type.back
                      )}
                    >
                      <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.takePictureButton}
                      onPress={takePicture}
                    >
                      <View style={styles.takePictureButtonInner} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.closeCameraButton}
                      onPress={() => setCameraVisible(false)}
                    >
                      <IconSymbol name="xmark" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={() => setCameraVisible(true)}
                  >
                    <IconSymbol name="camera.fill" size={24} color="#fff" />
                    <ThemedText style={styles.mediaButtonText}>Take Photo</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={pickImage}
                  >
                    <IconSymbol name="photo.on.rectangle" size={24} color="#fff" />
                    <ThemedText style={styles.mediaButtonText}>Choose from Gallery</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Video Tab Content */}
          {activeTab === 'video' && (
            <View style={styles.videoContainer}>
              {cameraVisible ? (
                <View style={styles.cameraContainer}>
                  <Camera
                    ref={cameraRef}
                    style={styles.camera}
                    type={cameraType}
                  />
                  
                  <View style={styles.cameraControls}>
                    {isRecordingVideo ? (
                      <>
                        <View style={styles.recordingIndicator}>
                          <View style={styles.recordingDot} />
                          <ThemedText style={styles.recordingText}>
                            {formatDuration(videoRecordingDuration)}
                          </ThemedText>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.stopRecordingButton}
                          onPress={stopVideoRecording}
                        >
                          <IconSymbol name="stop.fill" size={24} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.flipCameraButton}
                          onPress={() => setCameraType(
                            cameraType === Camera.Constants.Type.back
                              ? Camera.Constants.Type.front
                              : Camera.Constants.Type.back
                          )}
                        >
                          <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.recordVideoButton}
                          onPress={startVideoRecording}
                        >
                          <View style={styles.recordVideoButtonInner} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.closeCameraButton}
                          onPress={() => setCameraVisible(false)}
                        >
                          <IconSymbol name="xmark" size={24} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.videoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={() => setCameraVisible(true)}
                  >
                    <IconSymbol name="video.fill" size={24} color="#fff" />
                    <ThemedText style={styles.mediaButtonText}>Record Video</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={pickVideo}
                  >
                    <IconSymbol name="film" size={24} color="#fff" />
                    <ThemedText style={styles.mediaButtonText}>Choose from Gallery</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </GlassCard>
        
        {/* Media Preview Section */}
        {mediaFiles.length > 0 && (
          <View style={styles.mediaPreviewSection}>
            <ThemedText style={styles.mediaPreviewTitle}>Media Files</ThemedText>
            
            <View style={styles.mediaPreviewList}>
              {mediaFiles.map((file, index) => (
                <View key={index} style={styles.mediaPreviewItem}>
                  {file.type === 'photo' ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.mediaPreviewImage}
                      contentFit="cover"
                    />
                  ) : file.type === 'video' ? (
                    <View style={styles.mediaPreviewVideo}>
                      <IconSymbol name="video.fill" size={24} color="#fff" />
                      <ThemedText style={styles.mediaDuration}>
                        {formatDuration(file.duration)}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.mediaPreviewAudio}>
                      <IconSymbol name="mic.fill" size={24} color="#fff" />
                      <ThemedText style={styles.mediaDuration}>
                        {formatDuration(file.duration)}
                      </ThemedText>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMediaFile(index)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

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
  headerTitle: {
    fontSize: 24,
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#f7c5a8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#4b3621',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  moodSelector: {
    marginBottom: 16,
  },
  moodLabel: {
    marginBottom: 8,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedMoodOption: {
    backgroundColor: '#f7c5a8',
  },
  moodEmoji: {
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#f7c5a8',
  },
  tabText: {
    fontSize: 14,
  },
  activeTabText: {
    color: '#f7c5a8',
    fontWeight: '600',
  },
  contentInput: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  audioContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonsContainer: {
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    backgroundColor: '#f7c5a8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  recordingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
  },
  recordingText: {
    fontSize: 16,
  },
  stopRecordingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    minHeight: 200,
    justifyContent: 'center',
  },
  photoButtonsContainer: {
    gap: 16,
    alignItems: 'center',
  },
  mediaButton: {
    flexDirection: 'row',
    backgroundColor: '#f7c5a8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
    width: '80%',
    justifyContent: 'center',
  },
  mediaButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cameraContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  flipCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  takePictureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  takePictureButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  closeCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    minHeight: 200,
    justifyContent: 'center',
  },
  videoButtonsContainer: {
    gap: 16,
    alignItems: 'center',
  },
  recordVideoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ff3b30',
  },
  recordVideoButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3b30',
  },
  mediaPreviewSection: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  mediaPreviewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaPreviewItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4b3621',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewAudio: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4b3621',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaDuration: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});