# Prontuário Eletrônico de Enfermagem — Pessoas Trans

Projeto acadêmico para um sistema de prontuário eletrônico focado no cuidado integral de pessoas trans. O sistema reúne anamnese, histórico clínico, investigação sexual e reprodutiva, uso de medicações, avaliação emocional e acompanhamento multiprofissional.

---

## Estrutura do repositório

```
/frontend   → Interface HTML/CSS/JS adicional
/backend    → API Express + front-end público
/db         → Scripts SQL e migrações
```

---

## Pré-requisitos

- Node.js 18+ / 20+
- npm
- PostgreSQL (ou outro banco compatível com Prisma via `DATABASE_URL`)
- Conta/serviço Supabase para armazenamento e realtime (opcional, conforme uso de `SUPABASE_URL`)

---

## Configuração local

1. Abra o terminal na pasta `backend`:

```bash
cd backend
```

2. Instale dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na pasta `backend` com as variáveis abaixo:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
JWT_SECRET="uma_chave_secreta_segura"
JWT_EXPIRES_IN="7d"
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_KEY="sua_service_role_key"
```

> O `DATABASE_URL` é obrigatório para o Prisma. `JWT_EXPIRES_IN` é opcional e usa `7d` como padrão.

4. Crie as tabelas do banco usando o script SQL:

```bash
psql -U seu_usuario -d seu_banco -f ../db/prontuario_trans.sql
```

5. Gere o cliente Prisma e inicie o servidor:

```bash
npm start
```

---

## Executando o projeto

Após iniciar o backend, o servidor estará disponível em:

- `http://localhost:3000`

O front-end público está servido em `backend/public`.

---

## Observações

- O backend usa `Express` e serve arquivos estáticos em `backend/public`.
- As rotas de prontuários (`/prontuarios`) são protegidas por autenticação JWT.
- O fluxo de upload de fotos e geração de PDFs também roda pelo backend.

---

## Equipe

- Rafael Lima
- Alexandre Fonseca
- Arley Delgado
- Deryk Rodrigues
- Guilherme Tacchi
- João Pedro Moraes
- Arthur Jacques
- Lucas de Souza

---

## Status

🚧 Em desenvolvimento.
