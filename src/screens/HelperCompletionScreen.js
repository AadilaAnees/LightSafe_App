import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelperCompletionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.title}>Completed Successfully!</Text>
        <Text style={styles.subtitle}>You provided assistance and helped a sister stay safe.</Text>

        <View style={styles.rewardBox}>
          <Text style={styles.rewardText}>+50 Kindness Points Earned!</Text>
        </View>

        <TouchableOpacity 
          style={styles.rewardsBtn} 
          onPress={() => navigation.navigate('Rewards')}
        >
          <Text style={styles.rewardsBtnText}>View My Kindness Rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeBtn} 
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.homeBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: 'white', padding: 30, borderRadius: 24, alignItems: 'center', width: '100%', elevation: 3 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 15 },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  rewardBox: { backgroundColor: '#ECFDF5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginVertical: 18 },
  rewardText: { color: '#059669', fontWeight: 'bold', fontSize: 15 },
  rewardsBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardsBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  homeBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  homeBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 15 },
});