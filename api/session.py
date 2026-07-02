import json
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler
from api.sessionService import create_session, get_sessions, revoke_session

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            
            ip_address = self.headers.get('x-forwarded-for', 'Unknown IP')
            location = self.headers.get('x-vercel-ip-city', 'Unknown Location')
            
            user_id = body.get('userId')
            device_info = body.get('deviceInfo')
            
            if not user_id:
                return self.send_json(400, {"error": "Missing userId"})
                
            status, response = create_session(user_id, device_info, ip_address, location)
            self.send_json(status, response)
        except Exception as e:
            self.send_json(500, {"error": str(e)})

    def do_GET(self):
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            user_id = query_params.get('userId', [None])[0]
            
            if not user_id:
                return self.send_json(400, {"error": "Missing userId"})
                
            status, response = get_sessions(user_id)
            self.send_json(status, response)
        except Exception as e:
            self.send_json(500, {"error": str(e)})

    def do_DELETE(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            
            user_id = body.get('userId')
            session_id = body.get('sessionId')
            
            if not user_id or not session_id:
                return self.send_json(400, {"error": "Missing parameters"})
                
            status, response = revoke_session(session_id, user_id)
            self.send_json(status, response)
        except Exception as e:
            self.send_json(500, {"error": str(e)})