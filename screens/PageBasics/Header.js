import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = ({ city, modalVisible, setModalVisible }) => {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // استرجاع التوكن من AsyncStorage عند تحميل الـ component
    retrieveToken();
  }, []);

  const retrieveToken = async () => {
    try {
      const token = await AsyncStorage.getItem('customerToken');
      if (token) {
        setIsLoggedIn(true); // المستخدم مسجل دخول إذا كان التوكن موجود
      } else {
        setIsLoggedIn(false); // المستخدم غير مسجل دخول إذا كان التوكن غير موجود
      }
    } catch (error) {
      console.log('Error retrieving token from AsyncStorage:', error.message);
      // يمكنك تنفيذ إجراء مناسب هنا لمعالجة الخطأ
    }
  };

  const handleLocationPress = () => {
    if (isLoggedIn) {
      setModalVisible(true);
    } else {
      // Handle the case where user is not logged in
      Alert.alert('يجب تسجيل الدخول', 'يجب تسجيل الدخول لاستخدام هذه الميزة.');
      // Alternatively, you can navigate to a login screen or any other action
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.deliveryTo}>توصيل إلى:</Text>
        <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
          <Feather name="map-pin" size={20} color="#FBF9F8" style={styles.locationIcon} />
          <Text style={styles.addressText}>عنوان الموقع: {city ? city : 'الموقع الحالي'}</Text>
          <Feather name="chevron-right" size={20} color="#FBF9F8" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconContainer}>
          <Feather name="heart" size={25} color="white" style={styles.headerIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconContainer} onPress={() => navigation.navigate('Cart')}>
          <Feather name="shopping-cart" size={25} color="white" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 7,
    backgroundColor: '#365D9B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTo: {
    fontSize: 20,
    color: '#EBE7E7B0',
    fontWeight: 'bold',
  },
  addressText: {
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginLeft: -100,
  },
  locationIcon: {
    marginRight: 5,
  },
  arrowIcon: {
    marginLeft: 5,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIconContainer: {
    padding: 5,
    marginLeft: 10,
    marginTop: 25,
  },
  headerIcon: {
    color: 'white',
  },
});

export default Header;
