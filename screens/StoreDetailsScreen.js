import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const StoreDetailsScreen = () => {
  const [storeDetails, setStoreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [storeId, setStoreId] = useState(1);
  const navigation = useNavigation();

  useEffect(() => {
    if (!storeId) return;

    const fetchStoreDetails = () => {
      const dummyStoreDetails = {
        id: storeId,
        name: 'مطعم أ',
        serviceType: 'إيطالي',
        openingHours: '9:00 صباحًا',
        closingHours: '11:00 مساءً',
        expectedDeliveryTime: '30 دقيقة',
        deliveryFee: '2.99 دولار',
        distance: '5 كم',
        image: 'https://via.placeholder.com/300',
        logo: 'https://via.placeholder.com/100',
        categories: [
          {
            id: '1',
            name: 'المقبلات',
            products: [
              { id: '1', name: 'سلطة خضراء', ingredients: 'خس، طماطم، خيار', price: '5.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '2', name: 'حساء الطماطم', ingredients: 'طماطم، ثوم، بصل', price: '3.50 دولار', image: 'https://via.placeholder.com/150' },
              { id: '9', name: 'بروشيتا', ingredients: 'خبز، طماطم، ريحان', price: '4.00 دولار', image: 'https://via.placeholder.com/150' },
            ],
          },
          {
            id: '2',
            name: 'الأطباق الرئيسية',
            products: [
              { id: '3', name: 'بيتزا مارغريتا', ingredients: 'جبن، طماطم، ريحان', price: '8.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '4', name: 'مكرونة بولونيز', ingredients: 'مكرونة، لحم مفروم، طماطم', price: '10.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '10', name: 'ريزوتو بالفطر', ingredients: 'أرز، فطر، جبن', price: '12.00 دولار', image: 'https://via.placeholder.com/150' },
            ],
          },
          {
            id: '3',
            name: 'الحلويات',
            products: [
              { id: '5', name: 'تيراميسو', ingredients: 'قهوة، ماسكربوني، كاكاو', price: '6.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '6', name: 'جاتو الشوكولاتة', ingredients: 'شوكولاتة، دقيق، سكر', price: '7.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '11', name: 'بودينج الفانيليا', ingredients: 'حليب، فانيليا، سكر', price: '5.50 دولار', image: 'https://via.placeholder.com/150' },
            ],
          },
          {
            id: '4',
            name: 'المشروبات',
            products: [
              { id: '7', name: 'عصير برتقال طازج', ingredients: 'برتقال', price: '2.50 دولار', image: 'https://via.placeholder.com/150' },
              { id: '8', name: 'شاي مثلج', ingredients: 'شاي، ليمون، سكر', price: '2.00 دولار', image: 'https://via.placeholder.com/150' },
              { id: '12', name: 'قهوة لاتيه', ingredients: 'حليب، قهوة', price: '3.00 دولار', image: 'https://via.placeholder.com/150' },
            ],
          },
        ],
      };

      setTimeout(() => {
        setStoreDetails(dummyStoreDetails);
        setShowLoading(false);
        setLoading(false);
      }, 2000);
    };

    fetchStoreDetails();
  }, [storeId]);

  if (showLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365D9B" />
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: storeDetails.image }} style={styles.storeImage} />
        <View style={styles.iconOverlay}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="heart" size={20} color="#ff6347" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="share-2" size={20} color="#365D9B" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.storeDetailsContainer}>
          <View style={styles.storeInfoLeft}>
            <Text style={styles.storeLabelText}>النوع:</Text>
            <Text style={styles.storeText}>{storeDetails.serviceType}</Text>
            <Text style={styles.storeLabelText}>ساعات العمل:</Text>
            <Text style={styles.storeText}>{storeDetails.openingHours} - {storeDetails.closingHours}</Text>
            <Text style={styles.storeLabelText}>المسافة:</Text>
            <Text style={styles.storeText}>{storeDetails.distance}</Text>
          </View>
          <View style={styles.storeInfoRight}>
            <Text style={styles.storeLabelText}>وقت التوصيل المتوقع:</Text>
            <Text style={styles.storeText}>{storeDetails.expectedDeliveryTime}</Text>
            <Text style={styles.storeLabelText}>رسوم التوصيل:</Text>
            <Text style={styles.storeText}>{storeDetails.deliveryFee}</Text>
          </View>
        </View>

      {storeDetails.categories.map((category) => (
        <View key={category.id} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <FlatList
            data={category.products}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productIngredients}>{item.ingredients}</Text>
                  <Text style={styles.productPrice}>{item.price}</Text>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      ))}
    </ScrollView>
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
  imageContainer: {
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: 250,
  },
  iconOverlay: {
    position: 'absolute',
    top: 12,
    left: 10,
    flexDirection: 'row',
  },
  iconButton: {
    marginRight: 10,
    marginTop:10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  storeInfoContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  storeLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  storeDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    marginVertical: 10,
  },
  storeInfoLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  storeInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  storeLabelText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  storeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
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
  },
  horizontalList: {
    paddingLeft: 10,
  },
  productItem: {
    marginRight: 15,
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
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productDetails: {
    padding: 10,
    alignItems: 'center',
  },
  productName: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  productIngredients: {
    textAlign: 'center',
    color: 'gray',
    marginBottom: 5,
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#365D9B',
  },
});

export default StoreDetailsScreen;

