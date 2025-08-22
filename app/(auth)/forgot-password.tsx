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
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api';

export default function ForgotPassword() {
  const [mobileno, setMobileno] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: mobile input, 2: token input, 3: new password
  const router = useRouter();

  const handleRequestReset = async () => {
    // Validation
    if (!mobileno || mobileno === '+91') {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    // Basic mobile number validation
    const mobilePattern = /^\+91[6-9]\d{9}$/;
    if (!mobilePattern.test(mobileno)) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgotpassword', {
        mobileno: mobileno.trim()
      });

      if (response.data.success) {
        Alert.alert(
          'Reset Token Sent',
          `Your reset token is: ${response.data.resetToken}\n\nPlease use this token to reset your password.`,
          [
            {
              text: 'OK',
              onPress: () => setStep(2)
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.error || 'Failed to send reset token');
      }
    } catch (error) {
      console.error('Forgot Password Error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.error || 
                     error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!resetToken.trim()) {
      Alert.alert('Error', 'Please enter the reset token');
      return;
    }

    setStep(3);
  };

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.put(`/auth/resetpassword/${resetToken}`, {
        password: newPassword
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully! You can now login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset Password Error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.error || 
                     error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Step 1: Enter Mobile Number</Text>
      <Text style={styles.stepDescription}>
        Enter your registered mobile number to receive a reset token.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your mobile number"
          placeholderTextColor="#8B7355"
          value={mobileno}
          onChangeText={setMobileno}
          keyboardType="phone-pad"
          maxLength={13}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleRequestReset}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Sending...' : 'Send Reset Token'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Step 2: Enter Reset Token</Text>
      <Text style={styles.stepDescription}>
        Enter the reset token sent to your mobile number.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Reset Token</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter reset token"
          placeholderTextColor="#8B7355"
          value={resetToken}
          onChangeText={setResetToken}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleVerifyToken}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Verifying...' : 'Verify Token'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Step 3: Set New Password</Text>
      <Text style={styles.stepDescription}>
        Enter your new password.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#8B7355"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#8B7355"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo-final.jpg')}
            style={styles.logo}
          />
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
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
    shadowColor: '#B8956A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3D3D3D',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B5B4F',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D3D3D',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B5B4F',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#3D3D3D',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    color: '#3D3D3D',
    borderWidth: 1,
    borderColor: '#D4C4B0',
    shadowColor: '#B8956A',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: '#B8956A',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#B8956A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#D4C4B0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#6B5B4F',
    fontSize: 16,
  },
  footerLink: {
    color: '#B8956A',
    fontSize: 16,
    fontWeight: '600',
  },
});
