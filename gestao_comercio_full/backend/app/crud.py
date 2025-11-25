from sqlmodel import select
from .models import Setor, Produto, Saida
from sqlmodel import Session
from datetime import datetime
from typing import Optional

def create_setor(session: Session, nome: str):
    setor = Setor(nome=nome)
    session.add(setor)
    session.commit()
    session.refresh(setor)
    return setor

def list_setores(session: Session):
    return session.exec(select(Setor)).all()

def create_produto(session: Session, **data):
    produto = Produto(**data)
    session.add(produto)
    session.commit()
    session.refresh(produto)
    return produto

def get_produto_by_id(session: Session, produto_id: int):
    return session.get(Produto, produto_id)

def get_produto_by_codigo(session: Session, codigo: str):
    statement = select(Produto).where(Produto.codigo_barras == codigo)
    return session.exec(statement).first()

def update_produto(session: Session, produto: Produto, **fields):
    for k, v in fields.items():
        setattr(produto, k, v)
    session.add(produto)
    session.commit()
    session.refresh(produto)
    return produto

def create_saida(session: Session, produto: Produto, quantidade: int, codigo_barras: Optional[str] = None):
    if produto.quantidade < quantidade:
        raise ValueError("Estoque insuficiente")
    produto.quantidade -= quantidade
    session.add(produto)
    saida = Saida(produto_id=produto.id, quantidade=quantidade, codigo_barras=codigo_barras)
    session.add(saida)
    session.commit()
    session.refresh(saida)
    return saida

def relatorio_lucro(session: Session, since: Optional[datetime] = None, until: Optional[datetime] = None):
    stmt = select(Saida, Produto).join(Produto, Saida.produto_id == Produto.id)
    if since:
        stmt = stmt.where(Saida.data >= since)
    if until:
        stmt = stmt.where(Saida.data <= until)
    results = session.exec(stmt).all()
    total_vendido = 0.0
    total_lucro = 0.0
    itens_map = {}
    for saida, produto in results:
        valor_vendido = produto.preco_venda * saida.quantidade
        lucro = (produto.preco_venda - produto.preco_compra) * saida.quantidade
        total_vendido += valor_vendido
        total_lucro += lucro
        key = produto.id
        if key not in itens_map:
            itens_map[key] = {"produto": produto.nome, "quantidade_vendida": 0, "lucro_gerado": 0.0}
        itens_map[key]["quantidade_vendida"] += saida.quantidade
        itens_map[key]["lucro_gerado"] += lucro
    itens = list(itens_map.values())
    return {
        "total_vendido": total_vendido,
        "total_lucro": total_lucro,
        "itens": itens
    }
