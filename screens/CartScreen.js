import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartScreen = ({ route, navigation }) => {
  const { deliveryCost, deliveryTime, storeId } = route.params;

  const [customerId, setCustomerId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [loading, setLoading] = useState(true); // إضافة حالة التحميل

  useEffect(() => {
    retrieveCustomerId();
  }, []);

  useEffect(() => {
    if (customerId && storeId) {
      fetchCartItems(customerId, storeId);
    }
  }, [customerId, storeId]);

  const retrieveCustomerId = async () => {
    try {
      const storedCustomerId = await AsyncStorage.getItem('customer_id');
      if (storedCustomerId) {
        setCustomerId(storedCustomerId);
      } else {
        console.log('No customerId stored');
      }
    } catch (error) {
      console.error('Error retrieving customerId:', error);
    }
  };

  const fetchCartItems = async (customerId, storeId) => {
    setLoading(true); // بدء التحميل
    try {
      const response = await axios.get(`http://10.0.2.2:8000/api/customer/cart/${customerId}/${storeId}`);
      if (response.data.cart) {
        console.log('Cart items fetched:', response.data.cart);
        setCartItems(response.data.cart);
        calculateTotalPrice(response.data.cart);
        initializeItemQuantities(response.data.cart);
        setStoreName(response.data.store_name || ''); // Ensure storeName is set
      } else {
        console.error('No cart data returned');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false); // انتهاء التحميل
    }
  };

  const calculateTotalPrice = (cartItems) => {
    const total = cartItems.reduce((acc, item) => acc + item.items_price, 0);
    setTotalPrice(total);
  };

  const initializeItemQuantities = (cartItems) => {
    const quantities = {};
    cartItems.forEach(item => {
      quantities[item.id] = item.quantity;
    });
    setItemQuantities(quantities);
  };

  const incrementQuantity = async (itemId) => {
    const updatedQuantities = { ...itemQuantities };
    updatedQuantities[itemId]++;
    setItemQuantities(updatedQuantities);
    try {
      const response = await axios.post(`http://10.0.2.2:8000/api/cart/update-quantity/${itemId}`, {
        quantity: updatedQuantities[itemId]
      });
      console.log('Quantity updated successfully:', response.data.message);
      fetchCartItems(customerId, storeId);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const decrementQuantity = async (itemId) => {
    const updatedQuantities = { ...itemQuantities };
    if (updatedQuantities[itemId] > 1) {
      updatedQuantities[itemId]--;
      setItemQuantities(updatedQuantities);
      try {
        const response = await axios.post(`http://10.0.2.2:8000/api/cart/update-quantity/${itemId}`, {
          quantity: updatedQuantities[itemId]
        });
        console.log('Quantity updated successfully:', response.data.message);
        fetchCartItems(customerId, storeId);
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await axios.delete(`http://10.0.2.2:8000/api/cart/remove-item/${itemId}`);
      console.log('Item removed successfully:', response.data.message);
      const updatedCart = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedCart);
      const updatedQuantities = { ...itemQuantities };
      delete updatedQuantities[itemId];
      setItemQuantities(updatedQuantities);
      calculateTotalPrice(updatedCart);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const navigateToCheckout = () => {
    navigation.navigate('CheckoutScreen', { cartItems, totalPrice, deliveryCost, deliveryTime });
  };

  const roundToNearest500 = (price) => {
    return Math.ceil(price / 500) * 500;
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: `http://10.0.2.2:8000/products/${item.product.images}` }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.storeName}>{item.product.store_name}</Text>
        <Text style={styles.itemPrice}>{roundToNearest500(item.product.price)} SYP</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.quantityButton} onPress={() => decrementQuantity(item.id)}>
          <FontAwesome name="minus" size={16} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{itemQuantities[item.id]}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={() => incrementQuantity(item.id)}>
          <FontAwesome name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      {itemQuantities[item.id] === 1 && (
        <TouchableOpacity style={styles.removeItemButton} onPress={() => removeItem(item.id)}>
          <FontAwesome name="trash" size={20} color="#365D9B" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365D9B" style={styles.loader} />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      )}
      
      {!loading && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome name="arrow-left" size={24} color="#365D9B" />
            </TouchableOpacity>
            <Text style={styles.backButtonText}>عودة إلى المتجر</Text>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>سلة التسوق</Text>
              <Text style={styles.headerStoreName}>{storeName}</Text>
            </View>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={() => (
              <Text style={styles.emptyCartText}>سلة التسوق فارغة.</Text>
            )}
          />

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>الإجمالي: {roundToNearest500(totalPrice)} SYP</Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={navigateToCheckout}>
              <Text style={styles.checkoutButtonText}>الدفع</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButtonText: {
    color: '#365D9B',
    fontSize: 16,
    marginLeft: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#365D9B',
  },
  headerStoreName: {
    fontSize: 16,
    color: '#999',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    marginLeft: 10,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemPrice: {
    color: '#365D9B',
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#365D9B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 5,
  },
  removeItemButton: {
    marginLeft: 'auto',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#365D9B',
  },
  checkoutButton: {
    backgroundColor: '#365D9B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCartText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  storeName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#365D9B',
    fontWeight: 'bold',
  },
});

export default CartScreen;
