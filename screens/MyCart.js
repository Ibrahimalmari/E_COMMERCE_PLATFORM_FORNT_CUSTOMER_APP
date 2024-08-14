import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const MyCart = () => {

    const [carts, setCarts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const navigation = useNavigation();

    const fetchCarts = async () => {
        try {
            const token = await AsyncStorage.getItem('customerToken');
            const response = await axios.get('http://10.0.2.2:8000/api/savedCarts', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (response.data.success) {
                setCarts(response.data.carts);
            } else {
                console.error('Failed to fetch carts');
            }
        } catch (error) {
            console.error('Error fetching carts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCarts();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCarts();
        }, [])
    );

    const handleCartPress = (storeId) => {
        console.log(storeId);
        navigation.navigate('CartScreen', {
            storeId,
        });
    };

    const removeCart = async (cartId, storeId) => {
        const customerId = await AsyncStorage.getItem('customer_id');
        if (customerId) {
            try {
                await axios.delete(`http://10.0.2.2:8000/api/removeCart/${customerId}/${storeId}`);
                console.log('Cart removed');
                setCarts(carts.filter(cart => cart.id !== cartId));
            } catch (error) {
                console.error('Error removing cart:', error);
            }
        }
    };

    const handleDeleteCart = (cartId, storeId) => {
        Alert.alert(
            'تأكيد الحذف',
            'هل أنت متأكد أنك تريد حذف هذه السلة؟',
            [
                {
                    text: 'إلغاء',
                    style: 'cancel',
                },
                {
                    text: 'حذف',
                    onPress: () => removeCart(cartId, storeId),
                },
            ],
            { cancelable: false }
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ea" />
            </View>
        );
    }

    const renderCartItem = ({ item }) => {
        const items = item.items || [];
        const storeImage = item.storeImage
            ? `http://10.0.2.2:8000/stores/${item.storeImage.split('.')[0]}`
            : 'default-store-image-url';
        const totalPrice = item.totalPrice || '0';
        return (
            <TouchableOpacity style={styles.cartContainer} onPress={() => handleCartPress(item.store_id)}>
                <View style={styles.cartHeader}>
                    <Text style={styles.cartHeaderTitle}>{item.storeName || 'اسم المتجر غير متوفر'}</Text>
                    <TouchableOpacity onPress={() => handleDeleteCart(item.id, item.store_id)} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>حذف</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.storeContainer}>
                    <Image source={{ uri: storeImage }} style={styles.storeImage} />
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{item.storeName || 'اسم المتجر غير متوفر'}</Text>
                        <Text style={styles.itemCount}>{items.length} عناصر</Text>
                    </View>
                </View>
                <View style={styles.productsContainer}>
                    {items.length > 0 ? (
                        items.map((cartItem, index) => {
                            const product = cartItem || {};
                            const productImage = product.productImage
                                ? `http://10.0.2.2:8000/products/${product.productImage.split('.')[0]}`
                                : 'default-product-image-url';
                            return (
                                <View key={index} style={styles.productContainer}>
                                    <Image source={{ uri: productImage }} style={styles.productImage} />
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName}>{product.productName || 'اسم المنتج غير متوفر'}</Text>
                                        <Text style={styles.productQuantity}>الكمية: {cartItem.quantity || '0'}</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text>لا توجد منتجات في السلة</Text>
                    )}
                </View>
                <Text style={styles.totalPrice}>السعر الكلي: {totalPrice} ل.س</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>عودة</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>سلاتي</Text>
            </View>
            <FlatList
                data={carts}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />
        </View>
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
        backgroundColor: '#426C9D',
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
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
    },
    cartContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    cartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cartHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    deleteButton: {
        backgroundColor: '#ff3b30',
        borderRadius: 5,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    storeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    storeImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemCount: {
        fontSize: 14,
        color: '#666',
    },
    productsContainer: {
        marginBottom: 12,
    },
    productContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    productPrice: {
        fontSize: 12,
        color: '#666',
    },
    productQuantity: {
        fontSize: 12,
        color: '#666',
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MyCart;
