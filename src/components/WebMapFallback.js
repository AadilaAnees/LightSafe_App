/**
 * WebMapFallback.js
 * -----------------
 * 100% genuine live GPS map for LightSafe Web.
 * Uses official OpenStreetMap tiles (no API key / no watermark).
 * Centers strictly on the user's REAL device coordinates with zero hardcoded fake locations.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebMapFallback({
  userCoords,
  helperCoords,
  focusCoords,
  requests = [],
  onRequestLocation,
  isLocating,
  style,
}) {
  const iframeRef = useRef(null);

  // Strictly use real coordinates — NO Colombo or fake fallbacks!
  const targetCoords = focusCoords || userCoords;

  // Real-time message communication to move marker when phone moves
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
  }, [userCoords?.latitude, userCoords?.longitude]);

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
    if (!targetCoords) return '';

    const lat = targetCoords.latitude;
    const lng = targetCoords.longitude;

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

    /* Live GPS Pulsating Dot */
    .user-pulse-marker {
      position: relative;
      width: 26px;
      height: 26px;
    }
    .pulse-core {
      position: absolute;
      top: 5px; left: 5px;
      width: 16px; height: 16px;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.55);
      z-index: 2;
    }
    .pulse-ring {
      position: absolute;
      top: -3px; left: -3px;
      width: 32px; height: 32px;
      background: rgba(37, 99, 235, 0.35);
      border-radius: 50%;
      animation: pulse-wave 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
      z-index: 1;
    }
    @keyframes pulse-wave {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    /* Sister Target Marker */
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

  <button class="recenter-btn" onclick="recenterToCoords()" title="Center Map">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5">
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

    // Clean OpenStreetMap tiles (100% Free, NO API KEY, NO WATERMARK)
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Live User Marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-marker"><div class="pulse-ring"></div><div class="pulse-core"></div></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    var userMarker = L.marker([currentLat, currentLng], { icon: userIcon }).addTo(map);

    function recenterToCoords() {
      map.flyTo([currentLat, currentLng], 16, { animate: true, duration: 1.0 });
    }

    // Sister Destination Pin
    var sister = ${sisterPinJson};
    if (sister) {
      var sisterIcon = L.divIcon({
        className: '',
        html: '<div class="sister-target-marker">📍 Sister in Need</div>',
        iconSize: [140, 32],
        iconAnchor: [70, 16]
      });
      L.marker([sister.lat, sister.lng], { icon: sisterIcon }).addTo(map);
      map.flyTo([sister.lat, sister.lng], 16, { animate: true });
    }

    // Nearby Emergency Pins
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

    // Handle real-time updates from parent as phone moves
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'SET_USER_COORDS') {
        currentLat = event.data.lat;
        currentLng = event.data.lng;
        userMarker.setLatLng([currentLat, currentLng]);
        if (!sister) {
          map.flyTo([currentLat, currentLng], 16, { animate: true });
        }
      }
    });
  </script>
</body>
</html>`;
  }, [targetCoords?.latitude, targetCoords?.longitude, requestsJson, sisterPinJson]);

  // If no GPS coordinates yet, show the live GPS radar loader
  if (!targetCoords) {
    return (
      <View style={[styles.container, styles.locatingContainer, style]}>
        <View style={styles.radarPulse}>
          <Ionicons name="navigate" size={38} color="#D44D5C" />
        </View>
        <Text style={styles.locatingTitle}>Acquiring Your Exact Live GPS...</Text>
        <Text style={styles.locatingSub}>
          Connecting to your phone's satellites. Please tap "Allow" if your browser prompts for location.
        </Text>

        <TouchableOpacity
          style={styles.retryGpsBtn}
          onPress={onRequestLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="locate" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.retryGpsText}>Detect My Exact Location</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
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

      {/* Floating Live GPS Coordinates Badge */}
      <View style={styles.topBadge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>
          {focusCoords
            ? `Sister: ${focusCoords.latitude.toFixed(4)}, ${focusCoords.longitude.toFixed(4)}`
            : `Live GPS: ${userCoords?.latitude.toFixed(4)}, ${userCoords?.longitude.toFixed(4)}`}
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
  locatingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  radarPulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  locatingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9F1239',
    marginBottom: 6,
    textAlign: 'center',
  },
  locatingSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 280,
  },
  retryGpsBtn: {
    backgroundColor: '#D44D5C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    elevation: 2,
  },
  retryGpsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
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
    letterSpacing: 0.2,
  },
});
