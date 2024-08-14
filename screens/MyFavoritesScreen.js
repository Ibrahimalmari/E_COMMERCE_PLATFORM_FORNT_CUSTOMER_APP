import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // للحصول على موقع المستخدم
import { Feather } from '@expo/vector-icons';

const MyFavoritesScreen = ({ navigation }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            const customerId = await AsyncStorage.getItem('customer_id');
            try {
                const response = await axios.post('http://10.0.2.2:8000/api/favorite/getFavorites', { customer_id: customerId });
                if (response.data.success) {
                    setFavorites(response.data.favorites);
                } else {
                    setFavorites([]);
                }
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // نصف قطر الأرض بالكيلومترات
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // المسافة بالكيلومترات
        return distance;
    };

    const calculateDeliveryCost = (distance) => {
        const costPerKm = 4000; // تكلفة كل كيلومتر
        return distance * costPerKm;
    };

    const calculateDeliveryTime = (distance, averageSpeed = 40) => {
        const timeInHours = distance / averageSpeed; // الوقت بالساعات
        const timeInMinutes = timeInHours * 60 + 30; // تحويل الوقت إلى دقائق
        return Math.round(timeInMinutes); // تقريب الوقت إلى أقرب دقيقة
    };

    const handleStorePress = async (storeId, storeDeliveryTime) => {
        try {
            // احصل على موقع المستخدم الحالي
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }
            const userLocation = await Location.getCurrentPositionAsync({});
            const userLatitude = userLocation.coords.latitude;
            const userLongitude = userLocation.coords.longitude;

            // جلب إحداثيات المتجر من الخادم
            const response = await axios.get(`http://10.0.2.2:8000/api/store/getStoreAddress/${storeId}`);
            const storeLatitude = parseFloat(response.data.store.latitude);
            const storeLongitude = parseFloat(response.data.store.longitude);

            // احسب المسافة بين المستخدم والمتجر
            const distance = calculateDistance(userLatitude, userLongitude, storeLatitude, storeLongitude);
            const deliveryCost = calculateDeliveryCost(distance);
            const deliveryTime = calculateDeliveryTime(distance); // حساب الوقت المتوقع للتوصيل

            // الانتقال إلى صفحة تفاصيل المتجر مع تمرير المعلومات المحسوبة
            navigation.navigate('StoreDetailsScreen', {
                storeId: storeId,
                distance: distance,
                deliveryCost: deliveryCost,
                deliveryTime: deliveryTime, // تمرير الوقت المتوقع للتوصيل
            });

        } catch (error) {
            console.error('Error fetching store address or calculating distance:', error);
        }
    };

    const renderFavoriteItem = ({ item }) => {
        const store = item.store;

        return (
            <TouchableOpacity
                style={styles.storeItem}
                onPress={() => handleStorePress(store.id, store.deliveryTime)}
            >
                <Image source={{ uri: `http://10.0.2.2:8000/stores/${store.coverPhoto}` }} style={styles.storeImage} />
                <View style={styles.storeDetails}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <Text style={styles.storeType}>{store.type}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#365D9B" />
                <Text style={styles.loadingText}>جارٍ تحميل البيانات...</Text>
            </View>
        );
    }

    if (favorites.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>لا توجد متاجر مفضلة.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>المفضلة</Text>
            </View>

            <FlatList
                data={favorites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item.store.id.toString()}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#365D9B',
        paddingTop: 40, // لضبط المساحة في حالة وجود شريط حالة في الأجهزة
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    backButton: {
        paddingRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#365D9B',
    },
    listContent: {
        padding: 10,
    },
    storeItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 5,
    },
    storeImage: {
        width: 100,
        height: 100,
    },
    storeDetails: {
        flex: 1,
        padding: 10,
        justifyContent: 'center',
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    storeType: {
        fontSize: 14,
        color: '#777',
    },
});

export default MyFavoritesScreen;
