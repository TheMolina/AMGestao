# Backend — Comércio Simples

Requisitos: Python 3.11+ (recomendo 3.11/3.12)

Instalação rápida:

1. Abra terminal e vá para `backend`
2. Crie e ative venv:
   - Windows: `python -m venv .venv` && `.\.venv\Scripts\Activate.ps1`
3. Instale dependências: `pip install -r requirements.txt`
4. Rode o servidor: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Você pode usar o script prático `run_server.ps1`, que carrega variáveis do arquivo `.env` e inicia o Uvicorn automaticamente:

- Crie/edite `backend/.env` com as variáveis `HOST` e `PORT` (ex.: `HOST=0.0.0.0` / `PORT=8000`).
- Execute em PowerShell: `.
un_server.ps1`

API docs: http://127.0.0.1:8000/docs

Endpoints principais:
- POST /setores
- GET /setores
- POST /produtos
- GET /produtos
- GET /produtos/codigo/{codigo}
- POST /saidas
- GET /relatorio/lucro

Banco: SQLite (arquivo `database.db`) — criado automaticamente.

## Cobertura de testes (coverage)

Este projeto usa `pytest` + `pytest-cov` para gerar relatórios de cobertura.

- Instale dependências (se ainda não):

  ```powershell
  . .venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```

- Executar testes com relatório de cobertura (linha e arquivo lcov + HTML):

  ```powershell
  # gera cobertura e um relatório XML/HTML
  pytest --cov=app --cov-report=xml:reports/coverage.xml --cov-report=html:reports/htmlcov -q
  ```

- Interpretação:
  - `reports/htmlcov/index.html` contém o relatório visual com arquivos e linhas não cobertas (abra no navegador).
  - `reports/coverage.xml` / `coverage.xml` pode ser usado por serviços de CI/coverage (ex.: Codecov).
  - Você pode falhar o pipeline se a cobertura total estiver abaixo de um limite usando `coverage report --fail-under=80`.

Dica: os testes já existem em `backend/tests`. Para rodar somente os testes sem cobertura use `pytest -q`.
