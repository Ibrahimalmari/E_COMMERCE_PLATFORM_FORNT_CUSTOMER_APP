import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StoreDetailsScreen = () => {
  const [storeDetails, setStoreDetails] = useState(null);
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cartStatus, setCartStatus] = useState(null); // New state for cart status
  const [isFavorite, setIsFavorite] = useState(false); // New state for favorite status
  const navigation = useNavigation();
  const route = useRoute();
  const { storeId, distance, deliveryCost, deliveryTime, cartItem } = route.params;
  const isFocused = useIsFocused();

  const fetchStoreDetails = useCallback(async () => {
    setLoading(true); // Ensure the loading indicator shows when re-fetching data
    try {
      const storeResponse = await axios.get(`http://10.0.2.2:8000/api/DisplayStoreToCustomer/${storeId}`);
      const storeData = storeResponse.data;
      const categoriesResponse = await axios.get(`http://10.0.2.2:8000/api/store/getStoreDetails/${storeId}`);
      const categoriesData = categoriesResponse.data.categories;
      setStoreDetails(storeData.store);
      setCategoriesWithProducts(categoriesData);

      const customerId = await AsyncStorage.getItem('customer_id');
      if (customerId) {
        const cartResponse = await axios.get(`http://10.0.2.2:8000/api/checkCart/${customerId}/${storeId}`);
        console.log(cartResponse.data)

        if (cartResponse.data.exists) {
          setCartStatus(cartResponse.data.cartStatus); // Set cart status
          if (cartResponse.data.cartStatus !== 'completed') {
            setTotalQuantity(cartResponse.data.totalQuantity);
            setTotalPrice(cartResponse.data.totalPrice);
            
          }
        }
        const favoriteResponse = await axios.get(`http://10.0.2.2:8000/api/favorite/check/${customerId}/${storeId}`);
        setIsFavorite(favoriteResponse.data.isFavorite);
      }
    
    } catch (error) {
      console.error('Error fetching store details:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);


  

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails, isFocused]);

  

  useEffect(() => {
    if (cartItem) {
      const existingItemIndex = cart.findIndex(item => item.id === cartItem.id);
      if (existingItemIndex !== -1) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += cartItem.quantity;
        setCart(updatedCart);
      } else {
        setCart([...cart, cartItem]);
      }
    }
  }, [cartItem]);

  useEffect(() => {
    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const price = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalQuantity(quantity);
    setTotalPrice(price);
  }, [cart]);

  const removeCart = async () => {
    const customerId = await AsyncStorage.getItem('customer_id');
    if (customerId) {
      try {
        await axios.delete(`http://10.0.2.2:8000/api/removeCart/${customerId}/${storeId}`);
        console.log('Cart removed');
      } catch (error) {
        console.error('Error removing cart:', error);
      }
    }
  };

  const handleFavoritePress = async () => {
    const customerId = await AsyncStorage.getItem('customer_id');
  
    if (customerId) {
      try {
        if (isFavorite) {
          await axios.post('http://10.0.2.2:8000/api/favorite/remove', {
            customer_id: customerId,
            store_id: storeId,
          });
          console.log('Store removed from favorites');
        } else {
          await axios.post('http://10.0.2.2:8000/api/favorite/add', {
            customer_id: customerId,
            store_id: storeId,
          });
          console.log('Store added to favorites');
        }
        setIsFavorite(!isFavorite);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };
  

  const handleBackPress = async () => {
    if (totalQuantity > 0) {
      Alert.alert(
        'تأكيد',
        'هل تريد حفظ السلة قبل العودة؟',
        [
          {
            text: 'نعم',
            onPress: async () => {
              navigation.goBack();
            },
          },
          {
            text: 'لا',
            onPress: async () => {
              await removeCart();
              navigation.goBack();
            },
            style: 'destructive',
          },
          {
            text: 'إلغاء',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365D9B" />
        <Text style={styles.loadingText}>جارٍ تحميل البيانات...</Text>
      </View>
    );
  }

  if (!storeDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>لا توجد بيانات المتجر.</Text>
      </View>
    );
  }

  const filename = storeDetails.coverPhoto.split('.')[0];
  const imageUrl = `http://10.0.2.2:8000/stores/${filename}`;
  const storeName = storeDetails.name; // اسم المتجر

  const renderCategory = ({ item }) => {
    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{item.name}</Text>
        {item.branches && item.branches.length > 0 ? (
          item.branches.map(branch => (
            <View key={branch.id} style={styles.branchContainer}>
              <Text style={styles.branchTitle}>{branch.name}</Text>
              {branch.products && branch.products.length > 0 ? (
                <FlatList
                  data={branch.products}
                  renderItem={renderProduct}
                  keyExtractor={(product) => product.id.toString()}
                  horizontal
                  inverted
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              ) : (
                <Text style={styles.productUnavailableText}>لا توجد منتجات متاحة حالياً</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.branchUnavailableText}>لا توجد أفرع متاحة حالياً</Text>
        )}
      </View>
    );
  };

  const renderProduct = ({ item }) => {
    const roundedPrice = Math.ceil(item.price / 500) * 500; // تقريب إلى أقرب 500

    return (
      <TouchableOpacity style={styles.productItem} onPress={() => handleProductPress(item)}>
        <Image
          source={{ uri: `http://10.0.2.2:8000/products/${item.images}` }}
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription}>{item.description}</Text>
          <Text style={styles.productPrice}>{roundedPrice.toFixed(0)} SYP</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetailScreen', { product, storeName, distance, deliveryCost, deliveryTime, storeId });
  };

  const ListHeaderComponent = () => (
    <View style={styles.container}>
      {/* عنصر عرض الصورة */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.storeImage} />
      </View>
      {/* عنصر عرض اسم المتجر فوق تفاصيل المتجر */}
      <View style={styles.overlay}>
        <Text style={styles.storeNameText}>{storeName}</Text>
      </View>
      <View style={styles.iconOverlay}>
      <TouchableOpacity style={styles.iconButton} onPress={handleFavoritePress}>
        <FontAwesome name="heart" size={20} color={isFavorite ? "#ff6347" : "#bbb"} />
      </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Feather name="share-2" size={20} color="#365D9B" />
        </TouchableOpacity>
        {/* زر العود للخلف */}
        <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
          <Feather name="arrow-left" size={20} color="#365D9B" style={styles.backIcon} />
        </TouchableOpacity>
      </View>
      {/* عنصر عرض تفاصيل المتجر */}
      <View style={styles.storeDetailsContainer}>
        <DetailItem label="النوع:" value={storeDetails.type} />
        <DetailItem label="ساعات العمل:" value={`${storeDetails.openTime} - ${storeDetails.closeTime}`} />
        <DetailItem label="المسافة:" value={`${distance.toFixed(2)} كم`} />
        <DetailItem label="وقت التوصيل المتوقع:" value={`${deliveryTime} دقيقة`} />
        <DetailItem label="رسوم التوصيل:" value={`${Math.ceil(deliveryCost / 500) * 500} SYP`} />
      </View>
    </View>
  );

  const DetailItem = ({ label, value }) => (
    <View style={styles.detailItemContainer}>
      <Text style={styles.storeLabelText}>{label}</Text>
      <Text style={styles.storeText}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categoriesWithProducts}
        renderItem={renderCategory}
        keyExtractor={(category) => category.id.toString()}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.categoryList}
      />

      {totalQuantity > 0 && cartStatus !== 'completed' && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() =>
            navigation.navigate('CartScreen', { deliveryCost, deliveryTime ,storeId })
          }
        >
          <Text style={styles.cartButtonText}>
            عرض السلة ({totalQuantity}) - {Math.ceil(totalPrice / 500) * 500} SYP
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  imageContainer: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  storeImage: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  iconOverlay: {
    position: 'absolute',
    top: 12,
    left: 10,
    flexDirection: 'row',
  },
  iconButton: {
    marginRight: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 200,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  storeNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(235, 235, 235, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
  },
  storeDetailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
    zIndex: 0,
  },
  detailItemContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  storeLabelText: {
    fontSize: 16,
    color: '#555',
  },
  storeText: {
    fontSize: 18,
    color: '#333',
  },
  categoryContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
  },
  branchContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  branchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    textAlign: 'right',
  },
  horizontalList: {
    paddingLeft: 10,
    flexDirection: 'row-reverse',
  },
  productItem: {
    marginLeft: 15,
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productDetails: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  productDescription: {
    fontSize: 14,
    color: '#777',
    marginVertical: 5,
    textAlign: 'right',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  cartButton: {
    backgroundColor: '#365D9B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  cartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backIcon: {
    marginLeft: 5,
  },
});

export default StoreDetailsScreen;
