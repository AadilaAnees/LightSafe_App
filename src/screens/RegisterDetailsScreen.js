import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function RegisterDetailsScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [phone, setPhone] = useState('');

  const handleNext = () => {
    if (!fullName || !nic || !phone) {
      Alert.alert("Incomplete Form", "Please fill in all details to proceed.");
      return;
    }
    navigation.navigate('VerifyOTP', { phone });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Step 1 of 4</Text>
      <Text style={styles.title}>Personal Information</Text>
      <Text style={styles.sub}>Enter your official details for identity verification.</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="National ID (NIC) Number" placeholderTextColor="#9CA3AF" value={nic} onChangeText={setNic} />
      <TextInput style={styles.input} placeholder="Phone Number (+94 ...)" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnTxt}>Verify Phone Number ➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, paddingTop: 60 },
  stepHeader: { fontSize: 12, fontWeight: 'bold', color: '#D44D5C', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 30, marginTop: 4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 15, height: 52, marginBottom: 15, color: '#1F2937' },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});