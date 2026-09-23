import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../services/firebase';
import {
  sendMessage,
  listenToMessages,
  deleteRequestSession,
} from '../services/requestService';

export default function ChatScreen({ route, navigation }) {
  // role: 'requester' | 'helper'
  const { requestId, role } = route.params || { requestId: null, role: 'requester' };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ending, setEnding] = useState(false);
  const flatListRef = useRef(null);

  // Subscribe to real-time message stream
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = listenToMessages(requestId, (msgs) => {
      setMessages(msgs);
      // Auto-scroll to latest message
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [requestId]);

  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || !requestId) return;
    setInput('');
    await sendMessage(requestId, txt);
  };

  // End session: purge Firestore data then navigate based on role
  const handleEndSession = async () => {
    if (!requestId || ending) return;
    setEnding(true);
    try {
      await deleteRequestSession(requestId);
    } catch (e) {
      console.warn('Session teardown error:', e.message);
    }
    if (role === 'helper') {
      navigation.navigate('HelperCompletion');
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
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

          {/* Role-based end button */}
          <TouchableOpacity
            style={role === 'helper' ? styles.completeBtn : styles.helpReceivedBtn}
            onPress={handleEndSession}
            disabled={ending}
          >
            {ending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.actionBtnText}>
                {role === 'helper' ? 'Complete ✓' : 'Help Received'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Message Feed */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>
              No messages yet. Say hi! 👋{'\n'}
              (Messages are end-to-end ephemeral and deleted when session ends.)
            </Text>
          }
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
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
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
  completeBtn: { backgroundColor: '#10B981', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, minWidth: 80, alignItems: 'center' },
  helpReceivedBtn: { backgroundColor: '#D44D5C', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, minWidth: 80, alignItems: 'center' },
  actionBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyChat: { color: '#9CA3AF', textAlign: 'center', marginTop: 40, lineHeight: 22, fontSize: 13 },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%' },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#D44D5C' },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#E5E7EB' },
  myMsgTxt: { color: 'white' },
  theirMsgTxt: { color: '#1F2937' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginRight: 8, color: '#1F2937' },
  sendBtn: { backgroundColor: '#D44D5C', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 20 },
});
