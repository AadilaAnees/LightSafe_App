/**
 * MapScreen.web.js
 * Mobile-optimized helper map screen.
 * - Filters out stale/old requests (shows only real recent active requests).
 * - Instant GPS tracking on mobile.
 * - Shows sister location first, with prominent Chat button.
 * - Two-sided completion: reacts instantly when requester confirms help received or cancels.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDistanceInKm } from '../utils/distance';
import { trackLiveLocation } from '../utils/geolocation';
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

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [activeSister, setActiveSister] = useState(null);
  const [delivering, setDelivering] = useState(false);
  const isFinalizingRef = useRef(false);

  // Live GPS tracking on mobile
  useEffect(() => {
    const cancel = trackLiveLocation((coords) => {
      setUserLoc(coords);
    });
    return cancel;
  }, []);

  // Subscribe to pending requests from Firestore (real active requests only)
  useEffect(() => {
    const unsubscribe = listenToPendingRequests((docs) => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      const filtered = docs
        .filter((req) => {
          if (!req.location) return false;
          // Don't show own requests in helper view
          if (req.requesterId === auth.currentUser?.uid) return false;

          // Filter out stale dummy/test requests older than 2 hours
          if (req.createdAt?.toMillis && req.createdAt.toMillis() < twoHoursAgo) {
            return false;
          }
          return true;
        })
        .map((req) => {
          const dist = userLoc
            ? getDistanceInKm(
                userLoc.latitude,
                userLoc.longitude,
                req.location.latitude,
                req.location.longitude
              )
            : null;
          return {
            ...req,
            distanceKm: dist,
          };
        });

      setNearbyRequests(filtered);
    });

    return () => unsubscribe();
  }, [userLoc]);

  // Subscribe to real-time status of the currently assisted sister
  useEffect(() => {
    if (!activeSister?.id) return;
    isFinalizingRef.current = false;

    const unsubscribe = listenToRequest(activeSister.id, async (req) => {
      if (isFinalizingRef.current) return;

      if (!req) {
        // Document deleted or purged -> sister found help or closed session
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

  // When helper clicks View on Map: focus her location
  const handleViewOnMap = (item) => {
    setActiveSister(item);
  };

  // When helper clicks Assist & Chat:
  // 1. Accept request in Firestore
  // 2. Focus map on sister's location
  const handleAssist = async (item) => {
    if (accepting) return;
    setAccepting(item.id);
    try {
      await acceptRequest(item.id);
      setActiveSister(item);
    } catch (err) {
      console.error('acceptRequest failed:', err);
      Alert.alert('Notice', 'Could not accept request. It may have already been resolved.');
    } finally {
      setAccepting(null);
    }
  };

  // When helper marks delivered from MapScreen
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
          'Great job! Once the sister confirms "Help Received", your 50 Kindness Points will be awarded and session finalized.'
        );
      }
    } catch (err) {
      console.warn('handleMarkDelivered error:', err.message);
      Alert.alert('Notice', 'Could not record delivery. Please try again.');
    } finally {
      setDelivering(false);
    }
  };

  // Helper cancels assisting this sister
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

  return (
    <View style={styles.container}>
      {/* Map View (Compact for mobile so sheet is never cut off) */}
      <WebMapFallback
        userCoords={userLoc}
        focusCoords={activeSister?.location}
        requests={nearbyRequests}
        style={styles.map}
      />

      {/* Mobile Sliding Sheet */}
      <View style={styles.sheet}>
        {activeSister ? (
          /* Active Sister Detail Panel with direct Chat button */
          <View style={styles.sisterPanel}>
            <View style={styles.sisterHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pulseDot} />
                <Text style={styles.sisterPanelTitle}>Assisting Sister</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveSister(null)} style={{ padding: 4 }}>
                <Text style={styles.closeActiveText}>✕ Hide</Text>
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
                  ? `📍 ~${(activeSister.distanceKm * 1000).toFixed(0)} meters away (marked on map above)`
                  : '📍 Marked on map above'}
              </Text>
            </View>

            <View style={styles.sisterActionsCol}>
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
                <Text style={styles.chatActionText}>Open Chat with Sister</Text>
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
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-done"
                      size={18}
                      color={activeSister.requesterCompleted ? 'white' : '#10B981'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.completeActionText,
                        activeSister.requesterCompleted && { color: 'white' },
                      ]}
                    >
                      {activeSister.requesterCompleted ? 'Finish & Claim 50 Points' : 'Mark Help Delivered'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelAssistBtn}
                onPress={handleCancelAssistance}
              >
                <Text style={styles.cancelAssistText}>Can't Assist? Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Real-time active requests list */
          <View style={{ flex: 1 }}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sheetTitle}>Sisters Needing Help Nearby</Text>
              <Text style={styles.activeCountBadge}>
                {nearbyRequests.length} Active
              </Text>
            </View>

            <FlatList
              data={nearbyRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="shield-checkmark-outline" size={36} color="#10B981" />
                  <Text style={styles.emptyTitle}>All Safe Nearby!</Text>
                  <Text style={styles.emptySub}>
                    No active emergency requests in your area right now. When someone taps "Need a Pad" or "Instant Help", it will appear here in real time.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqType}>{item.type}</Text>
                    <Text style={styles.reqDist}>
                      {item.distanceKm
                        ? `~${(item.distanceKm * 1000).toFixed(0)}m away`
                        : 'Nearby'}
                    </Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.viewMapBtn}
                      onPress={() => handleViewOnMap(item)}
                    >
                      <Ionicons name="locate" size={14} color="#D44D5C" style={{ marginRight: 4 }} />
                      <Text style={styles.viewMapText}>Map</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.assistBtn}
                      onPress={() => handleAssist(item)}
                      disabled={accepting === item.id}
                    >
                      <Ionicons name="chatbubbles" size={14} color="white" style={{ marginRight: 4 }} />
                      <Text style={styles.assistText}>Assist</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', paddingBottom: 65 },
  map: { height: 230, width: '100%' },
  sheet: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  activeCountBadge: {
    backgroundColor: '#FEE2E2',
    color: '#D44D5C',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 35 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18, maxWidth: 280 },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF5F7',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  reqType: { fontSize: 14, fontWeight: 'bold', color: '#D44D5C' },
  reqDist: { fontSize: 11, color: '#666', marginTop: 2 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginRight: 8,
  },
  viewMapText: { color: '#D44D5C', fontSize: 12, fontWeight: 'bold' },
  assistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#D44D5C',
    borderRadius: 8,
  },
  assistText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  sisterPanel: { flex: 1, justifyContent: 'space-between' },
  sisterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  sisterPanelTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  closeActiveText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  requesterDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  requesterDoneText: { fontSize: 12, color: '#065F46', fontWeight: 'bold', flex: 1 },
  sisterInfoBox: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10, marginBottom: 10 },
  sisterNeedLabel: { fontSize: 11, color: '#6B7280' },
  sisterNeedValue: { fontSize: 14, fontWeight: 'bold', color: '#D44D5C', marginTop: 2 },
  sisterDistValue: { fontSize: 11, color: '#4B5563', marginTop: 4 },
  sisterActionsCol: { marginTop: 4 },
  chatActionBtn: {
    backgroundColor: '#D44D5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatActionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  completeActionBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 6,
  },
  completeActionBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  completeActionText: { color: '#065F46', fontWeight: 'bold', fontSize: 13 },
  cancelAssistBtn: { alignItems: 'center', paddingVertical: 6 },
  cancelAssistText: { color: '#9CA3AF', fontSize: 11, textDecorationLine: 'underline' },
});
