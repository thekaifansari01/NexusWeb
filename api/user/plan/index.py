# api/user/plan/index.py
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime, timezone, timedelta
from firebase_admin import firestore
from api.core.config import db, PLAN_LIMITS
from api.core.middleware import get_user_from_cookie

class handler(BaseHTTPRequestHandler):
    def set_cors_headers(self, origin=None):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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

            user_doc = db.collection('users').document(uid).get()
            if not user_doc.exists:
                return self.send_json(404, {'error': 'User not found'}, origin)
            user_data = user_doc.to_dict()
            plan = user_data.get('plan', 'free')
            monthly_limit = PLAN_LIMITS.get(plan, 1000)

            month_key = datetime.now(timezone.utc).strftime("%Y-%m")
            usage_ref = db.collection('userMonthlyUsage').document(f"{uid}_{month_key}")
            usage_doc = usage_ref.get()
            used = usage_doc.to_dict().get('count', 0) if usage_doc.exists else 0

            next_reset = (datetime.now(timezone.utc).replace(day=1) + timedelta(days=32)).replace(day=1).isoformat()

            response = {
                'plan': plan,
                'planLabel': plan.capitalize(),
                'monthlyUsage': used,
                'monthlyLimit': monthly_limit,
                'percentage': round((used / monthly_limit) * 100, 1) if monthly_limit > 0 else 0,
                'remaining': max(0, monthly_limit - used),
                'nextReset': next_reset,
                'billingCycle': 'monthly'
            }
            self.send_json(200, response, origin)
        except Exception as e:
            self.send_json(500, {'error': str(e)}, origin)