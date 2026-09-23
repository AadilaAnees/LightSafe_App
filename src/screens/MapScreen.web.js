/**
 * MapScreen.web.js
 * Web-platform version of MapScreen.
 * Displays live map, nearby requests, and when "Assist Sister" is tapped,
 * focuses on her location first with distance and a "Chat with Sister" button.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getDistanceInKm } from '../utils/distance';
import { listenToPendingRequests, acceptRequest } from '../services/requestService';
import { auth } from '../services/firebase';
import WebMapFallback from '../components/WebMapFallback';

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [activeSister, setActiveSister] = useState(null);

  // Acquire live continuous GPS
  useEffect(() => {
    let isMounted = true;
    let watchId = null;
    const defaultCoords = { latitude: 6.9271, longitude: 79.8612 };

    const startTracking = () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isMounted) {
              setUserLoc({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            }
          },
          (err) => {
            console.warn('Map initial geolocation warning:', err.message);
            if (isMounted) setUserLoc(defaultCoords);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
        );

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (isMounted) {
              setUserLoc({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            }
          },
          (err) => console.warn('Map live tracking warning:', err.message),
          { enableHighAccuracy: true, maximumAge: 2000 }
        );
        return;
      }

      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (isMounted) setUserLoc(loc.coords);
            return;
          }
        } catch (e) {
          console.warn('Map expo-location fallback:', e.message);
        }
        if (isMounted) setUserLoc(defaultCoords);
      })();
    };

    startTracking();
    return () => {
      isMounted = false;
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Subscribe to pending requests from Firestore
  useEffect(() => {
    const unsubscribe = listenToPendingRequests((docs) => {
      const activeLoc = userLoc || { latitude: 6.9271, longitude: 79.8612 };

      const filtered = docs
        .filter((req) => {
          if (!req.location) return false;
          if (req.requesterId === auth.currentUser?.uid) return false;
          const dist = getDistanceInKm(
            activeLoc.latitude, activeLoc.longitude,
            req.location.latitude, req.location.longitude
          );
          return dist <= 1000.0;
        })
        .map((req) => ({
          ...req,
          distanceKm: getDistanceInKm(
            activeLoc.latitude, activeLoc.longitude,
            req.location.latitude, req.location.longitude
          ),
        }));
      setNearbyRequests(filtered);
    });
    return () => unsubscribe();
  }, [userLoc]);

  // When helper clicks Assist Sister:
  // 1. Accept request in Firestore
  // 2. Focus map on sister's location FIRST
  // 3. Show chat option in helper panel
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

  return (
    <View style={styles.container}>
      {/* Live Map with Focus on Sister's Location when assisting */}
      <WebMapFallback
        userCoords={userLoc}
        focusCoords={activeSister?.location}
        requests={nearbyRequests}
        onLocationDetected={setUserLoc}
        style={styles.map}
      />

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

            <View style={styles.sisterInfoBox}>
              <Text style={styles.sisterNeedLabel}>Emergency Need:</Text>
              <Text style={styles.sisterNeedValue}>{activeSister.type}</Text>
              <Text style={styles.sisterDistValue}>
                {activeSister.distanceKm
                  ? `📍 ~${(activeSister.distanceKm * 1000).toFixed(0)} meters away (marked on map above)`
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
                style={styles.completeActionBtn}
                onPress={() => navigation.navigate('HelperCompletion')}
              >
                <Ionicons name="checkmark-done" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.completeActionText}>Delivered</Text>
              </TouchableOpacity>
            </View>
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
                    disabled={!!accepting}
                  >
                    <Text style={styles.assistText}>
                      {accepting === item.id ? 'Connecting...' : 'Assist Sister'}
                    </Text>
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
  container: { flex: 1, backgroundColor: '#FAF9F6', paddingBottom: 65 },
  map: { flex: 0.55, minHeight: 300 },
  sheet: {
    flex: 0.45,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF5F7',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  reqType: { fontSize: 15, fontWeight: '600', color: '#D44D5C' },
  reqDist: { fontSize: 12, color: '#666', marginTop: 2 },
  assistBtn: { backgroundColor: '#10B981', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20 },
  assistText: { color: 'white', fontWeight: '700', fontSize: 13 },

  // Active Sister Helping Panel
  sisterPanel: { flex: 1, justifyContent: 'space-between' },
  sisterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 8 },
  sisterPanelTitle: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  closeActiveText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  sisterInfoBox: { backgroundColor: '#F0FDF4', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#DCFCE7', marginVertical: 6 },
  sisterNeedLabel: { fontSize: 11, color: '#166534', textTransform: 'uppercase', fontWeight: 'bold' },
  sisterNeedValue: { fontSize: 18, fontWeight: 'bold', color: '#15803D', marginTop: 2 },
  sisterDistValue: { fontSize: 13, color: '#166534', marginTop: 4 },
  sisterActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  chatActionBtn: {
    flex: 0.65,
    backgroundColor: '#D44D5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  chatActionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  completeActionBtn: {
    flex: 0.32,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  completeActionText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
});
