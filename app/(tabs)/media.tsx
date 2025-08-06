// import { Image } from 'expo-image';
// import { Link, useRouter } from 'expo-router';
// import React, { useState, useRef } from 'react';
// import { StyleSheet, FlatList, TouchableOpacity, View, Dimensions, Animated } from 'react-native';

// import { GlassCard } from '@/components/GlassCard';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { IconSymbol } from '@/components/ui/IconSymbol';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { FontAwesome } from '@expo/vector-icons';

// // Sample media items for demonstration
// const sampleMedia = [
//   {
//     id: '1',
//     type: 'photo',
//     uri: 'https://picsum.photos/id/237/300/300',
//     title: 'Morning Walk',
//     date: '2023-10-15',
//     entryId: '1',
//   },
//   {
//     id: '2',
//     type: 'video',
//     uri: 'https://picsum.photos/id/238/300/300',
//     title: 'Beach Sunset',
//     duration: '0:45',
//     date: '2023-10-14',
//     entryId: '2',
//   },
//   {
//     id: '3',
//     type: 'audio',
//     title: 'Voice Note',
//     duration: '1:23',
//     date: '2023-10-12',
//     entryId: '3',
//   },
//   {
//     id: '4',
//     type: 'photo',
//     uri: 'https://picsum.photos/id/239/300/300',
//     title: 'City Lights',
//     date: '2023-10-10',
//     entryId: '4',
//   },
//   {
//     id: '5',
//     type: 'photo',
//     uri: 'https://picsum.photos/id/240/300/300',
//     title: 'Mountain View',
//     date: '2023-10-08',
//     entryId: '5',
//   },
//   {
//     id: '6',
//     type: 'video',
//     uri: 'https://picsum.photos/id/241/300/300',
//     title: 'Family Gathering',
//     duration: '2:10',
//     date: '2023-10-05',
//     entryId: '6',
//   },
//   {
//     id: '7',
//     type: 'audio',
//     title: 'Meeting Notes',
//     duration: '3:45',
//     date: '2023-10-03',
//     entryId: '7',
//   },
//   {
//     id: '8',
//     type: 'photo',
//     uri: 'https://picsum.photos/id/242/300/300',
//     title: 'Garden Flowers',
//     date: '2023-10-01',
//     entryId: '8',
//   },
// ];

// export default function MediaScreen() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const [activeFilter, setActiveFilter] = useState('all');
//   const [lastScrollY, setLastScrollY] = useState(0);
//   const filterBarOpacity = useRef(new Animated.Value(1)).current;
  
//   const filteredMedia = activeFilter === 'all' 
//     ? sampleMedia 
//     : sampleMedia.filter(item => item.type === activeFilter);

//   const handleScroll = (event) => {
//     const currentScrollY = event.nativeEvent.contentOffset.y;
    
//     if (currentScrollY > lastScrollY && currentScrollY > 20) {
//       // Scrolling down, hide filter bar
//       Animated.timing(filterBarOpacity, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     } else if (currentScrollY < lastScrollY || currentScrollY < 20) {
//       // Scrolling up or near top, show filter bar
//       Animated.timing(filterBarOpacity, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//     }
    
//     setLastScrollY(currentScrollY);
//   };

//   const renderMediaItem = ({ item }) => {
//     const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//     });

//     return (
//       <TouchableOpacity 
//         style={styles.mediaItem}
//         onPress={() => router.push(`/entry/${item.entryId}`)}
//         activeOpacity={0.8}
//       >
//         <GlassCard style={styles.mediaCard}>
//           <View style={styles.thumbnailContainer}>
//             {item.type === 'photo' && (
//               <Image
//                 source={{ uri: item.uri }}
//                 style={styles.thumbnail}
//                 contentFit="cover"
//                 transition={300}
//               />
//             )}
            
//             {item.type === 'video' && (
//               <>
//                 <Image
//                   source={{ uri: item.uri }}
//                   style={styles.thumbnail}
//                   contentFit="cover"
//                   transition={300}
//                 />
//                 <View style={styles.videoBadge}>
//                   <FontAwesome name="play" size={12} color="#fff" />
//                 </View>
//                 {item.duration && (
//                   <View style={styles.durationBadge}>
//                     <ThemedText style={styles.durationText}>{item.duration}</ThemedText>
//                   </View>
//                 )}
//               </>
//             )}
            
//             {item.type === 'audio' && (
//               <View style={[styles.audioThumbnail, { backgroundColor: Colors[colorScheme ?? 'light'].pastelPink }]}>
//                 <FontAwesome name="microphone" size={24} color={Colors[colorScheme ?? 'light'].text} />
//                 {item.duration && (
//                   <ThemedText style={styles.audioTitle}>{item.duration}</ThemedText>
//                 )}
//               </View>
//             )}
//           </View>
          
//           <View style={styles.mediaInfo}>
//             <ThemedText style={styles.mediaTitle} numberOfLines={1}>{item.title}</ThemedText>
//             <ThemedText style={styles.mediaDate}>{formattedDate}</ThemedText>
//           </View>
//         </GlassCard>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <ThemedView style={styles.container}>
//       <View style={styles.header}>
//         <ThemedText type="title">Media</ThemedText>
//       </View>
      
//       <Animated.View style={[styles.filterContainer, { opacity: filterBarOpacity }]}>
//         <TouchableOpacity 
//           style={[styles.filterOption, activeFilter === 'all' && styles.activeFilter]}
//           onPress={() => setActiveFilter('all')}
//         >
//           <ThemedText style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</ThemedText>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.filterOption, activeFilter === 'photo' && styles.activeFilter]}
//           onPress={() => setActiveFilter('photo')}
//         >
//           <ThemedText style={[styles.filterText, activeFilter === 'photo' && styles.activeFilterText]}>Photos</ThemedText>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.filterOption, activeFilter === 'video' && styles.activeFilter]}
//           onPress={() => setActiveFilter('video')}
//         >
//           <ThemedText style={[styles.filterText, activeFilter === 'video' && styles.activeFilterText]}>Videos</ThemedText>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.filterOption, activeFilter === 'audio' && styles.activeFilter]}
//           onPress={() => setActiveFilter('audio')}
//         >
//           <ThemedText style={[styles.filterText, activeFilter === 'audio' && styles.activeFilterText]}>Audio</ThemedText>
//         </TouchableOpacity>
//       </Animated.View>
      
//       <FlatList
//         data={filteredMedia}
//         renderItem={renderMediaItem}
//         keyExtractor={item => item.id}
//         numColumns={2}
//         contentContainerStyle={styles.mediaList}
//         showsVerticalScrollIndicator={false}
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//       />
//     </ThemedView>
//   );
// }

// const { width } = Dimensions.get('window');
// const itemWidth = (width - 48) / 2; // 2 columns with padding

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingTop: 60,
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   filterContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     zIndex: 10,
//   },
//   filterOption: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   activeFilter: {
//     backgroundColor: Colors.light.tint,
//   },
//   filterText: {
//     fontSize: 14,
//   },
//   activeFilterText: {
//     fontWeight: '600',
//     color: '#4b3621',
//   },
//   mediaList: {
//     padding: 16,
//     paddingTop: 8,
//   },
//   mediaItem: {
//     width: itemWidth,
//     marginBottom: 16,
//     marginHorizontal: 8,
//   },
//   mediaCard: {
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   thumbnailContainer: {
//     width: '100%',
//     height: itemWidth,
//     position: 'relative',
//   },
//   thumbnail: {
//     width: '100%',
//     height: '100%',
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//   },
//   audioThumbnail: {
//     width: '100%',
//     height: '100%',
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   audioTitle: {
//     marginTop: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   videoBadge: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -15 }, { translateY: -15 }],
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   durationBadge: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   durationText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   mediaInfo: {
//     padding: 12,
//   },
//   mediaTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   mediaDate: {
//     fontSize: 12,
//     opacity: 0.7,
//   },
// });