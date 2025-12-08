#!/usr/bin/env python3
"""
Simple REST API server using only Python standard library
No external dependencies required!
"""
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import sys

PORT = 8000

# In-memory database
data = {
    "setores": [
        {"id": 1, "nome": "Eletrônicos"},
        {"id": 2, "nome": "Alimentos"},
        {"id": 3, "nome": "Vestuário"}
    ],
    "produtos": [
        {"id": 1, "nome": "Notebook", "setor_id": 1, "preco_compra": 2000, "preco_venda": 3000, "quantidade": 5, "codigo_barras": "123456"},
        {"id": 2, "nome": "Teclado", "setor_id": 1, "preco_compra": 100, "preco_venda": 150, "quantidade": 20, "codigo_barras": "123457"},
        {"id": 3, "nome": "Arroz", "setor_id": 2, "preco_compra": 3, "preco_venda": 5, "quantidade": 100, "codigo_barras": "123458"},
        {"id": 4, "nome": "Camiseta", "setor_id": 3, "preco_compra": 20, "preco_venda": 50, "quantidade": 50, "codigo_barras": "123459"}
    ],
    "saidas": [],
    "next_setor": 4,
    "next_produto": 5
}

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_cors_headers()
        
        parsed = urlparse(self.path)
        pathname = parsed.path
        
        # GET /setores
        if pathname == '/setores':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data["setores"]).encode())
            return
        
        # GET /produtos
        if pathname == '/produtos':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data["produtos"]).encode())
            return
        
        # GET /produtos/:id
        if pathname.startswith('/produtos/') and pathname.count('/') == 2:
            try:
                produto_id = int(pathname.split('/')[2])
                produto = next((p for p in data["produtos"] if p["id"] == produto_id), None)
                if produto:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(produto).encode())
                else:
                    self.send_response(404)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.stringify({"detail": "Produto não encontrado"}).encode())
            except:
                self.send_response(400)
                self.end_headers()
            return
        
        # GET /produtos/codigo/:codigo
        if pathname.startswith('/produtos/codigo/'):
            codigo = pathname.split('/produtos/codigo/')[1]
            produto = next((p for p in data["produtos"] if p.get("codigo_barras") == codigo), None)
            if produto:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(produto).encode())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Produto não encontrado"}).encode())
            return
        
        # GET /relatorio/lucro
        if pathname == '/relatorio/lucro':
            total_lucro = 0
            for saida in data["saidas"]:
                produto = next((p for p in data["produtos"] if p["id"] == saida["produto_id"]), None)
                if produto:
                    lucro_unitario = produto["preco_venda"] - produto["preco_compra"]
                    total_lucro += lucro_unitario * saida["quantidade"]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"total_lucro": total_lucro}).encode())
            return
        
        # 404
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"detail": "Rota não encontrada"}).encode())

    def do_POST(self):
        self.send_cors_headers()
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode()
        
        parsed = urlparse(self.path)
        pathname = parsed.path
        
        try:
            payload = json.loads(body) if body else {}
        except:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": "JSON inválido"}).encode())
            return
        
        # POST /setores
        if pathname == '/setores':
            nome = payload.get('nome')
            if not nome:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Nome é obrigatório"}).encode())
                return
            
            novo_setor = {"id": data["next_setor"], "nome": nome}
            data["next_setor"] += 1
            data["setores"].append(novo_setor)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(novo_setor).encode())
            return
        
        # POST /produtos
        if pathname == '/produtos':
            nome = payload.get('nome')
            preco_compra = payload.get('preco_compra')
            preco_venda = payload.get('preco_venda')
            quantidade = payload.get('quantidade', 0)
            codigo_barras = payload.get('codigo_barras')
            setor_id = payload.get('setor_id')
            
            if not nome or preco_compra is None or preco_venda is None:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Dados incompletos"}).encode())
                return
            
            if codigo_barras and any(p.get('codigo_barras') == codigo_barras for p in data["produtos"]):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Código de barras já cadastrado"}).encode())
                return
            
            novo_produto = {
                "id": data["next_produto"],
                "nome": nome,
                "setor_id": setor_id,
                "preco_compra": float(preco_compra),
                "preco_venda": float(preco_venda),
                "quantidade": int(quantidade),
                "codigo_barras": codigo_barras
            }
            data["next_produto"] += 1
            data["produtos"].append(novo_produto)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(novo_produto).encode())
            return
        
        # POST /saidas
        if pathname == '/saidas':
            produto_id = payload.get('produto_id')
            quantidade = payload.get('quantidade')
            codigo_barras = payload.get('codigo_barras')
            
            if not produto_id or not quantidade:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Dados incompletos"}).encode())
                return
            
            produto = next((p for p in data["produtos"] if p["id"] == produto_id), None)
            if not produto:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Produto não encontrado"}).encode())
                return
            
            if produto["quantidade"] < quantidade:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Quantidade insuficiente em estoque"}).encode())
                return
            
            produto["quantidade"] -= quantidade
            nova_saida = {
                "id": len(data["saidas"]) + 1,
                "produto_id": produto_id,
                "quantidade": quantidade,
                "data": datetime.now().isoformat(),
                "codigo_barras": codigo_barras
            }
            data["saidas"].append(nova_saida)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(nova_saida).encode())
            return
        
        # 404
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"detail": "Rota não encontrada"}).encode())

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        # Custom logging
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    try:
        with socketserver.TCPServer(("", PORT), APIHandler) as httpd:
            print(f"✅ API Backend rodando em http://localhost:{PORT}")
            print(f"📊 Dados carregados:")
            print(f"   - Setores: {len(data['setores'])}")
            print(f"   - Produtos: {len(data['produtos'])}")
            print(f"\n⏳ Aguardando conexões... (Ctrl+C para parar)\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Servidor parado.")
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)
