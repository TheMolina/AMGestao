from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List

class Setor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    produtos: List["Produto"] = Relationship(back_populates="setor")

class Produto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    setor_id: Optional[int] = Field(default=None, foreign_key="setor.id")
    preco_compra: float
    preco_venda: float
    quantidade: int = 0
    codigo_barras: Optional[str] = Field(index=True, unique=True, default=None)
    setor: Optional[Setor] = Relationship(back_populates="produtos")

class Saida(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    quantidade: int
    data: datetime = Field(default_factory=datetime.utcnow)
    codigo_barras: Optional[str] = None
