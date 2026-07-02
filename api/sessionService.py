import uuid
from api.config import db
from firebase_admin import firestore

def create_session(user_id, device_info, ip_address, location):
    session_id = str(uuid.uuid4())
    session_data = {
        'userId': user_id,
        'sessionId': session_id,
        'deviceInfo': device_info,
        'ipAddress': ip_address,
        'location': location,
        'status': 'active',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'lastActive': firestore.SERVER_TIMESTAMP
    }
    db.collection('active_sessions').document(session_id).set(session_data)
    return 200, {"success": True, "sessionId": session_id}

def get_sessions(user_id):
    docs = db.collection('active_sessions').where('userId', '==', user_id).where('status', '==', 'active').get()
    sessions = []
    for doc in docs:
        data = doc.to_dict()
        if 'createdAt' in data and data['createdAt']:
            data['createdAt'] = data['createdAt'].isoformat()
        if 'lastActive' in data and data['lastActive']:
            data['lastActive'] = data['lastActive'].isoformat()
        sessions.append(data)
    return 200, {"sessions": sessions}

def revoke_session(session_id, user_id):
    doc_ref = db.collection('active_sessions').document(session_id)
    doc = doc_ref.get()
    
    if not doc.exists or doc.to_dict().get('userId') != user_id:
        return 403, {"error": "Unauthorized"}
        
    doc_ref.update({'status': 'revoked'})
    return 200, {"success": True}