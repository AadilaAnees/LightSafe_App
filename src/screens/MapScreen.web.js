/**
 * MapScreen.web.js
 * Web-platform version of MapScreen — Metro picks this file on web builds
 * instead of MapScreen.js, so react-native-maps is never bundled.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { getDistanceInKm } from '../utils/distance';
import { listenToPendingRequests, acceptRequest } from '../services/requestService';
import { auth } from '../services/firebase';
import WebMapFallback from '../components/WebMapFallback';

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);

  // Acquire device location via expo-location (uses navigator.geolocation on web)
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
            userLoc.latitude, userLoc.longitude,
            req.location.latitude, req.location.longitude
          );
          return dist <= 1.0;
        })
        .map((req) => ({
          ...req,
          distanceKm: getDistanceInKm(
            userLoc.latitude, userLoc.longitude,
            req.location.latitude, req.location.longitude
          ),
        }));
      setNearbyRequests(filtered);
    });
    return () => unsubscribe();
  }, [userLoc]);

  const handleAssist = async (item) => {
    if (accepting) return;
    setAccepting(item.id);
    try {
      await acceptRequest(item.id);
      navigation.navigate('Chat', { requestId: item.id, role: 'helper' });
    } catch (err) {
      console.error('acceptRequest failed:', err);
      Alert.alert('Error', 'Could not accept request. It may have already been taken.');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Web map — OpenStreetMap iframe, no native dependency */}
      <WebMapFallback userCoords={userLoc} style={styles.map} />

      {/* Sliding Sheet */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Sisters Needing Help Nearby (&lt;1km)</Text>
        <FlatList
          data={nearbyRequests}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active requests within 1km radius.</Text>
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
                  {accepting === item.id ? 'Accepting...' : 'Assist Sister'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 0.6, minHeight: 300 },
  sheet: { flex: 0.4, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, elevation: 10 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#FFF5F7', borderRadius: 12, marginBottom: 10 },
  reqType: { fontSize: 15, fontWeight: '600', color: '#D44D5C' },
  reqDist: { fontSize: 12, color: '#666', marginTop: 2 },
  assistBtn: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  assistText: { color: 'white', fontWeight: '600', fontSize: 13 },
});
