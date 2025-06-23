import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Journal prompts
const journalPrompts = [
  "What made you smile today?",
  "Describe a challenge you faced today and how you handled it.",
  "What are you grateful for right now?",
  "What's something new you learned today?",
  "Describe your current mood and what influenced it.",
  "What's something you're looking forward to?",
  "Reflect on a conversation that impacted you today.",
  "What's a small win you celebrated today?",
  "If you could change one thing about today, what would it be?",
  "What's a goal you're working towards right now?",
];

// Mood options
const moodOptions = [
  { label: 'Happy', emoji: '😊', value: 'happy' },
  { label: 'Sad', emoji: '😢', value: 'sad' },
  { label: 'Angry', emoji: '😠', value: 'angry' },
  { label: 'Thoughtful', emoji: '🤔', value: 'thoughtful' },
  { label: 'Excited', emoji: '🎉', value: 'excited' },
  { label: 'Calm', emoji: '😌', value: 'calm' },
];

export default function NewEntryScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [location, setLocation] = useState(null);
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const cameraRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation when recording
  useEffect(() => {
    if (isRecording || isVideoRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isVideoRecording, pulseAnim]);

  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('Location Added', 'Your current location has been added to this entry');
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access camera was denied');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const newAttachment = {
          id: Date.now().toString(),
          type: 'photo',
          uri: result.assets[0].uri,
        };
        setMediaAttachments([...mediaAttachments, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRecordAudio = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access microphone was denied');
      return;
    }

    try {
      if (isRecording) {
        // Stop recording
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setIsRecording(false);

        const newAttachment = {
          id: Date.now().toString(),
          type: 'audio',
          uri,
        };
        setMediaAttachments([...mediaAttachments, newAttachment]);
      } else {
        // Start recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record audio');
      setIsRecording(false);
    }
  };

  const handleRecordVideo = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access camera was denied');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        allowsEditing: true,
        videoMaxDuration: 60,
      });

      if (!result.canceled) {
        const newAttachment = {
          id: Date.now().toString(),
          type: 'video',
          uri: result.assets[0].uri,
        };
        setMediaAttachments([...mediaAttachments, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleRemoveAttachment = (id) => {
    setMediaAttachments(mediaAttachments.filter(item => item.id !== id));
  };

  const handleGetPrompt = () => {
    const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setPrompt(randomPrompt);
  };

  const handleDismissPrompt = () => {
    setPrompt(null);
  };

  const handleUsePrompt = () => {
    setContent(prompt);
    setPrompt(null);
  };

  const handleSave = () => {
    // Here you would save the entry to your database
    // For now, we'll just navigate back
    Alert.alert('Entry Saved', 'Your journal entry has been saved successfully');
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].icon} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>New Entry</ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.entryCard}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="rgba(75, 54, 33, 0.6)"
              value={title}
              onChangeText={setTitle}
            />
            
            <View style={styles.dateRow}>
              <ThemedText style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </ThemedText>
            </View>
            
            {prompt && (
              <View style={styles.promptContainer}>
                <GlassCard style={styles.promptCard}>
                  <ThemedText style={styles.promptText}>{prompt}</ThemedText>
                  <View style={styles.promptActions}>
                    <TouchableOpacity 
                      style={[styles.promptButton, styles.dismissButton]}
                      onPress={handleDismissPrompt}
                    >
                      <ThemedText style={styles.dismissButtonText}>Dismiss</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.promptButton, styles.useButton]}
                      onPress={handleUsePrompt}
                    >
                      <ThemedText style={styles.useButtonText}>Use Prompt</ThemedText>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>
            )}
            
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind today?"
              placeholderTextColor="rgba(75, 54, 33, 0.6)"
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />
            
            {mediaAttachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                <ThemedText style={styles.attachmentsTitle}>Attachments</ThemedText>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.attachmentsScroll}
                >
                  {mediaAttachments.map((item) => (
                    <View key={item.id} style={styles.attachmentItem}>
                      {item.type === 'photo' && (
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.attachmentThumbnail}
                          contentFit="cover"
                        />
                      )}
                      
                      {item.type === 'video' && (
                        <>
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.attachmentThumbnail}
                            contentFit="cover"
                          />
                          <View style={styles.videoBadge}>
                            <FontAwesome name="play" size={12} color="#fff" />
                          </View>
                        </>
                      )}
                      
                      {item.type === 'audio' && (
                        <View style={[styles.audioAttachment, { backgroundColor: Colors[colorScheme ?? 'light'].pastelBlue + '40' }]}>
                          <FontAwesome name="microphone" size={24} color={Colors[colorScheme ?? 'light'].icon} />
                        </View>
                      )}
                      
                      <TouchableOpacity 
                        style={styles.removeAttachment}
                        onPress={() => handleRemoveAttachment(item.id)}
                      >
                        <FontAwesome name="times" size={16} color="#4b3621" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.moodSelector}>
              <ThemedText style={styles.moodTitle}>How are you feeling?</ThemedText>
              <View style={styles.moodOptions}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.value && styles.selectedMood,
                    ]}
                    onPress={() => setSelectedMood(mood.value)}
                  >
                    <ThemedText style={styles.moodEmoji}>{mood.emoji}</ThemedText>
                    <ThemedText style={styles.moodLabel}>{mood.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </GlassCard>
        </ScrollView>
        
        {(isRecording || isVideoRecording) ? (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              <Animated.View 
                style={[
                  styles.recordingPulse,
                  { transform: [{ scale: pulseAnim }] },
                ]} 
              />
              <ThemedText style={styles.recordingText}>
                {isRecording ? 'Recording Audio...' : 'Recording Video...'}
              </ThemedText>
              <TouchableOpacity 
                style={styles.stopRecordingButton}
                onPress={isRecording ? handleRecordAudio : null}
              >
                <FontAwesome name="stop" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleTakePhoto}
            >
              <FontAwesome name="camera" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRecordVideo}
            >
              <FontAwesome name="video-camera" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRecordAudio}
            >
              <FontAwesome name="microphone" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleGetLocation}
            >
              <FontAwesome name="map-marker" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleGetPrompt}
            >
              <FontAwesome name="lightbulb-o" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
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
    paddingBottom: 100, // Extra padding for bottom action bar
  },
  entryCard: {
    marginBottom: 20,
  },
  titleInput: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    marginBottom: 8,
    color: '#4b3621',
  },
  dateRow: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  contentInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    color: '#4b3621',
  },
  attachmentsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  attachmentsScroll: {
    flexDirection: 'row',
  },
  attachmentItem: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentThumbnail: {
    width: '100%',
    height: '100%',
  },
  audioAttachment: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodSelector: {
    marginTop: 20,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedMood: {
    backgroundColor: '#ffe4e1',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    fontSize: 14,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginRight: 12,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  stopRecordingButton: {
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  promptContainer: {
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: Colors.light.pastelPink + '40',
  },
  promptText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  promptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dismissButtonText: {
    fontSize: 14,
  },
  useButton: {
    backgroundColor: Colors.light.tint,
  },
  useButtonText: {
    fontSize: 14,
    color: '#4b3621',
    fontWeight: '600',
  },
});