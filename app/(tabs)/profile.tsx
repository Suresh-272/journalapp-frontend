import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Navigate to login screen
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Profile</ThemedText>
        <TouchableOpacity>
          <IconSymbol name="gear" size={24} color="#181725" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileName}>Rahul Sharma</ThemedText>
          <ThemedText style={styles.profileEmail}>rahul.sharma@example.com</ThemedText>
          <TouchableOpacity style={styles.editButton}>
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="bag.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>My Orders</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="heart.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>My Favorites</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="location.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>Delivery Addresses</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="creditcard.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>Payment Methods</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="bell.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>Notifications</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <IconSymbol name="questionmark.circle.fill" size={20} color="#53B175" />
          </View>
          <ThemedText style={styles.menuText}>Help & Support</ThemedText>
          <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="arrow.right.square.fill" size={20} color="#F75555" />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5E5',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    color: '#7C7C7C',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#F2F3F2',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#53B175',
    fontWeight: '500',
    fontSize: 14,
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F2',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 20,
  },
  logoutText: {
    color: '#F75555',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
});