# api/user/index.py
import json
import traceback
from http.server import BaseHTTPRequestHandler
from firebase_admin import auth, firestore
from api.core.config import db, clear_cookie_headers
from api.core.middleware import get_user_from_cookie
from api.services.keyService import verify_captcha
from api.services import emailService

class handler(BaseHTTPRequestHandler):
    def set_cors_headers(self, origin=None):
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
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

    def do_DELETE(self):
        origin = self.headers.get('Origin')
        try:
            uid, session_id = get_user_from_cookie(self)

            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))
            captcha_token = body.get('captchaToken')

            if not captcha_token:
                return self.send_json(400, {'error': 'Missing captchaToken'}, origin)

            if not verify_captcha(captcha_token):
                return self.send_json(400, {'error': 'Invalid CAPTCHA'}, origin)

            if not self._check_delete_rate_limit(uid):
                return self.send_json(429, {'error': 'Too many deletion attempts. Please try again tomorrow.'}, origin)

            self._delete_user_data(uid)

            try:
                auth.delete_user(uid)
            except Exception as e:
                print(f"Failed to delete Firebase Auth user {uid}: {e}")

            # Get user email from Firestore for confirmation email
            user_doc = db.collection('users').document(uid).get()
            if user_doc.exists:
                user_email = user_doc.to_dict().get('email')
                if user_email:
                    try:
                        emailService.send_account_deletion_email(uid, user_email)
                    except Exception as e:
                        print(f"Failed to send deletion email: {e}")

            clear_cookie_headers(self)

            self._update_delete_rate_limit(uid)

            self.send_json(200, {'success': True}, origin)

        except Exception as e:
            print(f"Account deletion error: {str(e)}")
            traceback.print_exc()
            self.send_json(500, {'error': str(e), 'trace': traceback.format_exc()}, origin)

    def _check_delete_rate_limit(self, uid):
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).date().isoformat()
        doc_ref = db.collection('deleteRateLimits').document(f"{uid}_{today}")
        doc = doc_ref.get()
        if doc.exists:
            count = doc.to_dict().get('count', 0)
            return count < 2
        return True

    def _update_delete_rate_limit(self, uid):
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).date().isoformat()
        doc_ref = db.collection('deleteRateLimits').document(f"{uid}_{today}")
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update({'count': firestore.Increment(1)})
        else:
            doc_ref.set({'userId': uid, 'date': today, 'count': 1})

    def _delete_user_data(self, uid):
        collections = [
            'apiKeys',
            'authorizedDomains',
            'usageLogs',
            'userDailyUsage',
            'active_sessions',
            'userRateLimits',
            'emailLogs',
        ]

        db.collection('users').document(uid).delete()
        db.collection('userGroqKeys').document(uid).delete()

        for col in collections:
            try:
                docs = db.collection(col).where('userId', '==', uid).stream()
                batch = db.batch()
                count = 0
                for doc in docs:
                    batch.delete(doc.reference)
                    count += 1
                    if count >= 400:
                        try:
                            batch.commit()
                        except Exception as e:
                            print(f"Batch commit failed for {col}: {e}")
                        batch = db.batch()
                        count = 0
                if count > 0:
                    try:
                        batch.commit()
                    except Exception as e:
                        print(f"Final batch commit failed for {col}: {e}")
            except Exception as e:
                print(f"Error deleting from {col}: {e}")