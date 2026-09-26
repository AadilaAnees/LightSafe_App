/**
 * requestService.js
 * -----------------
 * Encapsulates all Firestore operations for the LightSafe peer-to-peer flow.
 * No screen should call Firestore directly — use these functions instead.
 *
 * Firestore schema:
 *   /requests/{requestId}            — pad/help request document
 *   /requests/{requestId}/messages   — ephemeral chat subcollection
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "./firebase";

// ---------------------------------------------------------------------------
// REQUESTER — create & listen to own request
// ---------------------------------------------------------------------------

/**
 * Creates a new pad/help request document in Firestore.
 * @param {string} type   - e.g. "Need a Pad" | "Instant Emergency"
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {Promise<string>} The new document ID (requestId)
 */
export async function createRequest(type, coords) {
  const docRef = await addDoc(collection(db, "requests"), {
    type,
    status: "pending",
    requesterId: auth.currentUser?.uid ?? "anon",
    requesterName: "Sister in Need",
    requesterCompleted: false,
    helperCompleted: false,
    createdAt: serverTimestamp(),
    location: {
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    },
  });
  return docRef.id;
}

/**
 * Attaches a real-time listener to a single request document.
 * Fires callback with the document data whenever it changes.
 * @param {string} requestId
 * @param {(data: object | null) => void} callback
 * @returns {() => void} Unsubscribe function — call in useEffect cleanup
 */
export function listenToRequest(requestId, callback) {
  const docRef = doc(db, "requests", requestId);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ---------------------------------------------------------------------------
// HELPER — listen for incoming requests and accept one
// ---------------------------------------------------------------------------

/**
 * Listens for all pending requests in real-time (helper side).
 * @param {(requests: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToPendingRequests(callback) {
  const q = query(
    collection(db, "requests"),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/**
 * Atomically marks a request as accepted by this helper.
 * This triggers the requester's onSnapshot listener to fire.
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export async function acceptRequest(requestId) {
  const helperId = auth.currentUser?.uid ?? "anon_helper";
  await updateDoc(doc(db, "requests", requestId), {
    status: "accepted",
    helperId,
    helperName: "Sister Volunteer",
    helperCompleted: false,
  });
}

// ---------------------------------------------------------------------------
// TWO-SIDED COMPLETION & CANCELLATION
// ---------------------------------------------------------------------------

/**
 * Marks that the requester has received help.
 * If helper has already completed, marks entire request as completed.
 * @param {string} requestId
 * @returns {Promise<{ bothCompleted: boolean }>}
 */
export async function markRequesterCompleted(requestId) {
  const docRef = doc(db, "requests", requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { bothCompleted: false };

  const data = snap.data();
  const bothCompleted = !!data.helperCompleted;

  await updateDoc(docRef, {
    requesterCompleted: true,
    ...(bothCompleted ? { status: "completed" } : {}),
  });

  return { bothCompleted };
}

/**
 * Marks that the helper has completed assistance / delivery.
 * If requester has already confirmed help received, marks request as completed.
 * @param {string} requestId
 * @returns {Promise<{ bothCompleted: boolean }>}
 */
export async function markHelperCompleted(requestId) {
  const docRef = doc(db, "requests", requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { bothCompleted: false };

  const data = snap.data();
  const bothCompleted = !!data.requesterCompleted;

  await updateDoc(docRef, {
    helperCompleted: true,
    ...(bothCompleted ? { status: "completed" } : {}),
  });

  return { bothCompleted };
}

/**
 * Cancels a request by either requester or helper.
 * If helper cancels, frees request back to pending so other nearby sisters can help.
 * If requester cancels, marks request as cancelled.
 * @param {string} requestId
 * @param {"requester" | "helper"} cancelledBy
 * @returns {Promise<void>}
 */
export async function cancelRequest(requestId, cancelledBy) {
  try {
    const docRef = doc(db, "requests", requestId);
    if (cancelledBy === "helper") {
      await updateDoc(docRef, {
        status: "pending",
        helperId: null,
        helperName: null,
        helperCompleted: false,
      });
    } else {
      await updateDoc(docRef, {
        status: "cancelled",
        cancelledBy: "requester",
      });
    }
  } catch (err) {
    console.warn("cancelRequest notice:", err.message);
  }
}

// ---------------------------------------------------------------------------
// CHAT — send and receive messages
// ---------------------------------------------------------------------------

/**
 * Sends a chat message to the request's messages subcollection.
 * @param {string} requestId
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function sendMessage(requestId, text) {
  await addDoc(collection(db, "requests", requestId, "messages"), {
    text,
    senderId: auth.currentUser?.uid ?? "anon",
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribes to the real-time message stream for a request.
 * Messages are ordered by createdAt ascending.
 * @param {string} requestId
 * @param {(messages: object[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function listenToMessages(requestId, callback) {
  const q = query(
    collection(db, "requests", requestId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}

// ---------------------------------------------------------------------------
// SESSION TEARDOWN — ephemeral purge
// ---------------------------------------------------------------------------

/**
 * Atomically purges the entire session:
 *   1. Deletes all documents in the messages subcollection.
 *   2. Deletes the parent request document.
 *
 * Called when both parties have completed or session is permanently dismissed.
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export async function deleteRequestSession(requestId) {
  try {
    // Step 1: Delete all messages
    const messagesRef = collection(db, "requests", requestId, "messages");
    const snapshot = await getDocs(messagesRef);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Step 2: Delete the parent request document
    await deleteDoc(doc(db, "requests", requestId));
  } catch (err) {
    console.warn(
      "deleteRequestSession error (session may already be gone):",
      err.message
    );
  }
}
