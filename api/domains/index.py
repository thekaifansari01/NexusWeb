# api/domains/index.py
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
            docs = db.collection('authorizedDomains').where('userId', '==', uid).stream()
            domains = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                if 'createdAt' in data and data['createdAt']:
                    if hasattr(data['createdAt'], 'isoformat'):
                        data['createdAt'] = data['createdAt'].isoformat()
                domains.append(data)
            self.send_json(200, {'domains': domains}, origin)
        except Exception as e:
            self.send_json(401, {'error': str(e)}, origin)

    def do_POST(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)

            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            domain = body.get('domain')

            if not domain:
                return self.send_json(400, {'error': 'Missing domain'}, origin)

            domain = domain.lower().strip()
            domain = domain.replace('http://', '').replace('https://', '').replace('www.', '').split('/')[0]

            if not domain or '.' not in domain or len(domain) < 4:
                return self.send_json(400, {'error': 'Invalid domain format'}, origin)

            existing = db.collection('authorizedDomains').where('userId', '==', uid).where('domain', '==', domain).get()
            if existing:
                return self.send_json(409, {'error': 'Domain already exists'}, origin)

            count_docs = db.collection('authorizedDomains').where('userId', '==', uid).get()
            if len(count_docs) >= 10:
                return self.send_json(429, {'error': 'Maximum 10 domains allowed'}, origin)

            doc_ref = db.collection('authorizedDomains').add({
                'userId': uid,
                'domain': domain,
                'status': 'active',
                'createdAt': firestore.SERVER_TIMESTAMP
            })

            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    emailService.send_domain_alert_email(uid, user_email, domain, "added")

            self.send_json(200, {'success': True, 'id': doc_ref[1].id}, origin)

        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)

    def do_DELETE(self):
        origin = self.headers.get('Origin')
        try:
            uid, _ = get_user_from_cookie(self)

            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            domain_id = body.get('domainId')

            if not domain_id:
                return self.send_json(400, {'error': 'Missing domainId'}, origin)

            doc_ref = db.collection('authorizedDomains').document(domain_id)
            doc = doc_ref.get()

            if not doc.exists:
                return self.send_json(404, {'error': 'Domain not found'}, origin)

            domain_data = doc.to_dict()
            if domain_data.get('userId') != uid:
                return self.send_json(403, {'error': 'Unauthorized'}, origin)

            domain_name = domain_data.get('domain', 'Unknown Domain')

            doc_ref.delete()

            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    emailService.send_domain_alert_email(uid, user_email, domain_name, "deleted")

            self.send_json(200, {'success': True}, origin)

        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)