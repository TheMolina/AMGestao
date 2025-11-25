Project: Gestão de Comércio (FastAPI + React)

Structure:
- backend/app: API (FastAPI) with SQLModel (SQLite)
- frontend: Vite + React (simple UI with barcode reader support)

Run backend:
  cd backend
  python -m venv .venv
  source .venv/bin/activate   # Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000

Run frontend:
  cd frontend
  npm install
  npm run dev

API docs: http://localhost:8000/docs
