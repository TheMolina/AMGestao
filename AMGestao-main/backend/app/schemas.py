from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class SetorCreate(BaseModel):
    nome: str

class SetorRead(BaseModel):
    id: int
    nome: str

class ProdutoCreate(BaseModel):
    nome: str
    setor_id: Optional[int]
    preco_compra: float
    preco_venda: float
    quantidade: int = 0
    codigo_barras: Optional[str]

class ProdutoRead(BaseModel):
    id: int
    nome: str
    setor_id: Optional[int]
    preco_compra: float
    preco_venda: float
    quantidade: int
    codigo_barras: Optional[str]

from pydantic import conint

class SaidaCreate(BaseModel):
    produto_id: int
    quantidade: conint(gt=0)

class SaidaRead(BaseModel):
    id: int
    produto_id: int
    quantidade: int
    preco_compra: float
    preco_venda: float
    created_at: datetime

class RelatorioItem(BaseModel):
    produto: str
    quantidade_vendida: int
    gasto: float
    vendido: float
    lucro_gerado: float

class RelatorioResumo(BaseModel):
    total_vendido: float
    total_gasto: float
    total_lucro: float
    itens: List[RelatorioItem]
