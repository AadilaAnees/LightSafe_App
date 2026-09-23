/**
 * geolocation.js
 * --------------
 * Robust mobile-friendly geolocation utility for LightSafe Web.
 * - Fast initial position via IP geolocation (resolves in ~200ms with zero popups).
 * - High-accuracy refinement via browser GPS (navigator.geolocation).
 * - Continuous live tracking via watchPosition.
 */

export function trackLiveLocation(onCoordsUpdate) {
  let isCancelled = false;

  // 1. Fast background city-level resolution (~200ms, zero permissions needed)
  if (typeof fetch !== 'undefined') {
    fetch('https://ipwho.is/')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data && data.success && data.latitude && data.longitude) {
          onCoordsUpdate({
            latitude: data.latitude,
            longitude: data.longitude,
            source: 'ip',
          });
        }
      })
      .catch(() => {});
  }

  // 2. High-accuracy real GPS satellite fix
  let watchId = null;
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    // Single clean call for immediate device GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isCancelled) {
          onCoordsUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            source: 'gps',
          });
        }
      },
      (err) => {
        console.warn('Browser GPS notice:', err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );

    // Continuous tracking as user moves
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isCancelled) {
          onCoordsUpdate({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            source: 'gps_live',
          });
        }
      },
      (err) => console.warn('GPS watch notice:', err.message),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }

  // Return cancel function
  return () => {
    isCancelled = true;
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
