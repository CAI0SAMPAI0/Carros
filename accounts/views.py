from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout

def register_view(request):
    user_form = UserCreationForm()
    if request.method == 'POST':
        user_form = user_form
        if user_form.is_valid():
            user_form.save()
            return redirect('login')
    else:
        user_form = user_form
    return render(request, 'register.html', {"user_form": user_form})

def login_view(request):
    login_form = AuthenticationForm()
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('cars_list')
        else:
            login_form = login_form
    else:
        login_form = login_form
    return render(request, 'login.html', {'login_form': login_form})

def logout_view(request):
    logout(request)
    return redirect('login')