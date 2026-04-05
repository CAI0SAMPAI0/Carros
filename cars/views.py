from django.shortcuts import render
from cars.models import Car

def cars_view(request):
    cars_1 = Car.objects.all().order_by('-model') # ou -model = faz pela ordem contrária
    search = request.GET.get('search')
    # tratando a varíavel
    if search:
        cars_1 = cars_1.filter(model__icontains=search) # busca por qualquer elemento com esse contain ignorando capitalização e ordenando por modelo
    
    #cars = Car.objects.all() # busca todos os objetos / registros
    #cars = Car.objects.filter(brand__name=search) filtrando e recebe o ID e não a string e usando __name é possível filtrar pelo nome
    # por model
        
    return render(request, 'cars.html',
                  {'cars': cars_1},)
