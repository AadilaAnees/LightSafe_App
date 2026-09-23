/**
 * WebMapFallback.js
 * -----------------
 * Ultra-responsive, mobile-first Leaflet map for LightSafe Web.
 * - Always renders immediately (never gets stuck on a blank/locating screen).
 * - Clean OpenStreetMap tiles (no watermarks, no API keys).
 * - Smoothly flies to user's real GPS position as soon as detected.
 * - Displays Sister target pin when helping.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function WebMapFallback({
  userCoords,
  helperCoords,
  focusCoords,
  requests = [],
  style,
}) {
  const iframeRef = useRef(null);

  // Target coordinates to focus
  const targetCoords = focusCoords || userCoords;
  const initialLat = targetCoords?.latitude ?? 20.0;
  const initialLng = targetCoords?.longitude ?? 0.0;
  const initialZoom = targetCoords ? 15 : 3;

  // Stream updates to Leaflet iframe as user moves
  useEffect(() => {
    if (userCoords && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_USER_COORDS',
          lat: userCoords.latitude,
          lng: userCoords.longitude,
          focusOnSister: !!focusCoords,
        },
        '*'
      );
    }
  }, [userCoords?.latitude, userCoords?.longitude, focusCoords]);

  // When focusCoords changes (e.g. tapped Assist Sister), fly to her
  useEffect(() => {
    if (focusCoords && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'FOCUS_SISTER',
          lat: focusCoords.latitude,
          lng: focusCoords.longitude,
        },
        '*'
      );
    }
  }, [focusCoords?.latitude, focusCoords?.longitude]);

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

  const userCoordsJson = userCoords
    ? JSON.stringify({
        lat: userCoords.latitude,
        lng: userCoords.longitude,
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

    /* Floating Recenter Button */
    .recenter-btn {
      position: absolute;
      bottom: 14px;
      right: 12px;
      z-index: 1000;
      background: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.22);
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

  <button class="recenter-btn" onclick="recenterMap()" title="Recenter">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5">
      <circle cx="12" cy="12" r="7"/>
      <line x1="12" y1="1" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="23"/>
      <line x1="1" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="23" y2="12"/>
      <circle cx="12" cy="12" r="2.5" fill="#2563EB"/>
    </svg>
  </button>

  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${initialLat}, ${initialLng}], ${initialZoom});

    // Clean OpenStreetMap tiles (100% Free, NO API KEY, NO WATERMARK)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var userCoords = ${userCoordsJson};
    var userMarker = null;

    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse-marker"><div class="pulse-ring"></div><div class="pulse-core"></div></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    if (userCoords) {
      userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    }

    // Sister Target Pin
    var sister = ${sisterPinJson};
    var sisterMarker = null;
    if (sister) {
      var sisterIcon = L.divIcon({
        className: '',
        html: '<div class="sister-target-marker">📍 Sister in Need</div>',
        iconSize: [140, 32],
        iconAnchor: [70, 16]
      });
      sisterMarker = L.marker([sister.lat, sister.lng], { icon: sisterIcon }).addTo(map);
      map.flyTo([sister.lat, sister.lng], 16, { animate: true });
    }

    // Nearby Request markers
    var requests = ${requestsJson};
    requests.forEach(function(req) {
      var reqIcon = L.divIcon({
        className: '',
        html: '<div style="background:#D44D5C;color:white;border:2px solid white;border-radius:12px;padding:3px 7px;font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.25);">📍 ' + req.type + '</div>',
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });
      L.marker([req.lat, req.lng], { icon: reqIcon })
        .addTo(map)
        .bindPopup('<b>' + req.type + '</b><br>' + req.distance);
    });

    function recenterMap() {
      if (sister) {
        map.flyTo([sister.lat, sister.lng], 16, { animate: true });
      } else if (userMarker) {
        map.flyTo(userMarker.getLatLng(), 16, { animate: true });
      }
    }

    // Handle messages from parent window
    window.addEventListener('message', function(event) {
      if (!event.data) return;

      if (event.data.type === 'SET_USER_COORDS') {
        var latLng = [event.data.lat, event.data.lng];
        if (!userMarker) {
          userMarker = L.marker(latLng, { icon: userIcon }).addTo(map);
        } else {
          userMarker.setLatLng(latLng);
        }
        if (!event.data.focusOnSister) {
          map.flyTo(latLng, 16, { animate: true, duration: 1.2 });
        }
      }

      if (event.data.type === 'FOCUS_SISTER') {
        var sLatLng = [event.data.lat, event.data.lng];
        if (sisterMarker) {
          sisterMarker.setLatLng(sLatLng);
        } else {
          var sIcon = L.divIcon({
            className: '',
            html: '<div class="sister-target-marker">📍 Sister in Need</div>',
            iconSize: [140, 32],
            iconAnchor: [70, 16]
          });
          sisterMarker = L.marker(sLatLng, { icon: sIcon }).addTo(map);
        }
        map.flyTo(sLatLng, 16, { animate: true });
      }
    });
  </script>
</body>
</html>`;
  }, [initialLat, initialLng, initialZoom, requestsJson, sisterPinJson, userCoordsJson]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 14,
        }}
        title="Live Map"
      />

      {/* Floating GPS Status Pill */}
      <View style={styles.topBadge}>
        <View style={[styles.dot, !userCoords && { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.badgeText}>
          {focusCoords
            ? 'Showing Sister Location'
            : userCoords
            ? `Live GPS: ${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`
            : 'Connecting GPS...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    minHeight: 220,
  },
  topBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
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
