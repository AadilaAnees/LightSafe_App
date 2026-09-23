/**
 * WebMapFallback.js
 * -----------------
 * Clean, watermark-free interactive map for LightSafe Web.
 * Uses official OpenStreetMap tiles (no API key / watermark),
 * real-time GPS tracking with allow="geolocation", and smooth focus on Sister's location.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebMapFallback({
  userCoords,
  helperCoords,
  focusCoords,
  requests = [],
  onLocationDetected,
  style,
}) {
  const iframeRef = useRef(null);

  // If focusCoords provided (e.g. assisting a sister), focus on her.
  // Otherwise use userCoords, or fallback if GPS still pending.
  const activeLat = focusCoords?.latitude ?? userCoords?.latitude ?? 6.9271;
  const activeLng = focusCoords?.longitude ?? userCoords?.longitude ?? 79.8612;
  const isPendingGps = !userCoords && !focusCoords;

  // Listen to GPS messages from inside Leaflet iframe
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.type === 'LIGHTSAFE_GPS_FOUND') {
        if (onLocationDetected && e.data.coords) {
          onLocationDetected(e.data.coords);
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [onLocationDetected]);

  // When userCoords changes in parent, inform Leaflet
  useEffect(() => {
    if (userCoords && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_USER_COORDS',
          lat: userCoords.latitude,
          lng: userCoords.longitude,
        },
        '*'
      );
    }
  }, [userCoords]);

  const requestsJson = JSON.stringify(
    requests
      .filter((r) => r.location?.latitude && r.location?.longitude)
      .map((r) => ({
        id: r.id,
        lat: r.location.latitude,
        lng: r.location.longitude,
        type: r.type || 'Need a Pad',
        distance: r.distanceKm ? `~${(r.distanceKm * 1000).toFixed(0)}m` : 'Nearby',
      }))
  );

  const sisterPinJson = focusCoords
    ? JSON.stringify({
        lat: focusCoords.latitude,
        lng: focusCoords.longitude,
      })
    : 'null';

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
      background: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }

    /* Pulsating Live User Dot */
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
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
      z-index: 2;
    }
    .pulse-ring {
      position: absolute;
      top: -4px; left: -4px;
      width: 32px; height: 32px;
      background: rgba(37, 99, 235, 0.35);
      border-radius: 50%;
      animation: pulse-wave 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
      z-index: 1;
    }
    @keyframes pulse-wave {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    /* Sister emergency target marker */
    .sister-target-marker {
      background: #D44D5C;
      color: white;
      border: 3px solid white;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(212, 77, 92, 0.5);
      display: inline-flex;
      align-items: center;
      animation: bounce 1.5s infinite;
      white-space: nowrap;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    /* Recenter Button */
    .recenter-btn {
      position: absolute;
      bottom: 18px;
      right: 14px;
      z-index: 1000;
      background: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.22);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
    }
    .recenter-btn:active { transform: scale(0.92); }

    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>

  <button class="recenter-btn" onclick="triggerGpsLocate()" title="Locate Me">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.4">
      <circle cx="12" cy="12" r="7"/>
      <line x1="12" y1="1" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="23"/>
      <line x1="1" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="23" y2="12"/>
      <circle cx="12" cy="12" r="2.5" fill="#2563EB"/>
    </svg>
  </button>

  <script>
    var currentLat = ${activeLat};
    var currentLng = ${activeLng};

    // Official OpenStreetMap tiles (100% clean, NO API KEY REQUIRED, NO WATERMARK)
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // User pulsating live dot
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-marker"><div class="pulse-ring"></div><div class="pulse-core"></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    var userMarker = L.marker([currentLat, currentLng], { icon: userIcon }).addTo(map);

    // Live browser GPS locate function
    function triggerGpsLocate() {
      map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    }

    map.on('locationfound', function(e) {
      currentLat = e.latlng.lat;
      currentLng = e.latlng.lng;
      userMarker.setLatLng(e.latlng);
      map.flyTo(e.latlng, 16, { animate: true });
      window.parent.postMessage({
        type: 'LIGHTSAFE_GPS_FOUND',
        coords: { latitude: e.latlng.lat, longitude: e.latlng.lng }
      }, '*');
    });

    // Auto-request live location if no fixed location provided
    ${isPendingGps ? 'triggerGpsLocate();' : ''}

    // Sister Target Pin (When helper clicks Assist Sister)
    var sister = ${sisterPinJson};
    if (sister) {
      var sisterIcon = L.divIcon({
        className: '',
        html: '<div class="sister-target-marker">📍 Sister In Need Here</div>',
        iconSize: [160, 32],
        iconAnchor: [80, 16]
      });
      var sisterMarker = L.marker([sister.lat, sister.lng], { icon: sisterIcon }).addTo(map);
      map.flyTo([sister.lat, sister.lng], 16, { animate: true });
    }

    // Nearby Request markers (General list)
    var requests = ${requestsJson};
    requests.forEach(function(req) {
      var reqIcon = L.divIcon({
        className: '',
        html: '<div style="background:#D44D5C;color:white;border:2px solid white;border-radius:12px;padding:4px 8px;font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.25);">📍 ' + req.type + '</div>',
        iconSize: [110, 26],
        iconAnchor: [55, 13]
      });
      L.marker([req.lat, req.lng], { icon: reqIcon })
        .addTo(map)
        .bindPopup('<b>' + req.type + '</b><br>' + req.distance);
    });

    // Listen to parent updates
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'SET_USER_COORDS') {
        var newLatLng = [event.data.lat, event.data.lng];
        userMarker.setLatLng(newLatLng);
        if (!sister) {
          map.flyTo(newLatLng, 16, { animate: true });
        }
      }
    });
  </script>
</body>
</html>`;
  }, [activeLat, activeLng, isPendingGps, requestsJson, sisterPinJson]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        allow="geolocation *"
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
        <View style={[styles.dot, isPendingGps && { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.badgeText}>
          {isPendingGps ? 'Locating via GPS...' : 'Live GPS Connected'}
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
    zIndex: 10,
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
