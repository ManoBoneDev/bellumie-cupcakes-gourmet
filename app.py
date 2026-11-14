
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from pathlib import Path
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import sqlite3

from models.db import criar_tabelas

from models.pedido import (
    listar_todos_pedidos,
    atualizar_status_pedido_por_id,
    excluir_pedido_por_id,
    salvar_pedido_no_banco,
)

from models.produto import (
    listar_produtos_ativos,
    listar_todos_produtos,
    atualizar_preco_produto,
    atualizar_produto_no_banco,
    excluir_produto_por_id,
    cadastrar_produto_no_banco,
    trocar_imagem_produto_no_banco,
)

app = Flask(__name__)

PASTA_PROJETO = Path(__file__).parent
PASTA_IMAGENS = PASTA_PROJETO / "static" / "imagens"
PASTA_IMAGENS.mkdir(parents=True, exist_ok=True)

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
FORMAS_PAGAMENTO_VALIDAS = {"Pix", "Cartão", "Dinheiro"}

CATEGORIAS_PRODUTO = {"Cupcakes", "Doces", "Bebidas"}

STATUS_VALIDOS = {
    "Recebido",
    "Em preparação",
    "Saiu para entrega",
    "Concluído",
}

LIMITE_NOME = 80
LIMITE_DESCRICAO = 250
LIMITE_DESCRICAO_DETALHADA = 2000
LIMITE_INGREDIENTES = 1500
LIMITE_ALERGENICOS = 1000
LIMITE_ENDERECO = 300
LIMITE_QUANTIDADE = 100


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
    pedidos = listar_todos_pedidos()
    return jsonify(pedidos)


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

    pedido_atualizado = atualizar_status_pedido_por_id(
        pedido_id,
        status
    )

    if not pedido_atualizado:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    return jsonify({"mensagem": "Status atualizado com sucesso!"})


@app.route("/api/admin/pedidos/<int:pedido_id>", methods=["DELETE"])
def excluir_pedido(pedido_id):
    pedido_excluido = excluir_pedido_por_id(pedido_id)

    if not pedido_excluido:
        return jsonify({"erro": "Pedido não encontrado."}), 404

    return jsonify({"mensagem": "Pedido excluído com sucesso!"})


@app.route("/api/produtos", methods=["GET"])
def produtos_loja():
    produtos = listar_produtos_ativos()
    return jsonify(produtos)


@app.route("/api/admin/produtos", methods=["GET"])
def listar_produtos():
    produtos = listar_todos_produtos()
    return jsonify(produtos)


@app.route("/api/admin/produtos/<int:produto_id>", methods=["PUT"])
def atualizar_produto(produto_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados inválidos."}), 400

    # Compatibilidade com a antiga edição somente de preço.
    if set(dados.keys()) == {"preco"}:
        preco = converter_preco(dados.get("preco"))

        if preco is None:
            return jsonify({
                "erro": "Informe um preço válido maior que zero."
            }), 400

        produto_atualizado = atualizar_preco_produto(
            produto_id,
            preco
        )

        if not produto_atualizado:
            return jsonify({"erro": "Produto não encontrado."}), 404

        return jsonify({"mensagem": "Preço atualizado com sucesso!"})

    campos = {
        "nome": LIMITE_NOME,
        "descricao": LIMITE_DESCRICAO,
        "descricao_detalhada": LIMITE_DESCRICAO_DETALHADA,
        "ingredientes": LIMITE_INGREDIENTES,
        "alergenicos": LIMITE_ALERGENICOS,
    }

    valores = {}

    for campo, limite in campos.items():
        valor = dados.get(campo, "")

        if not isinstance(valor, str):
            return jsonify({
                "erro": f"O campo {campo} é inválido."
            }), 400

        valor = valor.strip()

        if campo in ("nome", "descricao") and not valor:
            return jsonify({
                "erro": f"Preencha o campo {campo}."
            }), 400

        if len(valor) > limite:
            return jsonify({
                "erro": f"O campo {campo} ultrapassou o limite de caracteres."
            }), 400

        valores[campo] = valor

    categoria = dados.get("categoria", "Cupcakes")

    if not isinstance(categoria, str):
        return jsonify({"erro": "Categoria inválida."}), 400

    categoria = categoria.strip()

    if categoria not in CATEGORIAS_PRODUTO:
        return jsonify({"erro": "Categoria inválida."}), 400

    preco = converter_preco(dados.get("preco"))

    if preco is None:
        return jsonify({
            "erro": "Informe um preço válido maior que zero."
        }), 400

    try:
        produto_atualizado = atualizar_produto_no_banco(
            produto_id,
            valores["nome"],
            valores["descricao"],
            valores["descricao_detalhada"],
            valores["ingredientes"],
            valores["alergenicos"],
            preco,
            categoria
        )

        if not produto_atualizado:
            return jsonify({"erro": "Produto não encontrado."}), 404

        return jsonify({
            "mensagem": "Informações do produto atualizadas com sucesso!"
        })

    except sqlite3.IntegrityError:
        return jsonify({
            "erro": "Já existe outro produto com esse nome."
        }), 409

    except sqlite3.Error:
        app.logger.exception("Erro ao atualizar produto")

        return jsonify({
            "erro": "Não foi possível atualizar o produto."
        }), 500


@app.route("/api/admin/produtos/<int:produto_id>", methods=["DELETE"])
def excluir_produto(produto_id):
    produto_excluido = excluir_produto_por_id(produto_id)

    if not produto_excluido:
        return jsonify({"erro": "Produto não encontrado."}), 404

    return jsonify({"mensagem": "Produto excluído com sucesso!"})


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
        resultado = trocar_imagem_produto_no_banco(
            produto_id,
            nome_seguro
        )

        if resultado is None:
            return jsonify({
                "erro": "Produto não encontrado."
            }), 404

        if imagem_nova:
            try:
                arquivo.save(destino)
            except OSError:
                app.logger.exception("Erro ao salvar a nova imagem")

                return jsonify({
                    "erro": "Não foi possível salvar a imagem."
                }), 500

        imagem_antiga = resultado["imagem_antiga"]

        if (
            nome_seguro != imagem_antiga
            and not resultado["imagem_antiga_em_uso"]
        ):
            caminho_antigo = (
                PASTA_IMAGENS / Path(imagem_antiga).name
            )

            if caminho_antigo.is_file():
                caminho_antigo.unlink()

        return jsonify({
            "mensagem": "Foto atualizada com sucesso!",
            "imagem": nome_seguro,
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

    descricao_detalhada = request.form.get(
        "descricao_detalhada", ""
    ).strip()

    ingredientes = request.form.get(
        "ingredientes", ""
    ).strip()

    alergenicos = request.form.get(
        "alergenicos", ""
    ).strip()

    categoria = request.form.get(
        "categoria", "Cupcakes"
    ).strip()

    arquivo = request.files.get("imagem")
    preco = converter_preco(request.form.get("preco"))

    if categoria not in CATEGORIAS_PRODUTO:
        return jsonify({"erro": "Categoria inválida."}), 400

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

    if len(descricao_detalhada) > LIMITE_DESCRICAO_DETALHADA:
        return jsonify({
            "erro": "A descrição detalhada ultrapassou o limite de caracteres."
        }), 400

    if len(ingredientes) > LIMITE_INGREDIENTES:
        return jsonify({
            "erro": "A lista de ingredientes ultrapassou o limite de caracteres."
        }), 400

    if len(alergenicos) > LIMITE_ALERGENICOS:
        return jsonify({
            "erro": "O campo de alergênicos ultrapassou o limite de caracteres."
        }), 400

    if arquivo is None or not arquivo.filename:
        return jsonify({
            "erro": "Escolha uma imagem para o produto."
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
        if imagem_nova:
            arquivo.save(destino)

        try:
            cadastrar_produto_no_banco(
                nome,
                descricao,
                preco,
                nome_seguro,
                descricao_detalhada,
                ingredientes,
                alergenicos,
                categoria
            )

        except sqlite3.IntegrityError:
            if imagem_nova and destino.is_file():
                try:
                    destino.unlink()
                except OSError:
                    app.logger.exception(
                        "Não foi possível remover a imagem não utilizada"
                    )

            return jsonify({
                "erro": "Já existe um produto com esse nome."
            }), 409

        return jsonify({
            "mensagem": "Produto cadastrado com sucesso!"
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
            "erro": "Não foi possível cadastrar o produto."
        }), 500


@app.route("/api/pedidos", methods=["POST"])
def salvar_pedido():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return jsonify({"erro": "Dados do pedido inválidos."}), 400

    nome = dados.get("nome")
    telefone = dados.get("telefone")
    endereco = dados.get("endereco")
    tipo_recebimento = dados.get("tipo_recebimento")
    pagamento = dados.get("pagamento")
    troco_para = dados.get("troco_para")
    observacoes = dados.get("observacoes", "")
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
        not isinstance(telefone, str)
        or not telefone.strip()
        or len(telefone.strip()) > 30
    ):
        return jsonify({"erro": "Informe um telefone válido."}), 400

    if tipo_recebimento not in {"Entrega", "Retirada"}:
        return jsonify({"erro": "Tipo de recebimento inválido."}), 400

    if tipo_recebimento == "Entrega":
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

        endereco = endereco.strip()
    else:
        endereco = ""

    if (
        not isinstance(pagamento, str)
        or pagamento not in FORMAS_PAGAMENTO_VALIDAS
    ):
        return jsonify({"erro": "Forma de pagamento inválida."}), 400

    if pagamento == "Dinheiro" and troco_para is not None:
        try:
            troco_para = Decimal(str(troco_para))

            if not troco_para.is_finite() or troco_para <= 0:
                raise InvalidOperation

            troco_para = float(troco_para)

        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"erro": "Valor de troco inválido."}), 400
    else:
        troco_para = None

    if not isinstance(observacoes, str) or len(observacoes) > 500:
        return jsonify({
            "erro": "As observações devem ter até 500 caracteres."
        }), 400

    if not isinstance(itens, list) or not itens:
        return jsonify({"erro": "O pedido precisa ter produtos."}), 400

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

    try:
        resultado = salvar_pedido_no_banco(
            nome.strip(),
            telefone.strip(),
            endereco,
            tipo_recebimento,
            pagamento,
            troco_para,
            observacoes.strip(),
            itens
        )

        if "erro" in resultado:
            return jsonify({"erro": resultado["erro"]}), 400

        return jsonify({
            "mensagem": "Pedido salvo com sucesso!",
            "pedido_id": resultado["pedido_id"],
        }), 201

    except (sqlite3.Error, InvalidOperation, ValueError):
        app.logger.exception("Erro ao salvar pedido")

        return jsonify({
            "erro": "Não foi possível salvar o pedido."
        }), 500


criar_tabelas()

if __name__ == "__main__":
    app.run(debug=True)
