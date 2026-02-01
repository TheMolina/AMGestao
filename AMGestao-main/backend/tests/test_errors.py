def test_busca_codigo_not_found(client):
    r = client.get('/produtos/codigo/naoexiste')
    assert r.status_code == 404


def test_negative_quantity_rejected(client):
    r = client.post('/setores', json={'nome': 'Teste'})
    s = r.json()
    r = client.post('/produtos', json={'nome': 'X', 'setor_id': s['id'], 'preco_compra': 1.0, 'preco_venda': 2.0, 'quantidade': 5, 'codigo_barras': '999'})
    p = r.json()

    # negative quantity should be rejected by validation (422)
    r = client.post('/saidas', json={'produto_id': p['id'], 'quantidade': -1})
    assert r.status_code == 422


def test_saida_produto_nao_existe_returns_404(client):
    r = client.post('/saidas', json={'produto_id': 9999, 'quantidade': 1})
    assert r.status_code == 404


def test_codigo_duplicado_returns_400_and_message(client):
    r = client.post('/setores', json={'nome': 'Test2'})
    s = r.json()
    prod = {'nome':'Dupe','setor_id':s['id'],'preco_compra':1.0,'preco_venda':2.0,'quantidade':1,'codigo_barras':'dup001'}
    r = client.post('/produtos', json=prod)
    assert r.status_code == 200
    r = client.post('/produtos', json=prod)
    assert r.status_code == 400
    assert 'Código de barras' in r.json().get('detail','')
