/**
 * WebMapFallback.js
 * -----------------
 * A web-safe replacement for react-native-maps.
 * Rendered whenever Platform.OS === 'web' to prevent native map crashes.
 *
 * Props:
 *   userCoords   — { latitude, longitude }  (required)
 *   helperCoords — { latitude, longitude }  (optional, shows helper pin)
 *   style        — ViewStyle override
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebMapFallback({ userCoords, helperCoords, style }) {
  const lat = userCoords?.latitude?.toFixed(5) ?? '—';
  const lng = userCoords?.longitude?.toFixed(5) ?? '—';

  // Build an OpenStreetMap embed URL centred on the user's coordinates.
  // bbox = (lng-0.009, lat-0.009, lng+0.009, lat+0.009) ~ 1km view
  const bboxPad = 0.009;
  const osmSrc = userCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        (userCoords.longitude - bboxPad).toFixed(6)
      }%2C${(userCoords.latitude - bboxPad).toFixed(6)}%2C${
        (userCoords.longitude + bboxPad).toFixed(6)
      }%2C${(userCoords.latitude + bboxPad).toFixed(6)}&layer=mapnik&marker=${
        userCoords.latitude.toFixed(6)
      }%2C${userCoords.longitude.toFixed(6)}`
    : null;

  return (
    <View style={[styles.container, style]}>
      {osmSrc ? (
        // eslint-disable-next-line react-native/no-raw-text
        <iframe
          src={osmSrc}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          title="Map"
          loading="lazy"
        />
      ) : (
        <View style={styles.noGps}>
          <Ionicons name="location-outline" size={40} color="#D44D5C" />
          <Text style={styles.noGpsText}>Acquiring GPS…</Text>
        </View>
      )}

      {/* Coordinate overlay */}
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Ionicons name="navigate" size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>You: {lat}, {lng}</Text>
        </View>

        {helperCoords && (
          <View style={[styles.badge, styles.helperBadge]}>
            <Ionicons name="person" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>
              Helper: {helperCoords.latitude?.toFixed(5)}, {helperCoords.longitude?.toFixed(5)}
            </Text>
          </View>
        )}

        <View style={[styles.badge, styles.radiusBadge]}>
          <Ionicons name="radio-button-on" size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>1 km safe radius</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  noGps: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noGpsText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  helperBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  radiusBadge: {
    backgroundColor: 'rgba(212, 77, 92, 0.85)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
