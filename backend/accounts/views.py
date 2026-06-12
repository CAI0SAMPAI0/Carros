import json
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def register_view(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            user_form = UserCreationForm(data)
            if user_form.is_valid():
                user_form.save()
                return JsonResponse({'success': True, 'message': 'Usuário cadastrado com sucesso!'})
            else:
                # Retorna os erros de validação do formulário em formato amigável
                errors = {field: errors[0] for field, errors in user_form.errors.items()}
                return JsonResponse({'success': False, 'errors': errors}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
            
    # Fallback para o comportamento HTML original
    user_form = UserCreationForm()
    if request.method == 'POST':
        user_form = UserCreationForm(request.POST)
        if user_form.is_valid():
            user_form.save()
            return redirect('login')
    return render(request, 'register.html', {"user_form": user_form})

@csrf_exempt
def login_view(request):
    if request.method == 'POST' and request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True, 
                    'username': user.username,
                    'message': 'Login realizado com sucesso!'
                })
            else:
                return JsonResponse({'success': False, 'error': 'Usuário ou senha inválidos.'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    # Fallback para o comportamento HTML original
    login_form = AuthenticationForm()
    if request.method == "POST":
        login_form = AuthenticationForm(data=request.POST)
        if login_form.is_valid():
            user = login_form.get_user()
            login(request, user)
            return redirect('cars_list')
    return render(request, 'login.html', {'login_form': login_form})

def logout_view(request):
    logout(request)
    if request.headers.get('Accept') == 'application/json' or request.content_type == 'application/json':
        return JsonResponse({'success': True, 'message': 'Logout realizado com sucesso!'})
    return redirect('login')