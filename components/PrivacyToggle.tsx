import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Switch,
  ScrollView
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemedText } from './ThemedText';

interface PrivacyToggleProps {
  isProtected: boolean;
  onProtect: (password: string, useBiometrics: boolean) => Promise<void>;
  onUnprotect: (password: string) => Promise<void>;
  style?: any;
}

export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  isProtected,
  onProtect,
  onUnprotect,
  style
}) => {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Check biometrics availability on component mount
  React.useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.log('Biometrics not available:', error);
      setBiometricsAvailable(false);
    }
  };

  const handleToggle = () => {
    if (isProtected) {
      // If already protected, show unprotect modal
      setShowModal(true);
    } else {
      // If not protected, show protect modal
      setShowModal(true);
    }
  };

  const handleProtect = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onProtect(password, useBiometrics);
      setShowModal(false);
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Journal entry protected successfully');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to protect entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnprotect = async () => {
    if (!password) {
      Alert.alert('Password Required', 'Please enter the password to remove protection');
      return;
    }

    setIsLoading(true);
    try {
      await onUnprotect(password);
      setShowModal(false);
      setPassword('');
      Alert.alert('Success', 'Journal entry protection removed');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to remove protection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to protect this entry',
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        // Use a default password for biometric protection
        const biometricPassword = 'biometric_' + Date.now();
        await onProtect(biometricPassword, true);
        setShowModal(false);
        Alert.alert('Success', 'Journal entry protected with biometrics');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.toggleButton, isProtected && styles.protectedButton]}
        onPress={handleToggle}
        disabled={isLoading}
      >
        <Text style={[styles.lockIcon, isProtected && styles.protectedIcon]}>
          {isProtected ? '🔒' : '🔓'}
        </Text>
        <ThemedText style={[styles.toggleText, isProtected && styles.protectedText]}>
          {isProtected ? 'Protected' : 'Keep Private?'}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {isProtected ? 'Remove Protection' : 'Protect Journal Entry'}
            </ThemedText>

            <ScrollView style={styles.modalBody}>
              {!isProtected && (
                <>
                  <ThemedText style={styles.modalDescription}>
                    Add a password to keep this entry private. Only you will be able to access it.
                  </ThemedText>

                  {biometricsAvailable && (
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={handleBiometricAuth}
                    >
                      <Text style={styles.biometricIcon}>👆</Text>
                      <ThemedText style={styles.biometricText}>
                        Use Biometrics (Fingerprint/Face ID)
                      </ThemedText>
                    </TouchableOpacity>
                  )}

                  <View style={styles.divider}>
                    <ThemedText style={styles.dividerText}>OR</ThemedText>
                  </View>

                  <ThemedText style={styles.inputLabel}>Password (min 6 characters)</ThemedText>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <ThemedText style={styles.inputLabel}>Confirm Password</ThemedText>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <View style={styles.switchContainer}>
                    <ThemedText style={styles.switchLabel}>
                      Also allow biometric unlock
                    </ThemedText>
                    <Switch
                      value={useBiometrics}
                      onValueChange={setUseBiometrics}
                      disabled={!biometricsAvailable}
                    />
                  </View>
                </>
              )}

              {isProtected && (
                <>
                  <ThemedText style={styles.modalDescription}>
                    Enter the password to remove protection from this entry.
                  </ThemedText>

                  <ThemedText style={styles.inputLabel}>Password</ThemedText>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, isLoading && styles.disabledButton]}
                onPress={isProtected ? handleUnprotect : handleProtect}
                disabled={isLoading}
              >
                <ThemedText style={styles.confirmButtonText}>
                  {isLoading ? 'Processing...' : (isProtected ? 'Remove Protection' : 'Protect Entry')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  protectedButton: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
  },
  lockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  protectedIcon: {
    color: '#856404',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  protectedText: {
    color: '#856404',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  biometricIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  biometricText: {
    fontSize: 14,
    color: '#495057',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 