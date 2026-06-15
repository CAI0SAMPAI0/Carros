# Diretrizes de Desenvolvimento (Guidelines) - AutoDrive

Este documento serve como guia de referência técnica para garantir a consistência, legibilidade e manutenibilidade do código do **AutoDrive (Carros)**.

---

## 1. Padrões de Design e CSS (Aesthetics)

O projeto adota um tema escuro (Dark Mode) esportivo e moderno, utilizando variáveis nativas do CSS (`:root`) definidas no [index.css](file:///c:/Users/caio/Documents/GitHub/Carros/frontend/src/index.css) e no template `base.html`.

### 1.1 Paleta de Cores
- **Fundo Principal**: `--black` (`#0a0a0b`)
- **Fundo Escuro Secundário**: `--dark` (`#111114`)
- **Fundo de Painéis/Cards**: `--panel` (`#18181c`)
- **Bordas e Divisórias**: `--border` (`#2a2a30`)
- **Textos Secundários/Muted**: `--muted` (`#3a3a42`) e `--text-dim` (`#6b6b7a`)
- **Texto Principal**: `--text` (`#c8c8d4`)
- **Texto em Destaque**: `--text-hi` (`#eeeef5`)
- **Cor de Destaque / Esportiva (Vermelho)**: `--red` (`#e52222`) e `--red-dim` (`#7a1010`)
- **Tons Auxiliares**: `--chrome` (`#a8a8b8`) e `--gold` (`#c9a84c`)

### 1.2 Tipografia (Google Fonts)
- **Barlow**: Fonte principal para textos, descrições e inputs.
- **Barlow Condensed**: Usada para botões, rótulos (labels), navegação e textos secundários em maiúsculo.
- **Bebas Neue**: Utilizada exclusivamente para logotipos, títulos principais (`h1`, `h2`) e preços em destaque.

---

## 2. Diretrizes de Backend (Python & Django)

### 2.1 Convenções de Nomenclatura
- **Classes**: `CamelCase` (ex: `CarsListView`, `CarModelForm`).
- **Funções e Variáveis**: `snake_case` (ex: `cars_api_list`, `clear_cache_before_change`).
- **Arquivos e Diretórios**: `snake_case` (ex: `cars_ai.py`).

### 2.2 Uso de Views no Django
- **Páginas HTML**: Preferir Class-Based Views (CBVs) como `ListView`, `CreateView`, `DetailView`, `UpdateView`, `DeleteView` para operações padrões de CRUD.
- **Endpoints de API**: Usar Function-Based Views (FBVs) com checagem explícita de métodos HTTP (`request.method`) e respostas estruturadas em `JsonResponse`.
- **CORS e CSRF**:
  - Para endpoints consumidos pelo frontend SPA (Vite), utilizar o decorador `@csrf_exempt` e assegurar que a autenticação seja validada por token ou headers específicos.
  - Endpoints de autenticação devem ler dados decodificados de JSON via `json.loads(request.body)`.

---

## 3. Diretrizes de Frontend (TypeScript)

### 3.1 Padrões de Código
- **Tipagem Estrita**: Evitar o tipo `any` sempre que possível. Criar interfaces e tipos adequados para representar dados da API (como dados de veículos e marcas).
- **Manipulação de DOM**: Garantir checagem de nulo ao obter elementos com `document.getElementById` para evitar erros em tempo de execução.

### 3.2 Comunicação de API
- Toda chamada externa deve passar pela função `apiFetch` (em `src/api.ts`).
- Não armazenar credenciais ou tokens em texto plano no código fonte. Utilizar o `localStorage` com a chave `auth_token` e recuperar dinamicamente.
- O tratamento de erros de rede ou de validação retornados pela API (como status 400 ou 500) deve ser capturado e exibido ao usuário usando a biblioteca `toastify-js`.
- Ao obter status de resposta `401 Unauthorized` da API, remover imediatamente o `auth_token` do `localStorage` e redirecionar para a tela de login.
