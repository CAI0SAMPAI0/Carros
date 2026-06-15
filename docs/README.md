# Documentação do Projeto - AutoDrive (Carros)

Bem-vindo à documentação oficial do projeto **AutoDrive (Carros)**. Este diretório contém todos os guidelines, padrões e documentações técnicas necessárias para compreender, desenvolver e manter a aplicação.

---

## Índice da Documentação

### 1. [Arquitetura do Sistema (architecture.md)](file:///c:/Users/caio/Documents/GitHub/Carros/docs/architecture.md)
Descreve a estrutura do sistema, a divisão de responsabilidades entre o Backend e Frontend, a modelagem do banco de dados (Django ORM), o funcionamento do sistema de Caching (Redis) e as integrações externas.

### 2. [Diretrizes de Desenvolvimento (guidelines.md)](file:///c:/Users/caio/Documents/GitHub/Carros/docs/guidelines.md)
Detalha as convenções de código adotadas no projeto, incluindo o design system (variáveis CSS, tipografia Barlow/Bebas Neue), padrões de nomenclatura para Python/TypeScript, melhores práticas para o uso de views baseadas em classe (CBV) no Django e comunicação com as APIs REST.

---

## Resumo Tecnológico do Projeto

- **Backend**: Python 3.x, Django 4.2+, Django ORM, `django-redis` (Cache), `django-cloudinary-storage` (Armazenamento de Imagens), Groq SDK (Integração com Llama 3.1 8B).
- **Frontend SPA/MPA**: Vite, Vanilla TypeScript, HTML5 Semântico, CSS3 (Custom Variables).
- **Frontend SSR**: Django Template Language, Vanilla CSS integrado.
- **Banco de Dados**: PostgreSQL (Railway) / SQLite (Desenvolvimento opcional).
