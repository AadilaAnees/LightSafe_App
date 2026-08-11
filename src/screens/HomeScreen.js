import React, { useState, useEffect } from 'react';
import LightSafeLogo from '../components/LightSafeLogo';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
  const [flowState, setFlowState] = useState('IDLE');
  const [requestType, setRequestType] = useState('Instant Emergency');
  const [userCoords, setUserCoords] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [helperData, setHelperData] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserCoords(loc.coords);
    })();
  }, []);

  useEffect(() => {
    if (!activeRequestId) return;

    const unsubscribe = onSnapshot(doc(db, "requests", activeRequestId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'accepted') {
          setHelperData({
            name: data.helperName || 'Sister Volunteer',
            phone: data.helperPhone || '+15555555555',
            distance: data.helperDistance || '180 meters away',
            location: data.helperLocation || {
              latitude: (userCoords?.latitude || 6.9271) + 0.0015,
              longitude: (userCoords?.longitude || 79.8612) + 0.0015
            }
          });
          setFlowState('ACCEPTED');
        }
      }
    });

    return () => unsubscribe();
  }, [activeRequestId, userCoords]);

  const handleInitiateHelp = (type) => {
    setRequestType(type);
    setFlowState('CONFIRM_LOCATION');
  };

  const handleConfirmLocation = async () => {
    try {
      setFlowState('SEARCHING');
      const docRef = await addDoc(collection(db, "requests"), {
        userId: auth.currentUser?.uid || "guest_user",
        requestType: requestType,
        location: {
          latitude: userCoords?.latitude || 6.9271,
          longitude: userCoords?.longitude || 79.8612,
        },
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setActiveRequestId(docRef.id);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not broadcast request.");
      setFlowState('IDLE');
    }
  };

  const handlePhoneCall = () => {
    if (!helperData?.phone) return;
    Linking.openURL(`tel:${helperData.phone}`);
  };

  const handleFinalizeFeedback = async () => {
    if (activeRequestId) {
      try {
        await deleteDoc(doc(db, "requests", activeRequestId));
      } catch (e) {
        console.error("Error wiping request:", e);
      }
    }
    setActiveRequestId(null);
    setHelperData(null);
    setFeedbackText('');
    setFlowState('IDLE');
    Alert.alert("Thank You!", "Feedback submitted and active session wiped for your privacy.");
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* 📍 COMPACT HEADER LOGO ADDED HERE */}
          <LightSafeLogo size={42} showText={false} />
          
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greeting}>Hi Hiruni,</Text>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
          </View>
        </View>

          <TouchableOpacity 
          style={[styles.bellBtn, helperData && styles.bellBtnActive]}
          onPress={() => {
            if (helperData) setFlowState('ACCEPTED');
            else Alert.alert("Notifications", "No active help requests.");
          }}
        >
          <Ionicons name="notifications-outline" size={20} color={helperData ? "#EF4444" : "#374151"} />
        </TouchableOpacity>
        </View>

        {/* Active Assistance Banner */}
        {helperData && (
          <TouchableOpacity 
            style={styles.activeBanner} 
            onPress={() => setFlowState('ACCEPTED')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.pulseDot} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.bannerTitle}>Sister on the way! ({helperData.distance})</Text>
                <Text style={styles.bannerSub}>Tap to view map, call, or chat</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D44D5C" />
          </TouchableOpacity>
        )}

{/* Quick Grid Tiles */}
<View style={styles.grid}>
  {/* Need a Pad - Custom Vector Icon */}
  <TouchableOpacity 
    style={[styles.tile, { backgroundColor: '#F3E8FF' }]} 
    onPress={() => handleInitiateHelp('Need a Pad')}
  >
    <MaterialCommunityIcons name="hand-heart-outline" size={32} color="#7E22CE" style={styles.tileIcon} />
    <Text style={styles.tileTitle}>Need a pad</Text>
  </TouchableOpacity>

  {/* Find a Mentor */}
  <TouchableOpacity 
    style={[styles.tile, { backgroundColor: '#FCE7F3' }]} 
    onPress={() => navigation.navigate('Mentors')}
  >
    <Ionicons name="people-outline" size={32} color="#DB2777" style={styles.tileIcon} />
    <Text style={styles.tileTitle}>Find a mentor</Text>
  </TouchableOpacity>

  {/* Wellness Mode */}
  <TouchableOpacity 
    style={[styles.tile, { backgroundColor: '#E0F2FE' }]} 
    onPress={() => navigation.navigate('Wellness')}
  >
    <MaterialCommunityIcons name="flower-outline" size={32} color="#0284C7" style={styles.tileIcon} />
    <Text style={styles.tileTitle}>Wellness Mode</Text>
  </TouchableOpacity>

  {/* Swapped Settings to Map / Safe Zones */}
  <TouchableOpacity 
    style={[styles.tile, { backgroundColor: '#F3F4F6' }]} 
    onPress={() => navigation.navigate('Map')}
  >
    <Ionicons name="map-outline" size={30} color="#4B5563" style={styles.tileIcon} />
    <Text style={styles.tileTitle}>Map / Help Zones</Text>
  </TouchableOpacity>
</View>

{/* Instant Help Green Button (Pushed down slightly) */}
<View style={styles.sosContainer}>
  <TouchableOpacity 
    style={styles.sosButton} 
    onPress={() => handleInitiateHelp('Instant Emergency')}
    activeOpacity={0.8}
  >
    <Feather name="alert-circle" size={32} color="white" />
    <Text style={styles.sosText}>INSTANT HELP</Text>
    <Text style={styles.sosSubtext}>Tap to request immediate assistance</Text>
  </TouchableOpacity>
</View>

      </ScrollView>

      {/* ----------------- MODAL 1: CONFIRM LOCATION ----------------- */}
      <Modal visible={flowState === 'CONFIRM_LOCATION'} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Confirm Your Pickup Location</Text>
          <Text style={styles.modalSubHeader}>Requesting: {requestType}</Text>

          {userCoords && (
            <MapView
              style={styles.mapConfirmation}
              initialRegion={{
                latitude: userCoords.latitude,
                longitude: userCoords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker coordinate={userCoords} title="Your Location" pinColor="#D44D5C" />
            </MapView>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#E5E7EB' }]} 
              onPress={() => setFlowState('IDLE')}
            >
              <Text style={{ color: '#374151', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#D44D5C' }]} 
              onPress={handleConfirmLocation}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------- MODAL 2: SEARCHING OVERLAY ----------------- */}
      <Modal visible={flowState === 'SEARCHING'} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color="#D44D5C" />
            <Text style={styles.searchingTitle}>Broadcast Sent!</Text>
            <Text style={styles.searchingSub}>Finding a nearby helper within 1 km radius...</Text>
            
            <TouchableOpacity 
              style={styles.demoTrigger} 
              onPress={() => {
                if (activeRequestId) {
                  updateDoc(doc(db, "requests", activeRequestId), {
                    status: "accepted",
                    helperName: "Sister Volunteer",
                    helperPhone: "+15555555555",
                    helperDistance: "180 meters away"
                  });
                }
              }}
            >
              <Text style={{ fontSize: 11, color: '#888' }}>[Demo: Simulate Acceptance]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------- MODAL 3: HELPER TRACKING SHEET ----------------- */}
      <Modal visible={flowState === 'ACCEPTED'} animationType="slide">
        <View style={styles.fullTrackingContainer}>
          <View style={styles.trackingHeader}>
            <TouchableOpacity onPress={() => setFlowState('IDLE')}>
              <Text style={styles.minimizeBtn}>✕ Minimize</Text>
            </TouchableOpacity>
            <Text style={styles.trackingTitle}>Live Assistance</Text>
            <View style={{ width: 60 }} />
          </View>

          {userCoords && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: userCoords.latitude,
                longitude: userCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={userCoords} title="You" pinColor="blue" />
              {helperData?.location && (
                <Marker coordinate={helperData.location} title={helperData.name} pinColor="green" />
              )}
            </MapView>
          )}

          <View style={styles.bottomSheetCard}>
            <Text style={styles.matchTitle}>🎉 Helper Connected!</Text>
            <Text style={styles.matchSub}>{helperData?.name} is on her way.</Text>
            <Text style={styles.matchDistance}>Distance: {helperData?.distance}</Text>

            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.callBtn} onPress={handlePhoneCall}>
                <Ionicons name="call" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnIconText}>Call Helper</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.chatBtn} 
                onPress={() => {
                  setFlowState('IDLE');
                  navigation.navigate('Chat', { requestId: activeRequestId, role: 'requester' });
                }}
              >
                <Ionicons name="chatbubbles" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.btnIconText}>Chat</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.resolvedBtn} 
              onPress={() => setFlowState('FEEDBACK')}
            >
              <Text style={styles.resolvedText}>Help Received (Rate & End)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------- MODAL 4: FEEDBACK & RATING ----------------- */}
      <Modal visible={flowState === 'FEEDBACK'} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackHeader}>How was your experience?</Text>
            <Text style={styles.feedbackSub}>Rate your session with {helperData?.name}</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={rating >= star ? "star" : "star-outline"} 
                    size={32} 
                    color={rating >= star ? "#F59E0B" : "#D1D5DB"} 
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Leave 1-line feedback (e.g. Quick and sweet!)..."
              placeholderTextColor="#888"
              value={feedbackText}
              onChangeText={setFeedbackText}
              maxLength={100}
            />

            <TouchableOpacity style={styles.submitFeedbackBtn} onPress={handleFinalizeFeedback}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit & Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  greeting: { fontSize: 16, color: '#666' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  bellBtn: { padding: 10, backgroundColor: 'white', borderRadius: 20, elevation: 2, position: 'relative' },
  bellBtnActive: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#DC2626', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  activeBanner: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#991B1B' },
  bannerSub: { fontSize: 12, color: '#B91C1C', marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  tile: { width: '48%', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { marginBottom: 8 },
  tileTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  
  // Spacing container to push Instant Help down
  sosContainer: { marginTop: 35, marginBottom: 15 },
  sosButton: { backgroundColor: '#3A7D7C', padding: 25, borderRadius: 100, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  sosText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  sosSubtext: { color: '#E6F4F1', fontSize: 11, marginTop: 4 },

  modalContainer: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: 'white' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  modalSubHeader: { fontSize: 14, color: '#D44D5C', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  mapConfirmation: { flex: 1, borderRadius: 16, marginBottom: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, padding: 16, borderRadius: 12, alignItems: 'center' },

  searchingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchingBox: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', width: '100%' },
  searchingTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#1F2937' },
  searchingSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8 },
  demoTrigger: { marginTop: 25 },

  fullTrackingContainer: { flex: 1, backgroundColor: 'white' },
  trackingHeader: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  minimizeBtn: { color: '#D44D5C', fontSize: 15, fontWeight: 'bold' },
  trackingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  bottomSheetCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, alignItems: 'center', elevation: 10 },
  matchTitle: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  matchSub: { fontSize: 14, color: '#4B5563', marginVertical: 4 },
  matchDistance: { fontSize: 13, color: '#D44D5C', fontWeight: '600', marginBottom: 15 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  callBtn: { flex: 0.48, backgroundColor: '#2563EB', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chatBtn: { flex: 0.48, backgroundColor: '#D44D5C', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnIconText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  resolvedBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  resolvedText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  feedbackBox: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '100%', alignItems: 'center' },
  feedbackHeader: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  feedbackSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 15 },
  starRow: { flexDirection: 'row', marginBottom: 15 },
  feedbackInput: { width: '100%', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 13, color: '#1F2937', marginBottom: 15 },
  submitFeedbackBtn: { backgroundColor: '#D44D5C', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' }
});