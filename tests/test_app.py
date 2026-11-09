import tempfile
import unittest
from pathlib import Path

import models.db as db

# Cria a pasta temporária e o caminho do banco de testes.
_pasta_temporaria = Path(tempfile.mkdtemp())
_pasta_temporaria.mkdir(parents=True, exist_ok=True)

db.CAMINHO_BANCO = _pasta_temporaria / "teste_loja.db"

from app import app


class TestAplicacao(unittest.TestCase):

    def setUp(self):
        app.config["TESTING"] = True
        self.cliente = app.test_client()

    def test_pagina_inicial(self):
        resposta = self.cliente.get("/")

        self.assertEqual(resposta.status_code, 200)
        self.assertIn(
            b"Bellumi",
            resposta.data
        )

    def test_painel_administrativo(self):
        resposta = self.cliente.get("/admin")

        self.assertEqual(resposta.status_code, 200)

    def test_painel_produtos(self):
        resposta = self.cliente.get("/admin/produtos")

        self.assertEqual(resposta.status_code, 200)

    def test_api_produtos(self):
        resposta = self.cliente.get("/api/produtos")

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.content_type, "application/json")
        self.assertIsInstance(resposta.get_json(), list)

    def test_api_listar_pedidos(self):
        resposta = self.cliente.get("/api/admin/pedidos")

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.content_type, "application/json")
        self.assertIsInstance(resposta.get_json(), list)

    def test_atualizar_produto_com_preco_invalido(self):
        resposta = self.cliente.put(
            "/api/admin/produtos/1",
            json={"preco": -5}
        )

        self.assertEqual(resposta.status_code, 400)
        self.assertIn("erro", resposta.get_json())

    def test_atualizar_pedido_com_status_invalido(self):
        resposta = self.cliente.put(
            "/api/admin/pedidos/1/status",
            json={"status": "Status inventado"}
        )

        self.assertEqual(resposta.status_code, 400)
        self.assertIn("erro", resposta.get_json())

    def test_cadastrar_pedido_com_sucesso(self):
        resposta = self.cliente.post(
            "/api/pedidos",
            json={
                "nome": "Cliente Teste",
                "endereco": "Rua de Teste, 123",
                "pagamento": "Pix",
                "itens": [
                    {
                        "nome": "Chocolate",
                        "quantidade": 2
                    }
                ]
            }
        )

        self.assertEqual(resposta.status_code, 201)

        dados = resposta.get_json()
        self.assertIn("pedido_id", dados)
        self.assertIsInstance(dados["pedido_id"], int)

if __name__ == "__main__":
    unittest.main()