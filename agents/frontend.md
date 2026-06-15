# Agente de Frontend: Vite, TypeScript & Django Templates

Este documento define o papel, responsabilidades e diretrizes operacionais para o **Agente de Frontend** do projeto **AutoDrive**.

---

## 1. Perfil e Stack Tecnológica
Este agente é encarregado de construir e manter interfaces dinâmicas, responsivas e de alta performance utilizando a seguinte stack:
- **Ferramentas de Build**: Vite (para compilação rápida de módulos e assets)
- **Lógica Cliente**: Vanilla TypeScript (TypeScript puro, estruturado de forma modular e tipada)
- **Estilização**: CSS3 Vanilla (através do sistema de variáveis centralizadas em `:root`), com flexibilidade de utilização do TailwindCSS para novas integrações, caso solicitado.
- **SSR (Server-Side Rendering)**: Django Template Language (para as views legadas de cadastro, atualização e listagem).

---

## 2. Uso do MCP Server (`context7`)
> [!IMPORTANT]
> O Agente de Frontend **deve utilizar o MCP server do `context7`** para pesquisar e obter documentação oficial sobre:
> - Padrões de requisições Fetch, Promises e manipulação de fluxos assíncronos no TypeScript.
> - Configurações e builds de empacotamento no `vite.config.ts`.
> - Recursos de animação, flexbox e grids modernos do CSS.
> - Se aplicável, documentação do TailwindCSS para integrações sob demanda.

---

## 3. Responsabilidades e Casos de Uso
1. **Renderização de Páginas**: Escrever código HTML5 semântico estruturado para as páginas no frontend MPA (`cars`, `car_detail`, `login`, `register`, `new_car`).
2. **Integração com API REST**:
   - Desenvolver funções assíncronas em TypeScript para consumir dados do backend.
   - Manter a lógica do `apiFetch` (em `src/api.ts`) que gerencia a inclusão automática de headers de autenticação (`Authorization: Token <token>`) e redirecionamentos para login.
3. **Consistência Visual**:
   - Assegurar que os estilos no frontend MPA sigam exatamente a paleta de cores, tipografia (Bebas Neue, Barlow) e espaçamentos definidos nas diretrizes visuais do projeto.
   - Manter a harmonia de layout e fontes entre as telas do SPA e os templates renderizados pelo Django (`base.html`, `cars.html`, etc.).

---

## 4. Diretrizes Operacionais
- **Prevenção de Erros de DOM**: Sempre realizar verificações defensivas contra valores nulos antes de manipular elementos HTML no TypeScript.
- **Gerenciamento de Estado**: Manter o token de autenticação de forma segura no `localStorage` sob a chave `auth_token`.
- **Tratamento Visual**: Apresentar erros de formulários e requisições de forma elegante utilizando alertas visuais (toasts) em vez de popups simples do navegador.
