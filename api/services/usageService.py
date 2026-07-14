# api/services/usageService.py
from firebase_admin import firestore
from api.core.config import db

def check_and_increment_usage(user_id, plan, monthly_limit):
    """
    Atomically check and increment monthly usage count.
    Returns (success, new_count, error_message)
    """
    month_key = firestore.SERVER_TIMESTAMP.datetime().strftime("%Y-%m")
    usage_ref = db.collection('userMonthlyUsage').document(f"{user_id}_{month_key}")

    @firestore.transactional
    def transaction_logic(transaction):
        doc = transaction.get(usage_ref)
        if doc.exists:
            current_count = doc.to_dict().get('count', 0)
        else:
            current_count = 0

        if current_count >= monthly_limit:
            return False, current_count

        transaction.set(usage_ref, {
            'userId': user_id,
            'month': month_key,
            'count': current_count + 1,
            'limit': monthly_limit,
            'lastUpdated': firestore.SERVER_TIMESTAMP
        }, merge=True)
        return True, current_count + 1

    transaction = db.transaction()
    success, new_count = transaction_logic(transaction)
    if success:
        return True, new_count, None
    else:
        return False, new_count, "Monthly request limit exceeded"