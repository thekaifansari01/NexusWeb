import { auth } from "../config/firebase.js";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
    return signInWithPopup(auth, provider);
}

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            let sessionId = localStorage.getItem("sessionId");
            if (!sessionId) {
                try {
                    const ua = navigator.userAgent;
                    let browser = "Unknown Browser";
                    let os = "Unknown OS";

                    if (ua.includes("Firefox")) browser = "Firefox";
                    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
                    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
                    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
                    else if (ua.includes("Chrome")) browser = "Chrome";
                    else if (ua.includes("Safari")) browser = "Safari";

                    if (ua.includes("Windows")) os = "Windows";
                    else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
                    else if (ua.includes("Linux")) os = "Linux";
                    else if (ua.includes("Android")) os = "Android";
                    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

                    const response = await fetch("/api/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user.uid,
                            deviceInfo: `${browser} on ${os}`
                        })
                    });
                    
                    // FIX: Check if response is OK before parsing JSON
                    if (response.ok) {
                        const data = await response.json();
                        if (data.sessionId) {
                            localStorage.setItem("sessionId", data.sessionId);
                        }
                    } else {
                        console.warn("API is not available. Running in local fallback mode.", response.status);
                    }
                } catch (error) {
                    console.warn("Network error during session creation:", error);
                }
            }
        }
        callback(user);
    });
}

export async function signOutUser() {
    const sessionId = localStorage.getItem("sessionId");
    const user = auth.currentUser;
    if (sessionId && user) {
        try {
            const response = await fetch("/api/session", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    sessionId: sessionId
                })
            });
            if (!response.ok) console.warn("Failed to delete session on backend.");
        } catch (error) {
            console.warn("Network error during logout:", error);
        }
    }
    localStorage.removeItem("sessionId");
    return signOut(auth);
}