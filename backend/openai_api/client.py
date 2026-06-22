import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')


import time

def get_groq_client():
    """
    Retorna uma instância inicializada do cliente da Groq.
    """
    return Groq(api_key=GROQ_API_KEY)


def _execute_groq_completion(prompt, max_tokens, response_format=None, retries=3):
    """
    Executa chamadas de chat completion na Groq com suporte a retentativas 
    e backoff exponencial caso ocorra erro de rate limit (429).
    """
    client = get_groq_client()
    for attempt in range(retries):
        try:
            kwargs = {
                "model": "llama-3.1-8b-instant",
                "messages": [{'role': 'user', 'content': prompt}],
                "max_tokens": max_tokens,
            }
            if response_format:
                kwargs["response_format"] = response_format
                kwargs["temperature"] = 0.1
                
            response = client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e)
            if "rate_limit" in err_str.lower() or "429" in err_str:
                wait_time = (attempt + 1) * 3
                print(f"[Groq API Client] Rate limit (429) detectado. Aguardando {wait_time}s antes de retentar...", flush=True)
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Falha ao se conectar à API da Groq após múltiplas tentativas de Rate Limit.")


def get_car_ai_bio(model, brand, year):
    prompt = '''
    Me mostre uma descrição de venda para o carro {} {} {} em apenas 250 caracteres. Informe coisas específicas do carro.
    '''.format(brand, model, year)
    try:
        return _execute_groq_completion(prompt, max_tokens=500)
    except Exception as e:
        print(f"Erro na API Groq ao gerar bio: {e}")
        return f"Excelente modelo da marca {brand}, {model} ano {year}."


def get_car_ai_category(brand, model, year):
    """
    Consulta a Groq para classificar o veículo em uma das categorias fixas com tratamento de rate limit.
    Retorna uma string com o código da categoria (ex: 'SUV', 'SEDAN', 'CLASSICO').
    """
    categorias_validas = ['SEDAN', 'SUV', 'HATCH', 'PICAPE', 'ESPORTIVO', 'MINIVAN', 'ELETRICO', 'CLASSICO', 'OUTRO']

    prompt = f"""
Você é um especialista em automóveis. Classifique o carro "{brand} {model} {year or ''}" em UMA das seguintes categorias:
SEDAN, SUV, HATCH, PICAPE, ESPORTIVO, MINIVAN, ELETRICO, CLASSICO, OUTRO

Regras:
- Use CLASSICO para carros fabricados antes de 1990 ou modelos considerados ícones históricos.
- Use ELETRICO apenas para veículos 100% elétricos.
- Use ESPORTIVO para supercarros, carros esporte e modelos de alto desempenho.
- Use PICAPE para caminhonetes e pickups.
- Use SUV para utilitários esportivos e crossovers.
- Use HATCH para carros hatchback compactos.
- Use SEDAN para sedans e berlinas.
- Use MINIVAN para vans e minivans de passageiros.
- Use OUTRO apenas se nenhuma categoria se encaixar.

Retorne APENAS um JSON no formato:
{{"categoria": "CATEGORIA_AQUI"}}

Sem explicações adicionais.
"""

    try:
        content = _execute_groq_completion(prompt, max_tokens=50, response_format={"type": "json_object"})
        data = json.loads(content.strip())
        categoria = data.get('categoria', 'OUTRO').upper().strip()
        if categoria not in categorias_validas:
            return 'OUTRO'
        return categoria
    except Exception as e:
        print(f"Aviso: Erro ao classificar categoria para {brand} {model}: {e}")
        return 'OUTRO'


def get_car_ai_spec_sheet(brand, model, year):
    """
    Consulta a Groq para extrair a ficha técnica estruturada do carro como JSON.
    """
    prompt = f"""
    Gere a ficha técnica completa do carro "{brand} {model} {year or ''}" em formato JSON estruturado.
    A ficha técnica deve conter os seguintes campos (com valores reais aproximados para este modelo específico):
    - "Motor": (ex: 2.0 Turbo, 1.0 Flex, etc.)
    - "Potência": (ex: 150 cv, 252 hp, etc.)
    - "Transmissão": (ex: Automática 8 marchas, Manual 5 marchas, etc.)
    - "Combustível": (ex: Gasolina, Flex, Elétrico, Diesel, etc.)
    - "Aceleração 0-100 km/h": (ex: 6.2s, 11.5s, etc.)
    - "Consumo Médio": (ex: 10.5 km/l, etc.)
    
    Retorne APENAS o JSON válido com estas chaves exatas. Não inclua markdown, não inclua blocos de código ou explicações extras.
    """
    try:
        content = _execute_groq_completion(prompt, max_tokens=250, response_format={"type": "json_object"})
        # Valida se é um JSON válido
        json.loads(content.strip())
        return content.strip()
    except Exception as e:
        print(f"Erro ao obter ficha técnica por IA: {e}")
        fallback = {
            "Motor": "Não informado",
            "Potência": "Não informado",
            "Transmissão": "Não informado",
            "Combustível": "Não informado",
            "Aceleração 0-100 km/h": "Não informado",
            "Consumo Médio": "Não informado"
        }
        return json.dumps(fallback)