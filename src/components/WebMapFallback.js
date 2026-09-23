/**
 * WebMapFallback.js
 * -----------------
 * A web-safe replacement for react-native-maps.
 * Rendered whenever Platform.OS === 'web' to prevent native map crashes.
 *
 * Props:
 *   userCoords   — { latitude, longitude }  (optional, defaults to fallback)
 *   helperCoords — { latitude, longitude }  (optional, shows helper pin)
 *   style        — ViewStyle override
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebMapFallback({ userCoords, helperCoords, style }) {
  // Default fallback coordinates if device GPS is delayed or permission denied
  const fallbackCoords = { latitude: 6.9271, longitude: 79.8612 };
  const effectiveCoords = userCoords || fallbackCoords;
  const isEstimated = !userCoords;

  const lat = effectiveCoords.latitude.toFixed(4);
  const lng = effectiveCoords.longitude.toFixed(4);

  // Build an OpenStreetMap embed URL centred on the coordinates.
  const bboxPad = 0.009;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
    (effectiveCoords.longitude - bboxPad).toFixed(6)
  }%2C${(effectiveCoords.latitude - bboxPad).toFixed(6)}%2C${
    (effectiveCoords.longitude + bboxPad).toFixed(6)
  }%2C${(effectiveCoords.latitude + bboxPad).toFixed(6)}&layer=mapnik&marker=${
    effectiveCoords.latitude.toFixed(6)
  }%2C${effectiveCoords.longitude.toFixed(6)}`;

  return (
    <View style={[styles.container, style]}>
      <iframe
        src={osmSrc}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '260px',
          border: 'none',
          borderRadius: 14,
        }}
        title="LightSafe Map"
        loading="lazy"
      />

      {/* Coordinate overlay badges */}
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Ionicons name="navigate" size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>
            {isEstimated ? `Location: ${lat}, ${lng} (Auto)` : `You: ${lat}, ${lng}`}
          </Text>
        </View>

        {helperCoords && (
          <View style={[styles.badge, styles.helperBadge]}>
            <Ionicons name="person" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>
              Helper: {helperCoords.latitude?.toFixed(4)}, {helperCoords.longitude?.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={[styles.badge, styles.radiusBadge]}>
          <Ionicons name="shield-checkmark" size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>Safe Help Zone Active</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 280,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 6,
    pointerEvents: 'none',
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
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  radiusBadge: {
    backgroundColor: 'rgba(212, 77, 92, 0.9)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
