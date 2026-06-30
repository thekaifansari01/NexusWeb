import os
import json
import requests
from http.server import BaseHTTPRequestHandler
import firebase_admin
from firebase_admin import credentials, firestore


def init_firebase():
    service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if service_account_json:
        try:
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            return firestore.client()
        except Exception as e:
            print(f"Error initializing with FIREBASE_SERVICE_ACCOUNT: {e}")
    
    project_id = os.environ.get('FIREBASE_PROJECT_ID')
    client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')
    private_key = os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
    
    if project_id and client_email and private_key:
        cred_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID', ''),
            "private_key": private_key,
            "client_email": client_email,
            "client_id": os.environ.get('FIREBASE_CLIENT_ID', ''),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}",
            "universe_domain": "googleapis.com"
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        return firestore.client()
    
    raise Exception("Missing Firebase credentials")


if not firebase_admin._apps:
    db = init_firebase()
else:
    db = firestore.client()


class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Origin')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Origin')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))

            nexus_key = body.get('nexusKey')
            messages = body.get('messages', [])
            model = body.get('model', 'llama3-8b-8192')

            request_origin = self.headers.get('Origin') or self.headers.get('Referer') or ''
            if not request_origin:
                return self.send_json(400, {"error": "Missing Origin or Referer header"})

            clean_origin = request_origin.replace('http://', '').replace('https://', '').replace('www.', '').split('/')[0].lower()

            keys_ref = db.collection('apiKeys').where('key', '==', nexus_key).limit(1).get()
            if not keys_ref:
                return self.send_json(401, {"error": "Invalid Nexus API Key"})

            key_data = keys_ref[0].to_dict()
            if key_data.get('status') != 'active':
                return self.send_json(403, {"error": "Nexus Key is inactive"})

            user_id = key_data.get('userId')

            domains_ref = db.collection('authorizedDomains').where('userId', '==', user_id).where('domain', '==', clean_origin).limit(1).get()
            if not domains_ref:
                return self.send_json(403, {"error": f"Domain '{clean_origin}' not authorized"})

            domain_data = domains_ref[0].to_dict()
            if domain_data.get('status') != 'active':
                return self.send_json(403, {"error": "Domain is deactivated"})

            groq_doc = db.collection('userGroqKeys').document(user_id).get()
            if not groq_doc.exists or not groq_doc.to_dict().get('apiKey'):
                return self.send_json(400, {"error": "No Groq API Key configured"})

            groq_api_key = groq_doc.to_dict().get('apiKey')

            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": messages
            }
            groq_res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)

            if not groq_res.ok:
                return self.send_json(groq_res.status_code, {"error": "Groq API Error", "details": groq_res.json()})

            return self.send_json(200, groq_res.json())

        except json.JSONDecodeError:
            return self.send_json(400, {"error": "Invalid JSON payload"})
        except Exception as e:
            print(f"Server Error: {str(e)}")
            return self.send_json(500, {"error": "Internal Server Error", "real_reason": str(e)})