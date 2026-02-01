from sqlmodel import select
from .models import Setor, Produto, Saida
from .database import engine, get_session
from sqlmodel import Session
from typing import List

# Setor

def create_setor(nome: str) -> Setor:
    with Session(engine) as session:
        s = Setor(nome=nome)
        session.add(s)
        session.commit()
        session.refresh(s)
        return s

def list_setores() -> List[Setor]:
    with Session(engine) as session:
        return session.exec(select(Setor)).all()

# Produtos

def create_produto(prod_data: dict) -> Produto:
    with Session(engine) as session:
        p = Produto(**prod_data)
        session.add(p)
        session.commit()
        session.refresh(p)
        return p

def list_produtos() -> List[Produto]:
    with Session(engine) as session:
        return session.exec(select(Produto)).all()

def get_produto_by_codigo(codigo: str):
    with Session(engine) as session:
        return session.exec(select(Produto).where(Produto.codigo_barras == codigo)).first()

def get_produto(produto_id: int):
    with Session(engine) as session:
        return session.get(Produto, produto_id)

# Saida / Vendas

def registrar_saida(produto_id: int, quantidade: int):
    with Session(engine) as session:
        produto = session.get(Produto, produto_id)
        if not produto:
            # produto não encontrado
            raise LookupError('Produto não encontrado')
        if quantidade <= 0:
            raise ValueError('Quantidade inválida')
        if produto.quantidade < quantidade:
            raise ValueError('Estoque insuficiente')
        produto.quantidade -= quantidade
        saida = Saida(produto_id=produto.id, quantidade=quantidade, preco_compra=produto.preco_compra, preco_venda=produto.preco_venda)
        session.add(saida)
        session.add(produto)
        session.commit()
        session.refresh(saida)
        return saida

# Relatório

def relatorio_lucro() -> dict:
    from sqlalchemy import func
    with Session(engine) as session:
        rows = session.exec(select(Saida)).all()
        total_vendido = sum(r.preco_venda * r.quantidade for r in rows)
        total_gasto = sum(r.preco_compra * r.quantidade for r in rows)
        total_lucro = sum((r.preco_venda - r.preco_compra) * r.quantidade for r in rows)

        itens = {}
        for r in rows:
            p = session.get(Produto, r.produto_id)
            key = p.nome if p else f'Produto {r.produto_id}'
            if key not in itens:
                itens[key] = { 'produto': key, 'quantidade_vendida': 0, 'gasto':0.0, 'vendido':0.0, 'lucro_gerado':0.0 }
            itens[key]['quantidade_vendida'] += r.quantidade
            itens[key]['gasto'] += r.preco_compra * r.quantidade
            itens[key]['vendido'] += r.preco_venda * r.quantidade
            itens[key]['lucro_gerado'] += (r.preco_venda - r.preco_compra) * r.quantidade

        return {
            'total_vendido': total_vendido,
            'total_gasto': total_gasto,
            'total_lucro': total_lucro,
            'itens': list(itens.values())
        }
