import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressDetailsScreen = ({ route, navigation }) => {
  const { coordinates } = route.params;
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [floor, setFloor] = useState('');
  const [nearby, setNearby] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    const getCustomerId = async () => {
      try {
        const id = await AsyncStorage.getItem('customer_id');
        if (id) {
          setCustomerId(id);
        } else {
          Alert.alert('خطأ', 'لم يتم العثور على معرف العميل.');
        }
      } catch (error) {
        console.error('خطأ أثناء استرجاع معرف العميل:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء استرجاع معرف العميل.');
      }
    };

    getCustomerId();
  }, []);

  const handleSave = async () => {
    if (!customerId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف العميل.');
      return;
    }

    if (!name || !area || !street || !floor || !nearby) {
      Alert.alert('تنبيه', 'الرجاء ملء جميع الحقول.');
      return;
    }

    const data = {
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      area,
      street,
      nearBy: nearby || null,
      additionalDetails: additionalDetails || null,
      floor,
      customer_id: customerId,
    };

    try {
      const response = await axios.post(`http://10.0.2.2:8000/api/addresses`, data);
      console.log('تم حفظ العنوان الجديد:', response.data.address);

      Alert.alert('نجاح', 'تم حفظ العنوان الجديد بنجاح.', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('حدث خطأ أثناء حفظ العنوان:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ العنوان.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>تفاصيل العنوان</Text>
        
        <View style={styles.mapContainer} pointerEvents="none">
          <MapView
            style={styles.map}
            initialRegion={{
              ...coordinates,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker coordinate={coordinates} />
          </MapView>
        </View>

        <TextInput
          style={styles.input}
          placeholder="اسم العنوان"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="المنطقة"
          value={area}
          onChangeText={setArea}
        />
        <TextInput
          style={styles.input}
          placeholder="الشارع"
          value={street}
          onChangeText={setStreet}
        />
        <TextInput
          style={styles.input}
          placeholder="الطابق"
          value={floor}
          onChangeText={setFloor}
        />
        <TextInput
          style={styles.input}
          placeholder="قريب من"
          value={nearby}
          onChangeText={setNearby}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="تفاصيل إضافية"
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          multiline
        />
        
        <Button title="حفظ العنوان الجديد" onPress={handleSave} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    pointerEvents: 'none', // Ensure all touch events are ignored
  },
  map: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default AddressDetailsScreen;
