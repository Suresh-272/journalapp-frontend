import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Sample geotagged entries for demonstration
const sampleEntries = [
  {
    id: '1',
    title: 'Morning Reflections',
    preview: 'Today I woke up feeling refreshed...',
    date: '2023-10-15',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  },
  {
    id: '2',
    title: 'Central Park Walk',
    preview: 'Spent the afternoon walking through...',
    date: '2023-10-14',
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  },
  {
    id: '3',
    title: 'Brooklyn Bridge',
    preview: 'Crossed the Brooklyn Bridge today...',
    date: '2023-10-13',
    location: {
      latitude: 40.7061,
      longitude: -73.9969,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  },
];

// Custom map style for dark mode
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#263c3f',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#6b9a76',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#38414e',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#212a37',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9ca5b3',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#1f2835',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#f3d19c',
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#2f3948',
      },
    ],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#515c6d',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
];

export default function PlacesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Could not get your location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkerPress = (entryId) => {
    // This is handled by the callout now
  };

  const handleCalloutPress = (entryId) => {
    router.push(`/entry/${entryId}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 16 }}>Loading map...</ThemedText>
      </ThemedView>
    );
  }

  if (errorMsg) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={{ marginBottom: 16 }}>{errorMsg}</ThemedText>
        <TouchableOpacity
          style={{
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: '#4b3621', fontWeight: '600' }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 40.7128, // Default to NYC
        longitude: -74.0060,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Places</ThemedText>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton
          customMapStyle={colorScheme === 'dark' ? darkMapStyle : []}
        >
          {sampleEntries.map((entry) => (
            <Marker
              key={entry.id}
              coordinate={{
                latitude: entry.location.latitude,
                longitude: entry.location.longitude,
              }}
              pinColor={Colors[colorScheme ?? 'light'].tint}
              onPress={() => handleMarkerPress(entry.id)}
            >
              <Callout
                tooltip
                onPress={() => handleCalloutPress(entry.id)}
              >
                <View style={styles.calloutContainer}>
                  <ThemedText style={styles.calloutTitle}>{entry.title}</ThemedText>
                  <ThemedText style={styles.calloutPreview} numberOfLines={2}>
                    {entry.preview}
                  </ThemedText>
                  <ThemedText style={styles.calloutDate}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </ThemedText>
                  <TouchableOpacity style={styles.calloutAction}>
                    <ThemedText style={styles.calloutActionText}>View Entry</ThemedText>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
    margin: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#4b3621',
  },
  calloutPreview: {
    fontSize: 14,
    marginBottom: 4,
    color: '#4b3621',
  },
  calloutDate: {
    fontSize: 12,
    color: '#8a7866',
    marginBottom: 8,
  },
  calloutAction: {
    backgroundColor: '#f7c5a8',
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  calloutActionText: {
    color: '#4b3621',
    fontWeight: '600',
    fontSize: 12,
  },
});