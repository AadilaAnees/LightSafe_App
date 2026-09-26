import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { getKindnessPoints } from '../utils/rewardsStorage';

export default function RewardsScreen({ navigation }) {
  const screenWidth = Dimensions.get('window').width - 40;
  const [claimedVoucher, setClaimedVoucher] = useState(null);
  const [totalPoints, setTotalPoints] = useState(380);

  useEffect(() => {
    (async () => {
      const pts = await getKindnessPoints();
      setTotalPoints(pts);
    })();
  }, []);

  // Realistic monthly assistance score totals
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [40, 80, 20, 110, 60, 70] }],
  };

  const handleClaim = (title, code, brand) => {
    setClaimedVoucher({ title, code, brand });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F6' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kindness Rewards</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Main Score Banner */}
        <View style={styles.scoreBanner}>
          <Text style={styles.scoreLabel}>Total Kindness Score</Text>
          <Text style={styles.scoreValue}>{totalPoints} Points</Text>
          <Text style={styles.scoreSub}>You have assisted {Math.max(7, Math.floor(totalPoints / 50))} sisters in your community!</Text>
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
            onPress={() =>
              handleClaim(
                'Free Eva Ultra Sanitary Pad Pack',
                'EVA-LIGHTSAFE-2026',
                'EVA'
              )
            }
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
            onPress={() =>
              handleClaim(
                'Fems Intimate Wash Sample Pack',
                'FEMS-CARE-2026',
                'FEMS'
              )
            }
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

      {/* Claim Voucher Modal (100% Reliable on Web & Mobile) */}
      <Modal visible={!!claimedVoucher} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="gift" size={36} color="#D44D5C" />
            </View>
            <Text style={styles.modalTitle}>🎉 Voucher Claimed!</Text>
            <Text style={styles.modalSubtitle}>{claimedVoucher?.title}</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Redeem Code at Pharmacy:</Text>
              <Text style={styles.codeText}>{claimedVoucher?.code}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setClaimedVoucher(null);
                navigation.navigate('Pharmacies');
              }}
            >
              <Ionicons name="location" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.modalPrimaryText}>View Partner Pharmacies</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setClaimedVoucher(null)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingTop: 45, paddingBottom: 60 },
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
  claimBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 25, width: '100%', maxWidth: 360, alignItems: 'center', elevation: 10 },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 18 },
  codeContainer: { backgroundColor: '#F3F4F6', borderRadius: 14, padding: 14, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  codeLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  codeText: { fontSize: 18, fontWeight: 'bold', color: '#D44D5C', letterSpacing: 1.5 },
  modalPrimaryBtn: { backgroundColor: '#D44D5C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 14, borderRadius: 14, marginBottom: 10 },
  modalPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  modalCloseBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
});