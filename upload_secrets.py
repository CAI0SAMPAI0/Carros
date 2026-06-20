import os
import sys
from pathlib import Path

# Tentar importar bibliotecas necessárias
try:
    from huggingface_hub import HfApi
except ImportError:
    print("Biblioteca 'huggingface_hub' não encontrada.")
    print("Por favor, instale executando: pip install huggingface_hub")
    sys.exit(1)

try:
    from dotenv import dotenv_values
except ImportError:
    print("Biblioteca 'python-dotenv' não encontrada.")
    print("Por favor, instale executando: pip install python-dotenv")
    sys.exit(1)

# Caminho para o arquivo .env
env_path = Path(__file__).resolve().parent / "backend" / ".env"

if not env_path.exists():
    print(f"Erro: Arquivo .env não encontrado em: {env_path}")
    sys.exit(1)

# Ler chaves do arquivo .env
secrets = dotenv_values(env_path)

if not secrets:
    print("Nenhuma chave encontrada no arquivo .env para upload.")
    sys.exit(1)

print(f"Foram encontradas {len(secrets)} chaves para upload.")

# Solicitar Token de gravação do Hugging Face
print("\nVocê precisará do seu Token com permissão de ESCREVER (WRITE) do Hugging Face.")
print("Pegue o token aqui: https://huggingface.co/settings/tokens")
hf_token = input("Digite ou cole seu Hugging Face Write Token: ").strip()

if not hf_token:
    print("Erro: O Token não pode ser vazio.")
    sys.exit(1)

# Inicializar API do Hugging Face
api = HfApi(token=hf_token)
repo_id = "caio007/vehicles"

print(f"\nIniciando upload das chaves para o Space: {repo_id}...")

success_count = 0
for key, value in secrets.items():
    if not key or not value:
        continue
    
    # Ocultar o valor no log para segurança
    masked_val = value[:4] + "..." + value[-4:] if len(value) > 8 else "****"
    print(f"-> Enviando {key} (valor: {masked_val})...", end="", flush=True)
    
    try:
        api.add_space_secret(
            repo_id=repo_id,
            key=key,
            value=value
        )
        print(" [OK]")
        success_count += 1
    except Exception as e:
        print(f" [FALHOU]")
        print(f"   Erro ao enviar {key}: {e}")

print(f"\nUpload concluído! {success_count} de {len(secrets)} chaves foram configuradas com sucesso no Hugging Face!")
