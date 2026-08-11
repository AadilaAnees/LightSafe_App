import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getDistanceInKm } from '../utils/distance';

export default function MapScreen({ navigation }) {
  const [userLoc, setUserLoc] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLoc(loc.coords);
    })();
  }, []);

  useEffect(() => {
    if (!userLoc) return;

    const q = query(collection(db, "requests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter strictly within 1km radius
      const filtered = docs.filter(req => {
        if (!req.location) return false;
        const dist = getDistanceInKm(
          userLoc.latitude, userLoc.longitude,
          req.location.latitude, req.location.longitude
        );
        return dist <= 1.0 && req.userId !== auth.currentUser?.uid;
      }).map(req => ({
        ...req,
        distanceKm: getDistanceInKm(userLoc.latitude, userLoc.longitude, req.location.latitude, req.location.longitude)
      }));

      setNearbyRequests(filtered);
    });

    return unsubscribe;
  }, [userLoc]);

  return (
    <View style={styles.container}>
      {userLoc ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLoc.latitude,
            longitude: userLoc.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          <Marker coordinate={userLoc} title="You are here" pinColor="blue" />
          {nearbyRequests.map(req => (
            <Marker
              key={req.id}
              coordinate={req.location}
              title={`Needs: ${req.requestType}`}
              pinColor="red"
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingBox}><Text>Acquiring GPS Signal...</Text></View>
      )}

      {/* Sliding Sheet */}
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Sisters Needing Help Nearby (&lt;1km)</Text>
        <FlatList
          data={nearbyRequests}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No active requests within 1km radius.</Text>}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View>
                <Text style={styles.reqType}>{item.requestType}</Text>
                <Text style={styles.reqDist}>~{(item.distanceKm * 1000).toFixed(0)} meters away</Text>
              </View>
              <TouchableOpacity 
                style={styles.assistBtn}
                onPress={() => navigation.navigate('Chat', { requestId: item.id, role: 'helper' })}
              >
                <Text style={styles.assistText}>Assist Sister</Text>
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
  map: { flex: 0.6 },
  loadingBox: { flex: 0.6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  sheet: { flex: 0.4, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, elevation: 10 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },
  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#FFF5F7', borderRadius: 12, marginBottom: 10 },
  reqType: { fontSize: 15, fontWeight: '600', color: '#D44D5C' },
  reqDist: { fontSize: 12, color: '#666', marginTop: 2 },
  assistBtn: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  assistText: { color: 'white', fontWeight: '600', fontSize: 13 }
});