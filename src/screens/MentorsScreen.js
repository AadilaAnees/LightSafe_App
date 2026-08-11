import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MENTORS = [
  {
    id: '1',
    name: 'Dr. Pamoda Jayakody',
    role: 'Reproductive Health Advisor specializing in family planning and promoting overall sexual wellness',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=60',
    bio: "Dr. Jayakody's influence extends far beyond the clinic. She is celebrated for founding the 'Future Foundations' national outreach program, a successful initiative that delivered essential family planning education and resources to over 5,000 underserved families.\n\nFurther demonstrating her innovation, she pioneered the 'Wellness Woven' model, which seamlessly integrates sexual health discussions into routine general patient care."
  },
  {
    id: '2',
    name: 'Dr. Ananya Sharma',
    role: 'Gynecologist & Menstrual Hygiene Advocate',
    image: 'https://images.unsplash.com/photo-1594824813566-78a911e3b23c?w=500&auto=format&fit=crop&q=60',
    bio: 'Dr. Sharma specializes in adolescent reproductive health, PCOS management, and empowering young women through comprehensive care and confidential consultations.'
  }
];

export default function MentorsScreen({ navigation }) {
  const [selectedMentor, setSelectedMentor] = useState(null);

  return (
    <View style={styles.container}>
      {/* Navigation Header with Back Button */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>          
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Find a Mentor</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>Verified female medical advisors for confidential guidance.</Text>

      <FlatList
        data={MENTORS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedMentor(item)} activeOpacity={0.8}>
            <Image source={{ uri: item.image }} style={styles.cardImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role} numberOfLines={2}>{item.role}</Text>
              <Text style={styles.viewLink}>View Profile & Bio ➔</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detailed Modal */}
      <Modal visible={selectedMentor !== null} animationType="slide">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedMentor(null)}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.detailName}>{selectedMentor?.name}</Text>
            
            <View style={styles.profileRow}>
              <Text style={styles.detailRole}>{selectedMentor?.role}</Text>
              <Image source={{ uri: selectedMentor?.image }} style={styles.detailAvatar} />
            </View>

            <Text style={styles.detailBio}>{selectedMentor?.bio}</Text>

            <TouchableOpacity 
              style={styles.bookBtn} 
              onPress={() => Alert.alert("Booking", `Appointment request sent to ${selectedMentor?.name}.`)}
            >
              <Text style={styles.bookBtnText}>Book an appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.askBtn} 
              onPress={() => Alert.alert("Quick Question", "Type your confidential message to the mentor.")}
            >
              <Text style={styles.askBtnText}>Ask a Quick Question</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 20, paddingTop: 50 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 1 },
  cardImg: { width: 65, height: 65, borderRadius: 32, marginRight: 15 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
  role: { fontSize: 12, color: '#6B7280', marginVertical: 4 },
  viewLink: { fontSize: 13, color: '#D44D5C', fontWeight: 'bold', marginTop: 4 },

  modalBg: { flex: 1, backgroundColor: '#F3E8FF' },
  backBtn: { paddingTop: 50, paddingLeft: 20 },
  modalContent: { padding: 25 },
  detailName: { fontSize: 26, fontWeight: 'bold', color: '#2E1065', marginBottom: 15 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  detailRole: { flex: 0.65, fontSize: 15, color: '#4C1D95', lineHeight: 22 },
  detailAvatar: { width: 110, height: 110, borderRadius: 55 },
  detailBio: { fontSize: 14, color: '#3B0764', lineHeight: 22, marginBottom: 35 },
  bookBtn: { backgroundColor: '#1E0E38', padding: 18, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  bookBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  askBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1E0E38', padding: 18, borderRadius: 8, alignItems: 'center' },
  askBtnText: { color: '#1E0E38', fontWeight: 'bold', fontSize: 15 }
});