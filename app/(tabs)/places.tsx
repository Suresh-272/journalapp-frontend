// import { useRouter } from 'expo-router';
// import * as Location from 'expo-location';
// import React, { useState, useEffect, useRef } from 'react';
// import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
// import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';

// import { GlassCard } from '@/components/GlassCard';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { FontAwesome } from '@expo/vector-icons';

// // Sample geotagged entries for demonstration
// const sampleEntries = [
//   {
//     id: '1',
//     title: 'Morning Reflections',
//     preview: 'Today I woke up feeling refreshed...',
//     date: '2023-10-15',
//     location: {
//       latitude: 37.7749,
//       longitude: -122.4194,
//     },
//   },
//   {
//     id: '2',
//     title: 'Beach Day',
//     preview: 'Spent the afternoon at the beach...',
//     date: '2023-10-14',
//     location: {
//       latitude: 37.7833,
//       longitude: -122.4324,
//     },
//   },
//   {
//     id: '3',
//     title: 'Coffee Shop Thoughts',
//     preview: 'Found a cozy new coffee shop...',
//     date: '2023-10-10',
//     location: {
//       latitude: 37.7694,
//       longitude: -122.4094,
//     },
//   },
//   {
//     id: '4',
//     title: 'Park Meditation',
//     preview: 'Spent an hour meditating in the park...',
//     date: '2023-10-05',
//     location: {
//       latitude: 37.7699,
//       longitude: -122.4294,
//     },
//   },
// ];

// // Custom map style for a warm, beige theme
// const mapStyle = [
//   {
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#f5f5f5"
//       }
//     ]
//   },
//   {
//     "elementType": "labels.icon",
//     "stylers": [
//       {
//         "visibility": "off"
//       }
//     ]
//   },
//   {
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#616161"
//       }
//     ]
//   },
//   {
//     "elementType": "labels.text.stroke",
//     "stylers": [
//       {
//         "color": "#f5f5f5"
//       }
//     ]
//   },
//   {
//     "featureType": "administrative.land_parcel",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#bdbdbd"
//       }
//     ]
//   },
//   {
//     "featureType": "poi",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#eeeeee"
//       }
//     ]
//   },
//   {
//     "featureType": "poi",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#757575"
//       }
//     ]
//   },
//   {
//     "featureType": "poi.park",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#e5e5e5"
//       }
//     ]
//   },
//   {
//     "featureType": "poi.park",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#9e9e9e"
//       }
//     ]
//   },
//   {
//     "featureType": "road",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#ffffff"
//       }
//     ]
//   },
//   {
//     "featureType": "road.arterial",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#757575"
//       }
//     ]
//   },
//   {
//     "featureType": "road.highway",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#dadada"
//       }
//     ]
//   },
//   {
//     "featureType": "road.highway",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#616161"
//       }
//     ]
//   },
//   {
//     "featureType": "road.local",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#9e9e9e"
//       }
//     ]
//   },
//   {
//     "featureType": "transit.line",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#e5e5e5"
//       }
//     ]
//   },
//   {
//     "featureType": "transit.station",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#eeeeee"
//       }
//     ]
//   },
//   {
//     "featureType": "water",
//     "elementType": "geometry",
//     "stylers": [
//       {
//         "color": "#c9c9c9"
//       }
//     ]
//   },
//   {
//     "featureType": "water",
//     "elementType": "labels.text.fill",
//     "stylers": [
//       {
//         "color": "#9e9e9e"
//       }
//     ]
//   }
// ];

// export default function PlacesScreen() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const [location, setLocation] = useState(null);
//   const [errorMsg, setErrorMsg] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedMarker, setSelectedMarker] = useState(null);
//   const mapRef = useRef(null);
//   const calloutAnimation = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     (async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         setErrorMsg('Permission to access location was denied');
//         setLoading(false);
//         return;
//       }

//       try {
//         let location = await Location.getCurrentPositionAsync({});
//         setLocation(location);
//       } catch (error) {
//         setErrorMsg('Could not get your location');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const handleMarkerPress = (entryId) => {
//     setSelectedMarker(entryId);
    
//     // Animate callout appearance
//     Animated.spring(calloutAnimation, {
//       toValue: 1,
//       friction: 7,
//       tension: 40,
//       useNativeDriver: true,
//     }).start();
//   };

//   const handleCalloutPress = (entryId) => {
//     router.push(`/entry/${entryId}`);
//   };

//   const initialRegion = location
//     ? {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       }
//     : {
//         latitude: 37.78825,
//         longitude: -122.4324,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       };

//   if (loading) {
//     return (
//       <ThemedView style={[styles.container, styles.centerContent]}>
//         <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
//         <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
//       </ThemedView>
//     );
//   }

//   if (errorMsg) {
//     return (
//       <ThemedView style={[styles.container, styles.centerContent]}>
//         <FontAwesome name="exclamation-triangle" size={48} color={Colors[colorScheme ?? 'light'].tint} />
//         <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
//         <TouchableOpacity 
//           style={styles.retryButton}
//           onPress={() => router.replace('/places')}
//         >
//           <ThemedText style={styles.retryText}>Retry</ThemedText>
//         </TouchableOpacity>
//       </ThemedView>
//     );
//   }

//   return (
//     <ThemedView style={styles.container}>
//       <View style={styles.header}>
//         <ThemedText type="title">Places</ThemedText>
//       </View>
      
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={initialRegion}
//         provider={PROVIDER_GOOGLE}
//         customMapStyle={mapStyle}
//         showsUserLocation
//         showsMyLocationButton
//       >
//         {sampleEntries.map((entry) => (
//           <Marker
//             key={entry.id}
//             coordinate={entry.location}
//             onPress={() => handleMarkerPress(entry.id)}
//             pinColor={Colors[colorScheme ?? 'light'].tint}
//           >
//             <Callout 
//               tooltip
//               onPress={() => handleCalloutPress(entry.id)}
//             >
//               <Animated.View 
//                 style={[
//                   styles.calloutContainer,
//                   selectedMarker === entry.id && {
//                     transform: [
//                       { scale: calloutAnimation.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [0.8, 1]
//                       })}
//                     ]
//                   }
//                 ]}
//               >
//                 <GlassCard style={styles.callout}>
//                   <ThemedText style={styles.calloutTitle}>{entry.title}</ThemedText>
//                   <ThemedText style={styles.calloutPreview} numberOfLines={1}>{entry.preview}</ThemedText>
//                   <ThemedText style={styles.calloutDate}>{new Date(entry.date).toLocaleDateString('en-US', {
//                     month: 'short',
//                     day: 'numeric',
//                     year: 'numeric',
//                   })}</ThemedText>
//                   <TouchableOpacity 
//                     style={styles.calloutAction}
//                     onPress={() => handleCalloutPress(entry.id)}
//                   >
//                     <ThemedText style={styles.calloutActionText}>View Entry</ThemedText>
//                   </TouchableOpacity>
//                 </GlassCard>
//               </Animated.View>
//             </Callout>
//           </Marker>
//         ))}
//       </MapView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   centerContent: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   header: {
//     paddingTop: 60,
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     zIndex: 10,
//   },
//   map: {
//     flex: 1,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//   },
//   errorText: {
//     marginTop: 16,
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: Colors.light.tint,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 24,
//   },
//   retryText: {
//     fontWeight: '600',
//     color: '#4b3621',
//   },
//   calloutContainer: {
//     width: 200,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   callout: {
//     padding: 12,
//   },
//   calloutTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 4,
//     color: '#4b3621',
//   },
//   calloutPreview: {
//     fontSize: 14,
//     marginBottom: 4,
//     color: '#4b3621',
//   },
//   calloutDate: {
//     fontSize: 12,
//     color: '#8a7866',
//     marginBottom: 8,
//   },
//   calloutAction: {
//     backgroundColor: '#f7c5a8',
//     padding: 6,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   calloutActionText: {
//     color: '#4b3621',
//     fontWeight: '600',
//     fontSize: 12,
//   },
// });