from django.urls import reverse_lazy
from django.http import JsonResponse
from cars.models import Car
from cars.forms import CarModelForm
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import ListView, UpdateView, DeleteView, DetailView, CreateView
from django.views.decorators.csrf import csrf_exempt



class CarsListView(ListView):
    model = Car
    template_name = 'cars.html'
    context_object_name = 'cars'

    def get_queryset(self):
        cars = super().get_queryset().order_by('model') # filtrando como cars = Car.objects.all().order_by('model') porém usando Heranças
        search = self.request.GET.get('search')
        # tratando a varíavel
        if search:
            cars = cars.filter(model__icontains=search)
        return cars
    
# protegendo view fazendo autenticação
@method_decorator(login_required(login_url='login'), name='dispatch')
class NewCarCreateView(CreateView):
    model = Car
    form_class = CarModelForm
    template_name = 'new_car.html'
    success_url = '/cars/'

class CarDetailView(DetailView):
    model = Car
    template_name = 'car_detail.html'
class CarUpdateView(UpdateView):
    model = Car
    form_class = CarModelForm
    template_name = 'car_update.html'

    def get_success_url(self):
        return reverse_lazy('car_detail', kwargs={'pk': self.object.pk})

class CarDeleteView(DeleteView):
    model = Car
    template_name = 'car_delete.html'
    success_url = '/cars/'

def cars_api_list(request):
    cars = Car.objects.all().order_by('model')
    data = []
    for car in cars:
        data.append({
            'id': car.id,
            'marca': car.brand.name if car.brand else None,
            'modelo': car.model,
            'ano': car.model_year,
            'preco': car.value,
            'foto': car.photo.url if car.photo else None,
            'descricao': car.bio,
        })
    return JsonResponse(data, safe=False)

def brands_api_list(request):
    from cars.models import Brand
    brands = Brand.objects.all().order_by('name')
    data = []
    for brand in brands:
        data.append({
            'id': brand.id,
            'name': brand.name,
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def car_create_api(request):
    if request.method == 'POST':
        form = CarModelForm(request.POST, request.FILES)
        if form.is_valid():
            car = form.save()
            return JsonResponse({'success': True, 'id': car.id})
        else:
            return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

@csrf_exempt
def car_detail_api(request, pk):
    try:
        car = Car.objects.get(pk=pk)
    except Car.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Car not found'}, status=404)
        
    if request.method == 'GET':
        return JsonResponse({
            'id': car.id,
            'brand': car.brand.id if car.brand else None,
            'marca': car.brand.name if car.brand else None,
            'modelo': car.model,
            'ano_fabricacao': car.factory_year,
            'ano_modelo': car.model_year,
            'placa': car.plate,
            'preco': car.value,
            'foto': car.photo.url if car.photo else None,
            'descricao': car.bio,
        })
        
    elif request.method == 'POST':
        form = CarModelForm(request.POST, request.FILES, instance=car)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)
            
    elif request.method == 'DELETE':
        car.delete()
        return JsonResponse({'success': True})


