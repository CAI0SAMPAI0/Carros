# Agentes de IA - Time de Desenvolvimento AutoDrive

Este diretório contém as definições, especialidades e instruções para os agentes de Inteligência Artificial responsáveis pelo desenvolvimento e manutenção do projeto **AutoDrive (Carros)**.

---

## Índice de Agentes

### 1. [Agente de Backend Django (backend.md)](file:///c:/Users/caio/Documents/GitHub/Carros/agents/backend.md)
- **Especialidade**: Python 3.x, Django 4.2+, Django ORM, PostgreSQL, Redis, Groq/Llama SDK e Cloudinary.
- **MCP Server**: Utiliza o servidor MCP do `context7` para obter documentação oficial atualizada sobre bibliotecas Python e padrões do ecossistema Django.
- **Quando usar**: Para modificações em modelos de banco de dados, criação de APIs REST, rotas, middleware, sinalizadores (Signals), tarefas de cache e integrações de terceiros.

### 2. [Agente de Frontend (frontend.md)](file:///c:/Users/caio/Documents/GitHub/Carros/agents/frontend.md)
- **Especialidade**: Vite, Vanilla TypeScript, HTML5 Semântico, Django Template Language (SSR) e CSS3 (Custom Variables). É também treinado para utilizar TailwindCSS caso uma migração seja solicitada no futuro.
- **MCP Server**: Utiliza o servidor MCP do `context7` para acessar a documentação atualizada de empacotadores (Vite), TypeScript e padrões CSS modernos.
- **Quando usar**: Para ajustes de design e layout, manipulação do DOM via TypeScript, chamadas de API do lado do cliente, formulários interativos, validação de dados no frontend e criação de templates de servidor do Django.

### 3. [Agente de Testes e QA (tester.md)](file:///c:/Users/caio/Documents/GitHub/Carros/agents/tester.md)
- **Especialidade**: Automação de testes funcionais, de integração e validação visual de layout.
- **MCP Server**: Utiliza o servidor MCP do `playwright` para interagir com o navegador, verificar fluxos de usuário (login, cadastro, detalhe de carros, busca) e garantir que o design está correto e sem quebras visuais.
- **Quando usar**: Após a conclusão de qualquer tarefa de desenvolvimento para rodar testes automatizados e validar se a aplicação se comporta de acordo com o esperado no navegador.
