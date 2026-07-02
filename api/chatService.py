import requests
from datetime import datetime
from firebase_admin import firestore
from api.config import db

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

        if not request_origin:
            return 400, {"error": "Missing Origin header"}

        clean_origin = request_origin.replace('http://', '').replace('https://', '').replace('www.', '').split('/')[0].lower()

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

        groq_doc = db.collection('userGroqKeys').document(user_id).get()
        if not groq_doc.exists or not groq_doc.to_dict().get('apiKey'):
            return 400, {"error": "No Groq API Key configured"}

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
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            today = datetime.utcnow().date().isoformat()
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