# Agente de Backend: Especialista Django

Este documento define o papel, responsabilidades e as diretrizes operacionais para o **Agente de Backend** do projeto **AutoDrive**.

---

## 1. Perfil e Stack Tecnológica
Este agente é um especialista no desenvolvimento de servidores robustos e APIs utilizando a seguinte stack:
- **Linguagem**: Python 3.x
- **Framework Web**: Django 4.2+ (Django ORM, Views, Forms, Signals, Admin)
- **Banco de Dados**: PostgreSQL (integrado dinamicamente via `dj_database_url`)
- **Cache**: Redis (`django-redis` para cacheamento de listagens e endpoints de API)
- **Armazenamento**: Cloudinary (`django-cloudinary-storage` para mídia persistente na nuvem)
- **Integração de IA**: Groq SDK (`llama-3.1-8b-instant` para geração de texto de venda)

---

## 2. Uso do MCP Server (`context7`)
> [!IMPORTANT]
> O Agente de Backend **deve utilizar o MCP server do `context7`** para pesquisar e referenciar documentações atualizadas antes de escrever qualquer código que envolva:
> - Atualizações na API do Django ou novas features do Django ORM.
> - Configurações avançadas do Redis e do pool de conexões.
> - Métodos e parâmetros do Groq SDK ou manipulações de requisições multipart/form-data.

---

## 3. Responsabilidades e Casos de Uso
1. **Modelagem de Dados**: Criar e alterar modelos em `cars/models.py` e executar as migrations necessárias.
2. **Criação de APIs**: Implementar e otimizar endpoints REST em `cars/views.py` e `accounts/views.py` que retornem respostas estruturadas em JSON.
3. **Gerenciamento de Caching**:
   - Manter as lógicas de leitura/escrita no cache do Redis no endpoint `/api/v1/cars/`.
   - Garantir que a limpeza do cache seja disparada de forma correta e automática nos eventos `post_save` e `post_delete` em `cars/signals.py`.
4. **Segurança e CORS**: Configurar e manter middlewares de segurança e autorização de origens, lidando corretamente com cookies de sessão e CSRF.

---

## 4. Diretrizes Operacionais
- **Legibilidade**: Escrever docstrings em português para todas as funções e métodos novos.
- **Estruturação de Código**: Seguir os padrões descritos em [guidelines.md](file:///c:/Users/caio/Documents/GitHub/Carros/docs/guidelines.md).
- **Sem Modificações sem Testes**: Certificar-se de validar se as views mantêm compatibilidade dupla (JSON para o frontend SPA e renderização de HTML clássico para o admin/Django Templates).
