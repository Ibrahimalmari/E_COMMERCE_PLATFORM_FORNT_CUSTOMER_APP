import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // استيراد مكتبة الموقع

const CartScreen = ({ route, navigation }) => {
  const { deliveryCost, deliveryTime, storeId } = route.params || {};

  const [customerId, setCustomerId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [calculatedDeliveryCost, setCalculatedDeliveryCost] = useState(deliveryCost || 0);

  useEffect(() => {
    retrieveCustomerId();
  }, []);

  useEffect(() => {
    if (customerId && storeId) {
      fetchCartItems(customerId, storeId);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    if (!deliveryCost && storeId) {
      calculateDeliveryCost(storeId);
    }
  }, [storeId]);

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
    setLoading(true);
    try {
      const response = await axios.get(`http://10.0.2.2:8000/api/customer/cart/${customerId}/${storeId}`);
      if (response.data.cart) {
        console.log('Cart items fetched:', response.data.cart);
        setCartItems(response.data.cart);
        calculateTotalPrice(response.data.cart);
        initializeItemQuantities(response.data.cart);
        setStoreName(response.data.store_name || '');
      } else {
        console.error('No cart data returned');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
    setLoading(false);
  };

  const calculateTotalPrice = (cartItems) => {
    const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    setTotalPrice(total);
  };

  const initializeItemQuantities = (cartItems) => {
    const quantities = {};
    cartItems.forEach(item => {
      quantities[item.id] = item.quantity;
    });
    setItemQuantities(quantities);
  };

  const calculateDeliveryCost = async (storeId) => {
    try {
      // الحصول على إحداثيات الموقع الحالي للمستخدم
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({});
      const userLatitude = userLocation.coords.latitude;
      const userLongitude = userLocation.coords.longitude;

      // جلب إحداثيات المتجر
      const response = await axios.get(`http://10.0.2.2:8000/api/store/getStoreAddress/${storeId}`);
      const storeLatitude = response.data.store.latitude;
      const storeLongitude = response.data.store.longitude;

      // حساب المسافة بين المستخدم والمتجر باستخدام صيغة هافرسين
      const distance = calculateDistance(userLatitude, userLongitude, storeLatitude, storeLongitude);

      // حساب تكلفة التوصيل (كل كيلومتر = 4000)
      const cost = distance * 4000;
      setCalculatedDeliveryCost(cost);
      console.log(distance)
      console.log(calculatedDeliveryCost)

    } catch (error) {
      console.error('Error calculating delivery cost:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // المسافة بالكيلومترات
    return distance;
  };

  const incrementQuantity = async (itemId) => {
    const updatedQuantities = { ...itemQuantities };
    updatedQuantities[itemId]++;
    setItemQuantities(updatedQuantities);
    try {
      await axios.post(`http://10.0.2.2:8000/api/cart/update-quantity/${itemId}`, {
        quantity: updatedQuantities[itemId]
      });
      const updatedCart = cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: updatedQuantities[itemId] } : item
      );
      setCartItems(updatedCart);
      calculateTotalPrice(updatedCart);
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
        await axios.post(`http://10.0.2.2:8000/api/cart/update-quantity/${itemId}`, {
          quantity: updatedQuantities[itemId]
        });
        const updatedCart = cartItems.map(item =>
          item.id === itemId ? { ...item, quantity: updatedQuantities[itemId] } : item
        );
        setCartItems(updatedCart);
        calculateTotalPrice(updatedCart);
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`http://10.0.2.2:8000/api/cart/remove-item/${itemId}`);
      console.log('Item removed successfully');
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
    navigation.navigate('CheckoutScreen', { cartItems, totalPrice, deliveryCost: calculatedDeliveryCost, deliveryTime });
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
        <Text style={styles.itemPrice}>{roundToNearest500(item.product.price * item.quantity)} SYP</Text>
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#365D9B" />
          <Text style={styles.loadingText}>جاري تحميل سلة التسوق...</Text>
        </View>
      ) : (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#365D9B',
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
});

export default CartScreen;
