import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Footer from './PageBasics/Footer';

const AccountScreen = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      if (token) {
        setIsLoggedIn(true);
        fetchUserData(token);
      }
      setLoading(false);
    };

    checkLoginStatus();
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/customer', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === 200) {
        setUser(data.customer);
      } else {
        setUser(null);
        console.log('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    const token = await AsyncStorage.getItem('customerToken');
    if (token) {
      try {
        const response = await fetch('http://10.0.2.2:8000/api/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status === 200) {
          await AsyncStorage.clear(); // حذف كل البيانات من AsyncStorage
          setIsLoggedIn(false);
          setUser(null);
          const token = await AsyncStorage.getItem('customerToken');
            console.log(token);
          console.log('Logged out successfully');
        } else {
          console.log('Failed to logout');
        }
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  const helpItems = [
    { id: '1', title: 'سياسة الخصوصية', icon: 'shield' },
    { id: '2', title: 'شروط الاستخدام', icon: 'file-text' },
    { id: '3', title: 'الأسئلة الشائعة', icon: 'help-circle' },
    { id: '4', title: 'حول التطبيق', icon: 'info' },
    { id: '5', title: 'تواصل معنا', icon: 'phone' },
  ];

  const profileMenuItems = [
    { id: 'profile', title: 'تعديل ملفي الشخصي', screen: 'EditProfileScreen' },
    { id: 'requests', title: 'طلباتي', screen: 'MyRequestsScreen' },
    { id: 'addresses', title: 'عناويني', screen: 'MyAddressesScreen' },
    { id: 'favorites', title: 'المفضلة', screen: 'MyFavoritesScreen' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>جار التحميل...</Text>
      </View>
    );
  }

  const sections = isLoggedIn
    ? [
        { title: 'ملفي الشخصي', data: profileMenuItems },
        { title: 'مركز المساعدة', data: helpItems },
      ]
    : [{ title: 'مركز المساعدة', data: helpItems }];

  return (
    <View style={styles.container}>
      {isLoggedIn && user && (
        <Text style={styles.username}>{user.name}</Text>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Feather name="chevron-left" size={20} color="#333" style={styles.optionIconRight} />
            <Text style={styles.optionText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Feather name={title === 'ملفي الشخصي' ? 'user' : 'help-circle'} size={20} color="#333" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
      />

      {!isLoggedIn && (
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Feather name="log-in" size={20} color="#333" style={styles.loginIcon} />
          <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      )}

      {isLoggedIn && (
        <TouchableOpacity style={[styles.option, styles.lastOption]} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#333" style={styles.optionIcon} />
          <Text style={styles.optionText}>تسجيل خروج</Text>
        </TouchableOpacity>
      )}

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionIcon: {
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionIconRight: {
    marginLeft: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  loginButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  loginIcon: {
    marginLeft: 10,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  lastOption: {
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountScreen;
