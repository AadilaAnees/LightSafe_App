import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function VerifyOTPScreen({ route, navigation }) {
  const { phone } = route.params || { phone: 'your number' };
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    if (otp.length < 4) {
      Alert.alert("Invalid Code", "Please enter the verification code sent to your phone.");
      return;
    }
    navigation.navigate('FaceRecognition');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Step 2 of 4</Text>
      <Text style={styles.title}>Phone Verification</Text>
      <Text style={styles.sub}>Enter the 4-digit SMS code sent to {phone}.</Text>

      <TextInput 
        style={styles.otpInput} 
        placeholder="1234" 
        placeholderTextColor="#D1D5DB"
        keyboardType="number-pad" 
        maxLength={4}
        value={otp} 
        onChangeText={setOtp} 
      />

      <TouchableOpacity style={styles.btn} onPress={handleVerify}>
        <Text style={styles.btnTxt}>Confirm & Proceed ➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, paddingTop: 60 },
  stepHeader: { fontSize: 12, fontWeight: 'bold', color: '#D44D5C' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 30, marginTop: 4 },
  otpInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#D44D5C', borderRadius: 14, height: 60, fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 10, marginBottom: 25, color: '#1F2937' },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});