<div align="center">
  <h1>🔗 Encurtei</h1>
  <p>Encurtador de links rápido, validado e preparado para deploy em produção com uma arquitetura mais econômica.</p>
</div>

---

## 📖 Contexto

O **Encurtei** nasceu como um estudo de arquitetura para um encurtador de links com foco em performance, baixa latência e resiliência. [Na primeira versão](https://github.com/DenisLindner/Encurtei-API), o projeto utilizava **Apache Cassandra** como banco principal, uma escolha muito forte para cenários de hyper-escala, alto volume de escrita e distribuição horizontal.

Nesta versão, a arquitetura foi redesenhada para um ambiente mais realista de produção com menor custo operacional. O Cassandra entrega muita escalabilidade, mas também aumenta a complexidade e o custo de deploy, principalmente quando a aplicação precisa sair do ambiente local e rodar em uma infraestrutura gerenciada ou VPS com recursos limitados.

Por esse motivo, esta versão substitui o Cassandra por **PostgreSQL com Prisma**, mantendo o **Redis** como suporte para geração atômica dos códigos curtos. O objetivo foi preservar uma base sólida, simples de manter e barata de hospedar, sem abandonar boas práticas de validação, segurança e conteinerização.

## ⚖️ Trade-off: Cassandra vs PostgreSQL

A escolha pelo PostgreSQL foi uma decisão pragmática de produção.

Na primeira versão, o Cassandra fazia sentido como exercício de arquitetura distribuída e como solução para escrita massiva em escala industrial. Porém, para um deploy real, ele costuma exigir mais memória, mais configuração, mais cuidado operacional e, em muitos provedores, um custo maior para manter uma instância estável.

Com o PostgreSQL, o projeto ganha:

- Deploy mais barato e simples.
- Menor complexidade operacional.
- Melhor compatibilidade com provedores comuns.
- Integração direta com Prisma.
- Consultas simples e eficientes pelo `shortCode`.

O trade-off é que o PostgreSQL não oferece a mesma escalabilidade horizontal nativa do Cassandra para workloads extremos. Ainda assim, para uma versão de produção com foco em custo-benefício, manutenção e previsibilidade, ele é uma escolha mais adequada.

## 🎯 Objetivo

Fornecer uma API de encurtamento de URLs com uma arquitetura limpa, validada e pronta para rodar em containers. O projeto também demonstra uma evolução técnica importante: sair de uma arquitetura desenhada para hyper-escala com Cassandra e adaptar a solução para uma infraestrutura de produção mais acessível, usando PostgreSQL, Prisma, Redis e NestJS.

## 🛠 Stack e Bibliotecas

- **Backend:** Node.js, [NestJS](https://nestjs.com/), TypeScript
- **Banco de dados relacional:** [PostgreSQL](https://www.postgresql.org/)
- **ORM / Database Client:** [Prisma](https://www.prisma.io/)
- **Redis:** contador atômico para geração dos shortCodes
- **Infraestrutura:** Docker, Docker Compose
- **Segurança e validação:** `helmet`, `class-validator`, `class-transformer`, `@nestjs/throttler`
- **Agendamentos:** `@nestjs/schedule`

## 🧱 Arquitetura

A API possui um fluxo simples e direto:

1. O cliente envia uma URL para ser encurtada.
2. A aplicação valida o payload com DTOs e `ValidationPipe`.
3. Quando o usuário informa um caminho customizado, a API verifica se ele já existe no PostgreSQL.
4. Quando o caminho não é informado, o Redis incrementa um contador atômico.
5. O contador é convertido para um shortCode em base 64 customizada.
6. O link é persistido no PostgreSQL.
7. A consulta por `shortCode` retorna a URL original em JSON.

Os links possuem expiração configurada no banco para aproximadamente 3 anos, e a aplicação possui uma rotina agendada para remover links expirados.

## 📡 Endpoints

### 1. Criar novo link encurtado

`POST /`

Cria um novo link encurtado. O endpoint possui Rate Limiting de **4 requisições por minuto por IP** para reduzir abuso na criação de links.

**Body com shortCode automático:**

```json
{
  "originalUrl": "https://www.linkedin.com/in/denis-lindner/"
}
```

**Body com caminho customizado:**

```json
{
  "originalUrl": "https://www.linkedin.com/in/denis-lindner/",
  "path": "denis-linkedin"
}
```

**Retorno exemplo:**

```json
{
  "shortUrl": "denis-linkedin"
}
```

### 2. Buscar o link original

`GET /:code`

Busca o link original pelo `shortCode` e retorna a URL em JSON. O redirecionamento pode ser feito pela interface cliente.

**Retorno exemplo:**

```json
{
  "url": "https://www.linkedin.com/in/denis-lindner/"
}
```

## 🔐 Segurança

A aplicação possui proteções importantes para uma API pública:

- `helmet` para headers HTTP mais seguros.
- `ValidationPipe` global com whitelist e bloqueio de campos não permitidos.
- Validação de URL com `class-validator`.
- Validação de caminhos customizados, permitindo apenas letras, números, `.` e `-`.
- Rate Limiting global.
- Limite mais restrito no endpoint de criação.
- Redis protegido por senha no ambiente Docker.

## 🚀 Como Rodar

Este projeto utiliza Docker Compose para subir a API, PostgreSQL e Redis.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) instalado
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados

### Passo a passo

1. **Clone o repositório:**

```bash
git clone https://github.com/DenisLindner/Encurtei-API-Prod.git
cd Encurtei-API-Prod
```

2. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

3. **Suba os containers:**

```bash
docker compose up -d --build
```

4. **Acesse a API:**

```bash
http://localhost:3333
```

## 🧪 Rodando localmente sem Docker

Caso prefira rodar a aplicação fora do container, mantenha PostgreSQL e Redis ativos e execute:

```bash
npm install
npx prisma generate
npm run start:dev
```

## 📁 Estrutura Principal

```bash
src/
  app.module.ts
  main.ts
  links/
    links.controller.ts
    links.service.ts
    dto/create-link.dto.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  redis/
    redis.module.ts

prisma/
  schema.prisma
  migrations/
```

## 📬 Contato

<div align="center">
  <a href="https://github.com/DenisLindner/" target="_blank"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" target="_blank"></a>
  <a href="https://www.linkedin.com/in/denis-lindner/" target="_blank"><img src="https://img.shields.io/badge/-LinkedIn-%230077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank"></a>
  <a href="mailto:lindnerdenis19@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" target="_blank"></a>
  <br/>
  Criado e mantido por <strong>Denis Lindner</strong>.
</div>
