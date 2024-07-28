// Footer.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerItem}>
        <Feather name="home" size={24} color="black" style={styles.footerIcon} onPress={() => navigation.navigate('HomeScreen')} />
        <Text style={styles.footerText}>الرئيسية</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerItem}>
        <Feather name="search" size={24} color="black" style={styles.footerIcon} />
        <Text style={styles.footerText}>بحث</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('MyOrdersScreen')}>
        <Feather name="shopping-bag" size={24} color="black" style={styles.footerIcon} />
        <Text style={styles.footerText}>الطلبات</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('AccountScreen')}>
        <Feather name="user" size={24} color="black" style={styles.footerIcon} />
        <Text style={styles.footerText}>حسابي</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerIcon: {
    marginBottom: 5,
  },
  footerText: {
    fontSize: 12,
  },
});

export default Footer;
