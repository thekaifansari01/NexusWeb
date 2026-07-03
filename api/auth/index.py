import json
import uuid
from http.server import BaseHTTPRequestHandler
from firebase_admin import auth
from api.core.config import db, create_session_token, set_cookie_headers, clear_cookie_headers, COOKIE_NAME
from api.core.middleware import get_user_from_cookie
from api.services.sessionService import create_session, revoke_session
from api.services.keyService import verify_captcha

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/auth/session':
            self.handle_create_session()
        elif self.path == '/api/auth/logout':
            self.handle_logout()
        elif self.path == '/api/auth/verify-captcha':
            self.handle_verify_captcha()
        else:
            self.send_json(404, {'error': 'Not found'})

    def do_GET(self):
        if self.path == '/api/auth/me':
            self.handle_me()
        else:
            self.send_json(404, {'error': 'Not found'})

    def handle_create_session(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            id_token = body.get('idToken')
            if not id_token:
                return self.send_json(400, {'error': 'Missing idToken'})

            decoded = auth.verify_id_token(id_token)
            uid = decoded['uid']

            device_info = self.headers.get('User-Agent', 'Unknown Device')
            ip_address = self.headers.get('x-forwarded-for', 'Unknown IP')
            location = self.headers.get('x-vercel-ip-city', 'Unknown Location')

            session_id = str(uuid.uuid4())
            create_session(uid, session_id, device_info, ip_address, location)

            token = create_session_token(uid, session_id)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Credentials', 'true')
            set_cookie_headers(self, token)
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'uid': uid}).encode('utf-8'))

        except Exception as e:
            self.send_json(500, {'error': str(e)})

    def handle_logout(self):
        try:
            uid, session_id = get_user_from_cookie(self)
            revoke_session(session_id, uid)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Credentials', 'true')
            clear_cookie_headers(self)
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
        except Exception as e:
            self.send_json(401, {'error': str(e)})

    def handle_me(self):
        try:
            uid, session_id = get_user_from_cookie(self)
            self.send_json(200, {'uid': uid, 'sessionId': session_id})
        except Exception as e:
            self.send_json(401, {'error': str(e)})

    def handle_verify_captcha(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            token = body.get('token')
            if not token:
                return self.send_json(400, {'error': 'Missing token'})
            if verify_captcha(token):
                return self.send_json(200, {'success': True})
            else:
                return self.send_json(400, {'error': 'Invalid CAPTCHA'})
        except Exception as e:
            self.send_json(500, {'error': str(e)})