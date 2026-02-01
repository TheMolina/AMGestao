# Comércio Simples

[![Backend CI](https://github.com/OWNER/REPO/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/backend-tests.yml)

Projeto simples para gestão de um pequeno comércio: cadastro de setores, produtos, registro de vendas (saídas) via código de barras e relatório de lucro.

Estrutura:
- backend/ — FastAPI + SQLModel (SQLite)
- frontend/ — Vite + React

## Como rodar (rápido)

Backend:
1. cd backend
2. python -m venv .venv
3. . .venv\Scripts\Activate.ps1  (Windows PowerShell)
4. pip install -r requirements.txt
5. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
6. Abra http://127.0.0.1:8000/docs para documentação automática

Frontend:
1. cd frontend
2. npm install
3. Customize variables in `frontend/.env` if needed (e.g., `VITE_API_BASE_URL` to point to your backend)
4. npm run dev (Vite will pick `HOST` and `PORT` from `frontend/.env`)
5. Abra http://localhost:5173 (ou na porta definida em `.env`)

Notes: To change the API the frontend calls, edit `frontend/.env` and set `VITE_API_BASE_URL` — no code changes required.

Notas:
- O leitor de código de barras funciona como teclado: escaneie o código e pressione Enter no campo de vendas da UI.
- O banco SQLite é `backend/database.db` criado automaticamente.
## Como usar com leitor de código de barras

Leitores de código de barras normalmente funcionam como um teclado:

1. Certifique-se de que o campo de entrada de código de barras na tela de Vendas/ Caixa esteja com foco (ele tem `autoFocus` no frontend). Muitos scanners enviam automaticamente o `Enter` após o código, então a venda será registrada automaticamente.
2. Se o seu scanner não enviar `Enter`, pressione `Enter` manualmente após a leitura.
3. Para testes rápidos com `ui.html` (arquivo único), abra a página e clique no campo de leitura antes de escanear.
4. Se preferir rodar em container usando Docker Compose: `docker-compose up --build` abrirá o frontend em `http://localhost:5173` (map para nginx na porta 5173) e backend em `http://localhost:8000`.

## CI (GitHub Actions)

Este repositório inclui um workflow para o backend em `.github/workflows/backend-tests.yml` que é executado em `push` e `pull_request` na branch `main`.

O workflow faz:
- Instalação das dependências do backend usando `backend/requirements.txt`.
- Execução de `pytest` com `pytest-cov` para gerar relatório de cobertura (XML + HTML) em `backend/reports`.
- Upload dos artefatos de cobertura para inspeção no run do Actions (attachments).

Se os testes falharem o job do Actions falha (status vermelho) — garantindo que commits que quebrem os testes não sejam mesclados sem correção.

Para rodar localmente o mesmo comando usado pelo workflow:

```powershell
cd backend
pytest --cov=app --cov-report=xml:reports/coverage.xml --cov-report=html:reports/htmlcov -q
```

Abra `backend/reports/htmlcov/index.html` para ver o relatório HTML detalhado.

