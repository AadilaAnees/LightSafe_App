import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PHARMACIES = [
  // Major Chains
  { id: '1', name: 'Healthguard Pharmacy - Bambalapitiya', address: 'Galle Road, Colombo 04', distance: '1.2 km away', status: 'In Stock' },
  { id: '2', name: 'Union Chemists - Colpetty', address: 'Dharmapala Mawatha, Colombo 03', distance: '2.4 km away', status: 'In Stock' },
  { id: '3', name: 'Lanka Pharmacy - Dehiwala', address: 'Galle Road, Dehiwala', distance: '3.1 km away', status: 'In Stock' },
  { id: '4', name: 'Healthguard Pharmacy - Wellawatte', address: 'Maya Avenue, Colombo 06', distance: '3.8 km away', status: 'Limited Stock' },
  { id: '5', name: 'Superpharm - Rajagiriya', address: 'Parliament Road, Rajagiriya', distance: '4.2 km away', status: 'In Stock' },
  
  // Hospital & Regional Chains
  { id: '6', name: 'Asiri Surgical Pharmacy - Narahenpita', address: 'Kirimandala Mawatha, Colombo 05', distance: '4.8 km away', status: 'In Stock' },
  { id: '7', name: 'Nawaloka Medicare Pharmacy - Nugegoda', address: 'High Level Road, Nugegoda', distance: '5.5 km away', status: 'In Stock' },
  { id: '8', name: 'Cargills Express Pharmacy - Kirulapone', address: 'Baseline Road, Colombo 05', distance: '5.9 km away', status: 'In Stock' },
  
  // Outer Colombo & Campus Hubs
  { id: '9', name: 'State Pharmaceuticals Corporation (SPC) - Kelaniya', address: 'Kandy Road, Kelaniya', distance: '8.2 km away', status: 'In Stock' },
  { id: '10', name: 'City Pharmacy - Maharagama', address: 'High Level Road, Maharagama', distance: '9.0 km away', status: 'Limited Stock' },
];

export default function PharmaciesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Pharmacy Network</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtext}>
        Show your claimed voucher code at any of these verified partner outlets to pick up your free pad packs or discounts.
      </Text>

      <FlatList
        data={PHARMACIES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pharmacyName}>{item.name}</Text>
              <Text style={styles.pharmacyAddr}>{item.address}</Text>
              <View style={styles.tagRow}>
                <Text style={styles.distTag}>{item.distance}</Text>
                <Text style={[styles.stockTag, item.status === 'In Stock' ? styles.inStock : styles.lowStock]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.mapBtn}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.name)}`)}
            >
              <Ionicons name="navigate-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  subtext: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  pharmacyName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  pharmacyAddr: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  tagRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  distTag: { fontSize: 11, color: '#4B5563', marginRight: 10, fontWeight: '500' },
  stockTag: { fontSize: 11, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
  inStock: { backgroundColor: '#ECFDF5', color: '#059669' },
  lowStock: { backgroundColor: '#FEF3C7', color: '#D97706' },
  mapBtn: { backgroundColor: '#D44D5C', padding: 12, borderRadius: 12, marginLeft: 10 }
});