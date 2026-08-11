import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PARTNERS = [
  { id: '1', name: 'Eva', tag: 'Hygiene Partner', color: '#7E22CE' },
  { id: '2', name: 'Fems', tag: 'Care Partner', color: '#DB2777' },
  { id: '3', name: 'amanté', tag: 'Apparel Partner', color: '#1F2937' },
  { id: '4', name: 'Healthguard', tag: 'Pharmacy Network', color: '#0284C7' },
  { id: '5', name: 'Union Chemists', tag: 'Distribution Partner', color: '#059669' },
];

export default function AboutScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#1F2937" />
      </TouchableOpacity>

      {/* Main Copy (Exact Match to Image) */}
      <Text style={styles.heading}>
        We are a community-driven initiative dedicated to empowering women through instant, discreet support.
      </Text>

      <Text style={styles.paragraph}>
        Women-to-Women Instant Network (W2W-IN) connects nearby verified women to help each other in moments of need, whether it's an unexpected period.
      </Text>

      <Text style={styles.mission}>
        Our mission is simple: no woman should ever feel alone in public.
      </Text>

      {/* Partner Logos Grid */}
      <View style={styles.partnerSection}>
        <Text style={styles.partnerHeading}>Our Strategic Partners</Text>
        <Text style={styles.partnerSub}>Backed by leading health, hygiene, and retail networks.</Text>

        <View style={styles.logoGrid}>
          {PARTNERS.map((partner) => (
            <View key={partner.id} style={styles.logoCard}>
              <View style={[styles.brandCircle, { backgroundColor: partner.color }]}>
                <Text style={styles.brandCircleText}>{partner.name.charAt(0)}</Text>
              </View>
              <Text style={styles.brandName}>{partner.name}</Text>
              <Text style={styles.brandTag}>{partner.tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3E8FF' }, // Soft lavender tint matching image
  content: { padding: 25, paddingTop: 50, paddingBottom: 40 },
  backBtn: { marginBottom: 25 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1F2937', lineHeight: 32, marginBottom: 25 },
  paragraph: { fontSize: 18, fontWeight: '600', color: '#374151', lineHeight: 28, marginBottom: 25 },
  mission: { fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 30, marginBottom: 35 },
  
  partnerSection: { borderTopWidth: 1, borderTopColor: '#DDD6FE', paddingTop: 25, marginTop: 10 },
  partnerHeading: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  partnerSub: { fontSize: 12, color: '#6B7280', marginBottom: 20, marginTop: 2 },
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  logoCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 15, elevation: 1 },
  brandCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  brandCircleText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  brandName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  brandTag: { fontSize: 11, color: '#6B7280', marginTop: 2 }
});