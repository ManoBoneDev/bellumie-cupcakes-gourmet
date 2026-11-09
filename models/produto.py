from models.db import conectar_banco


def listar_produtos_ativos():
    """Retorna os produtos disponíveis na loja."""
    with conectar_banco() as conexao:
        produtos = conexao.execute("""
            SELECT
                id,
                nome,
                descricao,
                descricao_detalhada,
                ingredientes,
                alergenicos,
                preco,
                imagem
            FROM produtos
            WHERE ativo = 1
            ORDER BY id ASC
        """).fetchall()

    return [dict(produto) for produto in produtos]


def listar_todos_produtos():
    """Retorna todos os produtos para o painel administrativo."""
    with conectar_banco() as conexao:
        produtos = conexao.execute("""
            SELECT
                id,
                nome,
                descricao,
                descricao_detalhada,
                ingredientes,
                alergenicos,
                preco,
                imagem,
                ativo
            FROM produtos
            ORDER BY id ASC
        """).fetchall()

    return [dict(produto) for produto in produtos]


def atualizar_preco_produto(produto_id, preco):
    """Atualiza somente o preço de um cupcake."""
    with conectar_banco() as conexao:
        cursor = conexao.execute("""
            UPDATE produtos
            SET preco = ?
            WHERE id = ?
        """, (float(preco), produto_id))

        return cursor.rowcount > 0


def atualizar_produto_no_banco(
    produto_id,
    nome,
    descricao,
    descricao_detalhada,
    ingredientes,
    alergenicos,
    preco
):
    """Atualiza as informações completas de um cupcake."""
    with conectar_banco() as conexao:
        cursor = conexao.execute("""
            UPDATE produtos
            SET
                nome = ?,
                descricao = ?,
                descricao_detalhada = ?,
                ingredientes = ?,
                alergenicos = ?,
                preco = ?
            WHERE id = ?
        """, (
            nome,
            descricao,
            descricao_detalhada,
            ingredientes,
            alergenicos,
            float(preco),
            produto_id
        ))

        return cursor.rowcount > 0


def excluir_produto_por_id(produto_id):
    """Exclui um cupcake pelo seu ID."""
    with conectar_banco() as conexao:
        cursor = conexao.execute("""
            DELETE FROM produtos
            WHERE id = ?
        """, (produto_id,))

        return cursor.rowcount > 0


def cadastrar_produto_no_banco(
    nome,
    descricao,
    preco,
    imagem,
    descricao_detalhada="",
    ingredientes="",
    alergenicos=""
):
    """Cadastra um novo cupcake no banco de dados."""
    with conectar_banco() as conexao:
        conexao.execute("""
            INSERT INTO produtos (
                nome,
                descricao,
                preco,
                imagem,
                descricao_detalhada,
                ingredientes,
                alergenicos
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            nome,
            descricao,
            float(preco),
            imagem,
            descricao_detalhada,
            ingredientes,
            alergenicos
        ))


def trocar_imagem_produto_no_banco(produto_id, nome_imagem):
    """Atualiza a imagem de um produto e retorna a imagem anterior."""
    with conectar_banco() as conexao:
        produto = conexao.execute("""
            SELECT imagem
            FROM produtos
            WHERE id = ?
        """, (produto_id,)).fetchone()

        if produto is None:
            return None

        imagem_antiga = produto["imagem"]

        conexao.execute("""
            UPDATE produtos
            SET imagem = ?
            WHERE id = ?
        """, (nome_imagem, produto_id))

        imagem_em_uso = conexao.execute("""
            SELECT 1
            FROM produtos
            WHERE imagem = ?
            LIMIT 1
        """, (imagem_antiga,)).fetchone()

    return {
        "imagem_antiga": imagem_antiga,
        "imagem_antiga_em_uso": imagem_em_uso is not None,
    }