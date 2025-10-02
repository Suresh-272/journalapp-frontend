import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { ThemedText } from './ThemedText';

interface IOSStylePrivacyToggleProps {
  isProtected: boolean;
  onProtect: (password: string) => Promise<void>;
  onUnprotect: (password: string) => Promise<void>;
  style?: any;
  theme?: any;
}

export const IOSStylePrivacyToggle: React.FC<IOSStylePrivacyToggleProps> = ({
  isProtected,
  onProtect,
  onUnprotect,
  style,
  theme
}) => {
  // Default brown theme if not provided
  const defaultTheme = {
    primary: '#A9745A',
    background: '#F5EDE1',
    cardBackground: '#FFFFFF',
    text: '#4B2E2A',
    textSecondary: '#8B5E3C',
    border: '#D4C0A8',
    highlight: '#F0E6D7',
    shadow: 'rgba(75, 46, 42, 0.15)',
  };
  
  const currentTheme = theme || defaultTheme;
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isProtecting, setIsProtecting] = useState(false);

  const handleToggle = () => {
    if (isProtected) {
      // If already protected, show unprotect prompt
      if (Platform.OS === 'ios') {
        showUnprotectPrompt();
      } else {
        setIsProtecting(false);
        setPassword('');
        setShowPasswordModal(true);
      }
    } else {
      // If not protected, show password protect prompt
      if (Platform.OS === 'ios') {
        showPasswordProtectPrompt();
      } else {
        setIsProtecting(true);
        setPassword('');
        setShowPasswordModal(true);
      }
    }
  };

  const showPasswordProtectPrompt = () => {
    Alert.prompt(
      'Protect Journal Entry',
      'Enter a password to protect this entry (minimum 6 characters):',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Protect', 
          onPress: async (password) => {
            if (password && password.length >= 6) {
              setIsLoading(true);
              try {
                await onProtect(password);
                Alert.alert('Success', 'Journal entry protected successfully');
              } catch (error: any) {
                Alert.alert('Error', error.error || 'Failed to protect entry');
              } finally {
                setIsLoading(false);
              }
            } else {
              Alert.alert('Error', 'Password must be at least 6 characters long');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const showUnprotectPrompt = () => {
    Alert.prompt(
      'Remove Protection',
      'Enter the password to remove protection from this entry:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove Protection', 
          onPress: async (password) => {
            if (password && password.length > 0) {
              setIsLoading(true);
              try {
                await onUnprotect(password);
                Alert.alert('Success', 'Journal entry protection removed');
              } catch (error: any) {
                Alert.alert('Error', error.error || 'Failed to remove protection');
              } finally {
                setIsLoading(false);
              }
            } else {
              Alert.alert('Error', 'Password is required');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleModalSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    if (isProtecting && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      if (isProtecting) {
        await onProtect(password);
        Alert.alert('Success', 'Journal entry protected successfully');
      } else {
        await onUnprotect(password);
        Alert.alert('Success', 'Journal entry protection removed');
      }
      setShowPasswordModal(false);
      setPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.error || `Failed to ${isProtecting ? 'protect' : 'unprotect'} entry`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
  };


  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.toggleButton, 
          { 
            backgroundColor: isProtected ? currentTheme.highlight : currentTheme.cardBackground,
            borderColor: isProtected ? currentTheme.primary : currentTheme.border,
          }
        ]}
        onPress={handleToggle}
        disabled={isLoading}
      >
        <Text style={[styles.lockIcon, { color: isProtected ? currentTheme.primary : currentTheme.textSecondary }]}>
          {isProtected ? '🔒' : '🔓'}
        </Text>
        <ThemedText style={[
          styles.toggleText, 
          { color: isProtected ? currentTheme.primary : currentTheme.textSecondary }
        ]}>
          {isProtected ? 'Protected' : 'Public'}
        </ThemedText>
      </TouchableOpacity>

      {/* Android Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <ThemedText type="subtitle" style={[styles.modalTitle, { color: currentTheme.text }]}>
              {isProtecting ? 'Protect Journal Entry' : 'Remove Protection'}
            </ThemedText>
            
            <ThemedText style={[styles.modalDescription, { color: currentTheme.textSecondary }]}>
              {isProtecting 
                ? 'Enter a password to protect this entry (minimum 6 characters):'
                : 'Enter the password to remove protection from this entry:'
              }
            </ThemedText>

            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: currentTheme.highlight,
                  borderColor: currentTheme.border,
                  color: currentTheme.text,
                }
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={currentTheme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  { backgroundColor: currentTheme.border }
                ]}
                onPress={handleModalCancel}
                disabled={isLoading}
              >
                <ThemedText style={[styles.cancelButtonText, { color: currentTheme.text }]}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  { backgroundColor: isLoading ? currentTheme.border : currentTheme.primary }
                ]}
                onPress={handleModalSubmit}
                disabled={isLoading}
              >
                <ThemedText style={styles.confirmButtonText}>
                  {isLoading ? 'Processing...' : (isProtecting ? 'Protect' : 'Remove Protection')}
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
    borderWidth: 1,
  },
  lockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

