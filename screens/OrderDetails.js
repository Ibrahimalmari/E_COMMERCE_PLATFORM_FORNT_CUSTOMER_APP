import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const OrderDetails = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('customerToken');
        const response = await axios.get(`http://10.0.2.2:8000/api/OrderDetails/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.data.success) {
          setOrderDetails(response.data.order);
        } else {
          console.error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleReorder = async () => {
    try {
      const token = await AsyncStorage.getItem('customerToken');
      const customerId = await AsyncStorage.getItem('customer_id');
  
      if (!customerId) {
        Alert.alert('خطأ', 'لم يتم العثور على معرف العميل');
        return;
      }
  
      const orderItems = orderDetails.cart.items.map(item => ({
        customer_id: customerId,
        product_id: item.product.id,
        quantity: item.quantity,
        store_id: item.product.store.id,
      }));
  
      console.log('Data to be sent:', { items: orderItems });
  
      const response = await axios.post(
        'http://10.0.2.2:8000/api/CartAddDuringReOrder',
        { items: orderItems },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );
  
      console.log('API Response:', response.data);
  
      // التحقق من النجاح بناءً على الاستجابة
      if (response.data.message === 'Products added to cart successfully!') {
        // افترض أنك تحصل على deliveryCost و deliveryTime و storeId من orderDetails
        const { delivery_cost, delivery_time, store_id } = orderDetails; // تأكد من أن هذه القيم موجودة في orderDetails
        
        Alert.alert('نجاح', 'تمت إضافة الطلب إلى السلة بنجاح', [
          {
            text: 'موافق',
            onPress: () => navigation.navigate('CartScreen', {
              deliveryCost: delivery_cost,
              deliveryTime: delivery_time,
              storeId: store_id,
            }),
          },
        ]);
      } else {
        Alert.alert('خطأ', response.data.message || 'فشلت عملية إضافة الطلب إلى السلة');
      }
    } catch (error) {
      console.log('Error Details:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء إضافة الطلب إلى السلة';
      Alert.alert('خطأ', errorMessage);
    }
  };
  
  
  
  
  
  

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  if (!orderDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Order details not found.</Text>
      </View>
    );
  }

  const roundToNearest500 = (num) => {
    return Math.round(num / 500) * 500;
  };

  // Destructure order details
  const { cart, invoice_amount, discount, tax, delivery_fee, order_status } = orderDetails;

  // Calculate final total
  const final_total = invoice_amount - discount + tax + delivery_fee;

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>طلبك</Text>
        {cart.items.map((cartItem, index) => (
          <View key={index} style={styles.productContainer}>
            <Image source={{ uri: `http://10.0.2.2:8000/products/${cartItem.product.images}` }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{cartItem.product.name}</Text>
              <Text style={styles.productPrice}>{roundToNearest500(cartItem.product.price)} ل.س</Text>
              <Text style={styles.productQuantity}>الكمية: {cartItem.quantity}</Text>
            </View>
          </View>
        ))}
        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>تفاصيل الفاتورة</Text>
        <View style={styles.billDetails}>
          <Text style={styles.billItem}>المبلغ الإجمالي: {roundToNearest500(invoice_amount)} ل.س</Text>
          <Text style={styles.billItem}>قيمة الحسم: {roundToNearest500(discount)} ل.س</Text>
          <Text style={styles.billItem}>الضريبة: {roundToNearest500(tax)} ل.س</Text>
          <Text style={styles.billItem}>قيمة التوصيل: {roundToNearest500(delivery_fee)} ل.س</Text>
          <Text style={styles.billItemTotal}>المجموع النهائي: {roundToNearest500(final_total)} ل.س</Text>
        </View>
        {order_status === 'تم تسليم الطلب' && (
          <TouchableOpacity onPress={handleReorder} style={styles.reorderButton}>
            <Text style={styles.reorderButtonText}>إعادة الطلب</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 16,
  },
  productInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  billDetails: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  billItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  billItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#6200ea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#6200ea',
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetails;
