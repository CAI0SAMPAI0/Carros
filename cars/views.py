from django.shortcuts import render, redirect
from cars.models import Car
from cars.forms import CarModelForm

def cars_view(request):
    cars = Car.objects.all().order_by('-model') # ou -model = faz pela ordem contrária
    search = request.GET.get('search')
    # tratando a varíavel
    if search:
        cars = cars.filter(model__icontains=search) # busca por qualquer elemento com esse contain ignorando capitalização e ordenando por modelo
    
    #cars = Car.objects.all() # busca todos os objetos / registros
    #cars = Car.objects.filter(brand__name=search) filtrando e recebe o ID e não a string e usando __name é possível filtrar pelo nome
    # por model
        
    return render(request, 'cars.html',
                  {'cars': cars},)

def new_car_view(request):
    if request.method == 'POST':
        new_car_form = CarModelForm(request.POST, request.FILES)
        if new_car_form.is_valid():
            new_car_form.save()
            return redirect('cars_list')
    else:
        new_car_form = CarModelForm()
    return render(request, 'new_car.html', {'new_car_form': new_car_form})