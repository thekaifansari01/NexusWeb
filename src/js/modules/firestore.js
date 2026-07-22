// src/js/modules/firestore.js
import { db } from "../config/firebase.js";
import {
    collection, query, where, getDocs, addDoc, deleteDoc, doc,
    updateDoc, Timestamp, getDoc, setDoc, orderBy, limit 
} from "firebase/firestore";

const KEYS_COLLECTION = "apiKeys";
const DOMAINS_COLLECTION = "authorizedDomains";
const GROQ_COLLECTION = "userGroqKeys";

export async function getApiKeys(userId) {
    const q = query(collection(db, KEYS_COLLECTION), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

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

export async function deleteApiKey(keyId) {
    const res = await fetch('/api/keys', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete key');
    }
    return res.json();
}

export async function addDomain(userId, domain) {
    const res = await fetch('/api/domains', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add domain');
    }
    return res.json();
}

export async function deleteDomain(domainId) {
    const res = await fetch('/api/domains', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete domain');
    }
    return res.json();
}


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

export async function revokeApiKey(keyId) {
    await updateDoc(doc(db, KEYS_COLLECTION, keyId), { status: "revoked" });
}

export async function toggleDomainStatus(domainId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, DOMAINS_COLLECTION, domainId), { status: newStatus });
    return newStatus;
}

export async function getGroqApiKey(userId) {
    try {
        const res = await fetch('/api/groq', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch key status');
        const data = await res.json();
        return data.hasKey ? 'exists' : null;
    } catch (error) {
        console.error('getGroqApiKey error:', error);
        return null;
    }
}

export async function saveGroqApiKey(userId, apiKey) {
    const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apiKey })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save key');
    }
    return res.json();
}

export async function deleteGroqApiKey(userId) {
    const res = await fetch('/api/groq', {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete key');
    }
    return res.json();
}

export async function getUsageHistory(userId, limitCount = 10) {
    const q = query(
        collection(db, 'usageLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount) 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDailyUsageStats(userId) {
    try {
        const q = query(collection(db, 'userDailyUsage'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        let totalRequests = 0;
        let totalTokens = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            totalRequests += data.totalRequests || 0;
            totalTokens += data.totalTokens || 0;
        });

        return { totalRequests, totalTokens };
    } catch (error) {
        console.error("Error fetching daily usage stats:", error);
        return { totalRequests: 0, totalTokens: 0 };
    }
}