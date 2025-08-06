// app/(splash)/index.tsx
import { useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);

  useEffect(() => {
    // Enhanced animation sequence
    Animated.sequence([
      // Fade in logo
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Fade in text after logo
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1200),
    ]).start(() => {
      // Navigate to login screen after animation
      router.replace('/(auth)/login');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: logoOpacity, alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/LOGO.jpg')}
          style={styles.logo}
        />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        {/* <Text style={styles.text}>M</Text> */}
        <Text style={styles.tagline}>Log it, Love it, Relive it</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8', // Warm cream/beige background like Squarespace
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    // Warm brown shadow to match the theme
    shadowColor: '#B8956A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B8956A', // Warm brown/tan color matching Squarespace buttons
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#6B5B4F', // Darker brown for better readability on light background
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});