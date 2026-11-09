
import sqlite3
from pathlib import Path

PASTA = Path(__file__).resolve().parent

BANCO_ORIGINAL = PASTA / "loja.db"
BANCO_PUBLICACAO = PASTA / "loja_publicacao.db"

if not BANCO_ORIGINAL.exists():
    raise FileNotFoundError("O arquivo loja.db não foi encontrado.")

if BANCO_PUBLICACAO.exists():
    BANCO_PUBLICACAO.unlink()

origem = sqlite3.connect(BANCO_ORIGINAL)
destino = sqlite3.connect(BANCO_PUBLICACAO)

try:
    # Cria uma tabela de produtos independente.
    destino.execute("""
        CREATE TABLE produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            descricao TEXT NOT NULL,
            preco REAL NOT NULL,
            imagem TEXT NOT NULL,
            ativo INTEGER NOT NULL DEFAULT 1,
            descricao_detalhada TEXT NOT NULL DEFAULT '',
            ingredientes TEXT NOT NULL DEFAULT '',
            alergenicos TEXT NOT NULL DEFAULT ''
        )
    """)

    # Copia somente os produtos cadastrados.
    produtos = origem.execute("""
        SELECT id, nome, descricao, preco, imagem, ativo,
               descricao_detalhada, ingredientes, alergenicos
        FROM produtos
        ORDER BY id ASC
    """).fetchall()

    destino.executemany("""
        INSERT INTO produtos (
            id, nome, descricao, preco, imagem, ativo,
            descricao_detalhada, ingredientes, alergenicos
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, produtos)

    destino.commit()

    print(f"Banco de publicação criado com {len(produtos)} produtos.")
    print(f"Arquivo: {BANCO_PUBLICACAO}")

finally:
    origem.close()
    destino.close()
