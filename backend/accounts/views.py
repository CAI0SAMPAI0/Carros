import json
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from accounts.forms import RegisterForm
from accounts.models import AuthToken


@csrf_exempt
def register_view(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            form = RegisterForm(data)
            if form.is_valid():
                form.save()
                return JsonResponse({'success': True, 'message': 'Usuário cadastrado com sucesso!'})
            else:
                # Retorna os erros de validação de forma amigável
                errors = {field: errs[0] for field, errs in form.errors.items()}
                return JsonResponse({'success': False, 'errors': errors}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    # Fallback HTML
    return render(request, 'register.html', {})


@csrf_exempt
def login_view(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            username = data.get('username', '').strip()
            password = data.get('password', '')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                
                from accounts.jwt_helper import generate_tokens_for_user
                tokens = generate_tokens_for_user(user)
                
                return JsonResponse({
                    'success': True,
                    'username': user.username,
                    'token': tokens['access_token'],
                    'refresh_token': tokens['refresh_token'],
                    'message': 'Login realizado com sucesso!',
                })
            else:
                return JsonResponse(
                    {'success': False, 'error': 'Usuário ou senha inválidos.'},
                    status=400,
                )
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
def token_refresh_view(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh_token')
            if not refresh_token:
                return JsonResponse({'success': False, 'error': 'Refresh token is required.'}, status=400)
            
            from accounts.jwt_helper import verify_jwt, generate_tokens_for_user
            payload = verify_jwt(refresh_token)
            if not payload or payload.get('token_type') != 'refresh':
                return JsonResponse({'success': False, 'error': 'Invalid or expired refresh token.'}, status=401)
            
            from django.contrib.auth.models import User
            user = User.objects.get(id=payload['user_id'])
            tokens = generate_tokens_for_user(user)
            
            return JsonResponse({
                'success': True,
                'token': tokens['access_token'],
                'refresh_token': tokens['refresh_token']
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)

    # Fallback HTML
    login_form = AuthenticationForm()
    if request.method == 'POST':
        login_form = AuthenticationForm(data=request.POST)
        if login_form.is_valid():
            user = login_form.get_user()
            login(request, user)
            return redirect('cars_list')
    return render(request, 'login.html', {'login_form': login_form})


def logout_view(request):
    logout(request)
    if (
        request.headers.get('Accept') == 'application/json'
        or request.content_type == 'application/json'
    ):
        return JsonResponse({'success': True, 'message': 'Logout realizado com sucesso!'})
    return redirect('login')