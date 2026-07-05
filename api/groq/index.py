# api/groq/index.py
import json
import threading
from http.server import BaseHTTPRequestHandler
from firebase_admin import firestore
from api.core.crypto_utils import encrypt
from api.core.middleware import get_user_from_cookie
from api.core.config import db
from api.services import email_service

class handler(BaseHTTPRequestHandler):
    def set_cors_headers(self, origin=None):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def send_json(self, status_code, data, origin=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.set_cors_headers(origin)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        origin = self.headers.get('Origin')
        self.send_response(200)
        self.set_cors_headers(origin)
        self.end_headers()

    def do_GET(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)
            doc_ref = db.collection('userGroqKeys').document(uid)
            doc = doc_ref.get()
            has_key = doc.exists and doc.to_dict().get('apiKey') is not None
            self.send_json(200, {'hasKey': has_key}, origin)
        except Exception as e:
            self.send_json(401, {'error': str(e)}, origin)

    def do_POST(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            api_key = body.get('apiKey')
            if not api_key:
                return self.send_json(400, {'error': 'Missing apiKey'}, origin)
            encrypted = encrypt(api_key)
            db.collection('userGroqKeys').document(uid).set({
                'userId': uid,
                'apiKey': encrypted,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }, merge=True)

            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    def send_groq_save():
                        email_service.send_key_alert_email(uid, user_email, "Groq API Key", "saved/updated")
                    threading.Thread(target=send_groq_save).start()

            self.send_json(200, {'success': True}, origin)
        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)

    def do_DELETE(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)
            db.collection('userGroqKeys').document(uid).delete()

            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    def send_groq_delete():
                        email_service.send_key_alert_email(uid, user_email, "Groq API Key", "deleted")
                    threading.Thread(target=send_groq_delete).start()

            self.send_json(200, {'success': True}, origin)
        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)