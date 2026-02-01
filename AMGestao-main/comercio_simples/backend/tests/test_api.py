def test_product_crud_and_unique_barcode(client):
    # create setor
    r = client.post('/setores', json={'nome': 'Bebidas'})
    assert r.status_code == 200
    setor = r.json()

    # create product
    prod = {
        'nome': 'Cerveja',
        'setor_id': setor['id'],
        'preco_compra': 2.0,
        'preco_venda': 3.5,
        'quantidade': 10,
        'codigo_barras': '12345'
    }
    r = client.post('/produtos', json=prod)
    assert r.status_code == 200
    p = r.json()
    assert p['codigo_barras'] == '12345'

    # duplicate barcode should fail
    r = client.post('/produtos', json=prod)
    assert r.status_code == 400


def test_saida_reduces_stock_and_prevents_insufficient(client):
    r = client.post('/setores', json={'nome': 'Alimentos'})
    s = r.json()

    r = client.post('/produtos', json={'nome': 'Arroz', 'setor_id': s['id'], 'preco_compra': 5.0, 'preco_venda': 7.0, 'quantidade': 5, 'codigo_barras': '222'})
    assert r.status_code == 200
    p = r.json()
    assert p['quantidade'] == 5

    # valid sale reduces stock
    r = client.post('/saidas', json={'produto_id': p['id'], 'quantidade': 3})
    assert r.status_code == 200

    r = client.get('/produtos')
    produtos = r.json()
    updated = next(x for x in produtos if x['id'] == p['id'])
    assert updated['quantidade'] == 2

    # insufficient stock should be rejected
    r = client.post('/saidas', json={'produto_id': p['id'], 'quantidade': 3})
    assert r.status_code == 400


def test_relatorio_lucro_calculation(client):
    r = client.post('/setores', json={'nome': 'Doces'})
    s = r.json()

    r = client.post('/produtos', json={'nome': 'Bombom', 'setor_id': s['id'], 'preco_compra': 1.0, 'preco_venda': 2.5, 'quantidade': 10, 'codigo_barras': '333'})
    assert r.status_code == 200
    p = r.json()

    # register sales
    client.post('/saidas', json={'produto_id': p['id'], 'quantidade': 3})
    client.post('/saidas', json={'produto_id': p['id'], 'quantidade': 2})

    r = client.get('/relatorio/lucro')
    assert r.status_code == 200
    report = r.json()

    total_qty = 5
    assert abs(report['total_vendido'] - (p['preco_venda'] * total_qty)) < 1e-6
    assert abs(report['total_gasto'] - (p['preco_compra'] * total_qty)) < 1e-6
    assert abs(report['total_lucro'] - ((p['preco_venda'] - p['preco_compra']) * total_qty)) < 1e-6

    assert len(report['itens']) == 1
    item = report['itens'][0]
    assert item['produto'] == p['nome']
    assert item['quantidade_vendida'] == total_qty
