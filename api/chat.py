import json
from http.server import BaseHTTPRequestHandler
from api.chatService import handle_chat_request
from api.keyService import handle_create_key

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Origin')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_html(self, status_code, html_content):
        self.send_response(status_code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Origin')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_GET(self):
        # Keep your HTML string here (omitted for brevity)
        html = "<html><body><h1>Nexus API Status: Operational</h1></body></html>" 
        self.send_html(200, html)

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))

            if body.get('nexusKey'):
                request_origin = self.headers.get('Origin') or self.headers.get('Referer') or ''
                status, response = handle_chat_request(body, request_origin)
                return self.send_json(status, response)
            else:
                status, response = handle_create_key(body)
                return self.send_json(status, response)

        except json.JSONDecodeError:
            return self.send_json(400, {"error": "Invalid JSON payload"})
        except Exception as e:
            print(f"Server Error: {str(e)}")
            return self.send_json(500, {"error": "Internal Server Error", "real_reason": str(e)})