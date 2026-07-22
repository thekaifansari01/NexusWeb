# api/keys/index.py
import json
from http.server import BaseHTTPRequestHandler
from firebase_admin import firestore
from api.core.config import db
from api.core.middleware import get_user_from_cookie
from api.services import emailService

class handler(BaseHTTPRequestHandler):
    def set_cors_headers(self, origin=None):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
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
            docs = db.collection('apiKeys').where('userId', '==', uid).stream()
            keys = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                if 'createdAt' in data and data['createdAt']:
                    if hasattr(data['createdAt'], 'isoformat'):
                        data['createdAt'] = data['createdAt'].isoformat()
                keys.append(data)
            self.send_json(200, {'keys': keys}, origin)
        except Exception as e:
            self.send_json(401, {'error': str(e)}, origin)

    def do_DELETE(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)

            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            key_id = body.get('keyId')

            if not key_id:
                return self.send_json(400, {'error': 'Missing keyId'}, origin)

            doc_ref = db.collection('apiKeys').document(key_id)
            doc = doc_ref.get()

            if not doc.exists:
                return self.send_json(404, {'error': 'Key not found'}, origin)

            key_data = doc.to_dict()
            if key_data.get('userId') != uid:
                return self.send_json(403, {'error': 'Unauthorized'}, origin)

            key_name = key_data.get('name', 'Unknown Key')

            doc_ref.delete()

            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    emailService.send_key_alert_email(uid, user_email, key_name, "deleted")

            self.send_json(200, {'success': True}, origin)

        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)