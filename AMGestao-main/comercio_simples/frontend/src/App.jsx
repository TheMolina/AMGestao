import React, { useEffect, useState, useRef } from 'react'
import { getSetores, createSetor, getProdutos, createProduto, findByCodigo, registrarSaida, getRelatorio } from './api'

export default function App(){
  const [setores, setSetores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [msg, setMsg] = useState('')

  const [novoSetor, setNovoSetor] = useState('')
  const [produtoForm, setProdutoForm] = useState({nome:'', setor_id:'', preco_compra:'', preco_venda:'', quantidade:0, codigo_barras:''})
  const [saidaForm, setSaidaForm] = useState({produto_id:'', quantidade:1})
  const [relatorio, setRelatorio] = useState(null)
  const barcodeRef = useRef()

  async function loadAll(){
    setSetores(await getSetores())
    setProdutos(await getProdutos())
  }

  useEffect(()=>{ loadAll() }, [])

  function flash(text, ok=true){ setMsg(text); setTimeout(()=>setMsg(''), 3000) }

  async function handleAddSetor(e){ e.preventDefault(); if(!novoSetor) return; const r = await createSetor(novoSetor); if(r.ok){ flash('Setor criado'); setNovoSetor(''); loadAll() } else flash('Erro ao criar setor', false) }

  async function handleAddProduto(e){ e.preventDefault(); const body = { ...produtoForm, setor_id: produtoForm.setor_id ? Number(produtoForm.setor_id) : undefined, preco_compra:Number(produtoForm.preco_compra||0), preco_venda:Number(produtoForm.preco_venda||0), quantidade:Number(produtoForm.quantidade||0) }; const r = await createProduto(body); if(r.ok){ flash('Produto criado'); setProdutoForm({nome:'', setor_id:'', preco_compra:'', preco_venda:'', quantidade:0, codigo_barras:''}); loadAll() } else { const j=await r.json().catch(()=>({detail:'Erro'})); flash(j.detail||'Erro', false) } }

  async function handleSearchCodigo(e){
    e.preventDefault();
    const codigo = e.target.barcode.value.trim();
    if(!codigo) return;
    const p = await findByCodigo(codigo);
    if(!p){ flash('Produto não encontrado', false); return }
    // registrar venda com quantidade 1 por padrão
    const r = await registrarSaida({produto_id: p.id, quantidade:1});
    if(r.ok){ flash('Venda registrada'); setTimeout(()=>loadAll(), 300) } else { const j=await r.json().catch(()=>({detail:'Erro'})); flash(j.detail||'Erro', false) }
    e.target.barcode.value = ''
  }

  async function handleRegistrarSaida(e){ e.preventDefault(); const r = await registrarSaida({ produto_id: Number(saidaForm.produto_id), quantidade: Number(saidaForm.quantidade) }); if(r.ok){ flash('Saída registrada'); setSaidaForm({produto_id:'', quantidade:1}); loadAll() } else { const j=await r.json().catch(()=>({detail:'Erro'})); flash(j.detail||'Erro', false) } }

  async function handleRelatorio(){ const r = await getRelatorio(); if(r) setRelatorio(r) }

  return (
    <div className="app container">
      <header className="header">
        <h1>Comércio Simples</h1>
        <p className="muted">API: <code>http://localhost:8000</code></p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Setores</h2>
          <form onSubmit={handleAddSetor} className="form-inline">
            <input value={novoSetor} onChange={e=>setNovoSetor(e.target.value)} placeholder="Nome do setor" />
            <button type="submit">Adicionar</button>
          </form>
          <ul className="list">{setores.map(s=> <li key={s.id}>{s.nome}</li>)}{setores.length===0 && <li className="muted">Nenhum setor</li>}</ul>
        </section>

        <section className="card">
          <h2>Produtos</h2>
          <form onSubmit={handleAddProduto} className="form">
            <input placeholder="Nome" value={produtoForm.nome} onChange={e=>setProdutoForm({...produtoForm, nome:e.target.value})} required />
            <select value={produtoForm.setor_id} onChange={e=>setProdutoForm({...produtoForm, setor_id:e.target.value})}>
              <option value="">— Selecionar setor —</option>
              {setores.map(s=> <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <input placeholder="Preço compra" value={produtoForm.preco_compra} onChange={e=>setProdutoForm({...produtoForm, preco_compra:e.target.value})} required />
            <input placeholder="Preço venda" value={produtoForm.preco_venda} onChange={e=>setProdutoForm({...produtoForm, preco_venda:e.target.value})} required />
            <input type="number" min="0" placeholder="Quantidade" value={produtoForm.quantidade} onChange={e=>setProdutoForm({...produtoForm, quantidade:e.target.value})} />
            <input placeholder="Código de barras" value={produtoForm.codigo_barras} onChange={e=>setProdutoForm({...produtoForm, codigo_barras:e.target.value})} />
            <button type="submit">Criar produto</button>
          </form>

          <table className="table"><thead><tr><th>Nome</th><th>Setor</th><th>Qtd</th><th>Venda</th></tr></thead>
            <tbody>{produtos.map(p=> (
              <tr key={p.id}><td>{p.nome}</td><td>{p.setor_id ?? '-'}</td><td>{p.quantidade}</td><td>R$ {Number(p.preco_venda).toFixed(2)}</td></tr>
            ))}{produtos.length===0 && <tr><td colSpan={4} className="muted">Nenhum produto</td></tr>}</tbody>
          </table>
        </section>

        <section className="card">
          <h2>Vendas / Caixa</h2>
          <form onSubmit={handleSearchCodigo} className="form-inline">
            <input name="barcode" ref={barcodeRef} placeholder="Escaneie código de barras e pressione Enter" autoFocus style={{flex:1}} />
            <button type="submit">OK</button>
          </form>

          <h3>Registrar manualmente</h3>
          <form onSubmit={handleRegistrarSaida} className="form-inline">
            <select value={saidaForm.produto_id} onChange={e=>setSaidaForm({...saidaForm, produto_id:e.target.value})}>
              <option value="">— Selecionar produto —</option>
              {produtos.map(p=> <option key={p.id} value={p.id}>{p.nome} (qtd: {p.quantidade})</option>)}
            </select>
            <input type="number" min="1" value={saidaForm.quantidade} onChange={e=>setSaidaForm({...saidaForm, quantidade:e.target.value})} />
            <button type="submit">Registrar</button>
          </form>

          <h3>Relatório</h3>
          <button onClick={handleRelatorio}>Gerar relatório</button>
          {relatorio && (
            <div className="report">
              <p><strong>Total vendido:</strong> R$ {Number(relatorio.total_vendido).toFixed(2)}</p>
              <p><strong>Total gasto:</strong> R$ {Number(relatorio.total_gasto).toFixed(2)}</p>
              <p><strong>Total lucro:</strong> R$ {Number(relatorio.total_lucro).toFixed(2)}</p>
              <ul>{relatorio.itens.map((it,i)=> <li key={i}>{it.produto}: {it.quantidade_vendida} — R$ {Number(it.lucro_gerado).toFixed(2)}</li>)}</ul>
            </div>
          )}
        </section>
      </div>

      <div className="msg">{msg}</div>
      <footer className="footer muted">Sistema simples para gerenciar vendas e lucros.</footer>
    </div>
  )
}
