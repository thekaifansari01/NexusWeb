# api/stats/index.py
import json
import traceback
from http.server import BaseHTTPRequestHandler
from api.core.middleware import get_user_from_cookie
from api.services.statsService import get_stats

class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            uid, _ = get_user_from_cookie(self)
            query = self.path.split('?', 1)[-1] if '?' in self.path else ''
            params = dict(q.split('=') for q in query.split('&') if '=' in q)
            days = int(params.get('range', 7))
            if days < 1 or days > 90:
                days = 7
            print(f"Stats request: user={uid}, days={days}")
            stats = get_stats(uid, days)
            self.send_json(200, stats)
        except Exception as e:
            print("ERROR in /api/stats:")
            traceback.print_exc()
            self.send_json(500, {'error': str(e), 'trace': traceback.format_exc()})