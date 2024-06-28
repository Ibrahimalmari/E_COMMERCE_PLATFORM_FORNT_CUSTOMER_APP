import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';

const VerifyEmailScreen = ({ navigation, route }) => {
  const { email } = route.params; // Receive the phone number from Login
  const [verificationCodes, setVerificationCodes] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleVerificationCodeChange = (index, value) => {
    const newVerificationCodes = [...verificationCodes];
    newVerificationCodes[index] = value;
    setVerificationCodes(newVerificationCodes);

    if (value.length === 1 && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (value.length === 0 && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyEmail = async () => {
    try {
      const verificationCode = verificationCodes.join('');
      const response = await fetch('http://10.0.2.2:8000/api/verifyemail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, verification_code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('نجاح', data.message);
        // Navigate to the complete registration screen
        navigation.navigate('CompleteRegistrationScreen', { email: email });
      } else {
        Alert.alert('خطأ', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الرجاء إدخال رمز التحقق (ستة أرقام)</Text>
      <View style={styles.codeContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => inputRefs.current[index] = ref}
            style={styles.codeBox}
            onChangeText={(text) => handleVerificationCodeChange(index, text)}
            value={verificationCodes[index]}
            maxLength={1}
            keyboardType="numeric"
            textAlign="center"
            autoFocus={index === 0}
          />
        ))}
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={verifyEmail}>
          <Text style={styles.buttonText}>تحقق من حسابك</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  codeBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    width: 200,
    height: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VerifyEmailScreen;
