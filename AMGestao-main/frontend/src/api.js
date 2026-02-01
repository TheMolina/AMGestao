// Read API base from Vite env (VITE_API_BASE_URL). Change frontend/.env to point to different API base without code changes.
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function getSetores(){
  const r = await fetch(`${BASE}/setores`)
  return r.ok ? r.json() : []
}

export async function createSetor(nome){
  return fetch(`${BASE}/setores`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nome})})
}

export async function getProdutos(){
  const r = await fetch(`${BASE}/produtos`)
  return r.ok ? r.json() : []
}

export async function createProduto(prod){
  return fetch(`${BASE}/produtos`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(prod)})
}

export async function findByCodigo(codigo){
  const r = await fetch(`${BASE}/produtos/codigo/${encodeURIComponent(codigo)}`)
  return r.ok ? r.json() : null
}

export async function registrarSaida(saida){
  return fetch(`${BASE}/saidas`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(saida)})
}

export async function getRelatorio(){
  const r = await fetch(`${BASE}/relatorio/lucro`)
  return r.ok ? r.json() : null
}
