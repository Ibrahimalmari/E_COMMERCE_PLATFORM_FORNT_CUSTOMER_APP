import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';

const SearchDuringType = ({ route }) => {
  const { type } = route.params;
  const [sections, setSections] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [noRestaurants, setNoRestaurants] = useState(false);
  const navigation = useNavigation();

  const deliveryCostPerKm = 4000; // تكلفة التوصيل لكل كيلومتر
  const carSpeed = 40; // سرعة السيارة بالكيلومتر في الساعة

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.error('Failed to get location', error);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch(`http://10.0.2.2:8000/api/sections/${type}`);
        const data = await response.json();
        if (data.status === 200) {
          setSections(data.sections);
        } else {
          console.error('Failed to fetch sections', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch sections', error);
      } finally {
        setLoadingSections(false);
      }
    };

    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://10.0.2.2:8000/api/allstore');
        const data = await response.json();
        if (data && data.store) {
          const filtered = data.store.filter(restaurant => restaurant.type === type);
          setRestaurants(filtered);
          setFilteredRestaurants(filtered);
          setNoRestaurants(filtered.length === 0);
        } else {
          console.error('Failed to fetch restaurants', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants', error);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchSections();
    fetchRestaurants();
  }, [type]);

  useEffect(() => {
    const applySectionFilter = () => {
      if (selectedSections.length === 0) {
        setFilteredRestaurants(restaurants);
        setNoRestaurants(restaurants.length === 0);
      } else {
        const filtered = restaurants.filter(restaurant => {
          const storeSections = restaurant.section_ids || [];
          return selectedSections.every(sectionId => storeSections.includes(sectionId));
        });
        setFilteredRestaurants(filtered);
        setNoRestaurants(filtered.length === 0);
      }
    };

    applySectionFilter();
  }, [selectedSections, restaurants]);

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

  const renderSectionItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.sectionCard, selectedSections.includes(item.section.id) && styles.selectedSectionCard]}
      onPress={() => {
        setSelectedSections(prev =>
          prev.includes(item.section.id)
            ? prev.filter(id => id !== item.section.id)
            : [...prev, item.section.id]
        );
      }}
    >
      <Text style={styles.sectionName}>{item.section.name}</Text>
    </TouchableOpacity>
  );

  const renderRestaurantItem = ({ item }) => {
    let distance = 0;
    if (userLocation) {
      const { latitude: lat1, longitude: lon1 } = userLocation;
      if (item.latitude && item.longitude) {
        const lat2 = parseFloat(item.latitude);
        const lon2 = parseFloat(item.longitude);

        distance = calculateDistance(lat1, lon1, lat2, lon2);
      } else {
        console.warn(`Missing latitude or longitude data for item:`, item);
      }
    }

    const deliveryCost = distance * deliveryCostPerKm;
    const deliveryTime = Math.floor((distance / carSpeed) * 60) + 30;

    return (
      <TouchableOpacity 
        style={styles.restaurantCard} 
        onPress={() => navigation.navigate('StoreDetailsScreen', {
          storeId: item.id,
          distance,
          deliveryCost,
          deliveryTime,
        })}
      >
        <Image source={{ uri: `http://10.0.2.2:8000/stores/${item.coverPhoto}` }} style={styles.restaurantImage} />
        <View style={styles.restaurantDetails}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.restaurantCategory}>{item.description}</Text>
          <Text style={styles.restaurantDelivery}>
            تكلفة التوصيل: {Math.ceil(deliveryCost / 500) * 500} SYP
          </Text>
          <Text style={styles.restaurantDelivery}>
            الوقت المتوقع للتوصيل: {deliveryTime} دقيقة
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{type}</Text>
      </View>

      <Text style={styles.subTitle}>الأقسام</Text>
      {loadingSections ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={sections}
          renderItem={renderSectionItem}
          keyExtractor={(item) => item.section.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      <Text style={styles.subTitle}>المطاعم</Text>
      {loadingRestaurants ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : noRestaurants ? (
        <Text style={styles.noDataText}>لا توجد متاجر لعرضها في هذا القسم.</Text>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  sectionCard: {
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    height: 80,
    justifyContent: 'center',
  },
  selectedSectionCard: {
    backgroundColor: '#dfe6e9',
  },
  sectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  restaurantDetails: {
    flex: 1,
    padding: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  restaurantCategory: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  restaurantDelivery: {
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

export default SearchDuringType;
