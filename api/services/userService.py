# api/services/userService.py
from firebase_admin import firestore
from api.core.config import db

def delete_user_data(uid):
    collections = [
        'apiKeys',
        'authorizedDomains',
        'usageLogs',
        'userDailyUsage',
        'active_sessions',
        'userRateLimits',
        'emailLogs'
    ]
    db.collection('users').document(uid).delete()
    db.collection('userGroqKeys').document(uid).delete()
    for col in collections:
        try:
            docs = db.collection(col).where('userId', '==', uid).stream()
            batch = db.batch()
            count = 0
            for doc in docs:
                batch.delete(doc.reference)
                count += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            if count > 0:
                batch.commit()
        except Exception:
            pass