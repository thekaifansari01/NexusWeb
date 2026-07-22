import os
import requests
from datetime import datetime, timezone

BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
BREVO_FROM_EMAIL = os.environ.get('BREVO_FROM_EMAIL', 'noreply@trynexus.site')

def send_email(user_id: str, to_email: str, subject: str, html_body: str, timeout: int = 10) -> bool:
    if not BREVO_API_KEY:
        return False

    payload = {
        "sender": {"email": BREVO_FROM_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body
    }

    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=timeout
        )

        if response.status_code == 201:
            return True
        else:
            return False
    except Exception as e:
        return False

def _welcome_html(name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Nexus</title>
    </head>
    <body style="background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:60px 20px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:48px 40px;">
            <div style="text-align:center;margin-bottom:40px;">
              <span style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">Nexus<span style="color:#a855f7;">.</span></span>
            </div>
            <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px 0;text-align:center;">Welcome, {name}</h1>
            <p style="font-size:16px;line-height:26px;color:#a1a1aa;margin:0 0 32px 0;text-align:center;">Your secure, drop-in AI assistant is ready. Turn your static website into a conversational knowledge base in minutes.</p>
            <div style="text-align:center;margin-bottom:40px;">
              <a href="https://trynexusweb.vercel.app/dashboard" style="display:inline-block;background-color:#a855f7;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:9999px;">Go to Dashboard</a>
            </div>
            <div style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;">
              <p style="font-size:14px;color:#d4d4d8;margin:0;"><strong>Next step:</strong> Add your Groq API key in the dashboard to enable AI responses.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#09090b;border-top:1px solid #27272a;padding:32px 40px;text-align:center;">
            <p style="font-size:13px;color:#52525b;margin:0;">&copy; 2026 Nexus Web Assistant. All rights reserved.</p>
            <p style="font-size:13px;color:#52525b;margin:8px 0 0 0;"><a href="https://trynexusweb.vercel.app" style="color:#a855f7;text-decoration:none;">trynexusweb.vercel.app</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def _key_alert_html(key_name: str, action: str) -> str:
    if "deleted" in action.lower():
        color = "#ef4444"
        bg_color = "rgba(239, 68, 68, 0.1)"
        border_color = "rgba(239, 68, 68, 0.2)"
        label = "DELETED"
    elif "saved" in action.lower() or "update" in action.lower():
        color = "#3b82f6"
        bg_color = "rgba(59, 130, 246, 0.1)"
        border_color = "rgba(59, 130, 246, 0.2)"
        label = "UPDATED"
    else:
        color = "#10b981"
        bg_color = "rgba(16, 185, 129, 0.1)"
        border_color = "rgba(16, 185, 129, 0.2)"
        label = "CREATED"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert - Nexus</title>
    </head>
    <body style="background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:60px 20px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:48px 40px;">
            <div style="text-align:center;margin-bottom:40px;">
              <span style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">Nexus<span style="color:#a855f7;">.</span></span>
            </div>
            <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 8px 0;">Security Alert: API Key {label}</h1>
            <p style="font-size:15px;line-height:24px;color:#a1a1aa;margin:0 0 32px 0;">A change was recently made to one of your Nexus API keys. Please review the details below.</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #27272a;">
                  <span style="font-size:14px;color:#71717a;float:left;">Key Name</span>
                  <span style="font-size:14px;color:#ffffff;font-weight:600;float:right;">{key_name}</span>
                  <div style="clear:both;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #27272a;">
                  <span style="font-size:14px;color:#71717a;float:left;">Status</span>
                  <span style="font-size:12px;color:{color};background-color:{bg_color};border:1px solid {border_color};padding:4px 10px;border-radius:9999px;font-weight:700;letter-spacing:1px;float:right;">{label}</span>
                  <div style="clear:both;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;">
                  <span style="font-size:14px;color:#71717a;float:left;">Timestamp</span>
                  <span style="font-size:14px;color:#ffffff;float:right;">{datetime.now(timezone.utc).strftime('%b %d, %Y - %H:%M UTC')}</span>
                  <div style="clear:both;"></div>
                </td>
              </tr>
            </table>

            <div style="background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:16px 20px;margin-bottom:32px;">
              <p style="font-size:14px;color:#fca5a5;margin:0;"><strong>Not you?</strong> If you did not authorize this action, please revoke this key immediately from your dashboard.</p>
            </div>

            <div style="text-align:center;">
              <a href="https://trynexusweb.vercel.app/dashboard" style="display:inline-block;background-color:#ffffff;color:#09090b;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:9999px;">Review Dashboard</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#09090b;border-top:1px solid #27272a;padding:32px 40px;text-align:center;">
            <p style="font-size:13px;color:#52525b;margin:0;">This is an automated security notification.</p>
            <p style="font-size:13px;color:#52525b;margin:8px 0 0 0;">&copy; 2026 Nexus Web Assistant</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def _account_deletion_html() -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deleted - Nexus</title>
    </head>
    <body style="background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:60px 20px;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:48px 40px;">
            <div style="text-align:center;margin-bottom:40px;">
              <span style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">Nexus<span style="color:#a855f7;">.</span></span>
            </div>
            <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px 0;text-align:center;">Account Deleted</h1>
            <p style="font-size:16px;line-height:26px;color:#a1a1aa;margin:0 0 16px 0;text-align:center;">Your Nexus account has been successfully deleted.</p>
            <p style="font-size:16px;line-height:26px;color:#a1a1aa;margin:0 0 40px 0;text-align:center;">All of your personal data, API keys, whitelisted domains, and usage logs have been permanently removed from our servers.</p>
            
            <div style="text-align:center;">
              <a href="https://trynexusweb.vercel.app" style="display:inline-block;background-color:#27272a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:9999px;">Visit Homepage</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#09090b;border-top:1px solid #27272a;padding:32px 40px;text-align:center;">
            <p style="font-size:13px;color:#52525b;margin:0;">We're sorry to see you go.</p>
            <p style="font-size:13px;color:#52525b;margin:8px 0 0 0;">&copy; 2026 Nexus Web Assistant</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def send_welcome_email(user_id: str, to_email: str, user_name: str = "User"):
    send_email(user_id, to_email, "Welcome to Nexus", _welcome_html(user_name))

def send_key_alert_email(user_id: str, to_email: str, key_name: str, action: str = "created"):
    send_email(user_id, to_email, f"Security Alert: API Key {action.capitalize()}", _key_alert_html(key_name, action))

def send_account_deletion_email(user_id: str, to_email: str):
    send_email(user_id, to_email, "Your Nexus account has been deleted", _account_deletion_html())