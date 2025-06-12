import React from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MarketplaceScreen() {
  // Sample categories
  const categories = [
    { id: 1, name: 'Vegetables', icon: 'leaf.fill' },
    { id: 2, name: 'Fruits', icon: 'flame.fill' },
    { id: 3, name: 'Grains', icon: 'drop.fill' },
    { id: 4, name: 'Dairy', icon: 'bolt.fill' },
  ];

  // Sample products
  const products = [
    { id: 1, name: 'Organic Tomatoes', price: '₹60/kg', rating: 4.5, image: require('@/assets/images/partial-react-logo.png') },
    { id: 2, name: 'Fresh Carrots', price: '₹40/kg', rating: 4.2, image: require('@/assets/images/partial-react-logo.png') },
    { id: 3, name: 'Green Spinach', price: '₹30/bunch', rating: 4.7, image: require('@/assets/images/partial-react-logo.png') },
    { id: 4, name: 'Red Onions', price: '₹35/kg', rating: 4.0, image: require('@/assets/images/partial-react-logo.png') },
    { id: 5, name: 'Potatoes', price: '₹25/kg', rating: 4.3, image: require('@/assets/images/partial-react-logo.png') },
    { id: 6, name: 'Cauliflower', price: '₹45/piece', rating: 4.1, image: require('@/assets/images/partial-react-logo.png') },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Marketplace</ThemedText>
        <TouchableOpacity>
          <IconSymbol name="cart.fill" size={24} color="#53B175" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#7C7C7C" />
          <TextInput 
            placeholder="Search for products" 
            style={styles.searchInput} 
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <IconSymbol name="slider.horizontal.3" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryIcon}>
              <IconSymbol name={category.icon} size={20} color="#53B175" />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.productsContainer}>
        <View style={styles.productsGrid}>
          {products.map(product => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              <Image source={product.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.ratingContainer}>
                  <IconSymbol name="star.fill" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  <TouchableOpacity style={styles.addButton}>
                    <IconSymbol name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#53B175',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#181725',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#F2F3F2',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#181725',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#7C7C7C',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#53B175',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#53B175',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});