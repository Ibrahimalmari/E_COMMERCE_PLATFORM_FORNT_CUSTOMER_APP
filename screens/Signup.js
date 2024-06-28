import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';
import Button from '../components/Button';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isAfter } from 'date-fns';

const Signup = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [city, setCity] = useState('');
    const [birthdate, setBirthdate] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const maxDate = new Date();

    const isValidPhoneNumber = (phoneNumber) => {
        return /^\d{10}$/.test(phoneNumber);
    };

    const isValidEmail = (email) => {
        return /@(?:gmail\.com|gmail\.org)$/i.test(email);
    };

    const showDatePickerModal = () => {
        setShowDatePicker(true);
    };

    const handleSignup = async () => {
        let errors = {};

        if (!name) {
            errors.name = 'الرجاء إدخال الاسم';
        }

        if (!email || !isValidEmail(email)) {
            errors.email = 'الرجاء إدخال عنوان بريد إلكتروني صالح';
        }

        if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
            errors.phoneNumber = 'الرجاء إدخال رقم هاتف صالح (10 أرقام)';
        }

        if (!gender) {
            errors.gender = 'الرجاء تحديد الجنس';
        }

        if (!birthdate || isAfter(new Date(birthdate), new Date())) {
            errors.birthdate = 'الرجاء إدخال تاريخ الميلاد بشكل صحيح';
        }

        if (!city) {
            errors.city = 'الرجاء إدخال اسم المدينة';
        }

        if (!isChecked) {
            errors.isChecked = 'الرجاء الموافقة على الشروط والأحكام';
        }

        setErrors(errors);

        if (Object.keys(errors).length === 0) {
            setLoading(true);
            try {
                const formattedDate = birthdate ? format(new Date(birthdate), 'yyyy/MM/dd') : null;
                const response = await axios.post('http://10.0.2.2:8000/api/StoreUser/', {
                    name: name,
                    email: email,
                    phone: phoneNumber,
                    gender: gender,
                    DateOfBirth: formattedDate,
                    city: city,
                });
                setSuccessMessage('تم تسجيل الحساب بنجاح');
                navigation.navigate('VerifyEmail');
            } catch (error) {
                console.error('error', error);
                console.log(error.response.data);
                setSuccessMessage('');
                setLoading(false);
                Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الحساب، الرجاء المحاولة مرة أخرى.');
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ flex: 1, marginHorizontal: 22 }}>
                    {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}
                    {successMessage !== '' && (
                        <View style={{ backgroundColor: COLORS.successBackground, padding: 10, borderRadius: 8, marginBottom: 10 }}>
                            <Text style={{ color: COLORS.successText }}>{successMessage}</Text>
                        </View>
                    )}
                    <View style={{ marginVertical: 22 }}>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 12, color: COLORS.black }}>
                            إنشاء حساب
                        </Text>
                        <Text style={{ fontSize: 16, color: COLORS.black }}>قم بالاتصال بأصدقائك اليوم!</Text>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>الاسم</Text>
                        <View>
                            <TextInput
                                placeholder='ادخل اسمك'
                                placeholderTextColor={COLORS.black}
                                style={{ width: '100%', height: 48, borderColor: COLORS.black, borderWidth: 1, borderRadius: 8, paddingHorizontal: 22 }}
                                value={name}
                                onChangeText={setName}
                            />
                            {errors.name && <Text style={{ color: 'red', marginTop: 5 }}>{errors.name}</Text>}
                        </View>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>البريد الإلكتروني</Text>
                        <View>
                            <TextInput
                                placeholder='ادخل عنوان بريدك الإلكتروني'
                                placeholderTextColor={COLORS.black}
                                keyboardType='email-address'
                                style={{ width: '100%', height: 48, borderColor: COLORS.black, borderWidth: 1, borderRadius: 8, paddingHorizontal: 22 }}
                                value={email}
                                onChangeText={setEmail}
                            />
                            {errors.email && <Text style={{ color: 'red', marginTop: 5 }}>{errors.email}</Text>}
                        </View>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>رقم الهاتف المحمول</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', height: 48, borderColor: COLORS.black, borderWidth: 1, borderRadius: 8, paddingHorizontal: 22 }}>
                            <TextInput
                                placeholder='+963'
                                placeholderTextColor={COLORS.black}
                                keyboardType='numeric'
                                style={{ width: '12%', borderRightWidth: 1, borderLeftColor: COLORS.grey, height: '100%' }}
                                value='+963'
                                editable={false}
                            />
                            <TextInput
                                placeholder='ادخل رقم هاتفك'
                                placeholderTextColor={COLORS.black}
                                keyboardType='numeric'
                                style={{ width: '80%' }}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                        {errors.phoneNumber && <Text style={{ color: 'red', marginTop: 5 }}>{errors.phoneNumber}</Text>}
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>الجنس</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }} onPress={() => setGender('male')}>
                                <Ionicons name={gender === 'male' ? 'checkbox-outline' : 'square-outline'} size={24} color={COLORS.black} style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 16, fontWeight: '400' }}>ذكر</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setGender('female')}>
                                <Ionicons name={gender === 'female' ? 'checkbox-outline' : 'square-outline'} size={24} color={COLORS.black} style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 16, fontWeight: '400' }}>أنثى</Text>
                            </TouchableOpacity>
                        </View>
                        {errors.gender && <Text style={{ color: 'red', marginTop: 5 }}>{errors.gender}</Text>}
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <TouchableOpacity onPress={showDatePickerModal}>
                            <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>تاريخ الميلاد</Text>
                            <Text style={{ fontSize: 16, color: COLORS.black }}>{birthdate ? new Date(birthdate).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'اختر تاريخ الميلاد'}</Text>
                        </TouchableOpacity>
                        {errors.birthdate && <Text style={{ color: 'red', marginTop: 5 }}>{errors.birthdate}</Text>}
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={birthdate || new Date()} // Use current date if birthdate is null
                            mode="date" // تعيين وضع DateTimePicker إلى "date"
                            display="spinner" // تعيين طريقة عرض DateTimePicker إلى "spinner"
                            maximumDate={maxDate} // Set maximum date
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) {
                                    setBirthdate(date);
                                }
                            }}
                        />
                    )}

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: 400, marginVertical: 8 }}>المدينة</Text>
                        <View>
                            <TextInput
                                placeholder='ادخل اسم المدينة'
                                placeholderTextColor={COLORS.black}
                                style={{ width: '100%', height: 48, borderColor: COLORS.black, borderWidth: 1, borderRadius: 8, paddingHorizontal: 22 }}
                                value={city}
                                onChangeText={setCity}
                            />
                            {errors.city && <Text style={{ color: 'red', marginTop: 5 }}>{errors.city}</Text>}
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
                            <Ionicons name={isChecked ? 'checkbox-outline' : 'square-outline'} size={24} color={COLORS.black} style={{ marginRight: 8 }} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16 }}>أوافق على الشروط والأحكام</Text>
                    </View>
                    {errors.isChecked && <Text style={{ color: 'red', marginTop: 5 }}>{errors.isChecked}</Text>}

                    <Button title="إنشاء حساب" onPress={handleSignup} style={{ marginTop: 18, marginBottom: 4 }} disabled={gender === '' || !isChecked} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.grey, marginHorizontal: 10 }} />
                        <Text style={{ fontSize: 14 }}>أو قم بالتسجيل باستخدام</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.grey, marginHorizontal: 10 }} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <TouchableOpacity onPress={() => console.log('التسجيل باستخدام فيسبوك')}>
                            <Image source={require('../assets/facebook.png')} style={{ height: 36, width: 36, marginRight: 8 }} resizeMode='contain' />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => console.log('التسجيل باستخدام جوجل')}>
                            <Image source={require('../assets/google.png')} style={{ height: 36, width: 36, marginRight: 8 }} resizeMode='contain' />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 22 }}>
                        <Text style={{ fontSize: 16, color: COLORS.black }}>هل لديك حساب بالفعل؟ </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: 'bold' }}> تسجيل الدخول</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Signup;
