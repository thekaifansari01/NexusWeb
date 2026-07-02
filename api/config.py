import os
import json
import jwt
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if service_account_json:
        try:
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            print(f"Error initializing with FIREBASE_SERVICE_ACCOUNT: {e}")

    project_id = os.environ.get('FIREBASE_PROJECT_ID')
    client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')
    private_key = os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')

    if project_id and client_email and private_key:
        cred_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID', ''),
            "private_key": private_key,
            "client_email": client_email,
            "client_id": os.environ.get('FIREBASE_CLIENT_ID', ''),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}",
            "universe_domain": "googleapis.com"
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        return firestore.client()

    raise Exception("Missing Firebase credentials")

if not firebase_admin._apps:
    db = init_firebase()
else:
    db = firestore.client()

TURNSTILE_SECRET = os.environ.get('TURNSTILE_SECRET_KEY')
RATE_LIMIT_PER_DAY = 5

COOKIE_SECRET = os.environ.get('COOKIE_SECRET')
if not COOKIE_SECRET:
    raise Exception("COOKIE_SECRET environment variable not set")
COOKIE_NAME = 'nexus_session'
COOKIE_MAX_AGE = 60 * 60 * 24 * 7
JWT_ALGORITHM = 'HS256'

def create_session_token(uid, session_id):
    payload = {
        'uid': uid,
        'session_id': session_id,
        'exp': datetime.utcnow() + timedelta(seconds=COOKIE_MAX_AGE)
    }
    return jwt.encode(payload, COOKIE_SECRET, algorithm=JWT_ALGORITHM)

def verify_session_token(token):
    try:
        payload = jwt.decode(token, COOKIE_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['uid'], payload['session_id']
    except jwt.PyJWTError:
        return None, None

def set_cookie_headers(handler, token):
    handler.send_header('Set-Cookie', f'{COOKIE_NAME}={token}; Max-Age={COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Strict')

def clear_cookie_headers(handler):
    handler.send_header('Set-Cookie', f'{COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict')