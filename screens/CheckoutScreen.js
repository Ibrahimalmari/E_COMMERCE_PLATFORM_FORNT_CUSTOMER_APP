import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import Modal from 'react-native-modal';
import Pusher from 'pusher-js/react-native';
import NetInfo from '@react-native-community/netinfo'; // استيراد NetInfo


const CheckoutScreen = ({ route, navigation }) => {
  const { cartItems, totalPrice, deliveryCost, deliveryTime } = route.params;
  const [addresses, setAddresses] = useState([]);
  const [customerToken, setCustomerToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [selectedDeliveryNotes, setSelectedDeliveryNotes] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('الدفع عند الاستلام');
  const [showDiscountField, setShowDiscountField] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // لإظهار التحميل أثناء جلب البيانات
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // لإظهار التحميل أثناء تأكيد الطلب
  const taxValue = 2500; // قيمة الضريبة الثابتة

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [waitingForNotification, setWaitingForNotification] = useState(false); 

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const token = await AsyncStorage.getItem('customerToken');
        const id = await AsyncStorage.getItem('customer_id');
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
      setAddresses(response.data.addresses);
      setSavedAddresses(response.data.addresses);
      if (response.data.addresses.length > 0) {
        setSelectedAddress(response.data.addresses[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false); // إخفاء التحميل بعد جلب البيانات
    }
  };

  const toggleDeliveryNote = (note) => {
    setSelectedDeliveryNotes((prevNotes) => {
      if (prevNotes.includes(note)) {
        return prevNotes.filter((item) => item !== note);
      } else {
        return [...prevNotes, note];
      }
    });
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleApplyDiscount = () => {
    if (discountCode === 'DISCOUNT10') {
      setDiscountValue(totalPrice * 0.1); // خصم 10% في حال كان الكود صحيح
    } else {
      setDiscountValue(0); // لا يوجد خصم في حال كان الكود غير صحيح
    }
  };

  const roundToNearest500 = (value) => {
    return Math.ceil(value / 500) * 500;
  };

  const finalTotalPrice = totalPrice - discountValue + roundToNearest500(deliveryCost) + taxValue;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('خطأ', 'يرجى تحديد عنوان للتوصيل.');
      return;
    }

    const cartId = cartItems.length > 0 ? cartItems[0].cart_id : null;
    const storeId = cartItems.length > 0 ? cartItems[0].product.store_id : null;
    if (!cartId || !storeId) {
      Alert.alert('خطأ', 'لا يمكن الحصول على cart_id أو store_id.');
      return;
    }

    Alert.alert(
      'تأكيد الطلب',
      'هل أنت متأكد من إتمام الطلب؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم',
          onPress: async () => {
            setIsPlacingOrder(true); // عرض التحميل أثناء تأكيد الطلب
            setWaitingForNotification(true); // بدء الانتظار للإشعار

            const deliveryNotesText = selectedDeliveryNotes.join(', ');
            const orderData = {
              delivery_notes: deliveryNotesText,
              invoice_amount: roundToNearest500(totalPrice),
              order_status: 'تم استلام الطلب',
              pay_way: paymentMethod,
              tax: taxValue,
              tip: 0,
              delivery_fee: roundToNearest500(deliveryCost),
              discount: discountValue,
              cart_id: cartId,
              customer_id: customerId,
              store_id: storeId,
              address_id: selectedAddress.id,
            };

            try {
              const response = await axios.post('http://10.0.2.2:8000/api/orders', orderData, {
                headers: {
                  Authorization: `Bearer ${customerToken}`,
                },
              });

              if (response.data.success) {
                // بعد نجاح إرسال الطلب، قم بانتظار إشعار Pusher
                setNotificationMessage('تم إرسال الطلب بنجاح! انتظر قليلاً لتلقي إشعار.');
              } else {
                Alert.alert('خطأ', response.data.message || 'حدث خطأ أثناء إرسال الطلب.');
                setIsPlacingOrder(false); // إخفاء التحميل في حال حدوث خطأ
              }
            } catch (error) {
              console.error('Error placing order:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب.');
              setIsPlacingOrder(false); // إخفاء التحميل في حال حدوث خطأ
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleChangeAddress = () => {
    setModalVisible(true);
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setModalVisible(false);
  };

  useEffect(() => {
    const pusher = new Pusher('a7675dfaac8ec49f6511', {
      cluster: 'eu',
      encrypted: true,
    });

    const channel = pusher.subscribe('my-channel-customer');
    channel.bind('my-event-customer', (data) => {
      if (waitingForNotification) {
        setWaitingForNotification(false); // تم تلقي الإشعار
        setNotificationMessage(data.message);
        setNotificationVisible(true); // عرض الإشعار

        // الانتظار لبضع ثوانٍ قبل الانتقال إلى الصفحة التالية
        setTimeout(() => {
          setNotificationVisible(false); // إخفاء الإشعار
          navigation.navigate('HomeScreen', { orderId: data.orderId }); // الانتقال إلى صفحة HomeScreen بعد تلقي الإشعار
        }, 5000); // الانتظار لمدة 2 ثانية
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('my-channel-customer');
    };
  }, [waitingForNotification, navigation]);


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365D9B" />
        <Text style={styles.loadingText}>جارٍ تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#365D9B" />
        </TouchableOpacity>
        <Text style={styles.backButtonText}>عودة للسلة</Text>
      </View>

      <Text style={styles.pageTitle}>الفاتورة</Text>

      {selectedAddress && (
        <View style={styles.addressContainer}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(selectedAddress.latitude),
                longitude: parseFloat(selectedAddress.longitude),
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              region={{
                latitude: parseFloat(selectedAddress.latitude),
                longitude: parseFloat(selectedAddress.longitude),
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false} // تعطيل التمرير
              zoomEnabled={false} // تعطيل التكبير
              pitchEnabled={false} // تعطيل التدوير
              rotateEnabled={false} // تعطيل التدوير
            >
              <Marker
                coordinate={{
                  latitude: parseFloat(selectedAddress.latitude),
                  longitude: parseFloat(selectedAddress.longitude),
                }}
                title="موقع العنوان"
              />
            </MapView>
            <TouchableOpacity style={styles.changeAddressButton} onPress={handleChangeAddress}>
              <FontAwesome name="edit" size={18} color="#365D9B" />
              <Text style={styles.changeAddressText}>تغيير العنوان</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>المنطقة: {selectedAddress.area}</Text>
            <Text style={styles.addressText}>الشارع: {selectedAddress.street}</Text>
            <Text style={styles.addressText}>القريب من: {selectedAddress.nearBy}</Text>
            <Text style={styles.addressText}>تفاصيل إضافية: {selectedAddress.additionalDetails}</Text>
            <Text style={styles.addressText}>الطابق: {selectedAddress.floor}</Text>
          </View>
        </View>
      )}

<Text style={styles.sectionTitle}>الملاحظات على الطلب:</Text>
      <View style={styles.deliveryNotesContainer}>
        <TouchableOpacity
          style={[
            styles.deliveryNoteButton,
            selectedDeliveryNotes.includes('اتصل بي قبل الوصول') && styles.selectedDeliveryNoteButton,
          ]}
          onPress={() => toggleDeliveryNote('اتصل بي قبل الوصول')}
        >
          <Text style={styles.deliveryNoteText}>اتصل بي قبل الوصول</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.deliveryNoteButton,
            selectedDeliveryNotes.includes('اترك الطلب عند الباب') && styles.selectedDeliveryNoteButton,
          ]}
          onPress={() => toggleDeliveryNote('اترك الطلب عند الباب')}
        >
          <Text style={styles.deliveryNoteText}>اترك الطلب عند الباب</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.deliveryNoteButton,
            selectedDeliveryNotes.includes('لا تقم بالطرق على الباب') && styles.selectedDeliveryNoteButton,
          ]}
          onPress={() => toggleDeliveryNote('لا تقم بالطرق على الباب')}
        >
          <Text style={styles.deliveryNoteText}>لا تقم بالطرق على الباب</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>طريقة الدفع:</Text>
      <View style={styles.paymentMethodsContainer}>
        <TouchableOpacity
          style={[styles.paymentMethodButton, paymentMethod === 'الدفع عند الاستلام' && styles.selectedPaymentMethodButton]}
          onPress={() => handlePaymentMethodChange('الدفع عند الاستلام')}
        >
          <Text style={styles.paymentMethodText}>الدفع عند الاستلام</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentMethodButton, paymentMethod === 'البطاقة البنكية' && styles.selectedPaymentMethodButton]}
          onPress={() => handlePaymentMethodChange('البطاقة البنكية')}
        >
          <Text style={styles.paymentMethodText}>البطاقة البنكية</Text>
        </TouchableOpacity>
      </View> 

      <TouchableOpacity style={styles.discountToggle} onPress={() => setShowDiscountField(!showDiscountField)}>
<Text style={styles.discountToggleText}>لديك كود خصم؟</Text>
<FontAwesome
  name={showDiscountField ? 'angle-up' : 'angle-down'}
  size={24}
  color="#365D9B"
/>
</TouchableOpacity>

{showDiscountField && (
<View style={styles.discountContainer}>
  <TextInput
    style={styles.discountInput}
    placeholder="ادخل كود الخصم"
    value={discountCode}
    onChangeText={setDiscountCode}
  />
  <TouchableOpacity style={styles.applyDiscountButton} onPress={handleApplyDiscount}>
    <Text style={styles.applyDiscountButtonText}>تطبيق</Text>
  </TouchableOpacity>
</View>
)}

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>إجمالي السعر: {totalPrice.toFixed(2)} ل.س</Text>
        {discountValue > 0 && <Text style={styles.totalText}>الخصم: {discountValue.toFixed(2)} ل.س</Text>}
        <Text style={styles.totalText}>رسوم التوصيل: {roundToNearest500(deliveryCost).toFixed(2)} ل.س</Text>
        <Text style={styles.totalText}>الضريبة: {taxValue.toFixed(2)} ل.س</Text>
        <Text style={styles.totalText}>الإجمالي النهائي: {finalTotalPrice.toFixed(2)} ل.س</Text>
      </View>

      <TouchableOpacity
        style={[styles.placeOrderButton, isPlacingOrder && styles.placeOrderButtonDisabled]}
        onPress={handlePlaceOrder}
        disabled={isPlacingOrder}
      >
        {isPlacingOrder ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.placeOrderButtonText}>تأكيد الطلب</Text>
        )}
      </TouchableOpacity>

      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>اختر عنوان التوصيل</Text>
          {savedAddresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={styles.modalAddressItem}
              onPress={() => handleAddressSelect(address)}
            >
              <Text style={styles.modalAddressText}>{address.area}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal isVisible={notificationVisible} onBackdropPress={() => setNotificationVisible(false)}>
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationVisible(false)}>
            <Text style={styles.notificationButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:15,
  },
  backButtonText: {
    fontSize: 18,
    color: '#365D9B',
    marginLeft: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#365D9B',
    marginBottom: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    marginRight: 10,
    position: 'relative',
  },
  map: {
    height: 150,
    borderRadius: 10,
  },
  changeAddressButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changeAddressText: {
    marginLeft: 5,
    color: '#365D9B',
    fontSize: 16,
  },
  addressInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#365D9B',
    marginBottom: 10,
    textAlign: 'right',
  },
  deliveryNotesContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  deliveryNoteButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedDeliveryNoteButton: {
    borderColor: '#365D9B',
    backgroundColor: '#E6F0FF',
  },
  deliveryNoteText: {
    color: '#333',
    fontSize: 14,
  },
  paymentMethodsContainer: {
    flexDirection: 'row-reverse',
    marginBottom: 20,
  },
  paymentMethodButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  selectedPaymentMethodButton: {
    borderColor: '#365D9B',
    backgroundColor: '#E6F0FF',
  },
  paymentMethodText: {
    color: '#333',
    fontSize: 14,
  },
  discountToggle: {
    flexDirection: 'row',
    alignItems: 'right',
    marginBottom: 20,
  },
  discountToggleText: {
    fontSize: 16,
    color: '#365D9B',
    marginRight: 10,
    textAlign: 'right',
    alignItems:'right',

  },
  discountContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  applyDiscountButton: {
    backgroundColor: '#365D9B',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyDiscountButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  totalContainer: {
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
  },
  placeOrderButton: {
    backgroundColor: '#365D9B',
    borderRadius: 5,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#999',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#365D9B',
  },
  modalAddressItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalAddressText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#365D9B',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  notificationContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  notificationButton: {
    backgroundColor: '#365D9B',
    padding: 10,
    borderRadius: 5,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CheckoutScreen;
