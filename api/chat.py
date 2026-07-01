import os
import json
import requests
from http.server import BaseHTTPRequestHandler
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import secrets

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

TURNSTILE_SECRET = os.environ.get('TURNSTILE_SECRET_KEY')
RATE_LIMIT_PER_DAY = 5

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
        html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Nexus API · Chat Endpoint</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            <script src="https://unpkg.com/@phosphor-icons/web"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    darkMode: 'class',
                    theme: {
                        extend: {
                            fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
                            colors: {
                                background: '#09090b',
                                surface: '#18181b',
                                border: '#27272a',
                                primary: '#a855f7',
                                primaryHover: '#9333ea'
                            }
                        }
                    }
                }
            </script>
            <style>
                body {
                    background: #09090b;
                    color: #fafafa;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    padding: 1.5rem;
                }
                .glass-card {
                    background: rgba(24,24,27,0.4);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    padding: 2.5rem;
                    max-width: 560px;
                    width: 100%;
                    transition: all 0.3s ease;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
                }
                .glass-card:hover {
                    border-color: rgba(168,85,247,0.2);
                    background: rgba(24,24,27,0.6);
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(52,211,153,0.12);
                    color: #34d399;
                    padding: 0.25rem 1rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border: 1px solid rgba(52,211,153,0.15);
                }
                .status-badge .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #34d399;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }
                .icon-box {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    background: rgba(168,85,247,0.08);
                    border: 1px solid rgba(168,85,247,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.2rem;
                }
                .icon-box i {
                    font-size: 2.2rem;
                    color: #a855f7;
                }
                .link-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0.6rem 1.6rem;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #a1a1aa;
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                .link-btn:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fafafa;
                }
                .link-btn.primary {
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    border: none;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(168,85,247,0.2);
                }
                .link-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(168,85,247,0.35);
                }
            </style>
        </head>
        <body>
            <div class="glass-card text-center">
                <div class="icon-box">
                    <i class="ph-fill ph-brain"></i>
                </div>
                <h1 class="text-2xl font-extrabold tracking-tight">Nexus Chat API</h1>
                <div class="mt-2 flex justify-center">
                    <span class="status-badge">
                        <span class="dot"></span> Operational
                    </span>
                </div>
                <p class="text-zinc-400 text-sm leading-relaxed mt-4">
                    This endpoint handles POST requests for AI chat completions.
                    It securely proxies your messages to Groq using your saved API keys.
                </p>
                <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="https://github.com/thekaifansari01/NexusWeb" target="_blank" class="link-btn">
                        <i class="ph-bold ph-github-logo"></i> GitHub
                    </a>
                    <a href="/docs" class="link-btn primary">
                        <i class="ph-bold ph-book-open"></i> Documentation
                    </a>
                </div>
                <div class="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500">
                    <i class="ph-bold ph-lock-key text-primary/40"></i>
                    All requests are authenticated via Nexus API Key and domain whitelisting.
                </div>
            </div>
        </body>
        </html>
        """
        self.send_html(200, html)

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length).decode('utf-8'))

            if body.get('nexusKey'):
                return self.handle_chat(body)
            else:
                return self.handle_create_key(body)

        except json.JSONDecodeError:
            return self.send_json(400, {"error": "Invalid JSON payload"})
        except Exception as e:
            print(f"Server Error: {str(e)}")
            return self.send_json(500, {"error": "Internal Server Error", "real_reason": str(e)})

    def handle_chat(self, body):
        try:
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

        except Exception as e:
            print(f"Chat error: {str(e)}")
            return self.send_json(500, {"error": "Chat processing error"})

    def handle_create_key(self, body):
        try:
            user_id = body.get('userId')
            key_name = body.get('name')
            captcha_token = body.get('captchaToken')

            if not all([user_id, key_name, captcha_token]):
                return self.send_json(400, {"error": "Missing fields"})

            if not self.verify_captcha(captcha_token):
                return self.send_json(400, {"error": "CAPTCHA verification failed"})

            if not self.check_rate_limit(user_id):
                return self.send_json(429, {"error": f"Rate limit exceeded. Max {RATE_LIMIT_PER_DAY} keys per day."})

            key = f"nxs_{secrets.token_hex(32)}"
            _, doc_ref = db.collection('apiKeys').add({
                'userId': user_id,
                'name': key_name,
                'key': key,
                'status': 'active',
                'createdAt': firestore.SERVER_TIMESTAMP
            })

            if not hasattr(doc_ref, 'id'):
                print(f"ERROR: doc_ref is not a DocumentReference. Type: {type(doc_ref)}")
                return self.send_json(500, {"error": "Internal error: failed to get document reference"})

            try:
                self.update_rate_limit(user_id)
            except Exception as e:
                print(f"Rate limit update failed: {e}")

            return self.send_json(200, {"success": True, "key": key, "id": doc_ref.id})

        except Exception as e:
            print(f"Key creation error: {str(e)}")
            return self.send_json(500, {"error": "Internal server error", "details": str(e)})

    def verify_captcha(self, token):
        if not TURNSTILE_SECRET:
            print("TURNSTILE_SECRET_KEY not set")
            return False
        resp = requests.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data={'secret': TURNSTILE_SECRET, 'response': token}
        )
        return resp.json().get('success', False)

    def check_rate_limit(self, user_id):
        doc_ref = db.collection('userRateLimits').document(user_id)
        doc = doc_ref.get()
        today = datetime.utcnow().date().isoformat()
        if doc.exists:
            data = doc.to_dict()
            if data.get('date') == today:
                return data.get('count', 0) < RATE_LIMIT_PER_DAY
        return True

    def update_rate_limit(self, user_id):
        today = datetime.utcnow().date().isoformat()
        doc_ref = db.collection('userRateLimits').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if data.get('date') == today:
                doc_ref.update({'count': data.get('count', 0) + 1})
            else:
                doc_ref.set({'date': today, 'count': 1})
        else:
            doc_ref.set({'date': today, 'count': 1})