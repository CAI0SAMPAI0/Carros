# GEMINI.md - Diretrizes para Assistentes de IA (AutoDrive)

Este arquivo fornece contexto e diretrizes essenciais para agentes de Inteligência Artificial (como o Gemini) trabalhando no projeto **AutoDrive (Carros)**.

---

## 1. Estrutura do Workspace e Arquitetura do Projeto

O projeto é estruturado em dois diretórios principais:

- **`/backend`**: Projeto Django 4.2+ (Python).
  - `/app`: Configurações centrais do Django (`settings.py`, `middleware.py`, `urls.py`).
  - `/cars`: Gerenciamento de veículos e inventário (`models.py`, `views.py`, `signals.py`, `forms.py`).
  - `/accounts`: Autenticação e views de usuários (`views.py`).
  - `/openai_api`: Integração com Groq para geração de bio (`client.py`) e script de seed com IA (`cars_ai.py`).
  - `requirements.txt`: Dependências Python.

- **`/frontend`**: Aplicação multipáginas (MPA) configurada com Vite e TypeScript (sem framework como React ou Vue).
  - `/src`: Arquivos de lógica em TypeScript (`api.ts`, `auth.ts`, `cars.ts`, `car_detail.ts`, `new_car.ts`, `toast.ts`) e o arquivo de estilos global `index.css`.
  - `/cars`, `/car_detail`, `/login`, `/register`, `/new_car`: Diretórios das páginas, cada um contendo seu arquivo `index.html` estático que importa o respectivo script TS compilado.

---

## 2. Orientações Importantes para Implementação

Ao realizar implementações de código:

### 2.1 Backend (Django)
- Sempre verifique a existência de relacionamentos e restrições. A relação `Car.brand` é protegida com `models.PROTECT`.
- **Validação e Tratamento de Cache**: O endpoint `/api/v1/cars/` (`cars_api_list`) utiliza caching do Redis (`CACHES` padrão no settings). Modificações no modelo `Car` devem invalidar o cache. Certifique-se de que os signals em `backend/cars/signals.py` permaneçam funcionais e não sejam removidos ou quebrados.
- Ao criar novos endpoints de API REST, use `@csrf_exempt` se forem consumidos pelo frontend SPA, e decodifique o JSON manualmente de `request.body`.

### 2.2 Frontend (Vite + TypeScript)
- **CSS Vanilla**: O projeto utiliza CSS puro para estilização. As cores e fontes são centralizadas em variáveis CSS no [index.css](file:///c:/Users/caio/Documents/GitHub/Carros/frontend/src/index.css) e `base.html`. Não instale ou utilize TailwindCSS a menos que explicitamente solicitado.
- **Autenticação**: Ao fazer chamadas HTTP para o backend, utilize a função utilitária `apiFetch` (em `src/api.ts`) que insere automaticamente o token armazenado em `localStorage` (`auth_token`).

---

## 3. Diretrizes de Execução de Comandos no Ambiente

> [!WARNING]
> **Aviso de Execução de Comandos**: O terminal PowerShell local pode apresentar o erro `DriveNotFoundException` (Não existe uma unidade com o nome 'Microsoft.PowerShell.Core\FileSystem') ao tentar iniciar executáveis externos (como `git` ou `cmd.exe`).
>
> Para mitigar este problema:
> - **Priorize as ferramentas internas do agente** (`list_dir`, `view_file`, `write_to_file`, `replace_file_content`, `grep_search`) para navegar, ler, pesquisar e editar arquivos. Estas ferramentas rodam de forma nativa e não dependem do console PowerShell.
> - Ao rodar comandos essenciais de teste ou build, tente usar cmdlets nativos do PowerShell ou passe caminhos absolutos explícitos.
