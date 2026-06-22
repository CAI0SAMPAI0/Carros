import hmac
import hashlib
import base64
import json
import time
from django.conf import settings
from django.contrib.auth.models import User

def base64url_encode(payload_bytes):
    return base64.urlsafe_b64encode(payload_bytes).rstrip(b'=').decode('utf-8')

def base64url_decode(payload_str):
    # Corrige padding
    rem = len(payload_str) % 4
    if rem > 0:
        payload_str += '=' * (4 - rem)
    return base64.urlsafe_b64decode(payload_str.encode('utf-8'))

def generate_jwt(payload, secret_key=None):
    if secret_key is None:
        secret_key = settings.SECRET_KEY
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(secret_key.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token, secret_key=None):
    if secret_key is None:
        secret_key = settings.SECRET_KEY
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_signature = hmac.new(secret_key.encode('utf-8'), signing_input, hashlib.sha256).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        payload_data = base64url_decode(payload_b64)
        payload = json.loads(payload_data.decode('utf-8'))
        
        if 'exp' in payload and payload['exp'] < time.time():
            return None
            
        return payload
    except Exception:
        return None

def generate_tokens_for_user(user):
    """Gera um par de access_token e refresh_token para o usuário."""
    now = int(time.time())
    access_payload = {
        "user_id": user.id,
        "username": user.username,
        "token_type": "access",
        "exp": now + 3600  # 1 hora
    }
    refresh_payload = {
        "user_id": user.id,
        "token_type": "refresh",
        "exp": now + (3600 * 24 * 7)  # 7 dias
    }
    
    return {
        "access_token": generate_jwt(access_payload),
        "refresh_token": generate_jwt(refresh_payload)
    }

def validate_token_header(request):
    """
    Valida o token JWT passado no header Authorization.
    Suporta formatos 'Token <token>' ou 'Bearer <token>'.
    Retorna o User correspondente se válido, senão None.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
        
    parts = auth_header.split(' ')
    if len(parts) != 2 or parts[0].lower() not in ['token', 'bearer']:
        return None
        
    token = parts[1]
    payload = verify_jwt(token)
    if not payload or payload.get('token_type') != 'access':
        return None
        
    try:
        return User.objects.get(id=payload['user_id'])
    except User.DoesNotExist:
        return None

def token_required(view_func):
    """Decorator para exigir autenticação JWT válida."""
    from functools import wraps
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        user = validate_token_header(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'Autenticação necessária.'}, status=401)
        request.user = user
        return view_func(request, *args, **kwargs)
    return wrapped_view

