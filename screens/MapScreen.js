import React, { useState, useEffect } from 'react';
import { View, Button, Alert, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';

const MapScreen = ({ navigation }) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('تم رفض الوصول إلى الموقع');
          return;
        }

        if (Platform.OS === 'web') {
          Location.installWebGeolocationPolyfill();
        }

        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
        setMarkerPosition(location.coords);
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.error(error);
      }
    };

    requestLocationPermission();
  }, []);

  const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;

    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);

    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const R = 6371; // Radius of the Earth in kilometers
    return R * c * 1000; // Convert to meters
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarkerPosition = { latitude, longitude };

    if (currentLocation) {
      const distance = haversineDistance(currentLocation, newMarkerPosition);

      if (distance <= 200) { // Adjusted to 200 meters
        setMarkerPosition(newMarkerPosition);
        console.log(`تم تحديد الموقع الجديد: Latitude: ${latitude}, Longitude: ${longitude}`);
      } else {
        Alert.alert('تنبيه', 'يجب أن يكون الموقع الجديد ضمن 200 متر من الموقع الحالي.');
      }
    }
  };

  const handleZoomIn = () => {
    setMapRegion({
      ...mapRegion,
      latitudeDelta: mapRegion.latitudeDelta / 2,
      longitudeDelta: mapRegion.longitudeDelta / 2,
    });
  };

  const handleZoomOut = () => {
    setMapRegion({
      ...mapRegion,
      latitudeDelta: mapRegion.latitudeDelta * 2,
      longitudeDelta: mapRegion.longitudeDelta * 2,
    });
  };

  const handleCurrentLocation = () => {
    if (currentLocation) {
      setMapRegion({
        ...mapRegion,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleNext = () => {
    if (markerPosition) {
      console.log('تم تأكيد الموقع الجديد:', markerPosition);
      navigation.navigate('AddressDetailsScreen', { coordinates: markerPosition });
    } else {
      Alert.alert('تنبيه', 'الرجاء تحديد الموقع الجديد أولاً.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        onPress={handleMapPress}
        initialRegion={mapRegion}
        region={mapRegion}
      >
        {currentLocation && (
          <>
            <Marker coordinate={currentLocation} pinColor="blue" />
            <Circle
              center={currentLocation}
              radius={200} // Adjusted to 200 meters
              strokeWidth={2}
              strokeColor="rgba(0, 150, 255, 0.5)"
              fillColor="rgba(0, 150, 255, 0.1)"
            />
          </>
        )}
        {markerPosition && <Marker coordinate={markerPosition} draggable />}
      </MapView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleZoomIn}>
          <Feather name="zoom-in" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleZoomOut}>
          <Feather name="zoom-out" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCurrentLocation}>
          <Feather name="crosshair" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <Button title="التالي" onPress={handleNext} />
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 150,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#365D9B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});

export default MapScreen;
