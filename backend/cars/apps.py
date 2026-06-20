import os
import sys
import threading
from django.apps import AppConfig


class CarsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cars'

    def ready(self):
        import cars.signals
        
        # Only run the photo cleanup thread when executing the actual web server 
        # (runserver or Gunicorn). Prevents it from running during collectstatic, migrate, etc.
        run_main = os.environ.get('RUN_MAIN')
        is_runserver = 'runserver' in sys.argv
        is_gunicorn = os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn')
        
        is_web_server = (is_runserver and run_main == 'true') or is_gunicorn
        
        if is_web_server:
            # Usar um Lock para garantir que apenas um worker do Gunicorn execute o reparo por vez
            import tempfile
            import time
            lock_path = os.path.join(tempfile.gettempdir(), 'photo_cleanup.lock')
            
            # Limpa o lock se for muito antigo (mais de 1 hora) para evitar travamento em caso de crash
            if os.path.exists(lock_path):
                if time.time() - os.path.getmtime(lock_path) > 3600:
                    try:
                        os.remove(lock_path)
                    except OSError:
                        pass
                        
            try:
                # Tenta criar o arquivo de lock exclusivamente. 
                # Se o arquivo já existir, vai levantar FileExistsError.
                fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                
                from cars.utils import fix_all_photos
                thread = threading.Thread(target=fix_all_photos)
                thread.daemon = True
                thread.start()
            except FileExistsError:
                # Outro worker já adquiriu o lock e está rodando
                pass