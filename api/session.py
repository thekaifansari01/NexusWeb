import json
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler
from api.sessionService import get_sessions, revoke_session
from api.middleware import get_user_from_cookie

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            uid, current_session_id = get_user_from_cookie(self)
            status, response = get_sessions(uid, current_session_id)
            self.send_json(status, response)
        except Exception as e:
            self.send_json(401, {'error': str(e)})

    def do_DELETE(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            uid, _ = get_user_from_cookie(self)
            session_id = body.get('sessionId')
            if not session_id:
                return self.send_json(400, {"error": "Missing sessionId"})
            status, response = revoke_session(session_id, uid)
            self.send_json(status, response)
        except Exception as e:
            self.send_json(401, {'error': str(e)})