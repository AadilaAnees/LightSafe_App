import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Ionicons name="heart-circle" size={90} color="#D44D5C" />
      <Text style={styles.title}>Welcome to LightSafe!</Text>
      <Text style={styles.sub}>Your identity is verified. You are now part of our trusted sisterhood network.</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.btnTxt}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginTop: 20 },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 20, marginBottom: 35 },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});