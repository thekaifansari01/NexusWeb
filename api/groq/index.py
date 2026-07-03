import json
from http.server import BaseHTTPRequestHandler
from firebase_admin import firestore
from api.core.crypto_utils import encrypt
from api.core.middleware import get_user_from_cookie
from api.core.config import db

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            uid, _ = get_user_from_cookie(self)
            doc_ref = db.collection('userGroqKeys').document(uid)
            doc = doc_ref.get()
            has_key = doc.exists and doc.to_dict().get('apiKey') is not None
            self.send_json(200, {'hasKey': has_key})
        except Exception as e:
            self.send_json(401, {'error': str(e)})

    def do_POST(self):
        try:
            uid, _ = get_user_from_cookie(self)
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            api_key = body.get('apiKey')
            if not api_key:
                return self.send_json(400, {'error': 'Missing apiKey'})
            encrypted = encrypt(api_key)
            db.collection('userGroqKeys').document(uid).set({
                'userId': uid,
                'apiKey': encrypted,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }, merge=True)
            self.send_json(200, {'success': True})
        except Exception as e:
            self.send_json(500, {'error': str(e)})

    def do_DELETE(self):
        try:
            uid, _ = get_user_from_cookie(self)
            db.collection('userGroqKeys').document(uid).delete()
            self.send_json(200, {'success': True})
        except Exception as e:
            self.send_json(500, {'error': str(e)})