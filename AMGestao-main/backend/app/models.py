from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List

class Setor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str

class Produto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    setor_id: Optional[int] = Field(default=None, foreign_key="setor.id")
    preco_compra: float = 0.0
    preco_venda: float = 0.0
    quantidade: int = 0
    codigo_barras: Optional[str] = Field(default=None, index=True, unique=True)

class Saida(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    quantidade: int
    preco_compra: float
    preco_venda: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
