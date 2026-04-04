from django.contrib import admin
from cars.models import Car, Brand

class CarAdmin(admin.ModelAdmin):
    list_display = ('model', 'brand', 'factory_year', 'model_year', 'value', 'photo') # o que vai poder aparecer na tela
    search_fields = ('model', 'brand') # configura o que aparece na busca
    

class BrandAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    
admin.site.register(Brand, BrandAdmin)
admin.site.register(Car, CarAdmin)