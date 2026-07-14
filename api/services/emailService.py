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

def send_email(user_id: str, to_email: str, subject: str, html_body: str, timeout: int = 10) -> bool:
    if not _can_send_email(user_id):
        print(f"📧 [SKIP] User {user_id} daily limit.")
        return False
    if not RESEND_API_KEY:
        print("📧 [ERROR] RESEND_API_KEY missing.")
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
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout
        )

        if response.status_code == 200:
            print(f"📧 [SUCCESS] Email sent to {to_email}")
            _log_email_sent(user_id)
            return True
        else:
            print(f"📧 [FAIL] Resend {response.status_code}: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"📧 [EXCEPTION] {str(e)}")
        return False

def _welcome_html(name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Welcome to Nexus</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 35px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid #eaeef2; padding-bottom: 20px; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: 800; color: #1a1a1a;">Nexus</span>
                <span style="background: #a855f7; color: white; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; margin-left: 8px;">AI</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px 0;">Welcome, {name}! 👋</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Your AI-powered web assistant is ready. You can now embed Nexus into your websites with just one script tag.</p>
            <div style="background: #f7fafc; border-left: 4px solid #a855f7; padding: 16px 20px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #2d3748; font-size: 14px;"><strong>Next step:</strong> Add your Groq API key in the dashboard to enable AI responses.</p>
            </div>
            <a href="https://trynexusweb.vercel.app/dashboard" style="display: inline-block; background: #a855f7; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 6px; text-decoration: none; text-align: center;">Go to Dashboard</a>
            <div style="margin-top: 40px; border-top: 1px solid #eaeef2; padding-top: 25px; font-size: 13px; color: #718096;">
                <p style="margin: 0;">Nexus is open source and free forever.</p>
                <p style="margin: 5px 0 0 0;">© 2026 Nexus · <a href="https://trynexusweb.vercel.app" style="color: #a855f7; text-decoration: none;">Website</a></p>
            </div>
        </div>
    </body>
    </html>
    """

def _key_alert_html(key_name: str, action: str) -> str:
    if "deleted" in action.lower():
        color = "#e53e3e"
        label = "DELETED"
    elif "saved" in action.lower() or "update" in action.lower():
        color = "#3182ce"
        label = "UPDATED"
    else:
        color = "#d69e2e"
        label = "CREATED"

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Security Alert - Nexus</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 35px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid #eaeef2; padding-bottom: 20px; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: 800; color: #1a1a1a;">Nexus</span>
                <span style="background: #a855f7; color: white; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; margin-left: 8px;">Security</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">🔐 API Key {label}</h2>
            <p style="color: #4a5568; font-size: 15px; margin: 0 0 24px 0;">An action was performed on your Nexus API key.</p>
            <div style="background: #f7fafc; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #edf2f7;">
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7;">
                    <span style="color: #718096; font-size: 14px;">Key Name</span>
                    <span style="color: #1a1a1a; font-weight: 600; font-size: 14px;">{key_name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7;">
                    <span style="color: #718096; font-size: 14px;">Status</span>
                    <span style="color: {color}; font-weight: 700; font-size: 14px;">{label}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                    <span style="color: #718096; font-size: 14px;">Timestamp</span>
                    <span style="color: #1a1a1a; font-size: 14px;">{datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')}</span>
                </div>
            </div>
            <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 14px 18px; margin-bottom: 30px;">
                <p style="margin: 0; color: #9b2c2c; font-size: 14px;"><strong>⚠️ Not you?</strong> Revoke this key immediately from your dashboard.</p>
            </div>
            <a href="https://trynexusweb.vercel.app/dashboard" style="display: inline-block; background: #a855f7; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 6px; text-decoration: none; text-align: center;">Review Dashboard</a>
            <div style="margin-top: 40px; border-top: 1px solid #eaeef2; padding-top: 25px; font-size: 13px; color: #718096;">
                <p style="margin: 0;">This is an automated security notification.</p>
                <p style="margin: 5px 0 0 0;">© 2026 Nexus · <a href="https://trynexusweb.vercel.app" style="color: #a855f7; text-decoration: none;">Website</a></p>
            </div>
        </div>
    </body>
    </html>
    """

def _account_deletion_html() -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Account Deleted - Nexus</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 35px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid #eaeef2; padding-bottom: 20px; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: 800; color: #1a1a1a;">Nexus</span>
                <span style="background: #a855f7; color: white; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; margin-left: 8px;">AI</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px 0;">Account Deleted</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Your Nexus account has been successfully deleted. All your data, API keys, domains, and usage logs have been permanently removed.</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">If you did not request this, please contact us immediately.</p>
            <a href="https://trynexusweb.vercel.app" style="display: inline-block; background: #a855f7; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 32px; border-radius: 6px; text-decoration: none; text-align: center;">Visit Nexus Home</a>
            <div style="margin-top: 40px; border-top: 1px solid #eaeef2; padding-top: 25px; font-size: 13px; color: #718096;">
                <p style="margin: 0;">This is an automated confirmation email.</p>
                <p style="margin: 5px 0 0 0;">© 2026 Nexus · <a href="https://trynexusweb.vercel.app" style="color: #a855f7; text-decoration: none;">Website</a></p>
            </div>
        </div>
    </body>
    </html>
    """

def send_welcome_email(user_id: str, to_email: str, user_name: str = "User"):
    send_email(user_id, to_email, "Welcome to Nexus – Let's get started", _welcome_html(user_name))

def send_key_alert_email(user_id: str, to_email: str, key_name: str, action: str = "created"):
    send_email(user_id, to_email, f"Security Alert: API Key {action.capitalize()}", _key_alert_html(key_name, action))

def send_account_deletion_email(user_id: str, to_email: str):
    send_email(user_id, to_email, "Your Nexus account has been deleted", _account_deletion_html())