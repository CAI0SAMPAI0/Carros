import os
import csv
import django
from django.db import connection, IntegrityError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from cars.models import Brand


DEFAULT_BRANDS = [
    "Alfa Romeo", "Aston Martin", "Audi", "BMW", "BYD", "Caoa Chery", "Chevrolet", 
    "Chrysler", "Citroën", "Dodge", "Ferrari", "Fiat", "Ford", "GWM", "Honda", 
    "Hyundai", "Jac Motors", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", 
    "Lexus", "Maserati", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", 
    "Peugeot", "Porsche", "RAM", "Renault", "Rolls-Royce", "Subaru", "Suzuki", 
    "Tesla", "Toyota", "Troller", "Volkswagen", "Volvo"
]

def reset_db_sequence():
    print("Sincronizando sequência de chaves primárias (IDs) no banco de dados...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT setval(pg_get_serial_sequence('cars_brand', 'id'), coalesce(max(id), 1)) FROM cars_brand;")
            print("Sequência de IDs sincronizada com sucesso!")
    except Exception as e:
        print(f"Aviso ao tentar sincronizar sequências (pode ser ignorado se não for Postgres): {e}")

def import_from_csv(csv_path):
    print(f"Importando marcas a partir do arquivo CSV: {csv_path}...")
    imported_count = 0
    skipped_count = 0
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        first_row = next(reader, None)
        if first_row:
            if first_row[0].strip().lower() in ['marca', 'brand', 'name', 'nome']:
                print("Cabeçalho detectado e ignorado.")
            else:
                brand_name = first_row[0].strip()
                if brand_name:
                    brand, created = Brand.objects.get_or_create(name=brand_name)
                    if created:
                        imported_count += 1
                    else:
                        skipped_count += 1
        
        for row in reader:
            if not row:
                continue
            brand_name = row[0].strip()
            if brand_name:
                brand, created = Brand.objects.get_or_create(name=brand_name)
                if created:
                    imported_count += 1
                else:
                    skipped_count += 1
                    
    print(f"Importação via CSV concluída! Adicionadas: {imported_count} | Já existentes ou ignoradas: {skipped_count}")

def import_default_list():
    print("Importando lista padrão de marcas populares...")
    imported_count = 0
    skipped_count = 0
    
    for brand_name in DEFAULT_BRANDS:
        brand, created = Brand.objects.get_or_create(name=brand_name)
        if created:
            imported_count += 1
        else:
            skipped_count += 1
            
    print(f"Importação concluída! Adicionadas: {imported_count} | Já existentes ou ignoradas: {skipped_count}")

if __name__ == '__main__':
    reset_db_sequence()
    
    csv_file = os.path.join(os.path.dirname(__file__), 'brands.csv')
    
    if os.path.exists(csv_file):
        import_from_csv(csv_file)
    else:
        print("Nenhum arquivo 'brands.csv' encontrado na pasta do backend.")
        import_default_list()
        print("\nDica: Se quiser importar uma lista customizada, crie um arquivo chamado 'brands.csv' na pasta 'backend/' com uma marca por linha e rode este script novamente.")
