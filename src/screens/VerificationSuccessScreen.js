import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationSuccessScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const handleNext = () => {
    if (!username || !email || !password || !confirmPw) {
      Alert.alert("Missing Fields", "Please complete all fields.");
      return;
    }
    if (password !== confirmPw) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    navigation.navigate('PrivacyConcern');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.badgeRow}>
        <Ionicons name="checkmark-circle" size={28} color="#10B981" />
        <Text style={styles.badgeTxt}>Face Scan Verified</Text>
      </View>

      <Text style={styles.title}>Create Credentials</Text>
      <Text style={styles.sub}>Set up your login details to secure your account.</Text>

      <TextInput style={styles.input} placeholder="Choose Username" placeholderTextColor="#9CA3AF" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#9CA3AF" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#9CA3AF" secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnTxt}>Next: Privacy & Terms ➔</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, paddingTop: 60 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badgeTxt: { marginLeft: 8, color: '#10B981', fontWeight: 'bold', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 25, marginTop: 4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 15, height: 52, marginBottom: 15, color: '#1F2937' },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});