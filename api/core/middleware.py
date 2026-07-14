from api.core.config import verify_session_token, COOKIE_NAME

def get_user_from_cookie(handler):
    cookie_header = handler.headers.get('Cookie')
    if not cookie_header:
        raise Exception('No cookie provided')
    cookies = {}
    for item in cookie_header.split(';'):
        item = item.strip()
        if '=' in item:
            key, val = item.split('=', 1)
            cookies[key] = val
    token = cookies.get(COOKIE_NAME)
    if not token:
        raise Exception('Session cookie not found')
    uid, session_id = verify_session_token(token)
    if not uid:
        raise Exception('Invalid or expired session')
    return uid, session_id