# api/services/statsService.py
from datetime import datetime, timedelta, timezone
from api.core.config import db

def get_stats(user_id, days):
    daily = _get_daily_usage(user_id, days)
    breakdowns = _get_breakdowns(user_id, days)
    totals = _calculate_totals(daily)
    return {
        'daily': daily,
        'totals': totals,
        'modelBreakdown': breakdowns['models'],
        'domainBreakdown': breakdowns['domains'],
        'hourlyDistribution': breakdowns['hours']
    }

def _get_daily_usage(user_id, days):
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)
    results = []
    current = start_date
    while current <= end_date:
        date_str = current.isoformat()
        doc_ref = db.collection('userDailyUsage').document(f"{user_id}_{date_str}")
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            results.append({
                'date': date_str,
                'requests': data.get('totalRequests', 0),
                'tokens': data.get('totalTokens', 0)
            })
        else:
            results.append({'date': date_str, 'requests': 0, 'tokens': 0})
        current += timedelta(days=1)
    return results

def _get_breakdowns(user_id, days):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    try:
        docs = db.collection('usageLogs') \
                 .where('userId', '==', user_id) \
                 .where('timestamp', '>=', cutoff) \
                 .stream()
    except Exception as e:
        print(f"Firestore query error: {e}")
        return {'models': [], 'domains': [], 'hours': []}
    models = {}
    domains = {}
    hours = {}
    for doc in docs:
        data = doc.to_dict()
        model = data.get('model', 'unknown')
        models[model] = models.get(model, 0) + 1
        domain = data.get('domain', 'unknown')
        domains[domain] = domains.get(domain, 0) + 1
        if 'timestamp' in data and data['timestamp']:
            ts = data['timestamp']
            hour = ts.hour if hasattr(ts, 'hour') else 0
            hours[hour] = hours.get(hour, 0) + 1
    return {
        'models': [{'name': k, 'count': v} for k, v in models.items()],
        'domains': [{'name': k, 'count': v} for k, v in domains.items()],
        'hours': [{'hour': k, 'count': v} for k, v in hours.items()]
    }

def _calculate_totals(daily):
    total_requests = sum(d['requests'] for d in daily)
    total_tokens = sum(d['tokens'] for d in daily)
    return {'totalRequests': total_requests, 'totalTokens': total_tokens}