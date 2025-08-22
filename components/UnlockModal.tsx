import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface UnlockModalProps {
  visible: boolean;
  onUnlock: (password: string, useBiometrics: boolean) => Promise<void>;
  onCancel: () => void;
  entryTitle: string;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  visible,
  onUnlock,
  onCancel,
  entryTitle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Check biometrics availability on component mount
  React.useEffect(() => {
    checkBiometrics();
  }, []);

  // Show password prompt when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      showPasswordPrompt();
    }
  }, [visible]);

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

  const showPasswordPrompt = () => {
    // Show biometric option first if available
    if (biometricsAvailable) {
      Alert.alert(
        'Unlock Protected Entry',
        `"${entryTitle}"\n\nThis entry is protected. Choose your authentication method:`,
        [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          { 
            text: 'Use Biometrics', 
            onPress: handleBiometricUnlock
          },
          { 
            text: 'Enter Password', 
            onPress: showPasswordInput
          }
        ]
      );
    } else {
      showPasswordInput();
    }
  };

  const showPasswordInput = () => {
    Alert.prompt(
      'Unlock Protected Entry',
      `"${entryTitle}"\n\nEnter the password to unlock this entry:`,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { 
          text: 'Unlock', 
          onPress: async (password) => {
            if (password && password.length > 0) {
              setIsLoading(true);
              try {
                await onUnlock(password, false);
              } catch (error: any) {
                Alert.alert('Error', error.error || 'Failed to unlock entry');
                // Show password prompt again on error
                setTimeout(() => showPasswordInput(), 500);
              } finally {
                setIsLoading(false);
              }
            } else {
              Alert.alert('Error', 'Password is required');
              // Show password prompt again
              setTimeout(() => showPasswordInput(), 500);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleBiometricUnlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock this entry',
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        setIsLoading(true);
        try {
          await onUnlock('', true);
        } catch (error: any) {
          Alert.alert('Error', error.error || 'Failed to unlock entry');
          // Show password prompt on biometric failure
          setTimeout(() => showPasswordInput(), 500);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Show password prompt if biometric fails
        setTimeout(() => showPasswordInput(), 500);
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
      // Show password prompt on error
      setTimeout(() => showPasswordInput(), 500);
    }
  };

  // Since we're using Alert.prompt, we don't need to render a modal
  // The modal is kept for compatibility but will be invisible
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.hiddenModal}>
        {/* This modal is hidden since we're using Alert.prompt */}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  hiddenModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },

}); 