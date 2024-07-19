import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';

const CheckoutScreen = ({ route, navigation }) => {
  const { cartItems, totalPrice } = route.params;
  const [addresses, setAddresses] = useState([]);
  const [customerToken, setCustomerToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('الدفع عند الاستلام');

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
    if (customerId && customerToken) {
      fetchAddresses();
    }
  }, [customerId, customerToken]);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`http://10.0.2.2:8000/api/addresses/${customerId}`, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });
      console.log('Addresses:', response.data.addresses); // Log addresses data
      setAddresses(response.data.addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const toggleDeliveryOption = (option) => {
    // Toggle the selected delivery option
    if (selectedDeliveryOptions.includes(option)) {
      setSelectedDeliveryOptions(selectedDeliveryOptions.filter((item) => item !== option));
    } else {
      setSelectedDeliveryOptions([...selectedDeliveryOptions, option]);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#365D9B" />
        </TouchableOpacity>
        <Text style={styles.backButtonText}>عودة للسلة</Text>
      </View>

      {addresses.map((address) => (
        <View key={address.id} style={styles.addressContainer}>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>المنطقة: {address.area}</Text>
            <Text style={styles.addressText}>الشارع: {address.street}</Text>
            <Text style={styles.addressText}>القريب من: {address.nearBy}</Text>
            <Text style={styles.addressText}>تفاصيل إضافية: {address.additionalDetails}</Text>
            <Text style={styles.addressText}>الطابق: {address.floor}</Text>
          </View>
          {address.latitude && address.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(address.latitude),
                  longitude: parseFloat(address.longitude),
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                pointerEvents="none" // تجعل الخريطة غير قابلة للتعديل
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(address.latitude),
                    longitude: parseFloat(address.longitude),
                  }}
                  title="موقع العنوان"
                />
              </MapView>
            </View>
          )}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معلومات التوصيل</Text>
        <View style={styles.deliveryOptions}>
          <TouchableOpacity
            style={[
              styles.deliveryOptionButton,
              selectedDeliveryOptions.includes('إذا الطلب غير متوفر استبدله بديل له') && styles.selectedDeliveryOption,
            ]}
            onPress={() => toggleDeliveryOption('إذا الطلب غير متوفر استبدله بديل له')}
          >
            <View style={styles.checkbox}>
              {selectedDeliveryOptions.includes('إذا الطلب غير متوفر استبدله بديل له') && (
                <FontAwesome name="check" size={18} color="#365D9B" />
              )}
            </View>
            <Text style={styles.deliveryOptionText}>إذا الطلب غير متوفر استبدله بديل له</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deliveryOptionButton,
              selectedDeliveryOptions.includes('لا تقرع الجرس') && styles.selectedDeliveryOption,
            ]}
            onPress={() => toggleDeliveryOption('لا تقرع الجرس')}
          >
            <View style={styles.checkbox}>
              {selectedDeliveryOptions.includes('لا تقرع الجرس') && <FontAwesome name="check" size={18} color="#365D9B" />}
            </View>
            <Text style={styles.deliveryOptionText}>لا تقرع الجرس</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deliveryOptionButton,
              selectedDeliveryOptions.includes('اتصل بي عندما تصل') && styles.selectedDeliveryOption,
            ]}
            onPress={() => toggleDeliveryOption('اتصل بي عندما تصل')}
          >
            <View style={styles.checkbox}>
              {selectedDeliveryOptions.includes('اتصل بي عندما تصل') && (
                <FontAwesome name="check" size={18} color="#365D9B" />
              )}
            </View>
            <Text style={styles.deliveryOptionText}>اتصل بي عندما تصل</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[
              styles.paymentOptionButton,
              paymentMethod === 'الدفع عند الاستلام' && styles.selectedPaymentOption,
            ]}
            onPress={() => handlePaymentMethodChange('الدفع عند الاستلام')}
          >
            <View style={styles.checkbox}>
              {paymentMethod === 'الدفع عند الاستلام' && <FontAwesome name="check" size={18} color="#365D9B" />}
            </View>
            <Text style={styles.paymentOptionText}>الدفع عند الاستلام</Text>
          </TouchableOpacity>
          {/* يمكنك إضافة طرق دفع إضافية هنا بنفس الطريقة */}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إضافة كود الخصم</Text>
        {/* مربع نص لإضافة كود الخصم */}
        {/* زر لتأكيد إضافة كود الخصم */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تفاصيل الفاتورة</Text>
        <View style={styles.invoiceDetails}>
          <Text>الإجمالي: {totalPrice} SYP</Text>
          {/* عرض قيمة الحسم إن وجد */}
          {/* عرض قيمة التوصيل */}
          {/* عرض الضريبة إن وجدت */}
          {/* عرض المجموع النهائي */}
        </View>
      </View>

      <TouchableOpacity style={styles.placeOrderButton}>
        <Text style={styles.placeOrderButtonText}>ارسل الطلب</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#365D9B',
    fontSize: 16,
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deliveryOptions: {
    marginBottom: 20,
  },
  deliveryOptionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedDeliveryOption: {},
  deliveryOptionText: {
    fontSize: 16,
    color: '#000',
    marginRight: 10,
  },
  paymentOptions: {
    marginBottom: 20,
  },
  paymentOptionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedPaymentOption: {},
  paymentOptionText: {
    fontSize: 16,
    color: '#000',
    marginRight: 10,
  },
  invoiceDetails: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
    padding: 10,
  },
  placeOrderButton: {
    backgroundColor: '#365D9B',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row', // لوضع الخريطة على الجانب الأيسر
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 5,
  },
  mapContainer: {
    width: 150, // تحديد عرض الخريطة
    height: 150, // تحديد ارتفاع الخريطة
    marginLeft: 10, // ترك مسافة بين الخريطة وبقية المعلومات
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});

export default CheckoutScreen;
