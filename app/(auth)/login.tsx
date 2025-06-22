import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api'; // Axios instance

export default function Login() {
  const [mobileno, setMobileno] = useState('+91');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    // Validation
    if (!mobileno || mobileno === '+91' || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic mobile number validation (adjust pattern as needed)
    const mobilePattern = /^\+91[6-9]\d{9}$/;
    if (!mobilePattern.test(mobileno)) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        mobileno: mobileno.trim(),
        password: password.trim()
      });

      // Handle successful response
      if (response.data.success && response.data.token) {
        // Store token
        await AsyncStorage.setItem('userToken', response.data.token);
        
        // Store user data if available
        if (response.data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        
        console.log('Login Success. Token saved.');
        
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Invalid response from server');
      }
    } catch (error) {
      console.error('Login Error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || 
                     error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo-m2.jpg')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to My Journal</Text>
          <Text style={styles.subtitle}>Login to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              value={mobileno}
              onChangeText={setMobileno}
              keyboardType="phone-pad"
              maxLength={13} // +91 + 10 digits
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#181725',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7C7C7C',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#181725',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#181725',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#53B175',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#53B175',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A8E4BD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#7C7C7C',
    fontSize: 16,
  },
  footerLink: {
    color: '#53B175',
    fontSize: 16,
    fontWeight: '600',
  },
});
