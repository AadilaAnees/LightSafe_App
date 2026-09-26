import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  createRequest,
  listenToRequest,
  listenToPendingRequests,
  acceptRequest,
  markRequesterCompleted,
  deleteRequestSession,
} from '../services/requestService';
import { getDistanceInKm } from '../utils/distance';
import { auth } from '../services/firebase';
import WebMapFallback from '../components/WebMapFallback';

// Only import react-native-maps on native platforms — it has no web support.
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function HomeScreen({ navigation, route }) {
  const [flowState, setFlowState] = useState('IDLE'); // IDLE | CONFIRM_LOCATION | SEARCHING | ACCEPTED | FEEDBACK
  const [requestType, setRequestType] = useState('Instant Emergency');
  const [userCoords, setUserCoords] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [helperData, setHelperData] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Dashboard popup for incoming help requests from other sisters
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [dismissedRequests, setDismissedRequests] = useState({});

  // Fetch initial device location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserCoords(loc.coords);
    })();
  }, []);

  // Handle incoming feedback redirect from ChatScreen
  useEffect(() => {
    if (route?.params?.openFeedback) {
      if (route.params.requestId) {
        setActiveRequestId(route.params.requestId);
      }
      setHelperData({
        name: route.params.helperName || 'Sister Volunteer',
      });
      setFlowState('FEEDBACK');
    }
  }, [route?.params]);

  // Real-time listener for request status changes (requester side)
  useEffect(() => {
    if (!activeRequestId) return;

    const unsubscribe = listenToRequest(activeRequestId, (data) => {
      if (!data) {
        setActiveRequestId(null);
        setHelperData(null);
        setFlowState('IDLE');
        return;
      }
      if (data.status === 'accepted') {
        setHelperData({
          name: data.helperName || 'Sister Volunteer',
          helperId: data.helperId,
          location: data.helperLocation || null,
          distance: '~nearby',
        });
        setFlowState('ACCEPTED');
      }
    });

    return () => unsubscribe();
  }, [activeRequestId]);

  // Real-time listener for nearby pending requests to show dashboard popup
  useEffect(() => {
    const unsubscribe = listenToPendingRequests((docs) => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      const validNearby = docs
        .filter((req) => {
          if (!req.location) return false;
          // Don't show own request as incoming popup
          if (req.requesterId === auth.currentUser?.uid) return false;
          // Don't show if dismissed in this session
          if (dismissedRequests[req.id]) return false;
          // Stale filter
          if (req.createdAt?.toMillis && req.createdAt.toMillis() < twoHoursAgo) return false;
          return true;
        })
        .map((req) => {
          const dist = userCoords
            ? getDistanceInKm(
                userCoords.latitude,
                userCoords.longitude,
                req.location.latitude,
                req.location.longitude
              )
            : null;
          return { ...req, distanceKm: dist };
        })
        .filter((req) => req.distanceKm === null || req.distanceKm <= 50.0);

      // Show first nearby request if user is currently IDLE on the home screen
      if (validNearby.length > 0 && flowState === 'IDLE') {
        setIncomingRequest(validNearby[0]);
      } else if (validNearby.length === 0) {
        setIncomingRequest(null);
      }
    });

    return () => unsubscribe();
  }, [userCoords, dismissedRequests, flowState]);

  // Step 1: Open location confirmation sheet
  const handleInitiateHelp = (type = 'Need a Pad') => {
    setRequestType(type);
    setFlowState('CONFIRM_LOCATION');
  };

  // Step 2: Write request to Firestore & start listening
  const handleConfirmLocation = async () => {
    setFlowState('SEARCHING');
    try {
      const requestId = await createRequest(requestType, userCoords);
      setActiveRequestId(requestId);
    } catch (err) {
      console.error('createRequest failed:', err);
      Alert.alert('Connection Error', 'Could not broadcast request. Please check your network.');
      setFlowState('IDLE');
    }
  };

  const handlePhoneCall = () => {
    if (!helperData?.phone) return;
    Linking.openURL(`tel:${helperData.phone}`);
  };

  // Requester taps "Help Received" from live tracking modal
  const handleRequesterReceivedOnMap = async () => {
    if (activeRequestId) {
      try {
        await markRequesterCompleted(activeRequestId);
      } catch (e) {
        console.warn('markRequesterCompleted error:', e);
      }
    }
    setFlowState('FEEDBACK');
  };

  // Step 3: Requester ends session — purge Firestore & show feedback
  const handleFinalizeFeedback = async () => {
    if (activeRequestId) {
      try {
        await markRequesterCompleted(activeRequestId);
        await deleteRequestSession(activeRequestId);
      } catch (e) {
        console.warn('Feedback finalization notice:', e);
      }
    }
    setActiveRequestId(null);
    setHelperData(null);
    setFeedbackText('');
    setRating(5);
    setFlowState('IDLE');
    Alert.alert('Thank You!', 'Feedback submitted and active session wiped for your privacy.');
  };

  // Cancel request while still searching
  const handleCancelSearch = async () => {
    if (activeRequestId) {
      await deleteRequestSession(activeRequestId);
    }
    setActiveRequestId(null);
    setFlowState('IDLE');
  };

  // Helper actions from Dashboard Popup
  const handleQuickAssistFromDashboard = async () => {
    if (!incomingRequest) return;
    const req = incomingRequest;
    try {
      await acceptRequest(req.id);
      setIncomingRequest(null);
      navigation.navigate('Chat', {
        requestId: req.id,
        role: 'helper',
      });
    } catch (err) {
      console.warn('Dashboard quick assist failed:', err);
      Alert.alert('Notice', 'Could not accept request. It may have already been assisted.');
      setIncomingRequest(null);
    }
  };

  const handleViewOnMapFromDashboard = () => {
    setIncomingRequest(null);
    navigation.navigate('Map');
  };

  const handleDismissDashboardAlert = () => {
    if (incomingRequest) {
      setDismissedRequests((prev) => ({ ...prev, [incomingRequest.id]: true }));
      setIncomingRequest(null);
    }
  };

  // -----------------------------------------------------------------------
  // Map sub-components — guarded for web
  // -----------------------------------------------------------------------
  const renderConfirmMap = () => {
    if (!userCoords) return null;
    if (Platform.OS === 'web') {
      return (
        <WebMapFallback
          userCoords={userCoords}
          style={styles.mapConfirmation}
        />
      );
    }
    return (
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
    );
  };

  const renderTrackingMap = () => {
    if (!userCoords) return null;
    if (Platform.OS === 'web') {
      return (
        <WebMapFallback
          userCoords={userCoords}
          helperCoords={helperData?.location}
          style={{ flex: 1 }}
        />
      );
    }
    return (
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
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginLeft: 0 }}>
              <Text style={styles.greeting}>Hi Hiruni,</Text>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bellBtn, (helperData || incomingRequest) && styles.bellBtnActive]}
            onPress={() => {
              if (helperData) setFlowState('ACCEPTED');
              else if (incomingRequest) {
                // Keep alert visible
              } else Alert.alert('Notifications', 'No active help requests.');
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={helperData || incomingRequest ? '#EF4444' : '#374151'}
            />
          </TouchableOpacity>
        </View>

        {helperData && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => setFlowState('ACCEPTED')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.pulseDot} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.bannerTitle}>Sister on the way!</Text>
                <Text style={styles.bannerSub}>Tap to view map, call, or chat</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D44D5C" />
          </TouchableOpacity>
        )}

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.tile, { backgroundColor: '#F3E8FF' }]} onPress={() => handleInitiateHelp('Need a Pad')}>
            <MaterialCommunityIcons name="hand-heart-outline" size={32} color="#7E22CE" style={styles.tileIcon} />
            <Text style={styles.tileTitle}>Need a pad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, { backgroundColor: '#FCE7F3' }]} onPress={() => navigation.navigate('Mentors')}>
            <Ionicons name="people-outline" size={32} color="#DB2777" style={styles.tileIcon} />
            <Text style={styles.tileTitle}>Find a mentor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, { backgroundColor: '#E0F2FE' }]} onPress={() => navigation.navigate('Wellness')}>
            <MaterialCommunityIcons name="flower-outline" size={32} color="#0284C7" style={styles.tileIcon} />
            <Text style={styles.tileTitle}>Wellness Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, { backgroundColor: '#F3F4F6' }]} onPress={() => navigation.navigate('Map')}>
            <Ionicons name="map-outline" size={30} color="#4B5563" style={styles.tileIcon} />
            <Text style={styles.tileTitle}>Map / Help Zones</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosButton} onPress={() => handleInitiateHelp('Instant Emergency')} activeOpacity={0.8}>
            <Feather name="alert-circle" size={32} color="white" />
            <Text style={styles.sosText}>INSTANT HELP</Text>
            <Text style={styles.sosSubtext}>Tap to request immediate assistance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DASHBOARD POPUP: INCOMING HELP REQUEST FROM NEARBY SISTER */}
      <Modal visible={!!incomingRequest && flowState === 'IDLE'} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.incomingPopupCard}>
            <View style={styles.popupHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pulseDot} />
                <Text style={styles.popupAlertTitle}>Sister Nearby Needs Help!</Text>
              </View>
              <TouchableOpacity onPress={handleDismissDashboardAlert} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.popupBadgeRow}>
              <View style={styles.popupBadge}>
                <Text style={styles.popupBadgeText}>{incomingRequest?.type}</Text>
              </View>
              <Text style={styles.popupDistText}>
                {incomingRequest?.distanceKm
                  ? `📍 ~${(incomingRequest.distanceKm * 1000).toFixed(0)}m away`
                  : '📍 In your area'}
              </Text>
            </View>

            <Text style={styles.popupDesc}>
              A sister nearby needs immediate discreet assistance. Can you help her out?
            </Text>

            <View style={styles.popupActionRow}>
              <TouchableOpacity
                style={styles.popupAssistBtn}
                onPress={handleQuickAssistFromDashboard}
              >
                <Ionicons name="chatbubbles" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.popupAssistBtnText}>Help Her & Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popupMapBtn}
                onPress={handleViewOnMapFromDashboard}
              >
                <Ionicons name="map" size={16} color="#D44D5C" style={{ marginRight: 4 }} />
                <Text style={styles.popupMapBtnText}>View Map</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.popupDismissBtn}
              onPress={handleDismissDashboardAlert}
            >
              <Text style={styles.popupDismissText}>Dismiss for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 1: CONFIRM LOCATION */}
      <Modal visible={flowState === 'CONFIRM_LOCATION'} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Confirm Your Pickup Location</Text>
          <Text style={styles.modalSubHeader}>Requesting: {requestType}</Text>
          {renderConfirmMap()}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setFlowState('IDLE')}>
              <Text style={{ color: '#374151', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D44D5C' }]} onPress={handleConfirmLocation}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: SEARCHING */}
      <Modal visible={flowState === 'SEARCHING'} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color="#D44D5C" />
            <Text style={styles.searchingTitle}>Broadcast Sent!</Text>
            <Text style={styles.searchingSub}>
              Finding a nearby helper within 1 km radius...{'\n'}
              This will update automatically when a helper accepts.
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E5E7EB', marginTop: 20, width: '100%' }]}
              onPress={handleCancelSearch}
            >
              <Text style={{ color: '#374151', fontWeight: 'bold' }}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: HELPER TRACKING */}
      <Modal visible={flowState === 'ACCEPTED'} animationType="slide">
        <View style={styles.fullTrackingContainer}>
          <View style={styles.trackingHeader}>
            <TouchableOpacity onPress={() => setFlowState('IDLE')}>
              <Text style={styles.minimizeBtn}>✕ Minimize</Text>
            </TouchableOpacity>
            <Text style={styles.trackingTitle}>Live Assistance</Text>
            <View style={{ width: 60 }} />
          </View>
          {renderTrackingMap()}
          <View style={styles.bottomSheetCard}>
            <Text style={styles.matchTitle}>Helper Connected!</Text>
            <Text style={styles.matchSub}>{helperData?.name} is on her way.</Text>
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
            <TouchableOpacity style={styles.resolvedBtn} onPress={handleRequesterReceivedOnMap}>
              <Text style={styles.resolvedText}>Help Received (Rate & End)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: FEEDBACK */}
      <Modal visible={flowState === 'FEEDBACK'} transparent animationType="fade">
        <View style={styles.searchingOverlay}>
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackHeader}>How was your experience?</Text>
            <Text style={styles.feedbackSub}>Rate your session with {helperData?.name}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={32}
                    color={rating >= star ? '#F59E0B' : '#D1D5DB'}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Leave 1-line feedback..."
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
  bellBtn: { padding: 10, backgroundColor: 'white', borderRadius: 20, elevation: 2 },
  bellBtnActive: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  activeBanner: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#991B1B' },
  bannerSub: { fontSize: 12, color: '#B91C1C', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  tile: { width: '48%', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { marginBottom: 8 },
  tileTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
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
  fullTrackingContainer: { flex: 1, backgroundColor: 'white' },
  trackingHeader: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  minimizeBtn: { color: '#D44D5C', fontSize: 15, fontWeight: 'bold' },
  trackingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  bottomSheetCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, alignItems: 'center', elevation: 10 },
  matchTitle: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  matchSub: { fontSize: 14, color: '#4B5563', marginVertical: 4 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, marginTop: 12 },
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
  submitFeedbackBtn: { backgroundColor: '#D44D5C', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  // Dashboard incoming popup styles
  incomingPopupCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  popupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginLeft: 8,
  },
  popupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  popupBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  popupBadgeText: {
    color: '#D44D5C',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupDistText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '500',
  },
  popupDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 18,
  },
  popupActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  popupAssistBtn: {
    flex: 0.62,
    backgroundColor: '#D44D5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  popupAssistBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupMapBtn: {
    flex: 0.34,
    borderWidth: 1.5,
    borderColor: '#D44D5C',
    backgroundColor: '#FFF5F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  popupMapBtnText: {
    color: '#D44D5C',
    fontWeight: 'bold',
    fontSize: 13,
  },
  popupDismissBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  popupDismissText: {
    color: '#9CA3AF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
