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
  Alert,
} from 'react-native';
import { auth } from '../services/firebase';
import {
  sendMessage,
  listenToMessages,
  listenToRequest,
  markRequesterCompleted,
  markHelperCompleted,
  cancelRequest,
  deleteRequestSession,
} from '../services/requestService';
import { addKindnessPoints } from '../utils/rewardsStorage';

export default function ChatScreen({ route, navigation }) {
  // role: 'requester' | 'helper'
  const { requestId, role } = route.params || { requestId: null, role: 'requester' };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [requestDoc, setRequestDoc] = useState(null);
  const flatListRef = useRef(null);
  const isFinalizingRef = useRef(false);

  // Subscribe to real-time message stream
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = listenToMessages(requestId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [requestId]);

  // Subscribe to request document state for two-sided completion and cancellation
  useEffect(() => {
    if (!requestId) return;

    const unsubscribe = listenToRequest(requestId, async (req) => {
      if (isFinalizingRef.current) return;

      if (!req) {
        // Document deleted or purged
        if (role === 'helper') {
          Alert.alert('Session Finished', 'Receiver confirmed help or session was closed.');
          navigation.navigate('MainTabs', { screen: 'Map' });
        } else {
          navigation.navigate('MainTabs', { screen: 'Home' });
        }
        return;
      }

      setRequestDoc(req);

      // Handle cancellation
      if (req.status === 'cancelled') {
        isFinalizingRef.current = true;
        Alert.alert(
          'Request Cancelled',
          req.cancelledBy === 'requester'
            ? 'The sister cancelled this request.'
            : 'The volunteer had to cancel assistance.'
        );
        navigation.navigate('MainTabs');
        return;
      }

      // Check if both sides completed
      const bothDone = req.status === 'completed' || (req.requesterCompleted && req.helperCompleted);
      if (bothDone && !isFinalizingRef.current) {
        isFinalizingRef.current = true;
        if (role === 'helper') {
          await addKindnessPoints(50);
          await deleteRequestSession(requestId);
          navigation.navigate('HelperCompletion');
        } else {
          await deleteRequestSession(requestId);
          navigation.navigate('MainTabs', {
            screen: 'Home',
            params: {
              openFeedback: true,
              requestId,
              helperName: req.helperName || 'Sister Volunteer',
            },
          });
        }
      }
    });

    return () => unsubscribe();
  }, [requestId, role, navigation]);

  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || !requestId) return;
    setInput('');
    await sendMessage(requestId, txt);
  };

  // Requester taps "Help Received" -> redirects to feedback & marks completed
  const handleRequesterHelpReceived = async () => {
    if (!requestId || loadingAction || isFinalizingRef.current) return;
    setLoadingAction(true);
    try {
      const { bothCompleted } = await markRequesterCompleted(requestId);
      if (bothCompleted) {
        isFinalizingRef.current = true;
        await deleteRequestSession(requestId);
      }
      navigation.navigate('MainTabs', {
        screen: 'Home',
        params: {
          openFeedback: true,
          requestId,
          helperName: requestDoc?.helperName || 'Sister Volunteer',
        },
      });
    } catch (err) {
      console.warn('handleRequesterHelpReceived error:', err.message);
      Alert.alert('Notice', 'Could not record status. Please check your connection.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper taps "Complete ✓" -> marks delivered & checks if requester already confirmed
  const handleHelperComplete = async () => {
    if (!requestId || loadingAction || isFinalizingRef.current) return;
    setLoadingAction(true);
    try {
      const { bothCompleted } = await markHelperCompleted(requestId);
      if (bothCompleted || requestDoc?.requesterCompleted) {
        isFinalizingRef.current = true;
        await addKindnessPoints(50);
        await deleteRequestSession(requestId);
        navigation.navigate('HelperCompletion');
      } else {
        Alert.alert(
          'Marked as Delivered!',
          'Great job! Once the sister confirms "Help Received", your 50 Kindness Points will be awarded and session finalized.'
        );
      }
    } catch (err) {
      console.warn('handleHelperComplete error:', err.message);
      Alert.alert('Notice', 'Could not complete request. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Cancel action with confirmation
  const handleCancelSession = () => {
    if (!requestId || loadingAction) return;

    const title = role === 'requester' ? 'Cancel Request?' : 'Cancel Assistance?';
    const message =
      role === 'requester'
        ? 'Are you sure you want to cancel this emergency request? This will close the session.'
        : 'Are you unable to assist? This will return the request to the map for other sisters.';

    Alert.alert(title, message, [
      { text: 'Keep Active', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setLoadingAction(true);
          isFinalizingRef.current = true;
          try {
            if (role === 'requester') {
              await cancelRequest(requestId, 'requester');
              await deleteRequestSession(requestId);
              navigation.navigate('MainTabs', { screen: 'Home' });
            } else {
              await cancelRequest(requestId, 'helper');
              navigation.navigate('MainTabs', { screen: 'Map' });
            }
          } catch (e) {
            console.warn('Cancel error:', e.message);
            navigation.navigate('MainTabs');
          } finally {
            setLoadingAction(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Anonymous Peer Chat</Text>
            <Text style={styles.headerSub}>
              {role === 'helper' ? 'Connected with Sister' : 'Connected with Volunteer'}
            </Text>
          </View>

          {/* Action buttons (Complete + Cancel) */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelSession}
              disabled={loadingAction}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {role === 'helper' ? (
              <TouchableOpacity
                style={[
                  styles.completeBtn,
                  requestDoc?.requesterCompleted && styles.completeBtnPulsing,
                ]}
                onPress={handleHelperComplete}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.actionBtnText}>Complete ✓</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.helpReceivedBtn}
                onPress={handleRequesterHelpReceived}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.actionBtnText}>Help Received</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Real-time Status Notice Banner */}
        {role === 'helper' && requestDoc?.requesterCompleted && (
          <View style={styles.statusBannerSuccess}>
            <Text style={styles.statusBannerSuccessText}>
              ✓ Sister confirmed help received! Tap "Complete ✓" above to finish and claim your 50 points.
            </Text>
          </View>
        )}

        {role === 'helper' && requestDoc?.helperCompleted && !requestDoc?.requesterCompleted && (
          <View style={styles.statusBannerPending}>
            <Text style={styles.statusBannerPendingText}>
              ⏳ Marked as delivered. Waiting for sister to tap "Help Received"...
            </Text>
          </View>
        )}

        {role === 'requester' && requestDoc?.helperCompleted && !requestDoc?.requesterCompleted && (
          <View style={styles.statusBannerSuccess}>
            <Text style={styles.statusBannerSuccessText}>
              ✓ Sister volunteer marked help delivered. Tap "Help Received" to rate and finalize.
            </Text>
          </View>
        )}

        {role === 'requester' && requestDoc?.requesterCompleted && !requestDoc?.helperCompleted && (
          <View style={styles.statusBannerPending}>
            <Text style={styles.statusBannerPendingText}>
              ⏳ Help confirmed! Waiting for volunteer's final confirmation...
            </Text>
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { fontSize: 14, color: '#D44D5C', fontWeight: 'bold' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  headerSub: { fontSize: 11, color: '#6B7280' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 6,
  },
  cancelBtnText: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  completeBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeBtnPulsing: {
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  helpReceivedBtn: {
    backgroundColor: '#D44D5C',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  statusBannerSuccess: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  statusBannerSuccessText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBannerPending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  statusBannerPendingText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyChat: { color: '#9CA3AF', textAlign: 'center', marginTop: 40, lineHeight: 22, fontSize: 13 },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: '80%' },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#D44D5C' },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#E5E7EB' },
  myMsgTxt: { color: 'white' },
  theirMsgTxt: { color: '#1F2937' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    color: '#1F2937',
  },
  sendBtn: {
    backgroundColor: '#D44D5C',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 20,
  },
});
