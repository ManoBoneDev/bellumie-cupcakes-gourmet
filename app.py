from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from pathlib import Path
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import sqlite3

app = Flask(__name__)

PASTA_PROJETO = Path(__file__).parent
PASTA_IMAGENS = PASTA_PROJETO / "static" / "imagens"
PASTA_IMAGENS.mkdir(parents=True, exist_ok=True)

CAMINHO_BANCO = PASTA_PROJETO / "loja.db"

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
FORMAS_PAGAMENTO_VALIDAS = {"Pix", "Cartão", "Dinheiro"}
STATUS_VALIDOS = {
    "Recebido",
    "Em preparação",
    "Saiu para entrega",
    "Concluído",
}

LIMITE_NOME = 80
LIMITE_DESCRICAO = 250
LIMITE_ENDERECO = 300
LIMITE_QUANTIDADE = 100


def conectar_banco():
    conexao = sqlite3.connect(CAMINHO_BANCO)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao


def converter_preco(valor):
    try:
        preco = Decimal(str(valor))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if not preco.is_finite() or preco <= 0:
        return None

    return preco.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


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
            ("Limão", "Cupcake com sabor de limão.", 9.00, "limao.jpg"),
        ]

        conexao.executemany("""
            INSERT OR IGNORE INTO produtos
            (nome, descricao, preco, imagem)
            VALUES (?, ?, ?, ?)
        """, produtos_iniciais)

        colunas = {
            coluna["name"]
            for coluna in conexao.execute(
                "PRAGMA table_info(pedidos)"
            ).fetchall()
        }

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


@app.route("/api/admin/pedidos", methods=["GET"])
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
                "itens": [dict(item) for item in itens],
            })

    return jsonify(resultado)


@app.route(
    "/api/admin/pedidos/<int:pedido_id>/status",
    methods=["PUT"]
)
def atualizar_status_pedido(pedido_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados inválidos."}), 400

    status = dados.get("status")

    if not isinstance(status, str) or status not in STATUS_VALIDOS:
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
        pedido = conexao.execute("""
            SELECT id FROM pedidos WHERE id = ?
        """, (pedido_id,)).fetchone()

        if pedido is None:
            return jsonify({"erro": "Pedido não encontrado."}), 404

        conexao.execute("""
            DELETE FROM itens_pedido WHERE pedido_id = ?
        """, (pedido_id,))

        conexao.execute("""
            DELETE FROM pedidos WHERE id = ?
        """, (pedido_id,))

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

    preco = converter_preco(dados.get("preco"))

    if preco is None:
        return jsonify({
            "erro": "Informe um preço válido maior que zero."
        }), 400

    with conectar_banco() as conexao:
        produto = conexao.execute("""
            SELECT id FROM produtos WHERE id = ?
        """, (produto_id,)).fetchone()

        if produto is None:
            return jsonify({"erro": "Cupcake não encontrado."}), 404

        conexao.execute("""
            UPDATE produtos
            SET preco = ?
            WHERE id = ?
        """, (float(preco), produto_id))

    return jsonify({"mensagem": "Preço atualizado com sucesso!"})


@app.route("/api/admin/produtos/<int:produto_id>", methods=["DELETE"])
def excluir_produto(produto_id):
    with conectar_banco() as conexao:
        produto = conexao.execute("""
            SELECT id FROM produtos WHERE id = ?
        """, (produto_id,)).fetchone()

        if produto is None:
            return jsonify({"erro": "Cupcake não encontrado."}), 404

        conexao.execute("""
            DELETE FROM produtos WHERE id = ?
        """, (produto_id,))

    return jsonify({"mensagem": "Cupcake excluído com sucesso!"})


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
    imagem_nova = not destino.exists()

    try:
        with conectar_banco() as conexao:
            produto = conexao.execute("""
                SELECT imagem FROM produtos WHERE id = ?
            """, (produto_id,)).fetchone()

            if produto is None:
                return jsonify({
                    "erro": "Cupcake não encontrado."
                }), 404

            imagem_antiga = produto["imagem"]

            # Reutiliza a imagem se ela já existir.
            if imagem_nova:
                arquivo.save(destino)

            # Atualiza a imagem do produto.
            conexao.execute("""
                UPDATE produtos
                SET imagem = ?
                WHERE id = ?
            """, (nome_seguro, produto_id))

            # Remove a imagem antiga se não estiver em uso.
            if nome_seguro != imagem_antiga:
                imagem_em_uso = conexao.execute("""
                    SELECT 1
                    FROM produtos
                    WHERE imagem = ?
                    LIMIT 1
                """, (imagem_antiga,)).fetchone()

                caminho_antigo = PASTA_IMAGENS / Path(imagem_antiga).name

                if not imagem_em_uso and caminho_antigo.is_file():
                    caminho_antigo.unlink()

        return jsonify({
            "mensagem": "Foto atualizada com sucesso!",
            "imagem": nome_seguro,
        })

    except (sqlite3.Error, OSError):
        if imagem_nova and destino.is_file():
            try:
                destino.unlink()
            except OSError:
                app.logger.exception(
                    "Não foi possível remover a imagem não utilizada"
                )

        app.logger.exception("Erro ao trocar imagem do produto")

        return jsonify({
            "erro": "Não foi possível trocar a foto."
        }), 500


@app.route("/api/admin/produtos", methods=["POST"])
def cadastrar_produto():
    nome = request.form.get("nome", "").strip()
    descricao = request.form.get("descricao", "").strip()
    arquivo = request.files.get("imagem")
    preco = converter_preco(request.form.get("preco"))

    if preco is None:
        return jsonify({
            "erro": "Informe um preço válido maior que zero."
        }), 400

    if not nome or len(nome) > LIMITE_NOME:
        return jsonify({
            "erro": f"Informe um nome de até {LIMITE_NOME} caracteres."
        }), 400

    if not descricao or len(descricao) > LIMITE_DESCRICAO:
        return jsonify({
            "erro": (
                f"Informe uma descrição de até "
                f"{LIMITE_DESCRICAO} caracteres."
            )
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

    destino = PASTA_IMAGENS / nome_seguro
    imagem_nova = not destino.exists()

    try:
        # Salva a imagem antes de cadastrar o produto.
        if imagem_nova:
            arquivo.save(destino)

        try:
            with conectar_banco() as conexao:
                conexao.execute("""
                    INSERT INTO produtos (nome, descricao, preco, imagem)
                    VALUES (?, ?, ?, ?)
                """, (nome, descricao, float(preco), nome_seguro))

        except sqlite3.IntegrityError:
            if imagem_nova and destino.is_file():
                try:
                    destino.unlink()
                except OSError:
                    app.logger.exception(
                        "Não foi possível remover a imagem não utilizada"
                    )

            return jsonify({
                "erro": "Já existe um cupcake com esse nome."
            }), 409

        return jsonify({
            "mensagem": "Cupcake cadastrado com sucesso!"
        }), 201

    except (sqlite3.Error, OSError):
        if imagem_nova and destino.is_file():
            try:
                destino.unlink()
            except OSError:
                app.logger.exception(
                    "Não foi possível remover a imagem não utilizada"
                )

        app.logger.exception("Erro ao cadastrar produto")

        return jsonify({
            "erro": "Não foi possível cadastrar o cupcake."
        }), 500


@app.route("/api/pedidos", methods=["POST"])
def salvar_pedido():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados do pedido inválidos."}), 400

    nome = dados.get("nome")
    endereco = dados.get("endereco")
    pagamento = dados.get("pagamento")
    itens = dados.get("itens")

    if (
        not isinstance(nome, str)
        or not nome.strip()
        or len(nome.strip()) > LIMITE_NOME
    ):
        return jsonify({
            "erro": f"Informe um nome de até {LIMITE_NOME} caracteres."
        }), 400

    if (
        not isinstance(endereco, str)
        or not endereco.strip()
        or len(endereco.strip()) > LIMITE_ENDERECO
    ):
        return jsonify({
            "erro": (
                f"Informe um endereço de até "
                f"{LIMITE_ENDERECO} caracteres."
            )
        }), 400

    nome = nome.strip()
    endereco = endereco.strip()

    if (
        not isinstance(pagamento, str)
        or pagamento not in FORMAS_PAGAMENTO_VALIDAS
    ):
        return jsonify({"erro": "Forma de pagamento inválida."}), 400

    if not isinstance(itens, list) or not itens:
        return jsonify({"erro": "O pedido precisa ter produtos."}), 400

    itens_validados = []
    total = Decimal("0.00")

    try:
        with conectar_banco() as conexao:
            for item in itens:
                if not isinstance(item, dict):
                    return jsonify({"erro": "Item inválido."}), 400

                produto_nome = item.get("nome")
                quantidade = item.get("quantidade")

                if (
                    not isinstance(produto_nome, str)
                    or not produto_nome.strip()
                ):
                    return jsonify({"erro": "Produto inválido."}), 400

                if (
                    type(quantidade) is not int
                    or not 1 <= quantidade <= LIMITE_QUANTIDADE
                ):
                    return jsonify({"erro": "Quantidade inválida."}), 400

                produto = conexao.execute("""
                    SELECT nome, preco
                    FROM produtos
                    WHERE nome = ? AND ativo = 1
                """, (produto_nome.strip(),)).fetchone()

                if produto is None:
                    return jsonify({
                        "erro": (
                            f'O cupcake "{produto_nome}" '
                            "não está mais disponível."
                        )
                    }), 400

                preco = Decimal(str(produto["preco"])).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP
                )

                total += preco * quantidade

                itens_validados.append((
                    produto["nome"],
                    quantidade,
                    preco,
                ))

            total = total.quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            cursor = conexao.execute("""
                INSERT INTO pedidos
                (nome_cliente, endereco, forma_pagamento, total)
                VALUES (?, ?, ?, ?)
            """, (nome, endereco, pagamento, float(total)))

            pedido_id = cursor.lastrowid

            conexao.executemany("""
                INSERT INTO itens_pedido
                (pedido_id, produto, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?)
            """, [
                (pedido_id, produto, quantidade, float(preco))
                for produto, quantidade, preco in itens_validados
            ])

        return jsonify({
            "mensagem": "Pedido salvo com sucesso!",
            "pedido_id": pedido_id,
        }), 201

    except (sqlite3.Error, InvalidOperation, ValueError):
        app.logger.exception("Erro ao salvar pedido")

        return jsonify({
            "erro": "Não foi possível salvar o pedido."
        }), 500


criar_tabelas()


if __name__ == "__main__":
    app.run(debug=True)