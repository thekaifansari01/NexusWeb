# api/chat/index.py
import json
from http.server import BaseHTTPRequestHandler
from api.services.chatService import handle_chat_request
from api.services.keyService import handle_create_key
from api.core.middleware import get_user_from_cookie

class handler(BaseHTTPRequestHandler):
    def set_cors_headers(self, origin=None):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Origin')

    def send_json(self, status_code, data, origin=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.set_cors_headers(origin)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_html(self, status_code, html_content, origin=None):
        self.send_response(status_code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.set_cors_headers(origin)
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))

    def do_OPTIONS(self):
        origin = self.headers.get('Origin')
        self.send_response(200)
        self.set_cors_headers(origin)
        self.end_headers()

    def do_GET(self):
        origin = self.headers.get('Origin')
        html = "<html><body><h1>Nexus API Status: Operational</h1></body></html>"
        self.send_html(200, html, origin)

    def do_POST(self):
        origin = self.headers.get('Origin')
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))

            if body.get('nexusKey'):
                request_origin = self.headers.get('Origin') or self.headers.get('Referer') or ''

                uid = None
                is_authenticated = False
                try:
                    uid, _ = get_user_from_cookie(self)
                    is_authenticated = True
                except Exception:
                    pass  

                status, response = handle_chat_request(body, request_origin, uid, is_authenticated)
                return self.send_json(status, response, origin)
            else:
                try:
                    uid, _ = get_user_from_cookie(self)
                except Exception:
                    return self.send_json(401, {"error": "Authentication required"}, origin)
                status, response = handle_create_key(uid, body)
                return self.send_json(status, response, origin)

        except json.JSONDecodeError:
            return self.send_json(400, {"error": "Invalid JSON payload"}, origin)
        except Exception as e:
            print(f"Server Error: {str(e)}")
            return self.send_json(500, {"error": "Internal Server Error"}, origin)