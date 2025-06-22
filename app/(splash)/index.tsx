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
          source={require('../../assets/images/logo-m2.jpg')}
          style={styles.logo}
        />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        {/* <Text style={styles.text}>M</Text> */}
        <Text style={styles.tagline}>My journal app</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#53B175',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#7C7C7C',
    textAlign: 'center',
    marginTop: 8,
  },
});