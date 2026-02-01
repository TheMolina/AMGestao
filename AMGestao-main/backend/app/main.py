from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from . import crud, models
from .database import create_db_and_tables
from .schemas import *

app = FastAPI(title="Comércio Simples API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Setores
@app.post('/setores', response_model=SetorRead)
def create_setor(s: SetorCreate):
    return crud.create_setor(s.nome)

@app.get('/setores', response_model=list[SetorRead])
def list_setores():
    return crud.list_setores()

# Produtos
@app.post('/produtos', response_model=ProdutoRead)
def create_produto(p: ProdutoCreate):
    # codigo de barras unico verificação
    if p.codigo_barras:
        existing = crud.get_produto_by_codigo(p.codigo_barras)
        if existing:
            raise HTTPException(status_code=400, detail='Código de barras já existe')
    prod = crud.create_produto(p.dict())
    return prod

@app.get('/produtos', response_model=list[ProdutoRead])
def list_produtos():
    return crud.list_produtos()

@app.get('/produtos/codigo/{codigo}', response_model=ProdutoRead)
def buscar_por_codigo(codigo: str):
    prod = crud.get_produto_by_codigo(codigo)
    if not prod:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return prod

# Saidas
@app.post('/saidas', response_model=SaidaRead)
def registrar_saida(s: SaidaCreate):
    try:
        saida = crud.registrar_saida(s.produto_id, s.quantidade)
        return saida
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Relatorio
@app.get('/relatorio/lucro', response_model=RelatorioResumo)
def relatorio():
    return crud.relatorio_lucro()
