import requests
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from cars.models import Car

class Command(BaseCommand):
    help = 'Checks all vehicles for broken image links and schedules re-download'

    def handle(self, *args, **options):
        self.stdout.write('Starting check for broken image links...')
        cars = Car.objects.exclude(photo='').exclude(photo__isnull=True)
        
        headers = {"User-Agent": "CarrosBot/1.0 (cmsampaio71@gmail.com)"}
        broken_count = 0
        
        for car in cars:
            photo_url = car.photo.url if hasattr(car.photo, 'url') else str(car.photo)
            
            # If local path (media URL), check if file exists locally
            if not photo_url.startswith('http'):
                local_path = os.path.join(settings.MEDIA_ROOT, str(car.photo))
                if not os.path.exists(local_path):
                    self.stdout.write(self.style.WARNING(f"Local file missing for car {car.id}: {car.model}"))
                    car.photo = None
                    car.photo_placeholder = None
                    car.skip_signal = True
                    car.save()
                    broken_count += 1
                continue
                
            # If external URL, perform a quick HEAD request
            try:
                res = requests.head(photo_url, headers=headers, timeout=5)
                if res.status_code >= 400:
                    # Retry with GET in case HEAD is blocked
                    res = requests.get(photo_url, headers=headers, timeout=5, stream=True)
                    if res.status_code >= 400:
                        self.stdout.write(self.style.WARNING(f"Broken URL ({res.status_code}) for car {car.id}: {photo_url}"))
                        car.photo = None
                        car.photo_placeholder = None
                        car.skip_signal = True
                        car.save()
                        broken_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Error checking url for car {car.id}: {e}"))
                car.photo = None
                car.photo_placeholder = None
                car.skip_signal = True
                car.save()
                broken_count += 1

        self.stdout.write(self.style.SUCCESS(f"Finished checking. Reset {broken_count} broken images."))
