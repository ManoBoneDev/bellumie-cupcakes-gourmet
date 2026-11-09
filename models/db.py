
from pathlib import Path
import sqlite3

# Caminho da pasta principal do projeto.
PASTA_PROJETO = Path(__file__).resolve().parent.parent

# Caminho do banco de dados SQLite.
CAMINHO_BANCO = PASTA_PROJETO / "loja.db"


def conectar_banco():
    """Abre uma conexão com o banco de dados da loja."""
    conexao = sqlite3.connect(CAMINHO_BANCO)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao


def criar_tabelas():
    """Cria as tabelas, atualiza a estrutura e cadastra produtos iniciais."""
    with conectar_banco() as conexao:

        conexao.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_cliente TEXT NOT NULL,
                endereco TEXT NOT NULL,
                forma_pagamento TEXT NOT NULL,
                total REAL NOT NULL,
                data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conexao.execute("""
            CREATE TABLE IF NOT EXISTS itens_pedido (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pedido_id INTEGER NOT NULL,
                produto TEXT NOT NULL,
                quantidade INTEGER NOT NULL,
                preco_unitario REAL NOT NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
            )
        """)

        conexao.execute("""
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                descricao TEXT NOT NULL,
                preco REAL NOT NULL,
                imagem TEXT NOT NULL,
                ativo INTEGER NOT NULL DEFAULT 1
            )
        """)

        # Verifica as colunas existentes na tabela de produtos.
        colunas_produtos = {
            coluna["name"]
            for coluna in conexao.execute(
                "PRAGMA table_info(produtos)"
            ).fetchall()
        }

        # Adiciona novas colunas aos produtos sem apagar os dados existentes.
        novas_colunas = {
            "descricao_detalhada": """
                ALTER TABLE produtos
                ADD COLUMN descricao_detalhada TEXT NOT NULL DEFAULT ''
            """,
            "ingredientes": """
                ALTER TABLE produtos
                ADD COLUMN ingredientes TEXT NOT NULL DEFAULT ''
            """,
            "alergenicos": """
                ALTER TABLE produtos
                ADD COLUMN alergenicos TEXT NOT NULL DEFAULT ''
            """
        }

        for coluna, comando in novas_colunas.items():
            if coluna not in colunas_produtos:
                conexao.execute(comando)

        # Verifica as colunas existentes na tabela de pedidos.
        colunas_pedidos = {
            coluna["name"]
            for coluna in conexao.execute(
                "PRAGMA table_info(pedidos)"
            ).fetchall()
        }

        # Adiciona o status aos pedidos antigos.
        if "status" not in colunas_pedidos:
            conexao.execute("""
                ALTER TABLE pedidos
                ADD COLUMN status TEXT NOT NULL DEFAULT 'Recebido'
            """)

        # Adiciona as informações do checkout.
        novas_colunas_pedidos = {
            "telefone": """
                ALTER TABLE pedidos
                ADD COLUMN telefone TEXT NOT NULL DEFAULT ''
            """,
            "tipo_recebimento": """
                ALTER TABLE pedidos
                ADD COLUMN tipo_recebimento TEXT NOT NULL DEFAULT 'Entrega'
            """,
            "troco_para": """
                ALTER TABLE pedidos
                ADD COLUMN troco_para REAL
            """,
            "observacoes": """
                ALTER TABLE pedidos
                ADD COLUMN observacoes TEXT NOT NULL DEFAULT ''
            """,
            "taxa_entrega": """
                ALTER TABLE pedidos
                ADD COLUMN taxa_entrega REAL NOT NULL DEFAULT 0
            """
        }

        for coluna, comando in novas_colunas_pedidos.items():
            if coluna not in colunas_pedidos:
                conexao.execute(comando)

        # Cria a numeração comercial independente do ID interno.
        if "numero_pedido" not in colunas_pedidos:
            conexao.execute("""
                ALTER TABLE pedidos
                ADD COLUMN numero_pedido INTEGER
            """)

        # Preenche a numeração dos pedidos antigos que ainda não possuem número.
        pedidos_sem_numero = conexao.execute("""
            SELECT id
            FROM pedidos
            WHERE numero_pedido IS NULL
            ORDER BY id ASC
        """).fetchall()

        proximo_numero = conexao.execute("""
            SELECT COALESCE(MAX(numero_pedido), 0) + 1
            FROM pedidos
        """).fetchone()[0]

        for pedido_antigo in pedidos_sem_numero:
            conexao.execute("""
                UPDATE pedidos
                SET numero_pedido = ?
                WHERE id = ?
            """, (proximo_numero, pedido_antigo["id"]))

            proximo_numero += 1

        # Impede que dois pedidos tenham o mesmo número.
        conexao.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_pedidos_numero_pedido
            ON pedidos(numero_pedido)
        """)
