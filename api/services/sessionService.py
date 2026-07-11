# api/services/sessionService.py
import uuid
import re
from api.core.config import db
from firebase_admin import firestore

def _parse_user_agent(ua):
    if not ua:
        return {'os': 'Unknown', 'browser': 'Unknown', 'type': 'desktop'}

    ua_lower = ua.lower()
    os = 'Unknown'
    browser = 'Unknown'
    device_type = 'desktop'

    if 'windows' in ua_lower:
        os = 'Windows'
    elif 'mac' in ua_lower:
        os = 'macOS'
    elif 'linux' in ua_lower:
        os = 'Linux'
    elif 'android' in ua_lower:
        os = 'Android'
        device_type = 'mobile'
    elif 'iphone' in ua_lower or 'ipad' in ua_lower:
        os = 'iOS'
        device_type = 'mobile' if 'iphone' in ua_lower else 'tablet'
    elif 'cros' in ua_lower:
        os = 'ChromeOS'

    if 'chrome' in ua_lower and 'edg' not in ua_lower and 'opr' not in ua_lower:
        browser = 'Chrome'
    elif 'safari' in ua_lower and 'chrome' not in ua_lower:
        browser = 'Safari'
    elif 'firefox' in ua_lower:
        browser = 'Firefox'
    elif 'edg' in ua_lower:
        browser = 'Edge'
    elif 'opr' in ua_lower or 'opera' in ua_lower:
        browser = 'Opera'

    if any(x in ua_lower for x in ['mobile', 'android', 'iphone', 'ipad']):
        if 'tablet' in ua_lower or 'ipad' in ua_lower:
            device_type = 'tablet'
        elif 'mobile' in ua_lower or 'iphone' in ua_lower:
            device_type = 'mobile'

    return {'os': os, 'browser': browser, 'type': device_type}

def create_session(user_id, session_id, device_info, ip_address, location):
    parsed = _parse_user_agent(device_info)
    session_data = {
        'userId': user_id,
        'sessionId': session_id,
        'deviceInfo': device_info,
        'deviceOS': parsed['os'],
        'deviceBrowser': parsed['browser'],
        'deviceType': parsed['type'],
        'ipAddress': ip_address,
        'location': location,
        'status': 'active',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'lastActive': firestore.SERVER_TIMESTAMP
    }
    db.collection('active_sessions').document(session_id).set(session_data)
    return 200, {"success": True, "sessionId": session_id}

def get_sessions(user_id, current_session_id=None):
    docs = db.collection('active_sessions').where('userId', '==', user_id).where('status', '==', 'active').get()
    sessions = []
    for doc in docs:
        data = doc.to_dict()
        if 'createdAt' in data and data['createdAt']:
            data['createdAt'] = data['createdAt'].isoformat()
        if 'lastActive' in data and data['lastActive']:
            data['lastActive'] = data['lastActive'].isoformat()
        sessions.append(data)
    return 200, {"sessions": sessions, "currentSessionId": current_session_id}

def revoke_session(session_id, user_id):
    doc_ref = db.collection('active_sessions').document(session_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get('userId') != user_id:
        return 403, {"error": "Unauthorized"}
    doc_ref.update({'status': 'revoked'})
    return 200, {"success": True}

def revoke_all_sessions(user_id, current_session_id):
    docs = db.collection('active_sessions').where('userId', '==', user_id).where('status', '==', 'active').stream()
    batch = db.batch()
    count = 0
    for doc in docs:
        if doc.id == current_session_id:
            continue
        batch.update(doc.reference, {'status': 'revoked'})
        count += 1
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
    if count > 0:
        batch.commit()
    return 200, {"success": True}