# LightSafe: Women-to-Women Instant Network (W2W-IN)

**Video Submission Link:** https://youtu.be/knQV4yhJR8g

## Tech Stack Used
* **Frontend:** React Native, Expo, React Navigation
* **Backend as a Service:** Google Firebase (Firestore, Firebase Anonymous Auth)
* **Design/UI:** React Native Vector Icons (`@expo/vector-icons`), Custom SVG Components (`react-native-svg`)

## Deployment Details
The application is currently built as an Expo Managed project. It is not compiled into a standalone production APK/AAB for this submission stage. It runs via the Expo Go client to allow judges to easily test the cross-platform codebase on their own devices.

## Architecture / System Overview
LightSafe operates on a decentralized peer-to-peer assistance model. 
1. **Client Layer:** The Expo React Native app handles UI state and device permissions (location, camera).
2. **Auth Layer:** Firebase Anonymous Auth combined with local biometric/face-scan validation states ensures rapid, secure onboarding without immediate hard data retention.
3. **Database Layer:** Cloud Firestore manages real-time synced collections. The `/requests` collection acts as a live broadcast hub where users push SOS or supply needs. A snapshot listener in the `HomeScreen` constantly queries this collection for nearby pending requests, triggering real-time UI alerts. The `/messages` subcollection handles temporary anonymous chat, dynamically mapping users to `requester` or `helper` roles based on their interaction origin.

## Technical Challenges & Creative Solutions
1. **Secure Environment Configuration in Expo (`src/services/firebase.js`)**
   Preventing Google API key leakage in the GitHub repository without relying on unstable Babel plugins. *Solution:* Implemented Expo's native `EXPO_PUBLIC_` environment variable prefix strategy. This allowed us to keep `.env` in `.gitignore` while dynamically injecting Firebase credentials into the bundler at runtime.
2. **Strict Aspect-Ratio UI for Wellness Tracker (`src/screens/WellnessScreen.js`)**
   Building a custom calendar grid without heavy third-party libraries resulted in distorted oval shapes for day highlights due to percentage-based flex widths. *Solution:* Decoupled the outer column wrapper (`width: '14.28%'`) from the inner highlight circle (`width: 36, height: 36`), guaranteeing perfect 1:1 circular UI elements across all screen sizes.
3. **Dynamic Dual-Role Chat Routing (`src/screens/ChatScreen.js`)**
   Allowing two users to share a single chat interface but see different completion actions based on who asked for help vs. who offered it. *Solution:* Passed a `role` parameter (`'requester'` or `'helper'`) through React Navigation. Helpers see a "Complete ✓" button granting Kindness Points, while Requesters see a "Help Received" button triggering the feedback flow.
4. **Real-Time Nearby Alert Pulses (`src/screens/HomeScreen.js`)**
   Ensuring a user is instantly notified if another woman nearby requests an emergency item (like a sanitary pad) without relying on heavy push-notification infrastructure. *Solution:* Attached an active `onSnapshot` listener to Firestore's `/requests` collection scoped to pending statuses, which renders a continuous pulsing red banner at the top of the UI until the request is fulfilled.

## Scope Delivered
* **Fully Implemented:** 
  * Real-time SOS and Pad Request broadcasting to nearby users.
  * Anonymous Peer-to-Peer Chat with dynamic role resolution.
  * Wellness/Cycle tracking UI with accurate phase predictions and insight toggles.
  * Partner Pharmacies list with filtering.
* **Partially Implemented:** 
  * Biometric Face Scan: UI and flow are fully implemented and time-simulated, but the actual ML facial recognition verification backend is mocked for the prototype.
  * Map Safe Zones: Static pins are placed; real-time GPS clustering for safe zones is pending API integration.
* **Not Implemented by Choice:** 
  * Paid Mentor Booking: Removed to focus strictly on emergency peer-to-peer assistance and wellness for the hackathon scope.

## Judges Should Note
* **Environment Setup:** You must create an `.env` file based on the provided `Example.env` and insert valid Firebase configuration keys for the database and chat features to function. 
* **Anonymous Testing:** The app uses Firebase Anonymous Auth. If you uninstall and reinstall Expo Go, a new anonymous UID is generated, which will wipe your previous local test session context.
