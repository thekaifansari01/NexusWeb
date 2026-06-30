import { db } from "../config/firebase.js";
import {
    collection, query, where, getDocs, addDoc, deleteDoc, doc,
    updateDoc, Timestamp, getDoc, setDoc
} from "firebase/firestore";

const KEYS_COLLECTION = "apiKeys";
const DOMAINS_COLLECTION = "authorizedDomains";
const GROQ_COLLECTION = "userGroqKeys";

// ===== API KEYS =====
export async function createApiKey(userId, name, key) {
    const docRef = await addDoc(collection(db, KEYS_COLLECTION), {
        userId,
        name,
        key,
        status: "active",
        createdAt: Timestamp.now()
    });
    return docRef.id;
}

export async function getApiKeys(userId) {
    const q = query(collection(db, KEYS_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteApiKey(keyId) {
    await deleteDoc(doc(db, KEYS_COLLECTION, keyId));
}

export async function revokeApiKey(keyId) {
    await updateDoc(doc(db, KEYS_COLLECTION, keyId), { status: "revoked" });
}

// ===== AUTHORIZED DOMAINS =====
export async function getDomains(userId) {
    const q = query(collection(db, DOMAINS_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const domains = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return domains.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

export async function addDomain(userId, domain) {
    const q = query(
        collection(db, DOMAINS_COLLECTION),
        where("userId", "==", userId),
        where("domain", "==", domain)
    );
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error("Domain already exists");

    const countQ = query(collection(db, DOMAINS_COLLECTION), where("userId", "==", userId));
    const countSnapshot = await getDocs(countQ);
    if (countSnapshot.size >= 10) throw new Error("Maximum 10 domains allowed");

    const docRef = await addDoc(collection(db, DOMAINS_COLLECTION), {
        userId,
        domain: domain.toLowerCase().trim(),
        createdAt: Timestamp.now(),
        status: "active"
    });
    return docRef.id;
}

export async function deleteDomain(domainId) {
    await deleteDoc(doc(db, DOMAINS_COLLECTION, domainId));
}

export async function toggleDomainStatus(domainId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, DOMAINS_COLLECTION, domainId), { status: newStatus });
    return newStatus;
}

// ===== GROQ API KEY (using userId as document ID) =====
export async function getGroqApiKey(userId) {
    const docRef = doc(db, GROQ_COLLECTION, userId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return snapshot.data().apiKey || null;
    }
    return null;
}

export async function saveGroqApiKey(userId, apiKey) {
    const docRef = doc(db, GROQ_COLLECTION, userId);
    await setDoc(docRef, {
        userId,
        apiKey,
        updatedAt: Timestamp.now()
    }, { merge: true });
}

export async function deleteGroqApiKey(userId) {
    const docRef = doc(db, GROQ_COLLECTION, userId);
    await deleteDoc(docRef);
}