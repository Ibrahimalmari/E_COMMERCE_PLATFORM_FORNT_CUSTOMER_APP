import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput,Animated  ,Button} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import Modal from 'react-native-modal';
import Header from './PageBasics/Header';
import Footer from './PageBasics/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';  // Import FontAwesome

const HomeScreen = ({ route }) => {
  const { orderId } = route.params || {}; // Handle undefined route.params
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [city, setCity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleForRate, setModalVisibleForRate] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [visitorMode, setVisitorMode] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userLocation, setUserLocation] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const deliveryCostPerKm = 4000;
  const carSpeed = 40; // سرعة السيارة بالكيلومتر في الساعة
  console.log(orderId)

  useEffect(() => {
    const getCurrentCity = async () => {
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        let address = await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
        setCity(address);
      } catch (error) {
        console.error(error);
      }
    };

    getCurrentCity();
  }, []);


  useEffect(() => {
    let intervalId;

    if (orderId) {
      fetchOrderStatus(); // Fetch immediately

      intervalId = setInterval(() => {
        fetchOrderStatus(); // Fetch periodically
      }, 5000); // Check every 5 seconds
    }

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orderId]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('customer_id');
        if (userId) {
          fetchSavedAddresses(userId);
          setVisitorMode(false);
        } else {
          console.log('User ID not found in AsyncStorage');
          setVisitorMode(true);
        }
      } catch (error) {
        console.error('Failed to fetch user ID from AsyncStorage', error);
      }
    };

    fetchUserId();
  }, []);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      let response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      let data = await response.json();
      if (data.address && data.address.city) {
        return data.address.city;
      } else {
        return "Unable to fetch city";
      }
    } catch (error) {
      console.error(error);
      return "Unable to fetch city";
    }
  };

  const fetchSavedAddresses = async (userId) => {
    try {
      const response = await fetch(`http://10.0.2.2:8000/api/addresses/${userId}`);
      const data = await response.json();

      if (data && data.addresses) {
        const addresses = data.addresses.map(address => address.area);
        setSavedAddresses(addresses);
      } else {
        console.error('Unexpected response structure', data);
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error('Failed to fetch saved addresses', error);
      setSavedAddresses([]);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/allstore');
      const data = await response.json();
      if (data && data.store) {
        const restaurantsWithDetails = data.store.map(restaurant => ({
          ...restaurant,
          deliveryTime: calculateDeliveryTime(
            userLocation?.latitude || 0,
            userLocation?.longitude || 0,
            parseFloat(restaurant.latitude || 0),
            parseFloat(restaurant.longitude || 0)
          ),
        }));
        setRestaurants(restaurantsWithDetails);
      } else {
        console.error('Unexpected response structure', data);
        setRestaurants([]);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchOrderStatus = async () => {
    if (!orderId) return; // Check if orderId is present
    console.log(orderId)
    try {
      const response = await fetch(`http://10.0.2.2:8000/api/orders/getOrderStatus/${orderId}`);
      const data = await response.json();
      if (data && data.status) {
        setOrderStatus(data.status);
        if (data.status === 'تم تسليم الطلب') {
          setModalVisibleForRate(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order status', error);
    }
  };

  const handleRating = async () => {
    if (!orderId) return; // Check if orderId is present

    try {
      const response = await fetch(`http://10.0.2.2:8000/api/orders/rate${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedback }),
      });
      const result = await response.json();
      if (result.success) {
        setModalVisibleForRate(false);
        setOrderStatus(null);  // Clear the order status if needed
        navigation.navigate('HomeScreen');         
        console.log('Rating submitted successfully');
      }
    } catch (error) {
      console.error('Failed to submit rating', error);
    }
  };


  useEffect(() => {
    fetchRestaurants();
  }, [userLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const calculateDeliveryTime = (lat1, lon1, lat2, lon2) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    return Math.floor((distance / carSpeed) * 60) + 30; // الوقت المتوقع للتوصيل بالدقائق
  };

  const renderRestaurantItem = ({ item }) => {
    let filename = item.coverPhoto.split('.')[0];
    let imageUrl = `http://10.0.2.2:8000/stores/${filename}`;

    const deliveryCost = calculateDistance(
      userLocation?.latitude || 0,
      userLocation?.longitude || 0,
      parseFloat(item.latitude || 0),
      parseFloat(item.longitude || 0)
    ) * deliveryCostPerKm;

    return (
      <TouchableOpacity 
        style={styles.restaurantItem} 
        onPress={() => navigation.navigate('StoreDetailsScreen', {
          storeId: item.id,
          distance: calculateDistance(
            userLocation?.latitude || 0,
            userLocation?.longitude || 0,
            parseFloat(item.latitude || 0),
            parseFloat(item.longitude || 0)
          ),
          deliveryCost,
          deliveryTime: item.deliveryTime,
        })}
      >
        <View style={styles.restaurantBox}>
          <Image source={{ uri: imageUrl }} style={styles.restaurantImage} />
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantCategory}>{item.description}</Text>
            <Text style={styles.restaurantDelivery}>
              تكلفة التوصيل: {Math.ceil(deliveryCost / 500) * 500} SYP
            </Text>
            <Text style={styles.restaurantDelivery}>
              وقت التوصيل المتوقع: {item.deliveryTime} دقيقة
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const fadeInMessage = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (visitorMode) {
      fadeInMessage();
    }
  }, [visitorMode]);

  const visitorMessageStyle = {
    opacity: fadeAnim,
    transform: [
      {
        scale: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Header
        city={selectedAddress ? selectedAddress : city}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        deliveryCost={deliveryCostPerKm}
        deliveryTime={calculateDeliveryTime(
          userLocation?.latitude || 0,
          userLocation?.longitude || 0,
          parseFloat(restaurants[0]?.latitude || 0),
          parseFloat(restaurants[0]?.longitude || 0)
        )}
      />

    <Modal
        isVisible={modalVisibleForRate}
        swipeDirection={['down']}
        onSwipeComplete={() => setModalVisibleForRate(false)}
        onBackdropPress={() => setModalVisibleForRate(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>تقييم الطلب</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="أضف ملاحظاتك هنا..."
            value={feedback}
            onChangeText={setFeedback}
          />
          <Text style={styles.ratingTitle}>تقييم: {rating}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <FontAwesome
                  name={rating >= star ? 'star' : 'star-o'}
                  size={30}
                  color={rating >= star ? '#FFD700' : '#d3d3d3'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Button title="أرسل التقييم" onPress={handleRating} />
        </View>
      </Modal>


      <Modal
        isVisible={modalVisible}
        swipeDirection={['down']}
        onSwipeComplete={() => setModalVisible(false)}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>عنوان التوصيل</Text>
          <View style={styles.addressSection}>
            <Feather name="map-pin" size={20} color="#365D9B" style={styles.modalIcon} />
            <Text style={styles.modalCurrentAddress}>{city}</Text>
          </View>
          <Text style={styles.sectionTitle}>العناوين المحفوظة</Text>
          {savedAddresses.length > 0 ? (
            savedAddresses.map((address, index) => (
              <TouchableOpacity
                key={index}
                style={styles.savedAddress}
                onPress={() => {
                  setSelectedAddress(address);
                  setModalVisible(false);
                }}
              >
                <Feather name="map-pin" size={20} color="#365D9B" style={styles.addressIcon} />
                <Text style={styles.addressText}>{address}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noSavedAddresses}>لا توجد عناوين محفوظة</Text>
          )}
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => navigation.navigate('MapScreen')}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.modalButtonText}>أضف عنوان جديد</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView style={styles.body}>
        {visitorMode && (
          <Animated.View style={[styles.visitorMessage, visitorMessageStyle]}>
            <Text style={styles.visitorText}>أنت زائر حالياً. قم بتسجيل الدخول للوصول إلى المزيد من الخدمات.</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Text style={styles.orderText}>ماذا ترغب في طلبه؟</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => navigation.navigate('SearchDuringType', { type: 'مطعم' })}
          >
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/food.png")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>مطعم</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => navigation.navigate('SearchDuringType', { type: 'سوبرماركت' })}
          >
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/supermarket.jpg")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>سوبرماركت</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => navigation.navigate('SearchDuringType', { type: 'متاجر' })}
          >
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/store.jpg")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>متاجر</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.filterItem}
            onPress={() => navigation.navigate('SearchDuringType', { type: 'صيدلية' })}
          >
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/pharmacy.png")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>صيدلية</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>المطاعم</Text>
        {loading ? (
          <Text>جار التحميل...</Text>
        ) : (
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, { flexDirection: 'row-reverse' }]}
          />
        )}

        <Text style={styles.sectionTitle}>المطاعم المميزة في منطقتك</Text>
        {loading ? (
          <Text>جار التحميل...</Text>
        ) : (
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, { flexDirection: 'row-reverse' }]}
          />
        )}
      </ScrollView>
      <Footer style={styles.footer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  visitorMessage: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  visitorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#365D9B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  orderText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  filterItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: 40,
    height: 40,
  },
  filterText: {
    marginTop: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  horizontalList: {
    paddingHorizontal: 8,
  },
  restaurantItem: {
    marginLeft: 16,
    marginBottom: 10,
  },
  restaurantImage: {
    width: 180,
    height: 120,
    borderRadius: 10,
  },
  restaurantDetails: {
    marginTop: 8,
    width: 180,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  restaurantCategory: {
    fontSize: 16,
    color: '#666',
  },
  restaurantDelivery: {
    fontSize: 14,
    color: '#666',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    marginRight: 8,
  },
  modalCurrentAddress: {
    fontSize: 16,
    color: '#666',
  },
  savedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  addressIcon: {
    marginRight: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#666',
  },
  noSavedAddresses: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#365D9B',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  feedbackInput: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
});

export default HomeScreen;
