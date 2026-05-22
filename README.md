# Prontuário Eletrônico de Enfermagem — Pessoas Trans

Projeto acadêmico de desenvolvimento de um sistema de prontuário eletrônico voltado ao cuidado integral de pessoas trans, contemplando anamnese, exame físico e acompanhamento multiprofissional.

---

## Estrutura do repositório

```
/frontend   → Interface HTML/CSS/JS
/backend    → API (a definir)
/db         → Scripts SQL e migrations
```

---

## Como rodar localmente

> Em breve.

---

## Banco de dados

Copie o arquivo de variáveis de ambiente e preencha com suas credenciais locais:

```bash
cp .env.example .env
```

Para criar as tabelas, execute o script inicial:

```bash
psql -U seu_usuario -d seu_banco -f db/prontuario_trans.sql
```

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
