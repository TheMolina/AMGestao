import React, { useEffect, useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App(){
  const [setores, setSetores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState({nome:'', setor_id:'', preco_compra:'', preco_venda:'', quantidade:0, codigo_barras:''})
  const [vendaCodigo, setVendaCodigo] = useState('')
  const [vendaLista, setVendaLista] = useState([])
  const vendaInputRef = useRef(null)

  useEffect(()=>{ fetchSetores(); fetchProdutos(); }, [])

  useEffect(()=>{ if(vendaInputRef.current) vendaInputRef.current.focus() }, [vendaInputRef])

  async function fetchSetores(){
    const r = await fetch(`${API}/setores`)
    setSetores(await r.json())
  }
  async function fetchProdutos(){
    const r = await fetch(`${API}/produtos`)
    setProdutos(await r.json())
  }

  async function criarSetor(){
    const nome = prompt('Nome do setor:')
    if(!nome) return
    await fetch(`${API}/setores`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({nome})})
    fetchSetores()
  }

  async function criarProduto(e){
    e.preventDefault()
    const payload = {...form, setor_id: form.setor_id ? Number(form.setor_id) : null, preco_compra: Number(form.preco_compra), preco_venda: Number(form.preco_venda), quantidade: Number(form.quantidade)}
    const r = await fetch(`${API}/produtos`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
    if(r.ok){ setForm({nome:'', setor_id:'', preco_compra:'', preco_venda:'', quantidade:0, codigo_barras:''}); fetchProdutos(); alert('Produto criado') }
    else{ const j = await r.json(); alert(j.detail || 'Erro') }
  }

  async function scanVendaByCodigo(codigo){
    try{
      const r = await fetch(`${API}/produtos/codigo/${codigo}`)
      if(!r.ok) { alert('Produto não encontrado'); return }
      const produto = await r.json()
      setVendaLista(prev=>{
        const found = prev.find(p=>p.id===produto.id)
        if(found){ return prev.map(p=>p.id===produto.id?{...p, quantidade:p.quantidade+1}:p) }
        return [...prev, {...produto, quantidade:1}]
      })
    }catch(err){ console.error(err); alert('Erro ao buscar produto') }
  }

  async function handleVendaScan(e){
    if(e.key === 'Enter'){
      const codigo = vendaCodigo.trim()
      if(!codigo) return
      await scanVendaByCodigo(codigo)
      setVendaCodigo('')
    }
  }

  async function finalizarVenda(){
    for(const item of vendaLista){
      const payload = {produto_id: item.id, codigo_barras: item.codigo_barras, quantidade: item.quantidade}
      const r = await fetch(`${API}/saidas`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
      if(!r.ok){ const j = await r.json(); alert('Erro: '+(j.detail||'')); return }
    }
    alert('Venda registrada')
    setVendaLista([])
    fetchProdutos()
    if(vendaInputRef.current) vendaInputRef.current.focus()
  }

  return (
    <div className="container">
      <h1 style={{fontSize:24, fontWeight:700}}>Gestão de Comércio — Caixa rápido</h1>

      <section style={{marginTop:16}}>
        <h2 style={{fontWeight:600}}>Setores <button onClick={criarSetor} style={{marginLeft:8}}>+ novo</button></h2>
        <div style={{display:'flex', gap:8, marginTop:8}}>{setores.map(s=> <div key={s.id} style={{padding:6, border:'1px solid #ddd', borderRadius:6}}>{s.nome}</div>)}</div>
      </section>

      <section style={{marginTop:16}}>
        <h2 style={{fontWeight:600}}>Cadastro de Produto</h2>
        <form onSubmit={criarProduto} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:8}}>
          <input required placeholder="Nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} />
          <select value={form.setor_id} onChange={e=>setForm({...form, setor_id:e.target.value})}>
            <option value="">— setor —</option>
            {setores.map(s=> <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <input required placeholder="Preço compra" value={form.preco_compra} onChange={e=>setForm({...form, preco_compra:e.target.value})} />
          <input required placeholder="Preço venda" value={form.preco_venda} onChange={e=>setForm({...form, preco_venda:e.target.value})} />
          <input required placeholder="Quantidade" type="number" value={form.quantidade} onChange={e=>setForm({...form, quantidade:e.target.value})} />
          <input placeholder="Código de barras" value={form.codigo_barras} onChange={e=>setForm({...form, codigo_barras:e.target.value})} />
          <div style={{gridColumn:'1 / -1', marginTop:8}}>
            <button type="submit">Criar Produto</button>
          </div>
        </form>
      </section>

      <section style={{marginTop:24}}>
        <h2 style={{fontWeight:600}}>Caixa / Vendas</h2>
        <div style={{marginTop:8}}>
          <input ref={vendaInputRef} placeholder="Passe o leitor de código aqui (ou digite)" value={vendaCodigo} onChange={e=>setVendaCodigo(e.target.value)} onKeyDown={handleVendaScan} style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6}} />
        </div>
        <div style={{marginTop:12}}>
          <table>
            <thead><tr><th>Produto</th><th>Quantidade</th><th>Preço</th></tr></thead>
            <tbody>
              {vendaLista.map(item=> (
                <tr key={item.id}><td>{item.nome}</td><td>{item.quantidade}</td><td>{(item.preco_venda*item.quantidade).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:8}}>
            <button onClick={finalizarVenda} style={{padding:'8px 12px'}}>Finalizar Venda</button>
          </div>
        </div>
      </section>

      <section style={{marginTop:24}}>
        <h2 style={{fontWeight:600}}>Relatório rápido</h2>
        <div style={{marginTop:8}}>
          <button onClick={async ()=>{ const r = await fetch(`${API}/relatorio/lucro`); const j = await r.json(); alert('Lucro total: R$ '+j.total_lucro.toFixed(2)) }} >Calcular agora</button>
        </div>
      </section>
    </div>
  )
}
