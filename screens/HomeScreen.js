import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import Modal from 'react-native-modal';
import Header from './PageBasics/Header';
import Footer from './PageBasics/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [city, setCity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [visitorMode, setVisitorMode] = useState(false); // State to manage visitor mode
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getCurrentCity = async () => {
      try {
        let location = await Location.getCurrentPositionAsync({});
        let address = await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
        setCity(address);
      } catch (error) {
        console.error(error);
      }
    };

    getCurrentCity();
  }, []);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('customer_id');
        if (userId) {
          fetchSavedAddresses(userId);
          setVisitorMode(false); // Set visitor mode to false if user ID is found
        } else {
          console.log('User ID not found in AsyncStorage');
          setVisitorMode(true); // Set visitor mode to true if user ID is not found
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

      if (data && data.addresses) { // Corrected to access `addresses` array
        const addresses = data.addresses.map(address => address.area); // Adjust as per your data structure
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

  const dummyRestaurants = [
    { id: '1', name: 'مطعم أ', category: 'إيطالي', delivery: 'توصيل مجاني', image: 'https://via.placeholder.com/150' },
    { id: '2', name: 'مطعم ب', category: 'صيني', delivery: 'توصيل مدفوع', image: 'https://via.placeholder.com/150' },
    { id: '3', name: 'مطعم ج', category: 'مكسيكي', delivery: 'توصيل مجاني', image: 'https://via.placeholder.com/150' },
  ];

  const dummyProducts = [
    { id: '1', name: 'منتج أ', restaurant: 'مطعم أ', deliveryTime: '30 دقيقة', deliveryFee: '2.99 دولار', image: 'https://via.placeholder.com/150' },
    { id: '2', name: 'منتج ب', restaurant: 'مطعم ب', deliveryTime: '25 دقيقة', deliveryFee: '1.99 دولار', image: 'https://via.placeholder.com/150' },
    { id: '3', name: 'منتج ج', restaurant: 'مطعم ج', deliveryTime: '40 دقيقة', deliveryFee: '3.49 دولار', image: 'https://via.placeholder.com/150' },
  ];

  useEffect(() => {
    setTimeout(() => {
      setRestaurants(dummyRestaurants);
      setProducts(dummyProducts);
      setLoading(false);
    }, 1000);
  }, []);

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity style={styles.restaurantItem}>
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantDetails}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCategory}>{item.category}</Text>
        <Text style={styles.restaurantDelivery}>{item.delivery}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productRestaurant}>المطعم: {item.restaurant}</Text>
        <Text style={styles.productDeliveryTime}>وقت التوصيل: {item.deliveryTime}</Text>
        <Text style={styles.deliveryFee}>رسوم التوصيل: {item.deliveryFee}</Text>
      </View>
    </TouchableOpacity>
  );

  const fadeInMessage = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000, // Adjust timing as needed
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
      />
      
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
            onPress={() => {
              setModalVisible(false);
              navigation.navigate('MapScreen');
            }}
          >
            <Feather name="plus-circle" size={20} color="#fff" />
            <Text style={styles.modalButtonText}>إضافة عنوان جديد</Text>
          </TouchableOpacity>
        </View>
      </Modal>


      <ScrollView style={styles.body}>
         {/* Visitor Message */}
         {visitorMode && (
         <Animated.View style={[styles.visitorMessage, visitorMessageStyle]}>
          <Text style={styles.visitorText}>أنت زائر حالياً. قم بتسجيل الدخول للوصول إلى المزيد من الخدمات.</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')} // توجيه المستخدم إلى صفحة تسجيل الدخول
          >
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

        <Text style={styles.orderText}>ماذا ترغب في طلبه؟</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterItem}>
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/food.png")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>مطعم</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem}>
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/supermarket.jpg")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>سوبرماركت</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem}>
            <View style={styles.filterIconContainer}>
              <Image source={require("../assets/store.jpg")} style={styles.filterIcon} />
            </View>
            <Text style={styles.filterText}>متاجر</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem}>
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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}

        <Text style={styles.sectionTitle}>المنتجات</Text>
        {loading ? (
          <Text>جار التحميل...</Text>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
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
    backgroundColor: '#fff',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 60, // Adjusted to accommodate footer
  },
  visitorMessage: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  visitorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: '#365D9B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  orderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
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
    backgroundColor: '#eee',
    borderRadius: 50,
    padding: 12,
  },
  filterIcon: {
    width: 40,
    height: 40,
  },
  filterText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  horizontalList: {
    paddingBottom: 16,
  },
  restaurantItem: {
    marginRight: 16,
    width: 150,
  },
  restaurantImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  restaurantDetails: {
    marginTop: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  restaurantCategory: {
    fontSize: 12,
    color: '#777',
  },
  restaurantDelivery: {
    fontSize: 12,
    color: '#777',
  },
  productItem: {
    marginRight: 16,
    width: 150,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  productDetails: {
    marginTop: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productRestaurant: {
    fontSize: 12,
    color: '#777',
  },
  productDeliveryTime: {
    fontSize: 12,
    color: '#777',
  },
  deliveryFee: {
    fontSize: 12,
    color: '#777',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    marginRight: 10,
  },
  modalCurrentAddress: {
    fontSize: 16,
  },
  savedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addressIcon: {
    marginRight: 10,
  },
  addressText: {
    fontSize: 16,
  },
  noSavedAddresses: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#365D9B',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default HomeScreen;

