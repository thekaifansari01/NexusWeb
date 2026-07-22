import os
import requests
from datetime import datetime, timezone

BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
BREVO_FROM_EMAIL = os.environ.get('BREVO_FROM_EMAIL', 'noreply@trynexus.site')

def send_email(user_id: str, to_email: str, subject: str, html_body: str, timeout: int = 10) -> bool:
    if not BREVO_API_KEY:
        return False

    payload = {
        "sender": {"name": "Try Nexus", "email": BREVO_FROM_EMAIL},
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
        return response.status_code == 201
    except Exception:
        return False


def _welcome_html(name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p>Hi {name},</p>
        <p>Welcome to Nexus. Your secure, drop-in AI assistant is ready. You can now turn your static website into a conversational knowledge base in minutes.</p>
        <p>As a next step, please add your Groq API key in the dashboard to enable AI responses.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Go to Dashboard</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
        <p style="font-size:13px;color:#6b7280;margin:4px 0 0 0;">This is an automated message, please do not reply.</p>
      </div>
    </body>
    </html>
    """

def _key_alert_html(key_name: str, action: str) -> str:
    action_upper = action.upper()
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#111827;margin:0 0 16px 0;">API Key {action_upper}</p>
        <p>A change was recently made to one of your Nexus API keys. Please review the details below:</p>
        <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0;">
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Key Name:</span> <strong style="color:#111827;">{key_name}</strong></p>
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Action:</span> <strong style="color:#111827;">{action_upper}</strong></p>
          <p style="margin:0;font-size:14px;"><span style="color:#6b7280;">Time:</span> <strong style="color:#111827;">{datetime.now(timezone.utc).strftime('%b %d, %Y - %H:%M UTC')}</strong></p>
        </div>
        <p style="font-size:14px;color:#6b7280;">If you did not authorize this action, please revoke this key immediately from your dashboard.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Review Dashboard</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def _account_deletion_html() -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#111827;margin:0 0 16px 0;">Account Deleted</p>
        <p>Your Nexus account has been successfully deleted.</p>
        <p>All of your personal data, API keys, whitelisted domains, and usage logs have been permanently removed from our active servers.</p>
        <p>We are sorry to see you go. If you ever need us again, you can create a new account at any time.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Visit Homepage</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def _domain_alert_html(domain_name: str, action: str) -> str:
    action_label = "removed from" if "deleted" in action.lower() or "remove" in action.lower() else "added to"
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#111827;margin:0 0 16px 0;">Domain Configuration Updated</p>
        <p>A domain was recently {action_label} your allowed origins.</p>
        <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0;">
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Domain:</span> <strong style="color:#111827;">{domain_name}</strong></p>
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Status:</span> <strong style="color:#111827;">{action.upper()}</strong></p>
          <p style="margin:0;font-size:14px;"><span style="color:#6b7280;">Time:</span> <strong style="color:#111827;">{datetime.now(timezone.utc).strftime('%b %d, %Y - %H:%M UTC')}</strong></p>
        </div>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Review Domains</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def _usage_warning_html(used: int, limit: int, remaining: int) -> str:
    pct = int((used / limit) * 100)
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#111827;margin:0 0 16px 0;">Approaching Usage Limit</p>
        <p>This is a quick notice that you are approaching your monthly request limit.</p>
        <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0;">
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Requests Used:</span> <strong style="color:#111827;">{used}</strong></p>
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Total Limit:</span> <strong style="color:#111827;">{limit}</strong></p>
          <p style="margin:0;font-size:14px;"><span style="color:#6b7280;">Current Usage:</span> <strong style="color:#111827;">{pct}%</strong></p>
        </div>
        <p>To ensure uninterrupted service, please consider upgrading your plan.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Upgrade Plan</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def _usage_exceeded_html(used: int, limit: int) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#dc2626;margin:0 0 16px 0;">Monthly Limit Reached</p>
        <p>You have reached your monthly request limit of <strong style="color:#111827;">{limit}</strong> requests. All further API requests will be blocked until your billing cycle resets on the 1st of next month.</p>
        <p>If you need more capacity, you can upgrade your plan right now.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Upgrade Plan</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def _login_alert_html(device_os: str, device_browser: str, device_type: str, location: str, ip_address: str) -> str:
    device_str = f"{device_browser} on {device_os}"
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151;background-color:#f9fafb;margin:0;padding:40px 20px;">
      <div style="max-width:512px;margin:0 auto;background-color:#ffffff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <div style="font-weight:700;font-size:24px;color:#111827;margin-bottom:24px;letter-spacing:-0.5px;">Nexus.</div>
        <p style="font-weight:600;font-size:18px;color:#111827;margin:0 0 16px 0;">New Sign-in Detected</p>
        <p>Your Nexus account was recently accessed from a new device.</p>
        <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0;">
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Device:</span> <strong style="color:#111827;">{device_str}</strong></p>
          <p style="margin:0 0 8px 0;font-size:14px;"><span style="color:#6b7280;">Location:</span> <strong style="color:#111827;">{location or 'Unknown'}</strong></p>
          <p style="margin:0;font-size:14px;"><span style="color:#6b7280;">IP Address:</span> <strong style="color:#111827;">{ip_address or 'Unknown'}</strong></p>
        </div>
        <p style="font-size:14px;color:#6b7280;">If this was you, you can ignore this email. If you do not recognize this activity, please secure your account immediately.</p>
        <div style="margin:32px 0;">
          <a href="https://www.trynexus.site/dashboard" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;display:inline-block;font-size:15px;">Review Activity</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px 0;">
        <p style="font-size:13px;color:#6b7280;margin:0;">&copy; 2026 Nexus Web Assistant.</p>
      </div>
    </body>
    </html>
    """

def send_welcome_email(user_id: str, to_email: str, user_name: str = "User"):
    send_email(user_id, to_email, "Welcome to Nexus", _welcome_html(user_name))

def send_key_alert_email(user_id: str, to_email: str, key_name: str, action: str = "created"):
    send_email(user_id, to_email, f"Security Alert: API Key {action.capitalize()}", _key_alert_html(key_name, action))

def send_account_deletion_email(user_id: str, to_email: str):
    send_email(user_id, to_email, "Your Nexus account has been deleted", _account_deletion_html())

def send_domain_alert_email(user_id: str, to_email: str, domain_name: str, action: str = "added"):
    send_email(user_id, to_email, f"Domain Update: {domain_name}", _domain_alert_html(domain_name, action))

def send_usage_warning_email(user_id: str, to_email: str, used: int, limit: int):
    remaining = max(0, limit - used)
    send_email(user_id, to_email, f"Action Required: {int((used/limit)*100)}% Usage Reached", _usage_warning_html(used, limit, remaining))

def send_usage_exceeded_email(user_id: str, to_email: str, used: int, limit: int):
    send_email(user_id, to_email, "Action Required: Monthly Limit Reached", _usage_exceeded_html(used, limit))

def send_login_alert_email(user_id: str, to_email: str, device_os: str, device_browser: str, device_type: str, location: str, ip_address: str):
    send_email(user_id, to_email, "Security Alert: New Sign-in Detected", _login_alert_html(device_os, device_browser, device_type, location, ip_address))