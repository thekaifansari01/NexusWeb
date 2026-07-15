import requests
import time
from datetime import datetime, timezone
from urllib.parse import urlparse
from firebase_admin import firestore
from api.core.config import db, PLAN_LIMITS
from api.core.crypto_utils import decrypt

def handle_chat_request(body, request_origin):
    try:
        session_id = body.get('sessionId')
        if session_id:
            session_ref = db.collection('active_sessions').document(session_id).get()
            if not session_ref.exists or session_ref.to_dict().get('status') != 'active':
                return 401, {"error": "Session invalid or revoked"}

        nexus_key = body.get('nexusKey')
        messages = body.get('messages', [])
        model = body.get('model', 'llama3-8b-8192')

        if not messages or not isinstance(messages, list):
            return 400, {"error": "Invalid or empty messages array"}
        for msg in messages:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                return 400, {"error": "Each message must have 'role' and 'content'"}

        if not request_origin:
            return 400, {"error": "Missing Origin header"}

        parsed = urlparse(request_origin)
        netloc = parsed.netloc or parsed.path
        if ':' in netloc:
            netloc = netloc.split(':')[0]
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        clean_origin = netloc.lower()

        keys_ref = db.collection('apiKeys').where('key', '==', nexus_key).limit(1).get()
        if not keys_ref:
            return 401, {"error": "Invalid Nexus API Key"}

        key_data = keys_ref[0].to_dict()
        if key_data.get('status') != 'active':
            return 403, {"error": "Nexus Key is inactive"}

        user_id = key_data.get('userId')

        domains_ref = db.collection('authorizedDomains').where('userId', '==', user_id).where('domain', '==', clean_origin).limit(1).get()
        if not domains_ref:
            return 403, {"error": f"Domain '{clean_origin}' not authorized"}

        domain_data = domains_ref[0].to_dict()
        if domain_data.get('status') != 'active':
            return 403, {"error": "Domain is deactivated"}

        # === MONTHLY USAGE LIMIT CHECK (Added safely) ===
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists:
            return 400, {"error": "User not found"}
        user_data = user_doc.to_dict()
        plan = user_data.get('plan', 'free')
        monthly_limit = PLAN_LIMITS.get(plan, 1000)

        month_key = datetime.now(timezone.utc).strftime("%Y-%m")
        usage_ref = db.collection('userMonthlyUsage').document(f"{user_id}_{month_key}")

        # Simple retry logic without decorator
        max_retries = 3
        success = False
        new_count = 0
        for attempt in range(max_retries):
            try:
                transaction = db.transaction()
                doc = transaction.get(usage_ref)
                current_count = doc.to_dict().get('count', 0) if doc.exists else 0
                if current_count >= monthly_limit:
                    success = False
                    new_count = current_count
                    break
                transaction.set(usage_ref, {
                    'userId': user_id,
                    'month': month_key,
                    'count': current_count + 1,
                    'limit': monthly_limit,
                    'lastUpdated': firestore.SERVER_TIMESTAMP
                }, merge=True)
                success = True
                new_count = current_count + 1
                break
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(0.1 * (attempt + 1))

        if not success:
            return 429, {"error": "Monthly request limit exceeded. Upgrade your plan to continue."}
        # === END LIMIT CHECK ===

        groq_doc = db.collection('userGroqKeys').document(user_id).get()
        if not groq_doc.exists:
            return 400, {"error": "No Groq API Key configured"}

        encrypted_key = groq_doc.to_dict().get('apiKey')
        if not encrypted_key:
            return 400, {"error": "No Groq API Key configured"}

        try:
            groq_api_key = decrypt(encrypted_key)
        except Exception:
            return 500, {"error": "Failed to decrypt Groq key"}

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
            return groq_res.status_code, {"error": "Groq API Error", "details": groq_res.json()}

        groq_data = groq_res.json()

        try:
            usage = groq_data.get('usage', {})
            total_tokens = usage.get('total_tokens', 0)

            db.collection('usageLogs').add({
                'userId': user_id,
                'nexusKeyId': keys_ref[0].id,
                'nexusKeyName': key_data.get('name', 'Unknown'),
                'model': model,
                'promptTokens': usage.get('prompt_tokens', 0),
                'completionTokens': usage.get('completion_tokens', 0),
                'totalTokens': total_tokens,
                'status': 'success',
                'domain': clean_origin,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            today = datetime.now(timezone.utc).date().isoformat()
            db.collection('userDailyUsage').document(f"{user_id}_{today}").set({
                'userId': user_id,
                'date': today,
                'totalRequests': firestore.Increment(1),
                'totalTokens': firestore.Increment(total_tokens),
                'promptTokens': firestore.Increment(usage.get('prompt_tokens', 0)),
                'completionTokens': firestore.Increment(usage.get('completion_tokens', 0)),
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }, merge=True)
        except Exception:
            pass

        return 200, groq_data

    except Exception as e:
        return 500, {"error": str(e)}