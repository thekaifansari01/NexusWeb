# api/services/email_service.py
import os
import requests
from datetime import datetime, timezone
from firebase_admin import firestore
from api.core.config import db

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'onboarding@resend.dev')

MAX_EMAILS_PER_USER_PER_DAY = 5

def _can_send_email(user_id: str) -> bool:
    today = datetime.now(timezone.utc).date().isoformat()
    doc_ref = db.collection('emailLogs').document(f"{user_id}_{today}")
    doc = doc_ref.get()
    if doc.exists:
        count = doc.to_dict().get('count', 0)
        return count < MAX_EMAILS_PER_USER_PER_DAY
    return True

def _log_email_sent(user_id: str):
    today = datetime.now(timezone.utc).date().isoformat()
    doc_ref = db.collection('emailLogs').document(f"{user_id}_{today}")
    doc_ref.set({'count': firestore.Increment(1)}, merge=True)

def send_email(
    user_id: str,
    to_email: str,
    subject: str,
    html_body: str,
    timeout: int = 5
) -> bool:
    if not _can_send_email(user_id):
        print(f"📧 [SKIP] User {user_id} has reached daily email limit.")
        return False

    if not RESEND_API_KEY:
        print("📧 [ERROR] RESEND_API_KEY not set in environment.")
        return False

    payload = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html_body
    }

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=timeout
        )

        if response.status_code == 200:
            print(f"📧 [SUCCESS] Email sent to {to_email} (user: {user_id})")
            _log_email_sent(user_id)
            return True
        else:
            print(
                f"📧 [FAIL] Resend returned {response.status_code} for user {user_id}: "
                f"{response.text[:200]}"
            )
            return False

    except requests.exceptions.RequestException as e:
        print(f"📧 [EXCEPTION] Email send failed for user {user_id}: {str(e)}")
        return False

# =======================================================
#  PROFESSIONAL TEMPLATES
# =======================================================

def _get_base_style():
    return """
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    """

def _get_header():
    return """
    <div style="text-align: center; padding: 10px 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(168,85,247,0.08); padding: 6px 18px 6px 12px; border-radius: 40px; border: 1px solid rgba(168,85,247,0.15);">
            <span style="background: #a855f7; color: white; font-weight: 800; font-size: 12px; padding: 2px 10px; border-radius: 30px; letter-spacing: 0.5px;">NEXUS</span>
            <span style="color: #d4d4d8; font-weight: 500; font-size: 12px;">Web Assistant</span>
        </div>
    </div>
    """

def _get_footer():
    return """
    <div style="text-align: center; padding-top: 30px; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; justify-content: center; gap: 24px; font-size: 12px; color: #52525b; margin-bottom: 10px;">
            <a href="https://trynexusweb.vercel.app/dashboard" style="color: #a1a1aa; text-decoration: none;">Dashboard</a>
            <a href="https://trynexusweb.vercel.app/docs" style="color: #a1a1aa; text-decoration: none;">Docs</a>
            <a href="https://github.com/thekaifansari01/NexusWeb" style="color: #a1a1aa; text-decoration: none;">GitHub</a>
        </div>
        <div style="display: flex; justify-content: center; gap: 8px; font-size: 11px; color: #3f3f46;">
            <span>© 2026 Nexus</span>
            <span>·</span>
            <span style="background: rgba(168,85,247,0.1); color: #a855f7; padding: 0 8px; border-radius: 12px;">Open Source</span>
            <span>·</span>
            <span>Built with ❤️</span>
        </div>
    </div>
    """

def _welcome_html(name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nexus</title>
        {_get_base_style()}
    </head>
    <body style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; background: #09090b; color: #fafafa; -webkit-font-smoothing: antialiased;">
        
        <div style="background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px 30px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04);">
            
            {_get_header()}

            <div style="text-align: center; padding: 30px 0 20px 0;">
                <div style="font-size: 40px; margin-bottom: 10px;">🚀</div>
                <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 6px 0; background: linear-gradient(135deg, #d8b4fe, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                    Welcome aboard, {name}!
                </h1>
                <p style="color: #a1a1aa; font-size: 16px; margin: 0; font-weight: 400;">Your AI-powered web assistant is ready to deploy.</p>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 24px; margin: 20px 0; border-left: 3px solid #a855f7;">
                <p style="margin: 0 0 12px 0; color: #d4d4d8; font-size: 15px; line-height: 1.6;">
                    <strong>You're now part of the Nexus ecosystem.</strong> Here's what you can do next:
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: #a1a1aa;">
                    <div style="display: flex; align-items: center; gap: 12px;"><span style="background: #a855f7; width: 6px; height: 6px; border-radius: 50%;"></span> Add your <strong style="color: white;">Groq API key</strong> to power the AI.</div>
                    <div style="display: flex; align-items: center; gap: 12px;"><span style="background: #a855f7; width: 6px; height: 6px; border-radius: 50%;"></span> Generate <strong style="color: white;">Nexus Keys</strong> for your websites.</div>
                    <div style="display: flex; align-items: center; gap: 12px;"><span style="background: #a855f7; width: 6px; height: 6px; border-radius: 50%;"></span> Whitelist domains to keep your keys secure.</div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://trynexusweb.vercel.app/dashboard" 
                   style="display: inline-block; padding: 14px 40px; background: linear-gradient(145deg, #a855f7, #7c3aed); color: white; font-weight: 700; font-size: 16px; border-radius: 40px; text-decoration: none; box-shadow: 0 8px 25px rgba(168,85,247,0.3); transition: all 0.2s;">
                    Launch Dashboard
                </a>
            </div>

            {_get_footer()}

        </div>
    </body>
    </html>
    """

def _key_alert_html(key_name: str, action: str) -> str:
    # Determine severity and icon based on action
    if "deleted" in action.lower():
        severity_color = "#fb7185"
        icon = "🗑️"
        border_color = "rgba(251,113,133,0.2)"
        action_label = "DELETED"
    elif "saved" in action.lower() or "update" in action.lower():
        severity_color = "#60a5fa"
        icon = "🔄"
        border_color = "rgba(96,165,250,0.2)"
        action_label = "UPDATED"
    else:  # created
        severity_color = "#fbbf24"
        icon = "🔐"
        border_color = "rgba(251,191,36,0.2)"
        action_label = "CREATED"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
        {_get_base_style()}
    </head>
    <body style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; background: #09090b; color: #fafafa; -webkit-font-smoothing: antialiased;">
        
        <div style="background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px 30px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04);">
            
            {_get_header()}

            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 42px; margin-bottom: 5px;">{icon}</div>
                <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 4px 0; color: {severity_color};">
                    Security Alert
                </h2>
                <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Action: <strong style="color: white;">{action_label}</strong></p>
            </div>

            <div style="background: rgba(0,0,0,0.4); border-radius: 16px; padding: 20px 24px; margin: 20px 0; border: 1px solid {border_color};">
                <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <span style="color: #71717a;">Key Name</span>
                    <span style="color: white; font-weight: 600;">{key_name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <span style="color: #71717a;">Timestamp</span>
                    <span style="color: #d4d4d8;">{datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0;">
                    <span style="color: #71717a;">Device</span>
                    <span style="color: #d4d4d8;">Dashboard (Web)</span>
                </div>
            </div>

            <div style="background: rgba(251, 113, 133, 0.04); border-left: 4px solid {severity_color}; padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 20px 0;">
                <p style="margin: 0; color: #d4d4d8; font-size: 14px;">
                    ⚠️ <strong>If you did not perform this action</strong>, please <strong>revoke the key immediately</strong> from your dashboard and reset your credentials.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="https://trynexusweb.vercel.app/dashboard" 
                   style="display: inline-block; padding: 14px 40px; background: linear-gradient(145deg, #a855f7, #7c3aed); color: white; font-weight: 700; font-size: 16px; border-radius: 40px; text-decoration: none; box-shadow: 0 8px 25px rgba(168,85,247,0.3);">
                    Review Dashboard
                </a>
            </div>

            {_get_footer()}

        </div>
    </body>
    </html>
    """

# =======================================================
#  PUBLIC WRAPPERS
# =======================================================

def send_welcome_email(user_id: str, to_email: str, user_name: str = "User"):
    send_email(user_id, to_email, "🚀 Welcome to Nexus – Let's get started!", _welcome_html(user_name))

def send_key_alert_email(user_id: str, to_email: str, key_name: str, action: str = "created"):
    send_email(user_id, to_email, f"🔐 Security Alert: API Key {action.capitalize()} – {key_name}", _key_alert_html(key_name, action))