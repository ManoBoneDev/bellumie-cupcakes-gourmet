from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import sqlite3
from pathlib import Path
import uuid
PASTA_IMAGENS = Path(__file__).parent / "static" / "imagens"
PASTA_IMAGENS.mkdir(parents=True, exist_ok=True)

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}

app = Flask(__name__)

CAMINHO_BANCO = Path(__file__).parent / "loja.db"


def conectar_banco():
    conexao = sqlite3.connect(CAMINHO_BANCO)
    conexao.row_factory = sqlite3.Row
    return conexao


def criar_tabelas():
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

        produtos_iniciais = [
            ("Chocolate", "Cupcake de chocolate gourmet.", 8.00, "chocolate.jpg"),
            ("Morango", "Cupcake artesanal de morango.", 9.00, "morango.jpg"),
            ("Brigadeiro", "Cupcake com sabor de brigadeiro.", 10.00, "brigadeiro.jpg"),
            ("Red Velvet", "Cupcake red velvet especial.", 11.00, "red-velvet.jpg"),
            ("Coco", "Cupcake com sabor de coco.", 9.00, "coco.jpg"),
            ("Limão", "Cupcake com sabor de limão.", 9.00, "limao.jpg")
        ]

        conexao.executemany("""
            INSERT OR IGNORE INTO produtos
            (nome, descricao, preco, imagem)
            VALUES (?, ?, ?, ?)
        """, produtos_iniciais)


        colunas = [
            coluna["name"]
            for coluna in conexao.execute("PRAGMA table_info(pedidos)").fetchall()
        ]

        if "status" not in colunas:
            conexao.execute("""
                ALTER TABLE pedidos
                ADD COLUMN status TEXT NOT NULL DEFAULT 'Recebido'
            """)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/admin")
def painel_vendedor():
    return render_template("admin.html")

@app.route("/admin/produtos")
def painel_produtos():
    return render_template("produtos.html")


@app.route("/api/admin/pedidos")
def listar_pedidos():
    with conectar_banco() as conexao:
        pedidos = conexao.execute("""
            SELECT * FROM pedidos
            ORDER BY id ASC
        """).fetchall()
        resultado = []

        for pedido in pedidos:
            itens = conexao.execute("""
                SELECT produto, quantidade, preco_unitario
                FROM itens_pedido
                WHERE pedido_id = ?
            """, (pedido["id"],)).fetchall()

            resultado.append({
                "id": pedido["id"],
                "nome": pedido["nome_cliente"],
                "endereco": pedido["endereco"],
                "pagamento": pedido["forma_pagamento"],
                "total": pedido["total"],
                "data": pedido["data_pedido"],
                "status": pedido["status"],
                "itens": [dict(item) for item in itens]
            })

    return jsonify(resultado)


@app.route("/api/admin/pedidos/<int:pedido_id>/status", methods=["PUT"])
def atualizar_status_pedido(pedido_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados inválidos."}), 400

    status = dados.get("status")

    status_validos = {
        "Recebido",
        "Em preparação",
        "Saiu para entrega",
        "Concluído"
    }

    if status not in status_validos:
        return jsonify({"erro": "Status inválido."}), 400

    with conectar_banco() as conexao:
        cursor = conexao.execute("""
            UPDATE pedidos
            SET status = ?
            WHERE id = ?
        """, (status, pedido_id))

        if cursor.rowcount == 0:
            return jsonify({"erro": "Pedido não encontrado."}), 404

    return jsonify({"mensagem": "Status atualizado com sucesso!"})


@app.route("/api/admin/pedidos/<int:pedido_id>", methods=["DELETE"])
def excluir_pedido(pedido_id):
    with conectar_banco() as conexao:
        pedido = conexao.execute(
            "SELECT id FROM pedidos WHERE id = ?",
            (pedido_id,)
        ).fetchone()

        if pedido is None:
            return jsonify({"erro": "Pedido não encontrado."}), 404

        conexao.execute(
            "DELETE FROM itens_pedido WHERE pedido_id = ?",
            (pedido_id,)
        )

        conexao.execute(
            "DELETE FROM pedidos WHERE id = ?",
            (pedido_id,)
        )

    return jsonify({"mensagem": "Pedido excluído com sucesso!"})

@app.route("/api/produtos", methods=["GET"])
def produtos_loja():
    with conectar_banco() as conexao:
        produtos = conexao.execute("""
            SELECT id, nome, descricao, preco, imagem
            FROM produtos
            WHERE ativo = 1
            ORDER BY id ASC
        """).fetchall()

    return jsonify([dict(produto) for produto in produtos])

@app.route("/api/admin/produtos", methods=["GET"])
def listar_produtos():
    with conectar_banco() as conexao:
        produtos = conexao.execute("""
            SELECT id, nome, descricao, preco, imagem, ativo
            FROM produtos
            ORDER BY id ASC
        """).fetchall()

    return jsonify([dict(produto) for produto in produtos])
@app.route("/api/admin/produtos/<int:produto_id>", methods=["PUT"])
def atualizar_produto(produto_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados inválidos."}), 400

    try:
        preco = float(dados.get("preco", 0))
    except (TypeError, ValueError):
        return jsonify({"erro": "Preço inválido."}), 400

    if preco <= 0:
        return jsonify({"erro": "O preço precisa ser maior que zero."}), 400

    with conectar_banco() as conexao:
        produto = conexao.execute("""
            SELECT id FROM produtos
            WHERE id = ?
        """, (produto_id,)).fetchone()

        if produto is None:
            return jsonify({"erro": "Cupcake não encontrado."}), 404

        conexao.execute("""
            UPDATE produtos
            SET preco = ?
            WHERE id = ?
        """, (round(preco, 2), produto_id))

    return jsonify({
        "mensagem": "Preço atualizado com sucesso!"
    })


@app.route("/api/admin/produtos/<int:produto_id>", methods=["DELETE"])
def excluir_produto(produto_id):
    with conectar_banco() as conexao:
        produto = conexao.execute("""
            SELECT id FROM produtos
            WHERE id = ?
        """, (produto_id,)).fetchone()

        if produto is None:
            return jsonify({"erro": "Cupcake não encontrado."}), 404

        conexao.execute("""
            DELETE FROM produtos
            WHERE id = ?
        """, (produto_id,))

    return jsonify({
        "mensagem": "Cupcake excluído com sucesso!"
    })

@app.route(
    "/api/admin/produtos/<int:produto_id>/imagem",
    methods=["PUT"]
)

@app.route(
    "/api/admin/produtos/<int:produto_id>/imagem",
    methods=["PUT"]
)
def trocar_imagem_produto(produto_id):
    arquivo = request.files.get("imagem")

    if arquivo is None or not arquivo.filename:
        return jsonify({"erro": "Escolha uma imagem."}), 400

    nome_seguro = secure_filename(arquivo.filename)
    extensao = Path(nome_seguro).suffix.lower()

    if not nome_seguro or extensao not in EXTENSOES_PERMITIDAS:
        return jsonify({
            "erro": "Use uma imagem JPG, JPEG, PNG ou WEBP."
        }), 400

    destino = PASTA_IMAGENS / nome_seguro

    try:
        with conectar_banco() as conexao:
            produto = conexao.execute("""
                SELECT imagem
                FROM produtos
                WHERE id = ?
            """, (produto_id,)).fetchone()

            if produto is None:
                return jsonify({
                    "erro": "Cupcake não encontrado."
                }), 404

            imagem_antiga = produto["imagem"]

            # Se o arquivo escolhido já existe, reutiliza-o.
            if not destino.exists():
                arquivo.save(destino)

            # Atualiza a imagem vinculada ao produto.
            conexao.execute("""
                UPDATE produtos
                SET imagem = ?
                WHERE id = ?
            """, (nome_seguro, produto_id))

            # Apaga a imagem anterior somente se nenhum
            # outro produto ainda estiver usando esse arquivo.
            if nome_seguro != imagem_antiga:
                imagem_em_uso = conexao.execute("""
                    SELECT 1
                    FROM produtos
                    WHERE imagem = ?
                    LIMIT 1
                """, (imagem_antiga,)).fetchone()

                caminho_antigo = PASTA_IMAGENS / imagem_antiga

                if not imagem_em_uso and caminho_antigo.is_file():
                    caminho_antigo.unlink()

        return jsonify({
            "mensagem": "Foto atualizada com sucesso!",
            "imagem": nome_seguro
        })

    except (sqlite3.Error, OSError):
        app.logger.exception("Erro ao trocar imagem do produto")
        return jsonify({
            "erro": "Não foi possível trocar a foto."
        }), 500


@app.route("/api/admin/produtos", methods=["POST"])
def cadastrar_produto():
    nome = request.form.get("nome", "").strip()
    descricao = request.form.get("descricao", "").strip()
    arquivo = request.files.get("imagem")

    try:
        preco = float(request.form.get("preco", "0"))
    except (TypeError, ValueError):
        return jsonify({"erro": "Preço inválido."}), 400

    if not nome or len(nome) > 80:
        return jsonify({
            "erro": "Informe um nome de até 80 caracteres."
        }), 400

    if not descricao or len(descricao) > 250:
        return jsonify({
            "erro": "Informe uma descrição de até 250 caracteres."
        }), 400

    if preco <= 0:
        return jsonify({
            "erro": "O preço precisa ser maior que zero."
        }), 400

    if arquivo is None or not arquivo.filename:
        return jsonify({
            "erro": "Escolha uma imagem para o cupcake."
        }), 400

    nome_seguro = secure_filename(arquivo.filename)
    extensao = Path(nome_seguro).suffix.lower()

    if not nome_seguro or extensao not in EXTENSOES_PERMITIDAS:
        return jsonify({
            "erro": "Formato inválido. Use JPG, JPEG, PNG ou WEBP."
        }), 400

    nome_imagem = nome_seguro
    destino = PASTA_IMAGENS / nome_imagem

    # Se o arquivo já existir, reutiliza a imagem existente.
    reutilizar_imagem = destino.exists()

    try:
        with conectar_banco() as conexao:
            conexao.execute("""
                INSERT INTO produtos (nome, descricao, preco, imagem)
                VALUES (?, ?, ?, ?)
            """, (nome, descricao, preco, nome_imagem))

        # Só salva o arquivo quando ele ainda não existe.
        if not reutilizar_imagem:
            arquivo.save(destino)

        return jsonify({
            "mensagem": "Cupcake cadastrado com sucesso!"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "erro": "Já existe um cupcake com esse nome."
        }), 409

    except (sqlite3.Error, OSError):
        app.logger.exception("Erro ao cadastrar produto")
        return jsonify({
            "erro": "Não foi possível cadastrar o cupcake."
        }), 500


@app.route("/api/pedidos", methods=["POST"])
def salvar_pedido():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados do pedido inválidos."}), 400

    nome = str(dados.get("nome", "")).strip()
    endereco = str(dados.get("endereco", "")).strip()
    pagamento = str(dados.get("pagamento", "")).strip()
    itens = dados.get("itens")

    formas_validas = {"Pix", "Cartão", "Dinheiro"}

    if not nome or not endereco:
        return jsonify({"erro": "Informe nome e endereço."}), 400

    if pagamento not in formas_validas:
        return jsonify({"erro": "Forma de pagamento inválida."}), 400

    if not isinstance(itens, list) or not itens:
        return jsonify({"erro": "O pedido precisa ter produtos."}), 400

    itens_validados = []
    total = 0.0

    try:
        with conectar_banco() as conexao:
            for item in itens:
                if not isinstance(item, dict):
                    return jsonify({"erro": "Item inválido."}), 400

                produto_nome = item.get("nome")
                quantidade = item.get("quantidade")

                if not isinstance(produto_nome, str):
                    return jsonify({"erro": "Produto inválido."}), 400

                if (
                    type(quantidade) is not int
                    or not 1 <= quantidade <= 100
                ):
                    return jsonify({"erro": "Quantidade inválida."}), 400

                produto = conexao.execute("""
                    SELECT nome, preco
                    FROM produtos
                    WHERE nome = ? AND ativo = 1
                """, (produto_nome,)).fetchone()

                if produto is None:
                    return jsonify({
                        "erro": (
                            f'O cupcake "{produto_nome}" não está '
                            "mais disponível."
                        )
                    }), 400

                preco = float(produto["preco"])
                total += preco * quantidade

                itens_validados.append((
                    produto["nome"],
                    quantidade,
                    preco
                ))

            cursor = conexao.execute("""
                INSERT INTO pedidos
                (nome_cliente, endereco, forma_pagamento, total)
                VALUES (?, ?, ?, ?)
            """, (nome, endereco, pagamento, round(total, 2)))

            pedido_id = cursor.lastrowid

            conexao.executemany("""
                INSERT INTO itens_pedido
                (pedido_id, produto, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?)
            """, [
                (pedido_id, produto, quantidade, preco)
                for produto, quantidade, preco in itens_validados
            ])

        return jsonify({
            "mensagem": "Pedido salvo com sucesso!",
            "pedido_id": pedido_id
        }), 201

    except sqlite3.Error:
        app.logger.exception("Erro ao salvar pedido")
        return jsonify({
            "erro": "Não foi possível salvar o pedido."
        }), 500


criar_tabelas()


if __name__ == "__main__":
    app.run(debug=True)
