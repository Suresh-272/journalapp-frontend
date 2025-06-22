import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View, Text, ScrollView } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  // Sample data for featured products
  const featuredProducts = [
    { id: 1, name: 'Organic Tomatoes', price: '₹60/kg', image: require('@/assets/images/partial-react-logo.png') },
    { id: 2, name: 'Fresh Carrots', price: '₹40/kg', image: require('@/assets/images/partial-react-logo.png') },
    { id: 3, name: 'Green Spinach', price: '₹30/bunch', image: require('@/assets/images/partial-react-logo.png') },
  ];

  // Sample data for nearby farmers
  const nearbyFarmers = [
    { id: 1, name: 'Rajesh Kumar', distance: '2.5 km', image: require('@/assets/images/partial-react-logo.png') },
    { id: 2, name: 'Anita Singh', distance: '3.8 km', image: require('@/assets/images/partial-react-logo.png') },
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.headerImage}
        />
      }>
      {/* <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#7C7C7C" />
          <TextInput 
            placeholder="Search for products or farmers" 
            style={styles.searchInput} 
          />
        </View>
      </View> */}

      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="title">Welcome to M!</ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>Memory Journal</ThemedText>
      </ThemedView>

      {/* <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Featured Products</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </View> */}
        
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
          {featuredProducts.map(product => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <Image source={product.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productPrice}>{product.price}</ThemedText>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <IconSymbol name="plus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView> */}
      {/* </ThemedView> */}

      {/* <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Nearby Farmers</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {nearbyFarmers.map(farmer => (
          <TouchableOpacity key={farmer.id} style={styles.farmerCard}>
            <Image source={farmer.image} style={styles.farmerImage} />
            <View style={styles.farmerInfo}>
              <ThemedText style={styles.farmerName}>{farmer.name}</ThemedText>
              <ThemedText style={styles.farmerDistance}>{farmer.distance}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#7C7C7C" />
          </TouchableOpacity>
        ))}
      </ThemedView> */}

      {/* <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Seasonal Highlights</ThemedText>
        <TouchableOpacity style={styles.seasonalBanner}>
          <ThemedText style={styles.seasonalText}>Summer Harvest Special</ThemedText>
          <ThemedText style={styles.seasonalSubtext}>Discover fresh summer produce</ThemedText>
        </TouchableOpacity>
      </ThemedView> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeSubtitle: {
    color: '#7C7C7C',
    marginTop: 5,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    color: '#53B175',
    fontWeight: '500',
  },
  productsScroll: {
    marginLeft: -5,
  },
  productCard: {
    width: 150,
    marginHorizontal: 5,
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E5E5',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontWeight: '500',
    marginBottom: 5,
  },
  productPrice: {
    color: '#53B175',
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#53B175',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  farmerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5E5',
  },
  farmerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  farmerName: {
    fontWeight: '500',
    marginBottom: 5,
  },
  farmerDistance: {
    color: '#7C7C7C',
    fontSize: 14,
  },
  seasonalBanner: {
    backgroundColor: '#A1CEDC',
    borderRadius: 15,
    padding: 20,
  },
  seasonalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  seasonalSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
