
from decimal import Decimal, ROUND_HALF_UP

from models.db import conectar_banco


def listar_todos_pedidos():
    """Retorna os pedidos com numeração sequencial e seus respectivos itens."""
    with conectar_banco() as conexao:
        pedidos = conexao.execute("""
            SELECT id, nome_cliente, telefone, endereco,
                   tipo_recebimento, forma_pagamento, troco_para,
                   observacoes, taxa_entrega, total,
                   data_pedido, status
            FROM pedidos
            ORDER BY id ASC
        """).fetchall()

        resultado = []

        for numero, pedido in enumerate(pedidos, start=1):
            itens = conexao.execute("""
                SELECT produto, quantidade, preco_unitario
                FROM itens_pedido
                WHERE pedido_id = ?
            """, (pedido["id"],)).fetchall()

            resultado.append({
                "id": pedido["id"],
                "numero": numero,
                "nome": pedido["nome_cliente"],
                "telefone": pedido["telefone"],
                "endereco": pedido["endereco"],
                "tipo_recebimento": pedido["tipo_recebimento"],
                "pagamento": pedido["forma_pagamento"],
                "troco_para": pedido["troco_para"],
                "observacoes": pedido["observacoes"],
                "taxa_entrega": pedido["taxa_entrega"],
                "total": pedido["total"],
                "data": pedido["data_pedido"],
                "status": pedido["status"],
                "itens": [dict(item) for item in itens],
            })

    return resultado


def atualizar_status_pedido_por_id(pedido_id, status):
    """Atualiza o status de um pedido."""
    with conectar_banco() as conexao:
        cursor = conexao.execute("""
            UPDATE pedidos
            SET status = ?
            WHERE id = ?
        """, (status, pedido_id))

        return cursor.rowcount > 0


def excluir_pedido_por_id(pedido_id):
    """Exclui um pedido e seus itens associados."""
    with conectar_banco() as conexao:
        pedido = conexao.execute("""
            SELECT id FROM pedidos WHERE id = ?
        """, (pedido_id,)).fetchone()

        if pedido is None:
            return False

        conexao.execute("""
            DELETE FROM itens_pedido WHERE pedido_id = ?
        """, (pedido_id,))

        conexao.execute("""
            DELETE FROM pedidos WHERE id = ?
        """, (pedido_id,))

    return True


def salvar_pedido_no_banco(
    nome,
    telefone,
    endereco,
    tipo_recebimento,
    pagamento,
    troco_para,
    observacoes,
    itens
):
    """Valida os produtos e registra o pedido e seus itens no banco."""
    itens_validados = []
    subtotal = Decimal("0.00")

    with conectar_banco() as conexao:
        for item in itens:
            produto_nome = item["nome"].strip()
            quantidade = item["quantidade"]

            produto = conexao.execute("""
                SELECT nome, preco
                FROM produtos
                WHERE nome = ? AND ativo = 1
            """, (produto_nome,)).fetchone()

            if produto is None:
                return {
                    "erro": (
                        f'O cupcake "{produto_nome}" '
                        "não está mais disponível."
                    )
                }

            preco = Decimal(str(produto["preco"])).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            subtotal += preco * quantidade

            itens_validados.append((
                produto["nome"],
                quantidade,
                preco,
            ))

        subtotal = subtotal.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        taxa_entrega = (
            Decimal("5.00")
            if tipo_recebimento == "Entrega"
            else Decimal("0.00")
        )

        total = (subtotal + taxa_entrega).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        cursor = conexao.execute("""
            INSERT INTO pedidos (
                nome_cliente,
                telefone,
                endereco,
                tipo_recebimento,
                forma_pagamento,
                troco_para,
                observacoes,
                taxa_entrega,
                total
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            nome,
            telefone,
            endereco,
            tipo_recebimento,
            pagamento,
            troco_para,
            observacoes,
            float(taxa_entrega),
            float(total),
        ))

        pedido_id = cursor.lastrowid

        conexao.executemany("""
            INSERT INTO itens_pedido
            (pedido_id, produto, quantidade, preco_unitario)
            VALUES (?, ?, ?, ?)
        """, [
            (pedido_id, produto, quantidade, float(preco))
            for produto, quantidade, preco in itens_validados
        ])

    return {
        "pedido_id": pedido_id
    }
