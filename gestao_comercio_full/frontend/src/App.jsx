import React, { useEffect, useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App(){
  const [setores, setSetores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState({nome:'', setor_id:'', preco_compra:'', preco_venda:'', quantidade:0, codigo_barras:''})
  const [vendaCodigo, setVendaCodigo] = useState('')
  const [vendaLista, setVendaLista] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const vendaInputRef = useRef(null)

  useEffect(()=>{ 
    fetchSetores()
    fetchProdutos()
  }, [])

  useEffect(()=>{ 
    if(vendaInputRef.current) vendaInputRef.current.focus() 
  }, [vendaInputRef])

  async function fetchSetores(){
    try {
      const r = await fetch(`${API}/setores`)
      if(r.ok) setSetores(await r.json())
      else console.error('Erro ao buscar setores')
    } catch(err) { 
      console.error('Erro ao buscar setores:', err)
    }
  }
  
  async function fetchProdutos(){
    try {
      const r = await fetch(`${API}/produtos`)
      if(r.ok) setProdutos(await r.json())
      else console.error('Erro ao buscar produtos')
    } catch(err) { 
      console.error('Erro ao buscar produtos:', err)
    }
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
      <h1>📦 Gestão de Comércio — Caixa Rápido</h1>

      {error && <div className="status-message" style={{background:'#fee', color:'#c00'}}>{error}</div>}

      <section>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>🏢 Setores</h2>
          <button onClick={criarSetor}>➕ Novo Setor</button>
        </div>
        <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
          {setores.length === 0 ? <p style={{color:'#999'}}>Nenhum setor cadastrado</p> : setores.map(s=> <div key={s.id} className="setor-box">{s.nome}</div>)}
        </div>
      </section>

      <section>
        <h2>📝 Cadastro de Produto</h2>
        <form onSubmit={criarProduto} style={{marginTop:12}}>
          <input required placeholder="Nome do produto" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} />
          <select value={form.setor_id} onChange={e=>setForm({...form, setor_id:e.target.value})}>
            <option value="">— Selecione um setor —</option>
            {setores.map(s=> <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <input required type="number" step="0.01" placeholder="Preço de compra (R$)" value={form.preco_compra} onChange={e=>setForm({...form, preco_compra:e.target.value})} />
          <input required type="number" step="0.01" placeholder="Preço de venda (R$)" value={form.preco_venda} onChange={e=>setForm({...form, preco_venda:e.target.value})} />
          <input required type="number" placeholder="Quantidade em estoque" value={form.quantidade} onChange={e=>setForm({...form, quantidade:e.target.value})} />
          <input type="text" placeholder="Código de barras (opcional)" value={form.codigo_barras} onChange={e=>setForm({...form, codigo_barras:e.target.value})} />
          <div style={{gridColumn:'1 / -1', marginTop:8}}>
            <button type="submit" style={{padding:'12px 24px', fontSize:'16px'}}>✅ Criar Produto</button>
          </div>
        </form>
      </section>

      <section>
        <h2>💰 Caixa / Vendas</h2>
        <div style={{marginTop:12}}>
          <input 
            ref={vendaInputRef} 
            placeholder="Passe o leitor de código de barras aqui (ou digite manualmente)" 
            value={vendaCodigo} 
            onChange={e=>setVendaCodigo(e.target.value)} 
            onKeyDown={handleVendaScan}
            style={{width:'100%', padding:12, fontSize:'16px'}}
          />
        </div>
        
        {vendaLista.length === 0 ? (
          <div style={{marginTop:16, textAlign:'center', color:'#999', padding:'24px'}}>
            <p>Nenhum produto adicionado à venda</p>
          </div>
        ) : (
          <div style={{marginTop:16}}>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style={{textAlign:'center'}}>Quantidade</th>
                  <th style={{textAlign:'right'}}>Preço Unit.</th>
                  <th style={{textAlign:'right'}}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {vendaLista.map(item=> (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td style={{textAlign:'center'}}>{item.quantidade}</td>
                    <td style={{textAlign:'right'}}>R$ {item.preco_venda.toFixed(2)}</td>
                    <td style={{textAlign:'right'}}>R$ {(item.preco_venda*item.quantidade).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>Total: R$ {vendaLista.reduce((sum, item) => sum + (item.preco_venda * item.quantidade), 0).toFixed(2)}</strong>
              <button onClick={finalizarVenda} style={{padding:'12px 24px', fontSize:'16px', background:'#28a745'}}>🛒 Finalizar Venda</button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2>📊 Relatório Rápido</h2>
        <div className="button-group">
          <button onClick={async ()=>{ 
            try {
              const r = await fetch(`${API}/relatorio/lucro`)
              const j = await r.json()
              alert('Lucro total: R$ '+j.total_lucro.toFixed(2))
            } catch(err) {
              alert('Erro ao calcular lucro')
            }
          }}>Calcular Lucro</button>
          <button onClick={() => alert('Recursos de relatório em desenvolvimento')}>Ver Histórico de Vendas</button>
        </div>
      </section>

      <section style={{background:'#e7f3ff', border:'1px solid #b3d9ff', marginTop:24}}>
        <h3 style={{marginTop:0}}>ℹ️ Status</h3>
        <p><strong>API:</strong> {API}</p>
        <p><strong>Setores cadastrados:</strong> {setores.length}</p>
        <p><strong>Produtos cadastrados:</strong> {produtos.length}</p>
      </section>
    </div>
  )
}
