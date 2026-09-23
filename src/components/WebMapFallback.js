/**
 * WebMapFallback.js
 * -----------------
 * Premium, Uber-style interactive map for LightSafe Web.
 * Uses Leaflet with sleek CartoDB Voyager tiles, an animated pulsating live GPS dot,
 * smooth recentering, and real-time markers.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebMapFallback({
  userCoords,
  helperCoords,
  requests = [],
  style,
}) {
  const fallbackCoords = { latitude: 6.9271, longitude: 79.8612 };
  const effectiveCoords = userCoords || fallbackCoords;
  const isEstimated = !userCoords;

  const lat = effectiveCoords.latitude;
  const lng = effectiveCoords.longitude;

  // Prepare nearby emergency markers for Leaflet injection
  const requestsJson = JSON.stringify(
    requests
      .filter((r) => r.location && r.location.latitude && r.location.longitude)
      .map((r) => ({
        id: r.id,
        lat: r.location.latitude,
        lng: r.location.longitude,
        type: r.type || 'Need a Pad',
        distance: r.distanceKm ? `~${(r.distanceKm * 1000).toFixed(0)}m` : 'Nearby',
      }))
  );

  const helperJson = helperCoords
    ? JSON.stringify({
        lat: helperCoords.latitude,
        lng: helperCoords.longitude,
      })
    : 'null';

  // Construct self-contained, high-performance HTML with Leaflet and clean styling
  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }

    /* Uber-style pulsating blue dot */
    .user-pulse-marker {
      position: relative;
      width: 24px;
      height: 24px;
    }
    .pulse-core {
      position: absolute;
      top: 4px; left: 4px;
      width: 16px; height: 16px;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.45);
      z-index: 2;
    }
    .pulse-ring {
      position: absolute;
      top: -4px; left: -4px;
      width: 32px; height: 32px;
      background: rgba(37, 99, 235, 0.28);
      border-radius: 50%;
      animation: pulse-wave 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
      z-index: 1;
    }
    @keyframes pulse-wave {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    /* Red emergency marker */
    .emergency-pin {
      background: #D44D5C;
      color: white;
      border: 2px solid white;
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 3px 8px rgba(212, 77, 92, 0.4);
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    }

    /* Floating Recenter Action Button */
    .recenter-btn {
      position: absolute;
      bottom: 16px;
      right: 14px;
      z-index: 1000;
      background: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      transition: transform 0.15s ease;
    }
    .recenter-btn:active {
      transform: scale(0.92);
    }

    /* Minimalist Leaflet Overrides */
    .leaflet-control-attribution { display: none !important; }
    .leaflet-bar { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; border-radius: 8px !important; }
    .leaflet-bar a { border-radius: 8px !important; border-bottom: 1px solid #f1f5f9 !important; }
  </style>
</head>
<body>
  <div id="map"></div>

  <button class="recenter-btn" onclick="recenter()" title="Recenter to my location">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.3">
      <circle cx="12" cy="12" r="7"/>
      <line x1="12" y1="1" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="23"/>
      <line x1="1" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="23" y2="12"/>
      <circle cx="12" cy="12" r="2.5" fill="#2563EB"/>
    </svg>
  </button>

  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};

    // Initialize map
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 16);

    // Premium clean tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // User Live Pulsating Dot
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-marker"><div class="pulse-ring"></div><div class="pulse-core"></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    var userMarker = L.marker([currentLat, currentLng], { icon: userIcon }).addTo(map);

    // Recenter function
    function recenter() {
      map.flyTo([currentLat, currentLng], 16, { animate: true, duration: 1.0 });
    }

    // Nearby Request Pins
    var requests = ${requestsJson};
    requests.forEach(function(req) {
      var reqIcon = L.divIcon({
        className: '',
        html: '<div class="emergency-pin">📍 ' + req.type + ' (' + req.distance + ')</div>',
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });
      L.marker([req.lat, req.lng], { icon: reqIcon })
        .addTo(map)
        .bindPopup('<b>' + req.type + '</b><br>' + req.distance + ' away');
    });

    // Helper Pin
    var helper = ${helperJson};
    if (helper) {
      var helperIcon = L.divIcon({
        className: '',
        html: '<div style="background:#10B981;color:white;border:2px solid white;border-radius:12px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 3px 8px rgba(16,185,129,0.4);">💚 Helper Sister</div>',
        iconSize: [110, 26],
        iconAnchor: [55, 13]
      });
      L.marker([helper.lat, helper.lng], { icon: helperIcon }).addTo(map);
    }
  </script>
</body>
</html>`;
  }, [lat, lng, requestsJson, helperJson]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        srcDoc={mapHtml}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '280px',
          border: 'none',
          borderRadius: 16,
        }}
        title="Live Map"
      />

      {/* Floating Status Badge */}
      <View style={styles.topBadge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>
          {isEstimated ? 'Detecting GPS (Live Signal...)' : 'Live GPS Connected'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 280,
    width: '100%',
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    pointerEvents: 'none',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
