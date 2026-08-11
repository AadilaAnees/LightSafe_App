import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function WellnessScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Track'); // 'Track' | 'Insights' | 'Predictions'
  const [selectedDay, setSelectedDay] = useState(7);
  const [symptoms, setSymptoms] = useState({ cramps: true, fatigue: false, headache: true, bloating: false });

  // Continuous Period Days (Days 1–7)
  const periodDays = [1, 2, 3, 4, 5, 6, 7];
  // Predicted Ovulation Days (Days 14–18)
  const ovulationDays = [14, 15, 16, 17, 18];

  const toggleSymptom = (key) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Mode</Text>
        <TouchableOpacity onPress={() => Alert.alert("Calendar Export", "Cycle logs synced with health profile.")}>
          <Ionicons name="cloud-upload-outline" size={22} color="#D44D5C" />
        </TouchableOpacity>
      </View>

      {/* Top 3 Options Bar */}
      <View style={styles.tabRow}>
        {['Track', 'Insights', 'Predictions'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Track' ? 'Track Cycle' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB 1: TRACK MY CYCLE */}
      {activeTab === 'Track' && (
        <View>
          {/* Active Highlight Banner */}
          <View style={styles.dailyCard}>
            <Text style={styles.dayTag}>Day {selectedDay} of Cycle</Text>
            <Text style={styles.cycleFlow}>
              {periodDays.includes(selectedDay) 
                ? "Menstruation Phase • Light Flow" 
                : ovulationDays.includes(selectedDay) 
                ? "Fertile Window • High Energy" 
                : "Follicular / Luteal Phase"}
            </Text>
            <TouchableOpacity 
              style={styles.logBtn}
              onPress={() => Alert.alert("Log Saved", `Logged details for August ${selectedDay}, 2026.`)}
            >
              <Text style={styles.logBtnText}>+ Save Daily Symptoms</Text>
            </TouchableOpacity>
          </View>

          {/* Full August 2026 Calendar Grid */}
          <Text style={styles.sectionTitle}>August 2026 Calendar</Text>
          <View style={styles.calendarBox}>
            <View style={styles.weekHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                <Text key={i} style={styles.weekText}>{w}</Text>
              ))}
            </View>

            {/* 7-Column Grid with Perfect Circular Highlights */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isPeriod = periodDays.includes(day);
                const isOvulation = ovulationDays.includes(day);
                const isSelected = selectedDay === day;

                return (
                  <View key={day} style={styles.dayCellContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.baseCircle,
                        isPeriod && styles.periodCircle,
                        isOvulation && styles.ovulationCircle,
                        isSelected && styles.selectedCircle
                      ]}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayNumber,
                        (isPeriod || isSelected) && { color: 'white', fontWeight: 'bold' },
                        isOvulation && !isSelected && { color: '#059669', fontWeight: 'bold' }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Period (7 Days)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Ovulation Window</Text>
              </View>
            </View>
          </View>

          {/* Daily Symptom Logging Toggles */}
          <Text style={styles.sectionTitle}>Daily Symptom Tracker</Text>
          <View style={styles.symptomsGrid}>
            {[
              { key: 'cramps', label: 'Cramps', icon: 'flash-outline' },
              { key: 'fatigue', label: 'Fatigue', icon: 'battery-dead-outline' },
              { key: 'headache', label: 'Headache', icon: 'sad-outline' },
              { key: 'bloating', label: 'Bloating', icon: 'water-outline' },
            ].map((s) => (
              <TouchableOpacity 
                key={s.key} 
                style={[styles.symptomChip, symptoms[s.key] && styles.symptomChipActive]}
                onPress={() => toggleSymptom(s.key)}
              >
                <Ionicons name={s.icon} size={18} color={symptoms[s.key] ? 'white' : '#4B5563'} />
                <Text style={[styles.symptomText, symptoms[s.key] && styles.symptomTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: INSIGHTS */}
      {activeTab === 'Insights' && (
        <View style={{ gap: 15 }}>
          <View style={styles.insightCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={22} color="#92400E" />
              <Text style={styles.insightTitle}>Hydration & Cramp Relief</Text>
            </View>
            <Text style={styles.insightBody}>
              During Days 1–7 of menstruation, body water levels fluctuate. Drinking 2.5L of warm water daily reduces uterine muscle contractions by up to 35%.
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: '#E0F2FE' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={22} color="#0369A1" />
              <Text style={[styles.insightTitle, { color: '#0369A1' }]}>Light Movement & Yoga</Text>
            </View>
            <Text style={[styles.insightBody, { color: '#075985' }]}>
              Gentle pelvic tilts and child's pose relieve lower back strain. Avoid high-intensity workouts during heavy flow days.
            </Text>
          </View>

          <View style={[styles.insightCard, { backgroundColor: '#F3E8FF' }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="food-apple-outline" size={22} color="#6B21A8" />
              <Text style={[styles.insightTitle, { color: '#6B21A8' }]}>Iron & Magnesium Intake</Text>
            </View>
            <Text style={[styles.insightBody, { color: '#581C87' }]}>
              Replenish iron levels with dark leafy greens, dark chocolate, and spinach to maintain healthy stamina during your period.
            </Text>
          </View>
        </View>
      )}

      {/* TAB 3: PREDICTIONS */}
      {activeTab === 'Predictions' && (
        <View style={{ gap: 18 }}>
          <View style={styles.predictionBanner}>
            <Ionicons name="calendar-sharp" size={36} color="white" />
            <Text style={styles.predictionBannerTitle}>Next Cycle Phase</Text>
            <Text style={styles.predictionBannerDate}>September 2, 2026</Text>
            <Text style={styles.predictionBannerSub}>In approximately 22 Days • 28-Day Cycle Regular</Text>
          </View>

          <View style={styles.predDetailCard}>
            <Text style={styles.predDetailHeader}>Upcoming Phase Breakdown</Text>
            
            <View style={styles.predRow}>
              <Ionicons name="ellipse" size={12} color="#EF4444" style={{ marginTop: 4 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.predRowTitle}>Next Period Expected</Text>
                <Text style={styles.predRowDate}>Sep 2 – Sep 8, 2026</Text>
              </View>
            </View>

            <View style={styles.predRow}>
              <Ionicons name="ellipse" size={12} color="#10B981" style={{ marginTop: 4 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.predRowTitle}>Predicted Fertile Window</Text>
                <Text style={styles.predRowDate}>Aug 14 – Aug 18, 2026</Text>
              </View>
            </View>

            <View style={styles.predRow}>
              <Ionicons name="ellipse" size={12} color="#3B82F6" style={{ marginTop: 4 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.predRowTitle}>Peak Ovulation Day</Text>
                <Text style={styles.predRowDate}>August 16, 2026</Text>
              </View>
            </View>
          </View>

          <View style={styles.alertTile}>
            <Ionicons name="notifications-circle-outline" size={24} color="#D44D5C" />
            <Text style={styles.alertTileText}>Set automated reminder 2 days before next period</Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  tabRow: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#D44D5C' },
  tabText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  tabTextActive: { color: 'white' },

  dailyCard: { backgroundColor: '#FF85A1', padding: 22, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  dayTag: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  cycleFlow: { color: 'white', fontSize: 13, marginVertical: 6 },
  logBtn: { backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginTop: 8 },
  logBtnText: { color: '#FF85A1', fontWeight: 'bold', fontSize: 13 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, marginTop: 10 },
  
  // Calendar Grid Styles with Strict Equal Dimensions
  calendarBox: { backgroundColor: 'white', padding: 18, borderRadius: 20, elevation: 1, marginBottom: 10 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekText: { fontSize: 13, fontWeight: 'bold', color: '#9CA3AF' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCellContainer: { width: '14.28%', height: 42, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  
  // Strict 1:1 Circle Dimensions
  baseCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  periodCircle: { backgroundColor: '#EF4444' },
  ovulationCircle: { borderWidth: 2, borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  selectedCircle: { backgroundColor: '#1F2937' },
  dayNumber: { fontSize: 13, color: '#374151' },

  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 11, color: '#6B7280' },

  // Symptoms
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  symptomChip: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  symptomChipActive: { backgroundColor: '#D44D5C', borderColor: '#D44D5C' },
  symptomText: { marginLeft: 8, fontSize: 13, color: '#374151', fontWeight: '500' },
  symptomTextActive: { color: 'white' },

  // Insights
  insightCard: { backgroundColor: '#FEF3C7', padding: 18, borderRadius: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightTitle: { fontSize: 15, fontWeight: 'bold', color: '#92400E', marginLeft: 8 },
  insightBody: { fontSize: 13, color: '#78350F', lineHeight: 20 },

  // Predictions
  predictionBanner: { backgroundColor: '#3A7D7C', padding: 25, borderRadius: 24, alignItems: 'center' },
  predictionBannerTitle: { color: '#E6F4F1', fontSize: 13, marginTop: 8 },
  predictionBannerDate: { color: 'white', fontSize: 28, fontWeight: 'bold', marginVertical: 4 },
  predictionBannerSub: { color: 'white', fontSize: 11, opacity: 0.9 },
  predDetailCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, elevation: 1 },
  predDetailHeader: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  predRow: { flexDirection: 'row', marginBottom: 15 },
  predRowTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  predRowDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  alertTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 15, borderRadius: 16 },
  alertTileText: { marginLeft: 10, fontSize: 13, color: '#991B1B', fontWeight: '500' }
});