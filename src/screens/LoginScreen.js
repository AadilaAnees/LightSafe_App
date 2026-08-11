import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert("Missing Fields", "Please enter your username and password.");
      return;
    }
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.sub}>Log in to access your LightSafe safety network.</Text>

      <View style={styles.inputBox}>
        <Ionicons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
        <TextInput 
          style={styles.input} 
          placeholder="Username or Email" 
          placeholderTextColor="#9CA3AF"
          value={username} 
          onChangeText={setUsername} 
        />
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor="#9CA3AF"
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
      </View>

      <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Password reset link sent to your registered email.")}>
        <Text style={styles.forgotTxt}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnTxt}>Login</Text>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={{ color: '#6B7280' }}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterDetails')}>
          <Text style={styles.getStartedTxt}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 30, marginTop: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 15, height: 52, marginBottom: 15 },
  input: { flex: 1, color: '#1F2937' },
  forgotTxt: { alignSelf: 'flex-end', color: '#D44D5C', fontWeight: 'bold', fontSize: 12, marginBottom: 25 },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  getStartedTxt: { color: '#D44D5C', fontWeight: 'bold' }
});