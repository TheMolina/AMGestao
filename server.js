const http = require('http');
const url = require('url');

// Database em memória
const data = {
  setores: [
    { id: 1, nome: 'Eletrônicos' },
    { id: 2, nome: 'Alimentos' },
    { id: 3, nome: 'Vestuário' }
  ],
  produtos: [
    { id: 1, nome: 'Notebook', setor_id: 1, preco_compra: 2000, preco_venda: 3000, quantidade: 5, codigo_barras: '123456' },
    { id: 2, nome: 'Teclado', setor_id: 1, preco_compra: 100, preco_venda: 150, quantidade: 20, codigo_barras: '123457' },
    { id: 3, nome: 'Arroz', setor_id: 2, preco_compra: 3, preco_venda: 5, quantidade: 100, codigo_barras: '123458' },
    { id: 4, nome: 'Camiseta', setor_id: 3, preco_compra: 20, preco_venda: 50, quantidade: 50, codigo_barras: '123459' }
  ],
  saidas: [],
  nextSetor: 4,
  nextProduto: 5
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // GET /setores
  if (pathname === '/setores' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(data.setores));
    return;
  }

  // POST /setores
  if (pathname === '/setores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { nome } = JSON.parse(body);
        const newSetor = { id: data.nextSetor++, nome };
        data.setores.push(newSetor);
        res.writeHead(200);
        res.end(JSON.stringify(newSetor));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Erro ao criar setor' }));
      }
    });
    return;
  }

  // GET /produtos
  if (pathname === '/produtos' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(data.produtos));
    return;
  }

  // POST /produtos
  if (pathname === '/produtos' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { nome, setor_id, preco_compra, preco_venda, quantidade, codigo_barras } = JSON.parse(body);
        
        if (codigo_barras && data.produtos.find(p => p.codigo_barras === codigo_barras)) {
          res.writeHead(400);
          res.end(JSON.stringify({ detail: 'Código de barras já cadastrado' }));
          return;
        }

        const newProduto = {
          id: data.nextProduto++,
          nome,
          setor_id: setor_id || null,
          preco_compra: parseFloat(preco_compra),
          preco_venda: parseFloat(preco_venda),
          quantidade: parseInt(quantidade),
          codigo_barras: codigo_barras || null
        };
        data.produtos.push(newProduto);
        res.writeHead(200);
        res.end(JSON.stringify(newProduto));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Erro ao criar produto' }));
      }
    });
    return;
  }

  // GET /produtos/:id
  if (pathname.match(/^\/produtos\/\d+$/) && req.method === 'GET') {
    const id = parseInt(pathname.split('/')[2]);
    const produto = data.produtos.find(p => p.id === id);
    if (produto) {
      res.writeHead(200);
      res.end(JSON.stringify(produto));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ detail: 'Produto não encontrado' }));
    }
    return;
  }

  // GET /produtos/codigo/:codigo
  if (pathname.match(/^\/produtos\/codigo\//) && req.method === 'GET') {
    const codigo = pathname.split('/produtos/codigo/')[1];
    const produto = data.produtos.find(p => p.codigo_barras === codigo);
    if (produto) {
      res.writeHead(200);
      res.end(JSON.stringify(produto));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ detail: 'Produto não encontrado' }));
    }
    return;
  }

  // POST /saidas
  if (pathname === '/saidas' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { produto_id, quantidade, codigo_barras } = JSON.parse(body);
        const produto = data.produtos.find(p => p.id === produto_id);
        
        if (!produto) {
          res.writeHead(404);
          res.end(JSON.stringify({ detail: 'Produto não encontrado' }));
          return;
        }

        if (produto.quantidade < quantidade) {
          res.writeHead(400);
          res.end(JSON.stringify({ detail: 'Quantidade insuficiente em estoque' }));
          return;
        }

        produto.quantidade -= quantidade;
        const saida = {
          id: data.saidas.length + 1,
          produto_id,
          quantidade,
          data: new Date().toISOString(),
          codigo_barras: codigo_barras || null
        };
        data.saidas.push(saida);
        
        res.writeHead(200);
        res.end(JSON.stringify(saida));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ detail: 'Erro ao registrar saída' }));
      }
    });
    return;
  }

  // GET /relatorio/lucro
  if (pathname === '/relatorio/lucro' && req.method === 'GET') {
    const totalLucro = data.saidas.reduce((sum, saida) => {
      const produto = data.produtos.find(p => p.id === saida.produto_id);
      if (produto) {
        const lucroUnitario = produto.preco_venda - produto.preco_compra;
        return sum + (lucroUnitario * saida.quantidade);
      }
      return sum;
    }, 0);

    res.writeHead(200);
    res.end(JSON.stringify({ total_lucro: totalLucro }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ detail: 'Rota não encontrada' }));
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
  console.log(`📝 Documentação: http://localhost:${PORT}/docs`);
  console.log('\n📊 Dados iniciais carregados:');
  console.log(`   - Setores: ${data.setores.length}`);
  console.log(`   - Produtos: ${data.produtos.length}`);
});
