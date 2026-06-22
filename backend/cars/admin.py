from django.contrib import admin
from cars.models import Car, Brand, CarImage

class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 3

class CarAdmin(admin.ModelAdmin):
    list_display = ('model', 'brand', 'factory_year', 'model_year', 'value', 'photo')
    search_fields = ('model', 'brand')
    inlines = [CarImageInline]
    

class BrandAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    
admin.site.register(Brand, BrandAdmin)
admin.site.register(Car, CarAdmin)