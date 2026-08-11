import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyConcernScreen({ navigation }) {
  const [isAge16, setIsAge16] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const canRegister = isAge16 && agreedTerms;

  return (
    <View style={styles.container}>
      <Text style={styles.stepHeader}>Final Step</Text>
      <Text style={styles.title}>Privacy & Safety</Text>
      <Text style={styles.sub}>Please review our community guidelines before registering.</Text>

      {/* Checkbox 1 */}
      <TouchableOpacity style={styles.checkRow} onPress={() => setIsAge16(!isAge16)}>
        <Ionicons name={isAge16 ? "checkbox" : "square-outline"} size={24} color={isAge16 ? "#D44D5C" : "#9CA3AF"} />
        <Text style={styles.checkTxt}>I confirm that I am over 16 years of age.</Text>
      </TouchableOpacity>

      {/* Checkbox 2 */}
      <TouchableOpacity style={styles.checkRow} onPress={() => setAgreedTerms(!agreedTerms)}>
        <Ionicons name={agreedTerms ? "checkbox" : "square-outline"} size={24} color={agreedTerms ? "#D44D5C" : "#9CA3AF"} />
        <Text style={styles.checkTxt}>I agree to the Terms, Conditions, and Privacy Policies.</Text>
      </TouchableOpacity>

      {/* Link to Read Full Terms */}
      <TouchableOpacity onPress={() => setShowTermsModal(true)} style={{ marginTop: 15 }}>
        <Text style={styles.readTermsLink}>📖 Read Terms & Conditions</Text>
      </TouchableOpacity>

      {/* Disabled Register Button until both boxes are checked */}
      <TouchableOpacity 
        style={[styles.btn, !canRegister && styles.btnDisabled]} 
        disabled={!canRegister}
        onPress={() => navigation.navigate('Welcome')}
      >
        <Text style={styles.btnTxt}>Register Account</Text>
      </TouchableOpacity>

      {/* Terms & Conditions Modal Content */}
      <Modal visible={showTermsModal} animationType="slide">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTermsModal(false)}>
            <Ionicons name="close-circle" size={32} color="#1F2937" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.termsContent}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              Welcome to LightSafe, a Women-to-Women Instant Network (W2W-IN). By registering or using this app, you agree to follow the terms outlined below. W2W-IN is designed to connect verified women nearby for quick, discreet assistance.
              {"\n\n"}
              <Text style={styles.boldHead}>User Responsibility</Text>{"\n"}
              • You must be a verified female user to join this community.{"\n"}
              • You agree to use the app respectfully and responsibly, ensuring that all interactions remain safe and appropriate.{"\n"}
              • You may not share or misuse another user’s personal details or messages.{"\n"}
              • Requests should be genuine and related to personal wellness or safety needs only.
              {"\n\n"}
              <Text style={styles.boldHead}>Privacy and Data Protection</Text>{"\n"}
              • Your personal data (name, NIC, and phone number) is used only for verification and security.{"\n"}
              • Location data is shared in a limited, approximate way to find nearby users — your exact location is never revealed.{"\n"}
              • Photos or verification data used for face recognition are stored securely and never shared.{"\n"}
              • Chats are temporary and automatically deleted after completion.
              {"\n\n"}
              <Text style={styles.boldHead}>Safety and Conduct</Text>{"\n"}
              • W2W-IN promotes trust, empathy, and privacy.{"\n"}
              • Abusive language, harassment, fake requests, or any form of misconduct will result in account suspension.{"\n"}
              • The app is not a medical or emergency response service. For urgent medical situations, please contact professional or emergency services.
              {"\n\n"}
              <Text style={styles.boldHead}>Updates to Terms</Text>{"\n"}
              These Terms & Conditions may be updated periodically to improve user safety and compliance. Continued use of the app after changes means you accept the revised terms.
              {"\n\n"}
              <Text style={styles.boldHead}>Contact Us</Text>{"\n"}
              If you have questions or concerns, please reach out via our in-app feedback form or email: support@w2win.org
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 25, paddingTop: 60 },
  stepHeader: { fontSize: 12, fontWeight: 'bold', color: '#D44D5C' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 30, marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  checkTxt: { marginLeft: 12, fontSize: 14, color: '#374151', flex: 1 },
  readTermsLink: { color: '#D44D5C', fontWeight: 'bold', fontSize: 14, textDecorationLine: 'underline' },
  btn: { backgroundColor: '#D44D5C', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 35 },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: '#FAF9F6' },
  closeBtn: { paddingTop: 50, paddingRight: 20, alignSelf: 'flex-end' },
  termsContent: { padding: 25 },
  termsTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  termsText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  boldHead: { fontWeight: 'bold', color: '#1F2937', fontSize: 15 }
});