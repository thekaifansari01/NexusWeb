import requests
import time
from datetime import datetime, timezone
from urllib.parse import urlparse
from firebase_admin import firestore
from api.core.config import db, PLAN_LIMITS
from api.core.crypto_utils import decrypt
from api.services import emailService

def handle_chat_request(body, request_origin, uid=None, is_authenticated=False):
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

        key_user_id = key_data.get('userId')

        if is_authenticated and uid == key_user_id:
            pass
        else:
            domains_ref = db.collection('authorizedDomains').where('userId', '==', key_user_id).where('domain', '==', clean_origin).limit(1).get()
            if not domains_ref:
                return 403, {"error": f"Domain '{clean_origin}' not authorized"}

            domain_data = domains_ref[0].to_dict()
            if domain_data.get('status') != 'active':
                return 403, {"error": "Domain is deactivated"}

        user_doc = db.collection('users').document(key_user_id).get()
        if not user_doc.exists:
            return 400, {"error": "User not found"}
        user_data = user_doc.to_dict()
        user_email = user_data.get('email')

        plan = user_data.get('plan', 'free')
        monthly_limit = PLAN_LIMITS.get(plan, 1000)

        month_key = datetime.now(timezone.utc).strftime("%Y-%m")
        usage_ref = db.collection('userMonthlyUsage').document(f"{key_user_id}_{month_key}")

        def check_and_increment():
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    doc = usage_ref.get()
                    if doc.exists:
                        current_count = doc.to_dict().get('count', 0)
                    else:
                        current_count = 0

                    if current_count >= monthly_limit:
                        return False, current_count

                    usage_ref.set({
                        'userId': key_user_id,
                        'month': month_key,
                        'count': current_count + 1,
                        'limit': monthly_limit,
                        'lastUpdated': firestore.SERVER_TIMESTAMP
                    }, merge=True)
                    return True, current_count + 1

                except Exception:
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(0.1 * (attempt + 1))
            return False, 0

        success, new_count = check_and_increment()

        # ─── USAGE EXCEEDED (429) ────────────────────────────────────────────
        if not success:
            # Send limit‑exceeded email once per month
            if user_email:
                try:
                    doc = usage_ref.get()
                    if doc.exists:
                        data = doc.to_dict()
                        if not data.get('exceededSent', False):
                            subject = "⚠️ Monthly Request Limit Exceeded – Nexus"
                            html = f"""
                            <!DOCTYPE html>
                            <html>
                            <head><meta charset="UTF-8"><title>Limit Exceeded</title></head>
                            <body style="background:#09090b;font-family:system-ui;color:#fafafa;padding:40px 20px;">
                                <div style="max-width:520px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px 35px;">
                                    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">🚫 Monthly Limit Reached</h1>
                                    <p style="color:#a1a1aa;font-size:16px;line-height:1.6;">You've used <strong style="color:#f87171;">{data.get('count', 0)}</strong> out of <strong>{monthly_limit}</strong> requests this month. All further requests will be blocked until your plan resets.</p>
                                    <div style="background:#09090b;border:1px solid #27272a;border-radius:8px;padding:16px;margin:24px 0;">
                                        <p style="margin:0;color:#d4d4d8;font-size:14px;"><strong>Next reset:</strong> 1st of next month</p>
                                    </div>
                                    <a href="https://trynexusweb.vercel.app/dashboard" style="display:inline-block;background:#a855f7;color:#fff;font-weight:700;padding:12px 32px;border-radius:9999px;text-decoration:none;">Go to Dashboard</a>
                                </div>
                            </body>
                            </html>
                            """
                            emailService.send_email(key_user_id, user_email, subject, html)
                            usage_ref.update({'exceededSent': True})
                except Exception as e:
                    print(f"Failed to send exceeded email: {e}")

            return 429, {"error": "Monthly request limit exceeded. Upgrade your plan to continue."}

        # ─── SUCCESS – USAGE WARNING (80%) ─────────────────────────────────
        if user_email and monthly_limit > 0:
            threshold = int(monthly_limit * 0.8)
            try:
                doc = usage_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    if not data.get('warningSent', False) and new_count >= threshold and new_count < monthly_limit:
                        subject = "📊 Usage Alert: 80% of Monthly Limit – Nexus"
                        html = f"""
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="UTF-8"><title>Usage Alert</title></head>
                        <body style="background:#09090b;font-family:system-ui;color:#fafafa;padding:40px 20px;">
                            <div style="max-width:520px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px 35px;">
                                <h1 style="font-size:22px;font-weight:700;color:#fbbf24;margin:0 0 8px;">⚠️ Approaching Your Limit</h1>
                                <p style="color:#a1a1aa;font-size:16px;line-height:1.6;">You've used <strong style="color:#fff;">{new_count}</strong> out of <strong>{monthly_limit}</strong> requests this month. That's <strong>{int((new_count/monthly_limit)*100)}%</strong>.</p>
                                <div style="background:#09090b;border:1px solid #27272a;border-radius:8px;padding:16px;margin:24px 0;">
                                    <p style="margin:0;color:#d4d4d8;font-size:14px;"><strong>Remaining:</strong> {monthly_limit - new_count} requests</p>
                                </div>
                                <a href="https://trynexusweb.vercel.app/dashboard" style="display:inline-block;background:#a855f7;color:#fff;font-weight:700;padding:12px 32px;border-radius:9999px;text-decoration:none;">Upgrade Plan</a>
                            </div>
                        </body>
                        </html>
                        """
                        emailService.send_email(key_user_id, user_email, subject, html)
                        usage_ref.update({'warningSent': True})
            except Exception as e:
                print(f"Failed to send warning email: {e}")

        # ─── GROQ CALL ──────────────────────────────────────────────────────
        groq_doc = db.collection('userGroqKeys').document(key_user_id).get()
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
                'userId': key_user_id,
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
            db.collection('userDailyUsage').document(f"{key_user_id}_{today}").set({
                'userId': key_user_id,
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