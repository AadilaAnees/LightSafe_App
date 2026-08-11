import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

export default function RewardsScreen({ navigation }) {
  const screenWidth = Dimensions.get('window').width - 40;

  // Realistic monthly assistance score totals
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [40, 80, 20, 110, 60, 70] }]
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kindness Rewards</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Score Banner */}
      <View style={styles.scoreBanner}>
        <Text style={styles.scoreLabel}>Total Kindness Score</Text>
        <Text style={styles.scoreValue}>380 Points</Text>
        <Text style={styles.scoreSub}>You have assisted 7 sisters in your community!</Text>
      </View>

      {/* Monthly Chart */}
      <Text style={styles.sectionHeader}>Monthly Impact Summary</Text>
      <View style={styles.chartBox}>
        <BarChart
          data={chartData}
          width={screenWidth - 20}
          height={180}
          yAxisLabel=""
          yAxisSuffix=" pts"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(212, 77, 92, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          }}
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* Real Brand Rewards */}
      <Text style={styles.sectionHeader}>Brand Rewards & Perks</Text>

      {/* Reward 1: Unlocked - Eva */}
      <View style={styles.rewardCard}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>EVA</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardTitle}>Free Eva Ultra Sanitary Pad Pack</Text>
          <Text style={styles.rewardStatus}>UNLOCKED • 200 Points Required</Text>
        </View>
        <TouchableOpacity 
          style={styles.claimBtn}
          onPress={() => Alert.alert("Voucher Claimed", "Code: EVA-LIGHTSAFE-2026", [
  { text: "View Partner Pharmacies", onPress: () => navigation.navigate('Pharmacies') },
  { text: "Close", style: "cancel" }
])}
        >
          <Text style={styles.claimBtnText}>Claim</Text>
        </TouchableOpacity>
      </View>

      {/* Reward 2: Unlocked - Fems */}
      <View style={styles.rewardCard}>
        <View style={[styles.brandBadge, { backgroundColor: '#FCE7F3' }]}>
          <Text style={[styles.brandBadgeText, { color: '#DB2777' }]}>FEMS</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardTitle}>Fems Intimate Wash Sample Pack</Text>
          <Text style={styles.rewardStatus}>UNLOCKED • 300 Points Required</Text>
        </View>
        <TouchableOpacity 
          style={styles.claimBtn}
          onPress={() => Alert.alert("Voucher Claimed", "Code: FEMS-CARE-2026.")}
        >
          <Text style={styles.claimBtnText}>Claim</Text>
        </TouchableOpacity>
      </View>

      {/* Reward 3: Locked - amanté */}
      <View style={[styles.rewardCard, styles.lockedCard]}>
        <View style={[styles.brandBadge, { backgroundColor: '#E5E7EB' }]}>
          <Text style={[styles.brandBadgeText, { color: '#6B7280' }]}>amanté</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardTitle}>20% Off Voucher at amanté Stores</Text>
          <Text style={styles.rewardLockedStatus}>Requires 500 Points (120 pts needed)</Text>
        </View>
        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
      </View>

      {/* Reward 4: Locked - Healthguard */}
      <View style={[styles.rewardCard, styles.lockedCard]}>
        <View style={[styles.brandBadge, { backgroundColor: '#E5E7EB' }]}>
          <Text style={[styles.brandBadgeText, { color: '#6B7280' }]}>HG</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardTitle}>Free Healthguard Wellness Consultation</Text>
          <Text style={styles.rewardLockedStatus}>Requires 750 Points (370 pts needed)</Text>
        </View>
        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scoreBanner: { backgroundColor: '#3A7D7C', padding: 22, borderRadius: 20, alignItems: 'center', marginBottom: 25 },
  scoreLabel: { color: '#E6F4F1', fontSize: 13 },
  scoreValue: { color: 'white', fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  scoreSub: { color: 'white', fontSize: 12 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  chartBox: { backgroundColor: 'white', padding: 10, borderRadius: 20, alignItems: 'center', marginBottom: 25, elevation: 1 },
  
  // Brand Reward Cards
  rewardCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  lockedCard: { backgroundColor: '#F3F4F6', elevation: 0 },
  brandBadge: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  brandBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#7E22CE' },
  rewardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  rewardStatus: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 2 },
  rewardLockedStatus: { fontSize: 11, color: '#D44D5C', marginTop: 2 },
  claimBtn: { backgroundColor: '#D44D5C', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  claimBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});