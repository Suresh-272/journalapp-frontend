import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api'; // Axios instance
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileno, setMobileno] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const fullMobileNo = `+91${mobileno}`;

    if (!name || !email || !password || mobileno.length !== 10) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const mobilePattern = /^\+91[6-9]\d{9}$/;
    if (!mobilePattern.test(fullMobileNo)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        mobileno: fullMobileNo,
        password
      });

      if (response.data.success && response.data.token) {
        const { token } = response.data;

        await AsyncStorage.setItem('userToken', token);

        if (response.data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        console.log('Registration successful');

        Alert.alert('Success', 'Account created successfully', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Registration Failed', 'Invalid response from server');
      }
    } catch (error) {
      console.error('Registration Error:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      if (error?.response) {
        errorMessage = error.response?.data?.error ||
                       error.response?.data?.message ||
                       `Server error: ${error.response.status}`;
      } else if (error?.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo-m2.jpg')}
            style={styles.headerLogo}
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join My Journal</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>+91</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter 10-digit number"
                value={mobileno}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                  setMobileno(cleaned);
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Log In</Text>
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
    marginTop: 40,
    marginBottom: 30,
  },
  headerLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 15,
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
  userTypeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  userTypeButton: {
    flex: 1,
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#53B175',
  },
  userTypeText: {
    fontSize: 16,
    color: '#181725',
    fontWeight: '500',
  },
  userTypeTextActive: {
    color: '#FFF',
  },
  button: {
    backgroundColor: '#53B175',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
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
    marginBottom: 30,
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
