import os
import sys
import threading
from django.apps import AppConfig


class CarsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cars'

    def ready(self):
        import cars.signals
        
        run_main = os.environ.get('RUN_MAIN')
        is_runserver = 'runserver' in sys.argv
        
        if (is_runserver and run_main == 'true') or (not is_runserver):
            import tempfile
            import time
            lock_path = os.path.join(tempfile.gettempdir(), 'photo_cleanup.lock')
            
            if os.path.exists(lock_path):
                if time.time() - os.path.getmtime(lock_path) > 3600:
                    try:
                        os.remove(lock_path)
                    except OSError:
                        pass
                        
            try:
                fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                
                from cars.utils import fix_all_photos
                thread = threading.Thread(target=fix_all_photos)
                thread.daemon = True
                thread.start()
            except FileExistsError:
                pass