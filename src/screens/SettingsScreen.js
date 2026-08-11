import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebase';

export default function SettingsScreen({ navigation }) {

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => auth.signOut() }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action is permanent and will wipe all your personal data.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Permanently", style: "destructive", onPress: () => Alert.alert("Account Deleted") }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>H</Text>
        </View>
        <View>
          <Text style={styles.userName}>Hiruni Perera</Text>
          <Text style={styles.userEmail}>hiruni@gmail.com</Text>
        </View>
      </View>

      {/* Settings Options Group */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => Alert.alert("Edit Profile", "Feature ready for text updates.")}>
          <Ionicons name="person-outline" size={22} color="#D44D5C" style={styles.icon} />
          <Text style={styles.itemText}>Edit Profile Info</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Rewards')}>
          <Ionicons name="ribbon-outline" size={22} color="#D44D5C" style={styles.icon} />
          <Text style={styles.itemText}>Rewards Achieved (Kindness Points)</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => Alert.alert("Period Settings", "Cycle length and predictions reset.")}>
          <MaterialCommunityIcons name="calendar-refresh-outline" size={22} color="#D44D5C" style={styles.icon} />
          <Text style={styles.itemText}>Reset Period Settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('About')}>
          <Ionicons name="information-circle-outline" size={22} color="#D44D5C" style={styles.icon} />
          <Text style={styles.itemText}>Who We Are</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" style={styles.icon} />
          <Text style={[styles.itemText, { color: '#DC2626' }]}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={22} color="#DC2626" style={styles.icon} />
          <Text style={[styles.itemText, { color: '#DC2626' }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  content: { padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  userCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 25, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#7E22CE' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  userEmail: { fontSize: 13, color: '#6B7280' },
  section: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 15, marginBottom: 20, elevation: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  icon: { marginRight: 15 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#374151' }
});