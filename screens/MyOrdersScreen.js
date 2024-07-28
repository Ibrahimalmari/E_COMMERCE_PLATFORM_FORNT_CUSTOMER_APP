import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MyOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('customerToken');

        const response = await axios.get('http://10.0.2.2:8000/api/ForShowMyOrderToCustomer', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.success) {
          setOrders(response.data.orders);
        } else {
          console.error('Failed to fetch orders');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }) => {
    const { cart, order_status, created_at } = item;
    const store = cart.items[0].product.store;
    const imageUrl = `http://10.0.2.2:8000/stores/${store.coverPhoto.split('.')[0]}`;

    return (
      <View style={styles.orderContainer}>
        <View style={styles.orderHeader}>
          <Image source={{ uri: imageUrl }} style={styles.storeImage} />
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.orderNumber}>رقم الطلب #{item.order_numbers}</Text>
            <Text style={styles.orderDate}>{new Date(created_at).toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.separator} />
        {cart.items.map((cartItem, index) => (
          <View key={index} style={styles.productContainer}>
            <Text style={styles.productQuantity}>الكمية: {cartItem.quantity}</Text>
            <Text style={styles.productPrice}>السعر: {cartItem.product.price} ل.س</Text>
            <Text style={styles.orderStatus}>الحالة: {order_status}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.container}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ea',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
  },
  orderContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between', // Add this line
  },
  storeImage: {
    width: 50, // Increased size
    height: 50, // Increased size
    borderRadius: 25, // Adjusted for larger size
    marginLeft: 8, // Adjusted for RTL layout
  },
  storeInfo: {
    flex: 1,
    marginRight: 8, // Adjusted for RTL layout
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderInfo: {
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  productContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productQuantity: {
    fontSize: 14,
  },
  productPrice: {
    fontSize: 14,
  },
  orderStatus: {
    fontSize: 14,
    color: '#6200ea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyOrdersScreen;
