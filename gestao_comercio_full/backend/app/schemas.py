from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SetorCreate(BaseModel):
    nome: str

class ProdutoCreate(BaseModel):
    nome: str
    setor_id: Optional[int]
    preco_compra: float
    preco_venda: float
    quantidade: int = 0
    codigo_barras: Optional[str]

class SaidaCreate(BaseModel):
    produto_id: Optional[int]
    codigo_barras: Optional[str]
    quantidade: int

class RelatorioItem(BaseModel):
    produto: str
    quantidade_vendida: int
    lucro_gerado: float

class RelatorioResponse(BaseModel):
    total_vendido: float
    total_lucro: float
    itens: List[RelatorioItem]
