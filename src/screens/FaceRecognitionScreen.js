import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FaceRecognitionScreen({ navigation }) {
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      navigation.navigate('VerificationSuccess');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Step 3 of 4</Text>
      <Text style={styles.title}>Identity Verification</Text>
      <Text style={styles.sub}>Biometric check to ensure a 100% verified female network.</Text>

      <View style={styles.cameraBox}>
        <Ionicons name="scan-outline" size={120} color="#D44D5C" />
        {scanning && <ActivityIndicator size="large" color="#D44D5C" style={{ marginTop: 15 }} />}
      </View>

      <TouchableOpacity style={styles.btn} onPress={startScan} disabled={scanning}>
        <Text style={styles.btnTxt}>{scanning ? "Verifying Identity..." : "Start Face Scan"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, paddingTop: 60, alignItems: 'center' },
  stepHeader: { fontSize: 12, fontWeight: 'bold', color: '#D44D5C', alignSelf: 'flex-start' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', alignSelf: 'flex-start', marginTop: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 30, marginTop: 4, alignSelf: 'flex-start' },
  cameraBox: { width: 240, height: 280, borderRadius: 140, backgroundColor: 'white', borderWidth: 2, borderColor: '#D44D5C', justifyContent: 'center', alignItems: 'center', marginVertical: 30 },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});