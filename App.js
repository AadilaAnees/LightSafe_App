import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Auth Stack Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterDetailsScreen from './src/screens/RegisterDetailsScreen';
import VerifyOTPScreen from './src/screens/VerifyOTPScreen';
import FaceRecognitionScreen from './src/screens/FaceRecognitionScreen';
import VerificationSuccessScreen from './src/screens/VerificationSuccessScreen';
import PrivacyConcernScreen from './src/screens/PrivacyConcernScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// Core Dashboard Screens
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import WellnessScreen from './src/screens/WellnessScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MentorsScreen from './src/screens/MentorsScreen';
import ChatScreen from './src/screens/ChatScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import HelperCompletionScreen from './src/screens/HelperCompletionScreen';
import AboutScreen from './src/screens/AboutScreen';
import PharmaciesScreen from './src/screens/PharmaciesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const isWeb = Platform.OS === 'web';
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#D44D5C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: isWeb
          ? {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              height: 60,
              paddingBottom: 6,
              paddingTop: 6,
            }
          : {
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              elevation: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 25,
              height: 65,
              paddingBottom: 10,
              paddingTop: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.6)',
            },
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Home') return <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />;
          if (route.name === 'Wellness') return <MaterialCommunityIcons name={focused ? "flower" : "flower-outline"} size={24} color={color} />;
          if (route.name === 'Map') return <Ionicons name={focused ? "map" : "map-outline"} size={22} color={color} />;
          if (route.name === 'Settings') return <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wellness" component={WellnessScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  // Register the PWA service worker on web platform only
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((reg) => console.log('[SW] Registered, scope:', reg.scope))
          .catch((err) => console.warn('[SW] Registration failed:', err));
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          {/* Auth Stack */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="FaceRecognition" component={FaceRecognitionScreen} />
          <Stack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} />
          <Stack.Screen name="PrivacyConcern" component={PrivacyConcernScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />

          {/* Core App */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="Mentors" component={MentorsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="HelperCompletion" component={HelperCompletionScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Pharmacies" component={PharmaciesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}