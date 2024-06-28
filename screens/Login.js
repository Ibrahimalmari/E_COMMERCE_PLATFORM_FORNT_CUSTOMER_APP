import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import COLORS from '../constants/colors';
import Button from '../components/Button';

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isChecked, setIsChecked] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [location, setLocation] = useState(null);

    useEffect(() => {
        const requestLocationPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMessage('إذن الموقع مرفوض');
                setShowError(true);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        };

        requestLocationPermission();
    }, []);

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleLogin = async () => {
        let errors = {};

        if (!email || !isValidEmail(email)) {
            errors.email = 'الرجاء إدخال عنوان بريد إلكتروني صالح';
        }

        if (!isChecked) {
            errors.isChecked = 'يجب قبول شروط وأحكام الاستخدام';
        }

        setErrors(errors);

        if (Object.keys(errors).length === 0) {
            setLoading(true);
            setShowError(false);

            try {
                const response = await axios.post('http://10.0.2.2:8000/api/LoginUser', {
                    email: email,
                });

                setLoading(false);

                if (response.data.status === 'verification_needed') {
                    await AsyncStorage.setItem('customerToken', response.data.customerToken);
                    await AsyncStorage.setItem('customer_id', response.data.customer_id.toString());
                    console.log(response.data.customerToken, response.data.customer_id);
                    navigation.navigate('VerifyEmailScreen', { email: email });
                } else if (response.data.status === 'success') {
                    await AsyncStorage.setItem('customerToken', response.data.customerToken);
                    await AsyncStorage.setItem('customer_id', response.data.customer_id.toString());
                    console.log(response.data.customerToken, response.data.customer_id);
                    navigation.navigate('HomeScreen');
                }  else {
                    setErrorMessage(response.data.message || 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.');
                    setShowError(true);
                }
            } catch (error) {
                console.error('error', error);
                setLoading(false);

                let errorMessage = 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.';
                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = 'الرجاء التحقق من البيانات المدخلة وإعادة المحاولة.';
                    } else if (error.response.status === 500) {
                        errorMessage = 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى لاحقًا.';
                        if (error.response.data && error.response.data.message) {
                            errorMessage = error.response.data.message;
                        }
                    }
                }

                setErrorMessage(errorMessage);
                setShowError(true);
            }
        }
    };

    const handleGuestLogin = () => {
        navigation.navigate('HomeScreen');
    };

    return (
        <View style={{ flex: 1, marginHorizontal: 22 }}>
            <View style={{ marginVertical: 22 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 12, color: COLORS.black }}>
                    مرحبًا، مجددًا! 👋
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.black }}>مرحبًا مجددًا، لقد غبت عنا!</Text>
            </View>

            <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>البريد الإلكتروني</Text>
                <TextInput
                    placeholder='أدخل عنوان بريدك الإلكتروني'
                    placeholderTextColor={COLORS.black}
                    keyboardType='email-address'
                    style={{ width: '100%', height: 48, borderColor: COLORS.black, borderWidth: 1, borderRadius: 8, paddingHorizontal: 22 }}
                    value={email}
                    onChangeText={setEmail}
                />
                {errors.email && <Text style={{ color: 'red', marginTop: 5 }}>{errors.email}</Text>}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
                    <Ionicons name={isChecked ? 'checkbox-outline' : 'square-outline'} size={24} color={COLORS.black} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 16 }}>أوافق على الشروط والأحكام</Text>
            </View>
            {errors.isChecked && <Text style={{ color: 'red', marginTop: 5 }}>{errors.isChecked}</Text>}

            {location && (
                <Text style={{ color: COLORS.black, marginBottom: 12 }}>
                    الموقع الحالي: خط العرض: {location.coords.latitude}, خط الطول: {location.coords.longitude}
                </Text>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 18 }} />
            ) : (
                <>
                    <Button title="تسجيل الدخول" filled onPress={handleLogin} style={{ marginTop: 18, marginBottom: 4 }} />
                    <Button title="الدخول كزائر" filled onPress={handleGuestLogin} style={{ marginTop: 18, marginBottom: 4, backgroundColor: COLORS.grey }} />
                </>
            )}

            {showError && (
                <View style={{ marginVertical: 12 }}>
                    <Text style={{ color: 'red', textAlign: 'center' }}>{errorMessage}</Text>
                </View>
            )}
        </View>
    );
};

export default Login;
