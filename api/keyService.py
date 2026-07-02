import secrets
import requests
from datetime import datetime
from firebase_admin import firestore
from api.config import db, TURNSTILE_SECRET, RATE_LIMIT_PER_DAY

def verify_captcha(token):
    if not TURNSTILE_SECRET:
        print("TURNSTILE_SECRET_KEY not set")
        return False
    resp = requests.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        data={'secret': TURNSTILE_SECRET, 'response': token}
    )
    return resp.json().get('success', False)

def check_rate_limit(user_id):
    doc_ref = db.collection('userRateLimits').document(user_id)
    doc = doc_ref.get()
    today = datetime.utcnow().date().isoformat()
    if doc.exists:
        data = doc.to_dict()
        if data.get('date') == today:
            return data.get('count', 0) < RATE_LIMIT_PER_DAY
    return True

def update_rate_limit(user_id):
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

def handle_create_key(user_id, body):
    try:
        key_name = body.get('name')
        captcha_token = body.get('captchaToken')

        if not all([key_name, captcha_token]):
            return 400, {"error": "Missing fields"}

        if not verify_captcha(captcha_token):
            return 400, {"error": "CAPTCHA verification failed"}

        if not check_rate_limit(user_id):
            return 429, {"error": f"Rate limit exceeded. Max {RATE_LIMIT_PER_DAY} keys per day."}

        key = f"nxs_{secrets.token_hex(32)}"
        _, doc_ref = db.collection('apiKeys').add({
            'userId': user_id,
            'name': key_name,
            'key': key,
            'status': 'active',
            'createdAt': firestore.SERVER_TIMESTAMP
        })

        if not hasattr(doc_ref, 'id'):
            return 500, {"error": "Internal error: failed to get document reference"}

        try:
            update_rate_limit(user_id)
        except Exception as e:
            print(f"Rate limit update failed: {e}")

        return 200, {"success": True, "key": key, "id": doc_ref.id}

    except Exception as e:
        print(f"Key creation error: {str(e)}")
        return 500, {"error": "Internal server error", "details": str(e)}