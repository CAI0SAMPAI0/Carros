import io
import os
import hashlib
import requests
from django.core.files.base import ContentFile
from django.db.models.signals import post_save
from datetime import datetime


# Termos proibidos no título ou URL da imagem (documentos, mapas, diagramas, logos, etc.)
PHOTO_BLACKLIST = [
    "logo", "emblem", "badge", "drawing", "diagram", "interior", "sign",
    "document", "map", "mapa", "text", "page", "pdf", "chart", "graph",
    "table", "scan", "record", "patent", "schematic", "blueprint", "brochure",
    "poster", "advertisement", "ad", "catalogue", "catalog", "flyer",
    "manual", "plan", "aerial", "satellite", "coat_of_arms", "flag",
    "icon", "symbol", "stamp", "label",
]


def _is_valid_car_image(content: bytes) -> bool:
    """
    Verifica se a imagem baixada tem aspecto plausível para um carro.
    Rejeita imagens com proporção de documento (portrait A4 = mais alta que larga).
    Retorna True se a imagem for válida.
    """
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        w, h = img.size
        if w == 0 or h == 0:
            return False
        ratio = h / w
        # Rejeita se a imagem for mais alta que larga por mais de 20% (documentos, PDFs)
        if ratio > 1.2:
            return False
        # Rejeita imagens minúsculas (logos ou ícones)
        if w < 300 or h < 150:
            return False
        return True
    except Exception:
        # Se não conseguir abrir com PIL, aceita por padrão
        return True


def get_existing_photo_hashes():
    """
    Calcula e retorna um conjunto de hashes MD5 de todas as fotos de carros válidas existentes.
    Ignora silenciosamente arquivos inexistentes (comum após novas implantações na Render).
    """
    hashes = set()
    from cars.models import Car
    for car in Car.objects.exclude(photo='').exclude(photo__isnull=True):
        try:
            if car.photo:
                car.photo.open('rb')
                content = car.photo.read()
                car.photo.close()
                if content:
                    file_hash = hashlib.md5(content).hexdigest()
                    hashes.add(file_hash)
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Erro ao calcular hash para o carro {car.id}: {e}")
    return hashes


def _url_is_blacklisted(url: str, title: str) -> bool:
    """Verifica se a URL ou o título da imagem contém termos proibidos."""
    url_lower = url.lower()
    title_lower = title.lower()
    return any(term in url_lower or term in title_lower for term in PHOTO_BLACKLIST)


def fetch_and_save_car_photo_with_hashes(car_id, existing_hashes):
    """
    Função interna para buscar e salvar a URL da foto do Wikimedia diretamente no campo
    `photo_url` do banco de dados (PostgreSQL). Nenhum arquivo é baixado para o disco,
    evitando o problema de filesystem efêmero do Hugging Face Spaces / Render.
    O parâmetro `existing_hashes` é mantido por compatibilidade mas não é usado.
    """
    from cars.models import Car
    try:
        car = Car.objects.select_related('brand').get(pk=car_id)
    except Car.DoesNotExist:
        return

    if car.photo or car.photo_url:
        return

    brand_name = car.brand.name
    model_name = car.model
    year = car.model_year or car.factory_year or ""

    queries_to_try = [
        f"{brand_name} {model_name} {year} automóvel",
        f"{brand_name} {model_name} {year} car",
        f"{brand_name} {model_name} car",
        f"{brand_name} {model_name}",
    ]

    headers = {"User-Agent": "CarrosBot/1.0 (cmsampaio71@gmail.com)"}
    search_url = "https://commons.wikimedia.org/w/api.php"

    for query in queries_to_try:
        query = query.strip()
        if not query:
            continue

        search_params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 8,
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 1000,
            "format": "json"
        }

        try:
            res = requests.get(search_url, params=search_params, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                pages = data.get("query", {}).get("pages", {})
                if pages:
                    pages_list = list(pages.values())
                    pages_list.sort(key=lambda x: x.get("index", 999))

                    for page_data in pages_list:
                        title = page_data.get("title", "")
                        if "imageinfo" not in page_data:
                            continue

                        image_info = page_data["imageinfo"][0]
                        url = image_info.get("thumburl") or image_info.get("url", "")
                        mime = image_info.get("mime", "")

                        url_lower = url.lower()

                        # Aceita apenas formatos de imagem fotográfica
                        if not any(url_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                            # Tenta verificar pelo mime type
                            if mime and not any(t in mime for t in ['jpeg', 'png', 'webp']):
                                continue

                        # Aplica blacklist de termos proibidos
                        if _url_is_blacklisted(url, title):
                            continue

                        # Valida o aspect ratio baixando apenas os primeiros bytes
                        try:
                            img_res = requests.get(url, headers=headers, timeout=15, stream=True)
                            if img_res.status_code != 200:
                                continue

                            # Lê apenas o suficiente para verificar o aspect ratio (max 200KB)
                            img_content = b""
                            for chunk in img_res.iter_content(chunk_size=8192):
                                img_content += chunk
                                if len(img_content) >= 204800:
                                    break
                            img_res.close()

                            if not _is_valid_car_image(img_content):
                                print(f"   [Aspecto Inválido] Imagem rejeitada (documento/portrait): {url}", flush=True)
                                continue

                        except Exception as e:
                            print(f"   [Validação] Erro ao validar imagem {url}: {e}", flush=True)
                            continue

                        # Salva a URL diretamente no banco (PostgreSQL persiste entre reinicializações)
                        try:
                            car.skip_signal = True
                            car.photo_url = url
                            car.save(update_fields=['photo_url'])
                            print(f"   [Sucesso] URL salva para {brand_name} {model_name}: {url}", flush=True)

                            from django.core.cache import cache
                            try:
                                cache.clear()
                            except Exception:
                                pass
                            return

                        except Exception as e:
                            print(f"   [Erro ao salvar URL] {url}: {e}", flush=True)

        except Exception as e:
            print(f"Erro na requisição ao Wikimedia para a busca '{query}': {e}", flush=True)



def fetch_and_save_car_photo(car_id):
    """
    Wrapper público para buscar fotos de um carro individual (usado pelos sinais).
    """
    existing_hashes = get_existing_photo_hashes()
    fetch_and_save_car_photo_with_hashes(car_id, existing_hashes)


def fix_all_photos():
    """
    Varre todos os carros, identifica duplicatas ou imagens quebradas/inexistentes,
    e baixa novas fotos exclusivas e válidas em segundo plano.
    Desconecta os sinais do Django durante o processo para evitar loop de threads.
    """
    from cars.signals import car_post_save
    from cars.models import Car
    from django.conf import settings

    post_save.disconnect(car_post_save, sender=Car)

    try:
        cars = list(Car.objects.select_related('brand').all())

        seen_hashes = {}
        duplicates = []
        broken_or_missing = []

        print(f"[{datetime.now()}] [Photo Cleanup] Iniciando varredura em {len(cars)} carros no banco de dados...")

        is_cloudinary = getattr(settings, 'DEFAULT_FILE_STORAGE', '') == 'cloudinary_storage.storage.MediaCloudinaryStorage'

        for car in cars:
            if car.photo:
                if is_cloudinary:
                    # Se estiver usando Cloudinary, assumimos que se a foto está cadastrada no banco, ela existe na nuvem.
                    # Isso evita baixar centenas de imagens a cada boot da imagem docker na nuvem.
                    if car.photo.name in seen_hashes:
                        duplicates.append(car)
                    else:
                        seen_hashes[car.photo.name] = car.id
                else:
                    try:
                        car.photo.open('rb')
                        content = car.photo.read()
                        car.photo.close()
                        if content:
                            img_hash = hashlib.md5(content).hexdigest()
                            if img_hash in seen_hashes:
                                duplicates.append(car)
                            else:
                                seen_hashes[img_hash] = car.id
                        else:
                            broken_or_missing.append(car)
                    except FileNotFoundError:
                        broken_or_missing.append(car)
                    except Exception:
                        broken_or_missing.append(car)
            else:
                broken_or_missing.append(car)

        existing_hashes = set(seen_hashes.keys()) if not is_cloudinary else set()
        to_fix = duplicates + broken_or_missing

        if not to_fix:
            print(f"[{datetime.now()}] [Photo Cleanup] Todos os carros possuem fotos válidas e exclusivas. Nada a fazer!")
            return

        print(f"[{datetime.now()}] [Photo Cleanup] Encontrados {len(duplicates)} duplicados e {len(broken_or_missing)} sem fotos/quebradas.")

        for car in to_fix:
            print(f"[{datetime.now()}] [Photo Cleanup] Reparando foto de {car.brand.name} {car.model} ({car.model_year or 'unknown'})...")
            car.photo = None
            car.save()
            fetch_and_save_car_photo_with_hashes(car.id, existing_hashes)

        print(f"[{datetime.now()}] [Photo Cleanup] Varredura e reparos finalizados com sucesso!")

    except Exception as e:
        print(f"[{datetime.now()}] [Photo Cleanup Error] Ocorreu um erro no processo de reparo: {e}")
    finally:
        post_save.connect(car_post_save, sender=Car)
        # Remove o arquivo de lock ao finalizar o processamento
        import tempfile
        lock_path = os.path.join(tempfile.gettempdir(), 'photo_cleanup.lock')
        try:
            os.remove(lock_path)
        except OSError:
            pass

