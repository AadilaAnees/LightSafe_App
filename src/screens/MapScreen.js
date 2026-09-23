import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getDistanceInKm } from '../utils/distance';
import { listenToPendingRequests, acceptRequest } from '../services/requestService';
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

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [activeSister, setActiveSister] = useState(null);

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
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  map: { flex: 0.58 },
  loadingBox: { flex: 0.58, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  sheet: {
    flex: 0.42,
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
  assistBtn: { backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  assistText: { color: 'white', fontWeight: '600', fontSize: 13 },

  // Active Sister Helping Panel
  sisterPanel: { flex: 1, justifyContent: 'space-between' },
  sisterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
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
