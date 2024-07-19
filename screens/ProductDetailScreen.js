import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product, storeName, distance, deliveryCost, deliveryTime, storeId } = route.params;
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState('0');
  const [customerToken, setCustomerToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = await AsyncStorage.getItem('customerToken');
        const id = await AsyncStorage.getItem('customer_id');
        console.log('Token:', token);
        console.log('Customer ID:', id);
        setCustomerToken(token);
        setCustomerId(id);
      } catch (error) {
        console.error('Failed to fetch customer data from AsyncStorage', error);
      }
    };

    fetchCustomerData();
  }, []);

  useEffect(() => {
    calculateTotalPrice(product.price, quantity);
  }, [product.price, quantity]);

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = async () => {
    try {
      if (!customerToken || !customerId) {
        Alert.alert('Error', 'Customer ID or token not found. Please login again.');
        return;
      }

      console.log('Adding to cart with customer ID:', customerId);

      const response = await axios.post('http://10.0.2.2:8000/api/cart/add', {
        customer_id: customerId,
        product_id: product.id,
        quantity: quantity,
        notes: additionalNotes,

      }, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
          Accept: 'application/json',
        }
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Product added to cart successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('StoreDetailsScreen', {
                storeId: storeId,
                distance: distance,
                deliveryCost: deliveryCost,
                deliveryTime: deliveryTime,
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add product to cart. Please try again.');
        console.log(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
      console.error(error.response ? error.response.data : error.message);
    }
  };

  const roundToNearest500 = (price) => {
    return Math.round(price / 500) * 500;
  };

  const calculateTotalPrice = (price, quantity) => {
    if (typeof price === 'number' && !isNaN(price)) {
      const roundedPrice = roundToNearest500(price);
      const totalPriceValue = (roundedPrice * quantity).toFixed(2).replace(/\.?0+$/, '');
      setTotalPrice(totalPriceValue);
    } else {
      setTotalPrice('0');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: `http://10.0.2.2:8000/products/${product.images}` }} style={styles.productImage} />
      
      <View style={styles.iconsContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="heart" size={20} color="#ff6347" />
        </TouchableOpacity>
        <View style={styles.storeContainer}>
          <Text style={styles.storeName}>{storeName}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#365D9B" style={styles.backIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        {product.price && (
          <Text style={styles.productPrice}>{roundToNearest500(product.price)} SYP</Text>
        )}
      </View>

      <View style={styles.additionalNotesContainer}>
        <Text style={styles.notesLabel}>ملاحظات إضافية</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={3}
          placeholder="اكتب ملاحظتك هنا..."
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
        />
      </View>

      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>الكمية:</Text>
        <View style={styles.quantityButtons}>
          <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {totalPrice !== '0' && (
        <View style={styles.totalPriceContainer}>
          <Text style={styles.totalPriceLabel}>السعر الإجمالي:</Text>
          <Text style={styles.totalPrice}>{totalPrice} SYP</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Text style={styles.addToCartButtonText}>أضف إلى السلة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  iconButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    backgroundColor: 'rgba(235, 235, 235, 0.6)',
    borderRadius: 10,
    color: '#000',
    textAlign: 'right',
    marginRight: 10,
  },
  backIcon: {
    marginLeft: 5,
  },
  productDetails: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
  },
  productDescription: {
    fontSize: 16,
    color: '#777',
    marginBottom: 10,
    textAlign: 'right',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  additionalNotesContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  notesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
  },
  notesInput: {
    fontSize: 14,
    color: '#555',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    textAlignVertical: 'top',
  },
  quantityContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  quantityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
  },
  totalPriceContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addToCartButton: {
    backgroundColor: '#365D9B',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  addToCartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ProductDetailScreen;
