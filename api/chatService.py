import requests
from datetime import datetime
from firebase_admin import firestore
from api.config import db

def handle_chat_request(body, request_origin):
    try:
        nexus_key = body.get('nexusKey')
        messages = body.get('messages', [])
        model = body.get('model', 'llama3-8b-8192')

        if not request_origin:
            return 400, {"error": "Missing Origin or Referer header"}

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

        # Usage Logging
        try:
            usage = groq_data.get('usage', {})
            prompt_tokens = usage.get('prompt_tokens', 0)
            completion_tokens = usage.get('completion_tokens', 0)
            total_tokens = usage.get('total_tokens', 0)

            db.collection('usageLogs').add({
                'userId': user_id,
                'nexusKeyId': keys_ref[0].id,
                'nexusKeyName': key_data.get('name', 'Unknown'),
                'model': model,
                'promptTokens': prompt_tokens,
                'completionTokens': completion_tokens,
                'totalTokens': total_tokens,
                'status': 'success',
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            today = datetime.utcnow().date().isoformat()
            daily_doc_id = f"{user_id}_{today}"
            daily_ref = db.collection('userDailyUsage').document(daily_doc_id)
            
            daily_ref.set({
                'userId': user_id,
                'date': today,
                'totalRequests': firestore.Increment(1),
                'totalTokens': firestore.Increment(total_tokens),
                'promptTokens': firestore.Increment(prompt_tokens),
                'completionTokens': firestore.Increment(completion_tokens),
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }, merge=True)
        except Exception as e:
            print(f"Usage logging failed (non-critical): {e}")

        return 200, groq_data

    except Exception as e:
        print(f"Chat error: {str(e)}")
        return 500, {"error": "Chat processing error"}