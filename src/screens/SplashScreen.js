import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LightSafeLogo from '../components/LightSafeLogo'; // Import component

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* 📍 ADDED HERE */}
      <LightSafeLogo size={180} showText={true} />
      <Text style={styles.tagline}>Commence • Connect • Care</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', justifyContent: 'center', alignItems: 'center' },
  tagline: { fontSize: 13, color: '#6B7280', marginTop: 15, letterSpacing: 1 }
});