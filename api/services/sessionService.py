# api/services/sessionService.py
import uuid
import re
from api.core.config import db
from firebase_admin import firestore
from api.services import emailService

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

    # ─── NEW LOGIN ALERT EMAIL ──────────────────────────────────────
    try:
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            user_email = user_doc.to_dict().get('email')
            if user_email:
                device_str = f"{parsed['browser']} on {parsed['os']}"
                device_icon = "🖥️" if parsed['type'] == 'desktop' else "📱" if parsed['type'] == 'mobile' else "📟"

                subject = "🔐 New Sign-in to Your Nexus Account"

                html = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>New Sign-in Alert</title></head>
                <body style="background:#09090b;font-family:system-ui,-apple-system,sans-serif;color:#fafafa;padding:40px 20px;margin:0;">
                    <div style="max-width:520px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px 35px;">
                        <div style="text-align:center;margin-bottom:30px;">
                            <span style="font-size:28px;font-weight:900;color:#fff;">Nexus<span style="color:#a855f7;">.</span></span>
                        </div>
                        <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">🔐 New Sign-in Detected</h1>
                        <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">Your Nexus account was accessed from a new device.</p>

                        <div style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #27272a;">
                                <span style="color:#71717a;font-size:14px;">Device</span>
                                <span style="color:#fff;font-weight:600;font-size:14px;">{device_icon} {device_str}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #27272a;">
                                <span style="color:#71717a;font-size:14px;">Location</span>
                                <span style="color:#fff;font-weight:600;font-size:14px;">{location or 'Unknown'}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;padding:8px 0;">
                                <span style="color:#71717a;font-size:14px;">IP Address</span>
                                <span style="color:#fff;font-weight:600;font-size:14px;font-family:monospace;">{ip_address or 'Unknown'}</span>
                            </div>
                        </div>

                        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                            <p style="margin:0;color:#fca5a5;font-size:14px;"><strong>⚠️ Not you?</strong> Secure your account immediately from the dashboard.</p>
                        </div>

                        <a href="https://trynexusweb.vercel.app/dashboard" style="display:inline-block;background:#a855f7;color:#fff;font-weight:700;font-size:15px;padding:12px 32px;border-radius:9999px;text-decoration:none;text-align:center;">Review Activity</a>

                        <div style="margin-top:32px;border-top:1px solid #27272a;padding-top:20px;font-size:13px;color:#52525b;text-align:center;">
                            <p style="margin:0;">This is an automated security notification.</p>
                            <p style="margin:6px 0 0;">© 2026 Nexus Web Assistant</p>
                        </div>
                    </div>
                </body>
                </html>
                """

                emailService.send_email(user_id, user_email, subject, html)
    except Exception as e:
        print(f"Failed to send login alert email: {e}")

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