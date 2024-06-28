import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import COLORS from '../constants/colors';
import Button from '../components/Button';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import RNPickerSelect from 'react-native-picker-select';

const CompleteRegistrationScreen = ({ navigation, route }) => {
    const { email } = route.params;
    const [name, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');
    const [errors, setErrors] = useState({});

    const validateFields = () => {
        let valid = true;
        let errors = {};

        if (!name) {
            errors.name = 'الرجاء إدخال الاسم الكامل';
            valid = false;
        }

        if (!city) {
            errors.city = 'الرجاء اختيار المدينة';
            valid = false;
        }

        if (!gender) {
            errors.gender = 'الرجاء اختيار الجنس';
            valid = false;
        }

        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            errors.phoneNumber = 'الرجاء إدخال رقم هاتف صالح (10 أرقام)';
            valid = false;
        }

        setErrors(errors);
        return valid;
    };

    const handleCompleteRegistration = async () => {
        if (validateFields()) {
            try {
                const response = await axios.post('http://10.0.2.2:8000/api/completeRegistration', {
                    name: name,
                    city: city,
                    gender: gender,
                    phone: phoneNumber,
                    email: email,
                });

                showMessage({
                    message: 'تم استكمال التسجيل بنجاح!',
                    type: 'success',
                    icon: 'success',
                });

                navigation.navigate('HomeScreen');
            } catch (error) {
                console.error('Error:', error);
                showMessage({
                    message: 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
                    type: 'danger',
                    icon: 'danger',
                });
            }
        } else {
            showMessage({
                message: 'الرجاء إدخال جميع الحقول بشكل صحيح.',
                type: 'danger',
                icon: 'danger',
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.innerContainer}>
                <Text style={styles.title}>استكمال التسجيل</Text>

                <TextInput
                    placeholder='الاسم الكامل'
                    placeholderTextColor={COLORS.gray}
                    style={[styles.input, errors.name && styles.inputError]}
                    value={name}
                    onChangeText={setFullName}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <View style={styles.phoneContainer}>
                    <Text style={styles.label}>رقم الهاتف المحمول</Text>
                    <View style={styles.phoneInputContainer}>
                        <TextInput
                            placeholder='+963'
                            placeholderTextColor={COLORS.black}
                            keyboardType='numeric'
                            style={styles.countryCode}
                            value='+963'
                            editable={false}
                        />
                        <TextInput
                            placeholder='ادخل رقم هاتفك'
                            placeholderTextColor={COLORS.gray}
                            keyboardType='numeric'
                            style={styles.phoneNumber}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>
                    {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
                </View>

                <RNPickerSelect
                    onValueChange={(value) => setCity(value)}
                    items={[
                        { label: 'دمشق', value: 'دمشق' },
                        { label: 'ريف دمشق', value: 'ريف دمشق' },
                    ]}
                    style={pickerSelectStyles(errors.city)}
                    placeholder={{
                        label: 'اختر المدينة',
                        value: null,
                    }}
                    value={city}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

                <RNPickerSelect
                    onValueChange={(value) => setGender(value)}
                    items={[
                        { label: 'ذكر', value: 'ذكر' },
                        { label: 'أنثى', value: 'أنثى' },
                    ]}
                    style={pickerSelectStyles(errors.gender)}
                    placeholder={{
                        label: 'اختر الجنس',
                        value: null,
                    }}
                    value={gender}
                />
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

                <Button title="استكمال التسجيل" filled onPress={handleCompleteRegistration} style={styles.button} />
            </ScrollView>
            <FlashMessage position="top" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    innerContainer: {
        flexGrow: 1,
        marginHorizontal: 22,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: COLORS.black,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '400',
        marginVertical: 8,
        color: COLORS.black,
    },
    input: {
        width: '100%',
        height: 48,
        borderColor: COLORS.black,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        textAlign: 'right',
        marginBottom: 12,
        backgroundColor: COLORS.lightGray,
    },
    inputError: {
        borderColor: 'red',
    },
    phoneContainer: {
        marginBottom: 12,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 48,
        borderColor: COLORS.black,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.lightGray,
    },
    countryCode: {
        width: '20%',
        borderRightWidth: 1,
        borderRightColor: COLORS.grey,
        height: '100%',
        textAlign: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        color: COLORS.black,
    },
    phoneNumber: {
        width: '80%',
        height: '100%',
        paddingHorizontal: 8,
        textAlign: 'right',
        color: COLORS.black,
    },
    errorText: {
        color: 'red',
        marginTop: 5,
        textAlign: 'right',
    },
    button: {
        marginTop: 18,
        marginBottom: 4,
    },
});

const pickerSelectStyles = (isError) => ({
    inputIOS: {
        width: '100%',
        height: 48,
        borderColor: isError ? 'red' : COLORS.black,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        textAlign: 'right',
        marginBottom: 12,
        backgroundColor: COLORS.lightGray,
    },
    inputAndroid: {
        width: '100%',
        height: 48,
        borderColor: isError ? 'red' : COLORS.black,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        textAlign: 'right',
        marginBottom: 12,
        backgroundColor: COLORS.lightGray,
    },
});

export default CompleteRegistrationScreen;
