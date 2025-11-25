from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import init_db, get_session
from . import crud, models, schemas
from typing import Optional
from datetime import datetime

app = FastAPI(title="API Gestão Comércio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.post('/setores')
def criar_setor(setor: schemas.SetorCreate, session: Session = Depends(get_session)):
    return crud.create_setor(session, setor.nome)

@app.get('/setores')
def listar_setores(session: Session = Depends(get_session)):
    return crud.list_setores(session)

@app.post('/produtos')
def criar_produto(produto: schemas.ProdutoCreate, session: Session = Depends(get_session)):
    data = produto.dict()
    codigo = data.get('codigo_barras')
    if codigo:
        exists = crud.get_produto_by_codigo(session, codigo)
        if exists:
            raise HTTPException(status_code=400, detail='Código de barras já cadastrado')
    return crud.create_produto(session, **data)

@app.get('/produtos')
def listar_produtos(session: Session = Depends(get_session)):
    return session.exec(select(models.Produto)).all()

@app.get('/produtos/{produto_id}')
def obter_produto(produto_id: int, session: Session = Depends(get_session)):
    p = crud.get_produto_by_id(session, produto_id)
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return p

@app.get('/produtos/codigo/{codigo}')
def produto_por_codigo(codigo: str, session: Session = Depends(get_session)):
    p = crud.get_produto_by_codigo(session, codigo)
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    return p

@app.put('/produtos/{produto_id}')
def editar_produto(produto_id: int, produto: schemas.ProdutoCreate, session: Session = Depends(get_session)):
    p = crud.get_produto_by_id(session, produto_id)
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    data = produto.dict()
    return crud.update_produto(session, p, **data)

@app.delete('/produtos/{produto_id}')
def deletar_produto(produto_id: int, session: Session = Depends(get_session)):
    p = crud.get_produto_by_id(session, produto_id)
    if not p:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    session.delete(p)
    session.commit()
    return {"ok": True}

@app.post('/saidas')
def registrar_saida(saida: schemas.SaidaCreate, session: Session = Depends(get_session)):
    produto = None
    if saida.produto_id:
        produto = crud.get_produto_by_id(session, saida.produto_id)
    elif saida.codigo_barras:
        produto = crud.get_produto_by_codigo(session, saida.codigo_barras)
    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    try:
        s = crud.create_saida(session, produto, saida.quantidade, saida.codigo_barras)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return s

@app.get('/saidas')
def listar_saidas(desde: Optional[str] = None, ate: Optional[str] = None, session: Session = Depends(get_session)):
    stmt = select(models.Saida)
    if desde:
        since_dt = datetime.fromisoformat(desde)
        stmt = stmt.where(models.Saida.data >= since_dt)
    if ate:
        until_dt = datetime.fromisoformat(ate)
        stmt = stmt.where(models.Saida.data <= until_dt)
    return session.exec(stmt).all()

@app.get('/relatorio/lucro')
def relatorio(desde: Optional[str] = None, ate: Optional[str] = None, session: Session = Depends(get_session)):
    since_dt = datetime.fromisoformat(desde) if desde else None
    until_dt = datetime.fromisoformat(ate) if ate else None
    return crud.relatorio_lucro(session, since_dt, until_dt)
