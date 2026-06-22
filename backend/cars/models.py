from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache


class Brand(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    
    def __str__(self) -> str:
        return self.name

class Car(models.Model):
    CATEGORIA_CHOICES = [
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('HATCH', 'Hatch'),
        ('PICAPE', 'Picape'),
        ('ESPORTIVO', 'Esportivo'),
        ('MINIVAN', 'Minivan'),
        ('ELETRICO', 'Elétrico'),
        ('CLASSICO', 'Clássico'),
        ('OUTRO', 'Outro'),
    ]

    id = models.AutoField(primary_key=True)
    model = models.CharField(max_length=200)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='car_brand')
    factory_year = models.IntegerField(blank=True, null=True)
    model_year = models.IntegerField(blank=True, null=True)
    plate = models.CharField(max_length=10, blank=True, null=True)
    CURRENCY_CHOICES = [
        ('BRL', 'BRL (R$)'),
        ('USD', 'USD ($)'),
    ]

    value = models.FloatField(blank=True, null=True)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='BRL',
    )
    photo = models.ImageField(upload_to='cars/', blank=True, null=True)
    photo_placeholder = models.TextField(blank=True, null=True)
    ficha_tecnica = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        blank=True,
        null=True,
        default=None,
    )
    
    def save(self, *args, **kwargs):
        # Gera o placeholder em base64 se houver uma nova foto e nenhum placeholder gerado
        if self.photo and not self.photo_placeholder:
            try:
                from PIL import Image
                import base64
                import io
                
                # Abre a imagem
                self.photo.open('rb')
                img = Image.open(self.photo)
                # Cria miniatura de 20x15
                img.thumbnail((20, 20))
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=20)
                self.photo_placeholder = f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
                self.photo.close()
            except Exception as e:
                print(f"[Placeholder] Erro ao gerar: {e}", flush=True)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.model

class CarInventory(models.Model):
    cars_count = models.IntegerField()
    cars_value = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.cars_count} - {self.cars_value}'


@receiver([post_save, post_delete], sender=Car)
def clear_cache_before_change(sender, instance, **kwargs):
    try:
        cache.clear()
    except Exception as e:
        print(f"Aviso: Não foi possível limpar o cache (Redis): {e}")


class CarImage(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='cars/extra/')
    photo_placeholder = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Gera o placeholder em base64 se houver uma nova foto e nenhum placeholder gerado
        if self.image and not self.photo_placeholder:
            try:
                from PIL import Image
                import base64
                import io
                
                self.image.open('rb')
                img = Image.open(self.image)
                img.thumbnail((20, 20))
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=20)
                self.photo_placeholder = f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
                self.image.close()
            except Exception as e:
                print(f"[Extra Image Placeholder] Erro ao gerar: {e}", flush=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Imagem de {self.car.model}"


class PriceAlert(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='price_alerts')
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('car', 'email')

    def __str__(self):
        return f"Alerta para {self.car.model} - {self.email}"