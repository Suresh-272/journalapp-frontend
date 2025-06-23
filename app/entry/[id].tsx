// import { Audio } from 'expo-av';
// import { Image } from 'expo-image';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useState, useEffect, useRef } from 'react';
// import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';

// import { GlassCard } from '@/components/GlassCard';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { IconSymbol } from '@/components/ui/IconSymbol';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';

// // Sample entry data
// const sampleEntries = {
//   '1': {
//     id: '1',
//     title: 'Morning Reflections',
//     content: 'Today I woke up feeling refreshed and ready to tackle the day. The sun was streaming through my window, casting a warm glow across my room. I took a moment to appreciate the quiet morning before the hustle of the day began.\n\nI made myself a cup of coffee and sat on the balcony, watching the world wake up. There\'s something magical about these early hours when everything feels possible.\n\nI\'m setting an intention to remain present throughout the day and to approach challenges with a calm mind.',
//     date: '2023-10-15',
//     mood: 'happy',
//     location: {
//       latitude: 37.78825,
//       longitude: -122.4324,
//       name: 'San Francisco, CA',
//     },
//     media: [
//       {
//         id: '101',
//         type: 'photo',
//         uri: 'https://via.placeholder.com/400',
//         caption: 'Morning view from my balcony',
//       },
//       {
//         id: '102',
//         type: 'audio',
//         uri: 'dummy_audio_uri',
//         duration: '1:24',
//         caption: 'Morning thoughts',
//       },
//     ],
//   },
//   '2': {
//     id: '2',
//     title: 'Evening Thoughts',
//     content: 'As the day comes to a close, I find myself reflecting on the events that unfolded. It was a productive day at work, though not without its challenges. I managed to complete the project I\'ve been working on for weeks, which feels like a significant accomplishment.\n\nI met with Sarah for coffee in the afternoon. Our conversations always leave me feeling inspired and understood. We talked about our future plans and shared some laughs about old memories.\n\nTonight, I\'m grateful for good friends, meaningful work, and the quiet moments that allow for reflection.',
//     date: '2023-10-14',
//     mood: 'thoughtful',
//     media: [
//       {
//         id: '201',
//         type: 'video',
//         uri: 'https://via.placeholder.com/400',
//         duration: '0:45',
//         caption: 'Sunset timelapse',
//       },
//     ],
//   },
// };

// export default function EntryDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const [entry, setEntry] = useState(null);
//   const [playingAudio, setPlayingAudio] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [playbackPosition, setPlaybackPosition] = useState(0);
//   const [playbackDuration, setPlaybackDuration] = useState(0);
  
//   const soundRef = useRef(null);
  
//   useEffect(() => {
//     // In a real app, you would fetch the entry from AsyncStorage or your backend
//     // For now, we'll use our sample data
//     if (id && sampleEntries[id]) {
//       setEntry(sampleEntries[id]);
//     }
    
//     return () => {
//       // Clean up audio when component unmounts
//       if (soundRef.current) {
//         soundRef.current.unloadAsync();
//       }
//     };
//   }, [id]);
  
//   const handlePlayAudio = async (audioItem) => {
//     if (playingAudio === audioItem.id) {
//       // Toggle play/pause for current audio
//       if (isPlaying) {
//         await soundRef.current.pauseAsync();
//         setIsPlaying(false);
//       } else {
//         await soundRef.current.playAsync();
//         setIsPlaying(true);
//       }
//     } else {
//       // Stop current audio if any
//       if (soundRef.current) {
//         await soundRef.current.unloadAsync();
//       }
      
//       // Load and play new audio
//       try {
//         // In a real app, you would use the actual URI
//         // For this example, we'll just simulate playing
//         const { sound } = await Audio.Sound.createAsync(
//           require('@/assets/sounds/sample.mp3'), // You would need to add this file
//           { shouldPlay: true },
//           onPlaybackStatusUpdate
//         );
        
//         soundRef.current = sound;
//         setPlayingAudio(audioItem.id);
//         setIsPlaying(true);
//       } catch (error) {
//         console.log('Error playing audio:', error);
//       }
//     }
//   };
  
//   const onPlaybackStatusUpdate = (status) => {
//     if (status.isLoaded) {
//       setPlaybackPosition(status.positionMillis);
//       setPlaybackDuration(status.durationMillis);
      
//       if (status.didJustFinish) {
//         setIsPlaying(false);
//         setPlaybackPosition(0);
//       }
//     }
//   };
  
//   const formatTime = (millis) => {
//     if (!millis) return '0:00';
//     const totalSeconds = Math.floor(millis / 1000);
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = totalSeconds % 60;
//     return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
//   };
  
//   if (!entry) {
//     return (
//       <ThemedView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//             <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
//           </TouchableOpacity>
//           <ThemedText type="title">Entry Not Found</ThemedText>
//         </View>
//       </ThemedView>
//     );
//   }
  
//   const moodEmoji = {
//     happy: '😊',
//     sad: '😢',
//     thoughtful: '🤔',
//     excited: '🎉',
//     calm: '😌',
//     angry: '😠',
//   }[entry.mood] || '😐';
  
//   return (
//     <ThemedView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
//         </TouchableOpacity>
//         <View style={styles.headerTitleContainer}>
//           <ThemedText type="subtitle" numberOfLines={1} style={styles.headerTitle}>
//             {entry.title}
//           </ThemedText>
//           <ThemedText style={styles.dateText}>
//             {new Date(entry.date).toLocaleDateString('en-US', {
//               weekday: 'long',
//               month: 'long',
//               day: 'numeric',
//               year: 'numeric',
//             })}
//           </ThemedText>
//         </View>
//         <TouchableOpacity style={styles.editButton}>
//           <IconSymbol name="pencil" size={20} color={Colors[colorScheme ?? 'light'].text} />
//         </TouchableOpacity>
//       </View>
      
//       <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
//         <GlassCard style={styles.entryCard}>
//           <View style={styles.entryHeader}>
//             <ThemedText type="journalTitle">{entry.title}</ThemedText>
//             <View style={styles.moodContainer}>
//               <ThemedText style={styles.moodEmoji}>{moodEmoji}</ThemedText>
//             </View>
//           </View>
          
//           <ThemedText style={styles.entryContent}>{entry.content}</ThemedText>
          
//           {entry.media && entry.media.length > 0 && (
//             <View style={styles.mediaSection}>
//               <ThemedText style={styles.mediaSectionTitle}>Attachments</ThemedText>
              
//               {entry.media.map((item) => (
//                 <View key={item.id} style={styles.mediaItem}>
//                   {item.type === 'photo' && (
//                     <Image
//                       source={{ uri: item.uri }}
//                       style={styles.photoAttachment}
//                       contentFit="cover"
//                     />
//                   )}
                  
//                   {item.type === 'video' && (
//                     <View style={styles.videoContainer}>
//                       <Image
//                         source={{ uri: item.uri }}
//                         style={styles.videoThumbnail}
//                         contentFit="cover"
//                       />
//                       <TouchableOpacity style={styles.playButton}>
//                         <IconSymbol name="play.fill" size={24} color="#fff" />
//                       </TouchableOpacity>
//                     </View>
//                   )}
                  
//                   {item.type === 'audio' && (
//                     <View style={styles.audioContainer}>
//                       <TouchableOpacity 
//                         style={styles.audioPlayButton}
//                         onPress={() => handlePlayAudio(item)}
//                       >
//                         <IconSymbol 
//                           name={playingAudio === item.id && isPlaying ? "pause.fill" : "play.fill"} 
//                           size={24} 
//                           color={Colors[colorScheme ?? 'light'].text} 
//                         />
//                       </TouchableOpacity>
                      
//                       <View style={styles.audioInfo}>
//                         <View style={styles.audioProgressContainer}>
//                           <View 
//                             style={[
//                               styles.audioProgress, 
//                               { 
//                                 width: playingAudio === item.id ? 
//                                   `${(playbackPosition / playbackDuration) * 100}%` : 
//                                   '0%' 
//                               }
//                             ]} 
//                           />
//                         </View>
//                         <View style={styles.audioTimeContainer}>
//                           <ThemedText style={styles.audioTime}>
//                             {playingAudio === item.id ? formatTime(playbackPosition) : '0:00'}
//                           </ThemedText>
//                           <ThemedText style={styles.audioTime}>
//                             {item.duration}
//                           </ThemedText>
//                         </View>
//                       </View>
//                     </View>
//                   )}
                  
//                   {item.caption && (
//                     <ThemedText style={styles.mediaCaption}>{item.caption}</ThemedText>
//                   )}
//                 </View>
//               ))}
//             </View>
//           )}
          
//           {entry.location && (
//             <View style={styles.locationSection}>
//               <ThemedText style={styles.locationTitle}>Location</ThemedText>
//               <View style={styles.mapContainer}>
//                 <MapView
//                   style={styles.map}
//                   initialRegion={{
//                     latitude: entry.location.latitude,
//                     longitude: entry.location.longitude,
//                     latitudeDelta: 0.01,
//                     longitudeDelta: 0.01,
//                   }}
//                   scrollEnabled={false}
//                   zoomEnabled={false}
//                   rotateEnabled={false}
//                   pitchEnabled={false}
//                 >
//                   <Marker
//                     coordinate={{
//                       latitude: entry.location.latitude,
//                       longitude: entry.location.longitude,
//                     }}
//                     pinColor={Colors[colorScheme ?? 'light'].tint}
//                   />
//                 </MapView>
//                 <ThemedText style={styles.locationName}>{entry.location.name}</ThemedText>
//               </View>
//             </View>
//           )}
//         </GlassCard>
//       </ScrollView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: Platform.OS === 'ios' ? 60 : 40,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitleContainer: {
//     flex: 1,
//     marginLeft: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//   },
//   dateText: {
//     fontSize: 12,
//     opacity: 0.7,
//   },
//   editButton: {
//     padding: 8,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 40,
//   },
//   entryCard: {
//     marginBottom: 20,
//   },
//   entryHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   moodContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 228, 225, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   moodEmoji: {
//     fontSize: 24,
//   },
//   entryContent: {
//     fontSize: 16,
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   mediaSection: {
//     marginBottom: 24,
//   },
//   mediaSectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   mediaItem: {
//     marginBottom: 16,
//   },
//   photoAttachment: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     marginBottom: 8,
//   }
// });
  