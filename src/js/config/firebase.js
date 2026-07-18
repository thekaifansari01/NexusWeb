import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAEptheO-640PV6s7lbDZ_4pxkRoCXe_VE",
    authDomain: "trynexus.site",
    projectId: "nexuswebassistant",
    storageBucket: "nexuswebassistant.firebasestorage.app",
    messagingSenderId: "69132729895",
    appId: "1:69132729895:web:1fc74209c95486e241d802",
    measurementId: "G-WEPDV083FB"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };