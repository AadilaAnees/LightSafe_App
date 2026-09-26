import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getDistanceInKm } from '../utils/distance';
import {
  listenToPendingRequests,
  acceptRequest,
  listenToRequest,
  markHelperCompleted,
  cancelRequest,
  deleteRequestSession,
} from '../services/requestService';
import { auth } from '../services/firebase';
import { addKindnessPoints } from '../utils/rewardsStorage';
import WebMapFallback from '../components/WebMapFallback';

// Only import react-native-maps on native platforms — it has no web support.
let MapView = null;
let Marker = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [activeSister, setActiveSister] = useState(null);
  const [delivering, setDelivering] = useState(false);
  const isFinalizingRef = useRef(false);

  // Acquire device location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLoc(loc.coords);
    })();
  }, []);

  // Subscribe to pending requests from Firestore (helper side)
  useEffect(() => {
    const unsubscribe = listenToPendingRequests((docs) => {
      if (!userLoc) {
        setNearbyRequests(docs);
        return;
      }

      const filtered = docs
        .filter((req) => {
          if (!req.location) return false;
          if (req.requesterId === auth.currentUser?.uid) return false;
          const dist = getDistanceInKm(
            userLoc.latitude,
            userLoc.longitude,
            req.location.latitude,
            req.location.longitude
          );
          return dist <= 50.0;
        })
        .map((req) => ({
          ...req,
          distanceKm: getDistanceInKm(
            userLoc.latitude,
            userLoc.longitude,
            req.location.latitude,
            req.location.longitude
          ),
        }));

      setNearbyRequests(filtered);
    });

    return () => unsubscribe();
  }, [userLoc]);

  // Real-time listener for the active assisted sister
  useEffect(() => {
    if (!activeSister?.id) return;
    isFinalizingRef.current = false;

    const unsubscribe = listenToRequest(activeSister.id, async (req) => {
      if (isFinalizingRef.current) return;

      if (!req) {
        // Document deleted / purged
        Alert.alert('Notice', 'The sister received help or the session was ended.');
        setActiveSister(null);
        return;
      }

      if (req.status === 'cancelled') {
        Alert.alert('Notice', 'The sister cancelled this request or found another helper.');
        setActiveSister(null);
        return;
      }

      // Check if both completed
      if (req.status === 'completed' || (req.requesterCompleted && req.helperCompleted)) {
        isFinalizingRef.current = true;
        await addKindnessPoints(50);
        await deleteRequestSession(activeSister.id);
        setActiveSister(null);
        navigation.navigate('HelperCompletion');
        return;
      }

      // Update active sister with latest info (e.g. requesterCompleted flag)
      setActiveSister((prev) => (prev ? { ...prev, ...req } : null));
    });

    return () => unsubscribe();
  }, [activeSister?.id, navigation]);

  // When helper clicks Assist Sister:
  const handleAssist = async (item) => {
    if (accepting) return;
    setAccepting(item.id);
    try {
      await acceptRequest(item.id);
      setActiveSister(item);
    } catch (err) {
      console.error('acceptRequest failed:', err);
      Alert.alert('Error', 'Could not accept request. It may have already been taken.');
    } finally {
      setAccepting(null);
    }
  };

  // Helper marks delivered
  const handleMarkDelivered = async () => {
    if (!activeSister?.id || delivering || isFinalizingRef.current) return;
    setDelivering(true);
    try {
      const { bothCompleted } = await markHelperCompleted(activeSister.id);
      if (bothCompleted || activeSister.requesterCompleted) {
        isFinalizingRef.current = true;
        await addKindnessPoints(50);
        await deleteRequestSession(activeSister.id);
        setActiveSister(null);
        navigation.navigate('HelperCompletion');
      } else {
        Alert.alert(
          'Marked as Delivered!',
          'Great job! Once the sister confirms "Help Received", your 50 Kindness Points will be awarded.'
        );
      }
    } catch (err) {
      console.warn('handleMarkDelivered error:', err.message);
      Alert.alert('Notice', 'Could not record delivery. Please try again.');
    } finally {
      setDelivering(false);
    }
  };

  // Helper cancels assistance
  const handleCancelAssistance = () => {
    if (!activeSister?.id) return;
    Alert.alert(
      'Cancel Assistance?',
      'Are you unable to assist? This will return the request to the map so another nearby sister can help.',
      [
        { text: 'Keep Assisting', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(activeSister.id, 'helper');
              setActiveSister(null);
            } catch (e) {
              console.warn('Cancel error:', e);
              setActiveSister(null);
            }
          },
        },
      ]
    );
  };

  const renderMap = () => {
    if (!userLoc) {
      return (
        <View style={styles.loadingBox}>
          <Text>Acquiring GPS Signal...</Text>
        </View>
      );
    }
    if (Platform.OS === 'web') {
      return (
        <WebMapFallback
          userCoords={userLoc}
          focusCoords={activeSister?.location}
          requests={nearbyRequests}
          onLocationDetected={setUserLoc}
          style={styles.map}
        />
      );
    }
    const centerCoords = activeSister?.location || userLoc;
    return (
      <MapView
        style={styles.map}
        region={{
          latitude: centerCoords.latitude,
          longitude: centerCoords.longitude,
          latitudeDelta: activeSister ? 0.008 : 0.015,
          longitudeDelta: activeSister ? 0.008 : 0.015,
        }}
      >
        <Marker coordinate={userLoc} title="You are here" pinColor="blue" />
        {nearbyRequests.map((req) => (
          <Marker
            key={req.id}
            coordinate={req.location}
            title={`Needs: ${req.type}`}
            pinColor="red"
          />
        ))}
        {activeSister && (
          <Marker
            coordinate={activeSister.location}
            title={`Assisting: ${activeSister.type}`}
            pinColor="green"
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Dynamic Sliding Sheet: Shows Sister Details OR Nearby List */}
      <View style={styles.sheet}>
        {activeSister ? (
          <View style={styles.sisterPanel}>
            <View style={styles.sisterHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pulseDot} />
                <Text style={styles.sisterPanelTitle}>Assisting Sister</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveSister(null)} style={{ padding: 4 }}>
                <Text style={styles.closeActiveText}>✕ Back to List</Text>
              </TouchableOpacity>
            </View>

            {/* If sister has confirmed help received, highlight notice */}
            {activeSister.requesterCompleted && (
              <View style={styles.requesterDoneBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#065F46" style={{ marginRight: 6 }} />
                <Text style={styles.requesterDoneText}>
                  Sister confirmed help received! Tap below to finish & claim 50 points.
                </Text>
              </View>
            )}

            <View style={styles.sisterInfoBox}>
              <Text style={styles.sisterNeedLabel}>Emergency Need:</Text>
              <Text style={styles.sisterNeedValue}>{activeSister.type}</Text>
              <Text style={styles.sisterDistValue}>
                {activeSister.distanceKm
                  ? `📍 ~${(activeSister.distanceKm * 1000).toFixed(0)} meters away (marked on map)`
                  : '📍 Location pinned on map'}
              </Text>
            </View>

            <View style={styles.sisterActionsRow}>
              <TouchableOpacity
                style={styles.chatActionBtn}
                onPress={() =>
                  navigation.navigate('Chat', {
                    requestId: activeSister.id,
                    role: 'helper',
                  })
                }
              >
                <Ionicons name="chatbubbles" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.chatActionText}>Chat with Sister</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.completeActionBtn,
                  activeSister.requesterCompleted && styles.completeActionBtnActive,
                ]}
                onPress={handleMarkDelivered}
                disabled={delivering}
              >
                {delivering ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.completeActionText}>
                      {activeSister.requesterCompleted ? 'Finish & Claim' : 'Delivered'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelAssistBtn} onPress={handleCancelAssistance}>
              <Text style={styles.cancelAssistText}>Can't Assist? Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Sisters Needing Help Nearby</Text>
            <FlatList
              data={nearbyRequests}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No active requests within range right now.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  <View>
                    <Text style={styles.reqType}>{item.type}</Text>
                    <Text style={styles.reqDist}>
                      {item.distanceKm
                        ? `~${(item.distanceKm * 1000).toFixed(0)} meters away`
                        : 'Nearby'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.assistBtn, accepting === item.id && { opacity: 0.6 }]}
                    onPress={() => handleAssist(item)}
                    disabled={accepting === item.id}
                  >
                    <Ionicons name="hand-right" size={16} color="white" style={{ marginRight: 4 }} />
                    <Text style={styles.assistBtnText}>Assist Sister</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  map: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: {
    position: 'absolute',
    bottom: 90,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    maxHeight: 280,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyText: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginVertical: 20 },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reqType: { fontSize: 15, fontWeight: 'bold', color: '#D44D5C' },
  reqDist: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  assistBtn: {
    backgroundColor: '#D44D5C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  assistBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  sisterPanel: { padding: 4 },
  sisterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 8 },
  sisterPanelTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  closeActiveText: { fontSize: 12, color: '#6B7280' },
  requesterDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  requesterDoneText: { fontSize: 11, color: '#065F46', fontWeight: 'bold', flex: 1 },
  sisterInfoBox: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, marginVertical: 6 },
  sisterNeedLabel: { fontSize: 11, color: '#6B7280' },
  sisterNeedValue: { fontSize: 14, fontWeight: 'bold', color: '#D44D5C' },
  sisterDistValue: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  sisterActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chatActionBtn: {
    flex: 0.58,
    backgroundColor: '#D44D5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatActionText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  completeActionBtn: {
    flex: 0.38,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  completeActionBtnActive: {
    backgroundColor: '#059669',
  },
  completeActionText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  cancelAssistBtn: { alignItems: 'center', paddingVertical: 4, marginTop: 4 },
  cancelAssistText: { color: '#9CA3AF', fontSize: 11, textDecorationLine: 'underline' },
});
