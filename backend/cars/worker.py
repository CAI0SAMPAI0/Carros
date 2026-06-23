import os
import sys
import time
import requests
import threading
from datetime import datetime
from django.db.models import Q

def ping_self():
    """
    Realiza uma chamada HTTP GET para a URL pública do Hugging Face Space (ou localhost)
    para registrar tráfego e evitar que o contêiner durma.
    """
    space_host = os.getenv('SPACE_HOST')
    space_id = os.getenv('SPACE_ID')
    
    url = None
    if space_host:
        url = f"https://{space_host}/"
    elif space_id and '/' in space_id:
        user, space = space_id.split('/')
        user_name = user.replace('.', '-').replace('_', '-').lower()
        space_name = space.replace('.', '-').replace('_', '-').lower()
        url = f"https://{user_name}-{space_name}.hf.space/"
        
    if not url:
        url = "http://localhost:7860/"
        
    print(f"[{datetime.now()}] [Keep-Alive] Pinging self at {url}...", flush=True)
    try:
        response = requests.get(url, timeout=15)
        print(f"[{datetime.now()}] [Keep-Alive] Ping response status: {response.status_code}", flush=True)
    except Exception as e:
        print(f"[{datetime.now()}] [Keep-Alive] Failed to ping self: {e}", flush=True)

def auto_update_categories_and_bios():
    """
    Varre o banco de dados buscando carros sem categoria ou bio
    e as preenche usando a IA da Groq de forma independente.
    """
    from cars.models import Car
    from openai_api.client import get_car_ai_category, get_car_ai_bio, get_car_ai_spec_sheet
    
    print(f"[{datetime.now()}] [Text Worker] Checking for cars with missing category, bio, or spec sheet...", flush=True)
    
    cars_to_update = Car.objects.filter(
        Q(categoria='') | Q(categoria__isnull=True) | Q(categoria=None) |
        Q(bio='') | Q(bio__isnull=True) |
        Q(ficha_tecnica='') | Q(ficha_tecnica__isnull=True)
    )
    
    if not cars_to_update.exists():
        print(f"[{datetime.now()}] [Text Worker] All categories, bios, and spec sheets are up to date.", flush=True)
        return
        
    print(f"[{datetime.now()}] [Text Worker] Found {cars_to_update.count()} cars needing text/spec updates.", flush=True)
    
    try:
        for car in cars_to_update:
            # Re-fetch para evitar race conditions
            try:
                car = Car.objects.get(pk=car.id)
            except Car.DoesNotExist:
                continue
                
            brand_name = car.brand.name
            model_name = car.model
            full_name = f"{brand_name} {model_name}"
            
            updated_fields = []
            
            # 1. Categoria
            if not car.categoria:
                try:
                    categoria = get_car_ai_category(car.brand, car.model, car.model_year)
                    if categoria:
                        car.categoria = categoria
                        updated_fields.append('categoria')
                        print(f"   [Text Worker] Categoria de {full_name} definida como: {categoria}", flush=True)
                except Exception as e:
                    print(f"   [Text Worker Erro] Erro ao classificar {full_name}: {e}", flush=True)
            
            # 2. Bio
            if not car.bio:
                try:
                    bio = get_car_ai_bio(car.model, car.brand, car.model_year)
                    if bio:
                        car.bio = bio
                        updated_fields.append('bio')
                        print(f"   [Text Worker] Bio de {full_name} gerada com sucesso.", flush=True)
                except Exception as e:
                    print(f"   [Text Worker Erro] Erro ao gerar bio de {full_name}: {e}", flush=True)

            # 3. Ficha Técnica
            if not car.ficha_tecnica:
                try:
                    ficha = get_car_ai_spec_sheet(brand_name, model_name, car.model_year)
                    if ficha:
                        car.ficha_tecnica = ficha
                        updated_fields.append('ficha_tecnica')
                        print(f"   [Text Worker] Ficha técnica de {full_name} gerada com sucesso.", flush=True)
                except Exception as e:
                    print(f"   [Text Worker Erro] Erro ao gerar ficha técnica de {full_name}: {e}", flush=True)
            
            if updated_fields:
                car.skip_signal = True  # Impede loops ou re-disparo do post_save signal
                car.save(update_fields=updated_fields)
                
            # Intervalo para respeitar limites da API da Groq
            time.sleep(2.5)
            
    except Exception as e:
        print(f"[{datetime.now()}] [Text Worker Error] Ocorreu uma exceção: {e}", flush=True)

def auto_update_photos():
    """
    Varre o banco de dados buscando carros sem fotos e busca imagens correspondentes
    na internet de forma independente da classificação de texto.
    """
    from cars.models import Car
    from cars.utils import fetch_and_save_car_photo_with_hashes, get_existing_photo_hashes
    
    print(f"[{datetime.now()}] [Photo Worker] Checking for cars with missing photos...", flush=True)
    
    cars_to_update = Car.objects.filter(
        Q(photo='') | Q(photo__isnull=True)
    ).filter(
        Q(photo_url='') | Q(photo_url__isnull=True)
    )
    
    if not cars_to_update.exists():
        print(f"[{datetime.now()}] [Photo Worker] All cars have photos.", flush=True)
        return
        
    print(f"[{datetime.now()}] [Photo Worker] Found {cars_to_update.count()} cars needing photos.", flush=True)

    
    try:
        # Carrega os hashes das fotos apenas uma vez por lote
        existing_hashes = get_existing_photo_hashes()
        
        for car in cars_to_update:
            # Re-fetch para evitar race conditions
            try:
                car = Car.objects.get(pk=car.id)
            except Car.DoesNotExist:
                continue
                
            if not car.photo and not car.photo_url:
                brand_name = car.brand.name
                model_name = car.model
                full_name = f"{brand_name} {model_name}"
                
                print(f"[{datetime.now()}] [Photo Worker] Buscando foto para {full_name}...", flush=True)
                try:
                    # fetch_and_save_car_photo_with_hashes já define skip_signal internamente
                    fetch_and_save_car_photo_with_hashes(car.id, existing_hashes)
                except Exception as e:
                    print(f"   [Photo Worker Erro] Erro ao buscar/salvar foto de {full_name}: {e}", flush=True)
                    
                # Espera entre downloads para respeitar limites do Commons/Wikimedia
                time.sleep(3)
                
    except Exception as e:
        print(f"[{datetime.now()}] [Photo Worker Error] Ocorreu uma exceção: {e}", flush=True)

def ping_loop_task():
    """Tarefa periódica de keep-alive (a cada 10 minutos)."""
    while True:
        try:
            ping_self()
        except Exception as e:
            print(f"[Keep-Alive Exception] {e}", flush=True)
        time.sleep(600)

def text_update_loop_task():
    """Tarefa periódica de atualização de IA de Texto (a cada 5 minutos)."""
    while True:
        try:
            auto_update_categories_and_bios()
        except Exception as e:
            print(f"[Text Worker Loop Exception] {e}", flush=True)
        time.sleep(300)

def photo_update_loop_task():
    """Tarefa periódica de busca e download de fotos (a cada 5 minutos)."""
    while True:
        try:
            auto_update_photos()
        except Exception as e:
            print(f"[Photo Worker Loop Exception] {e}", flush=True)
        time.sleep(300)

def check_broken_images_task():
    """Varre todas as fotos e remove referências quebradas para re-download."""
    from cars.models import Car
    import requests
    print(f"[{datetime.now()}] [Weekly Image Checker] Iniciando verificação de links de imagem...", flush=True)
    cars = Car.objects.exclude(photo='').exclude(photo__isnull=True)
    headers = {"User-Agent": "CarrosBot/1.0 (cmsampaio71@gmail.com)"}
    broken_count = 0
    
    for car in cars:
        try:
            car = Car.objects.get(pk=car.id)
        except Car.DoesNotExist:
            continue
            
        photo_url = car.photo.url if hasattr(car.photo, 'url') else str(car.photo)
        if photo_url.startswith('http'):
            try:
                res = requests.head(photo_url, headers=headers, timeout=5)
                if res.status_code >= 400:
                    res = requests.get(photo_url, headers=headers, timeout=5, stream=True)
                    if res.status_code >= 400:
                        print(f"   [Weekly Image Checker] Link quebrado ({res.status_code}) para o carro {car.id}. Resetando foto.", flush=True)
                        car.photo = None
                        car.photo_placeholder = None
                        car.skip_signal = True
                        car.save()
                        broken_count += 1
            except Exception as e:
                print(f"   [Weekly Image Checker] Erro ao checar URL para o carro {car.id}: {e}. Resetando foto.", flush=True)
                car.photo = None
                car.photo_placeholder = None
                car.skip_signal = True
                car.save()
                broken_count += 1
        else:
            import os
            from django.conf import settings
            local_path = os.path.join(settings.MEDIA_ROOT, str(car.photo))
            if not os.path.exists(local_path):
                print(f"   [Weekly Image Checker] Arquivo local inexistente para o carro {car.id}. Resetando foto.", flush=True)
                car.photo = None
                car.photo_placeholder = None
                car.skip_signal = True
                car.save()
                broken_count += 1
    print(f"[{datetime.now()}] [Weekly Image Checker] Verificação concluída. Resetou {broken_count} fotos.", flush=True)

def weekly_check_loop_task():
    """Tarefa periódica executada a cada 7 dias para monitoramento de links quebrados."""
    # Espera 1 hora antes do primeiro run
    time.sleep(3600)
    while True:
        try:
            check_broken_images_task()
        except Exception as e:
            print(f"[Weekly Checker Loop Exception] {e}", flush=True)
        time.sleep(7 * 24 * 3600)

def worker_loop():
    """
    Iniciador principal do background loop.
    Cria e executa threads daemon separadas para cada tarefa paralela.
    """
    print(f"[{datetime.now()}] [Background Worker] Starting parallel loop threads...", flush=True)
    
    # Aguarda o servidor estar completamente inicializado
    time.sleep(10)
    
    # 1. Thread de Ping / Keep-Alive
    ping_thread = threading.Thread(target=ping_loop_task, name="PingKeepAliveThread")
    ping_thread.daemon = True
    ping_thread.start()
    
    # 2. Thread de Categoria e Bio (IA Texto)
    text_thread = threading.Thread(target=text_update_loop_task, name="TextAIWorkerThread")
    text_thread.daemon = True
    text_thread.start()
    
    # 3. Thread de Fotos (Mídia)
    photo_thread = threading.Thread(target=photo_update_loop_task, name="PhotoScraperWorkerThread")
    photo_thread.daemon = True
    photo_thread.start()

    # 4. Thread de Checagem Semanal de Imagens Quebradas
    broken_check_thread = threading.Thread(target=weekly_check_loop_task, name="WeeklyBrokenImageThread")
    broken_check_thread.daemon = True
    broken_check_thread.start()
