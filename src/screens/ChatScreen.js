import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ChatScreen({ route, navigation }) {
  // role: 'requester' | 'helper'
  const { requestId, role } = route.params || { requestId: 'demo_room', role: 'requester' };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!requestId) return;
    const messagesRef = collection(db, "requests", requestId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(list);
    });

    return unsubscribe;
  }, [requestId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const txt = input;
    setInput('');

    await addDoc(collection(db, "requests", requestId, "messages"), {
      text: txt,
      senderId: auth.currentUser?.uid || "user_anon",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Anonymous Peer Chat</Text>

          {/* Divided Role Actions */}
          {role === 'helper' ? (
            <TouchableOpacity 
              style={styles.completeBtn} 
              onPress={() => navigation.navigate('HelperCompletion')}
            >
              <Text style={styles.actionBtnText}>Complete ✓</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.helpReceivedBtn} 
              onPress={() => {
                // Navigate back to Home and open Feedback Modal
                navigation.navigate('MainTabs', { 
                  screen: 'Home', 
                  params: { triggerFeedback: true } 
                });
              }}
            >
              <Text style={styles.actionBtnText}>Help Received</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message Feed */}
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === auth.currentUser?.uid;
            return (
              <View style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}>
                <Text style={isMe ? styles.myMsgTxt : styles.theirMsgTxt}>{item.text}</Text>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type discreet message..."
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', elevation: 2 },
  backBtn: { fontSize: 16, color: '#D44D5C', fontWeight: 'bold' },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  completeBtn: { backgroundColor: '#10B981', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  helpReceivedBtn: { backgroundColor: '#D44D5C', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  actionBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%' },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#D44D5C' },
  theirMsg: { alignSelf: 'start', backgroundColor: '#E5E7EB' },
  myMsgTxt: { color: 'white' },
  theirMsgTxt: { color: '#1F2937' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 8, color: '#1F2937' },
  sendBtn: { backgroundColor: '#D44D5C', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 20 }
});