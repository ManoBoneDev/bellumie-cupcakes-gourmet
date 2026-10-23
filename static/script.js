
let pedidos = [];
let produtosDisponiveis = [];

const listaProdutos = document.getElementById("lista-produtos");
const listaPedidos = document.getElementById("lista-pedidos");
const totalPedido = document.getElementById("total-pedido");
const carrinhoContainer = document.getElementById("carrinho-container");
const irParaCheckout = document.getElementById("ir-para-checkout");
const checkoutContainer = document.getElementById("checkout-container");
const fecharCheckout = document.getElementById("fechar-checkout");
const voltarCheckout = document.getElementById("voltar-checkout");
const confirmarPedido = document.getElementById("confirmar-pedido");
const pedidoSucesso = document.getElementById("pedido-sucesso");
const fecharSucesso = document.getElementById("fechar-sucesso");
const nomeCliente = document.getElementById("nome-cliente");
const enderecoCliente = document.getElementById("endereco-cliente");
const formaPagamento = document.getElementById("forma-pagamento");
const mensagemErro = document.getElementById("mensagem-erro");

/* Formatar preços */

function formatarPreco(preco) {
    return Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* Carregar produtos */

async function carregarProdutos() {
    try {
        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os cupcakes.");
        }

        produtosDisponiveis = await resposta.json();
        listaProdutos.innerHTML = "";

        if (produtosDisponiveis.length === 0) {
            listaProdutos.textContent =
                "Nenhum cupcake disponível no momento.";
            return;
        }

        produtosDisponiveis.forEach(function(produto) {
            const card = document.createElement("div");
            card.className = "produto";

            const imagem = document.createElement("img");
            imagem.src =
                "/static/imagens/" + encodeURIComponent(produto.imagem);
            imagem.alt = "Cupcake de " + produto.nome;

            imagem.onerror = function() {
                imagem.onerror = null;
                imagem.style.display = "none";

                const placeholder = document.createElement("div");
                placeholder.className = "imagem-placeholder";
                placeholder.textContent = "🧁";
                placeholder.setAttribute("aria-label", "Imagem indisponível");

                card.insertBefore(placeholder, card.firstChild);
            };

            const titulo = document.createElement("h3");
            titulo.textContent = "Cupcake de " + produto.nome;

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao || "";

            const preco = document.createElement("strong");
            preco.textContent = formatarPreco(produto.preco);

            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = "Adicionar ao carrinho";

            botao.addEventListener("click", function() {
                pedidos.push({
                    nome: produto.nome,
                    preco: Number(produto.preco)
                });

                atualizarCarrinho();
            });

            card.appendChild(imagem);
            card.appendChild(titulo);
            card.appendChild(descricao);
            card.appendChild(preco);
            card.appendChild(botao);

            listaProdutos.appendChild(card);
        });

        atualizarCarrinho();

    } catch (erro) {
        listaProdutos.textContent =
            "Erro ao carregar os cupcakes. Atualize a página e tente novamente.";

        console.error(erro);
    }
}

/* Atualizar carrinho */

function atualizarCarrinho() {
    listaPedidos.innerHTML = "";

    if (pedidos.length === 0) {
        carrinhoContainer.style.display = "none";
        totalPedido.textContent = formatarPreco(0);
        return;
    }

    carrinhoContainer.style.display = "block";

    const produtosAgrupados = {};

    pedidos.forEach(function(produto) {
        if (!produtosAgrupados[produto.nome]) {
            produtosAgrupados[produto.nome] = {
                nome: produto.nome,
                preco: produto.preco,
                quantidade: 0
            };
        }

        produtosAgrupados[produto.nome].quantidade++;
    });

    let total = 0;

    Object.values(produtosAgrupados).forEach(function(produto) {
        const item = document.createElement("li");
        const texto = document.createElement("span");
        const subtotal = produto.preco * produto.quantidade;

        texto.textContent =
            produto.nome +
            " - " +
            produto.quantidade +
            "x - " +
            formatarPreco(subtotal);

        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover";

        remover.addEventListener("click", function() {
            const indice = pedidos.findIndex(function(item) {
                return item.nome === produto.nome;
            });

            if (indice !== -1) {
                pedidos.splice(indice, 1);
            }

            atualizarCarrinho();
        });

        item.appendChild(texto);
        item.appendChild(remover);
        listaPedidos.appendChild(item);

        total += subtotal;
    });

    totalPedido.textContent = formatarPreco(total);
}

/* Abrir e fechar checkout */

irParaCheckout.addEventListener("click", function() {
    if (pedidos.length === 0) {
        return;
    }

    mensagemErro.textContent = "";
    checkoutContainer.classList.add("ativo");
    nomeCliente.focus();
});

function fecharJanelaCheckout() {
    checkoutContainer.classList.remove("ativo");
    mensagemErro.textContent = "";
}

fecharCheckout.addEventListener("click", fecharJanelaCheckout);
voltarCheckout.addEventListener("click", fecharJanelaCheckout);

/* Confirmar pedido */

confirmarPedido.addEventListener("click", async function() {
    const nome = nomeCliente.value.trim();
    const endereco = enderecoCliente.value.trim();
    const pagamento = formaPagamento.value;

    mensagemErro.textContent = "";

    if (pedidos.length === 0) {
        mensagemErro.textContent =
            "Adicione pelo menos um produto ao carrinho.";
        return;
    }

    if (!nome) {
        mensagemErro.textContent = "Digite seu nome.";
        nomeCliente.focus();
        return;
    }

    if (!endereco) {
        mensagemErro.textContent = "Digite seu endereço.";
        enderecoCliente.focus();
        return;
    }

    if (!pagamento) {
        mensagemErro.textContent =
            "Selecione uma forma de pagamento.";
        formaPagamento.focus();
        return;
    }

    const agrupados = {};

    pedidos.forEach(function(produto) {
        if (!agrupados[produto.nome]) {
            agrupados[produto.nome] = {
                nome: produto.nome,
                quantidade: 0
            };
        }

        agrupados[produto.nome].quantidade++;
    });

    const itens = Object.values(agrupados);

    confirmarPedido.disabled = true;
    confirmarPedido.textContent = "Salvando pedido...";

    try {
        const resposta = await fetch("/api/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                endereco: endereco,
                pagamento: pagamento,
                itens: itens
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                "Não foi possível salvar o pedido."
            );
        }

        fecharJanelaCheckout();

        pedidos = [];
        atualizarCarrinho();

        nomeCliente.value = "";
        enderecoCliente.value = "";
        formaPagamento.value = "";

        pedidoSucesso.classList.add("ativo");
        fecharSucesso.focus();

    } catch (erro) {
        mensagemErro.textContent =
            erro.message || "Erro ao conectar com o servidor.";
    } finally {
        confirmarPedido.disabled = false;
        confirmarPedido.textContent = "Confirmar pedido";
    }
});

/* Fechar confirmação */

fecharSucesso.addEventListener("click", function() {
    pedidoSucesso.classList.remove("ativo");
});

/* Iniciar loja */

carrinhoContainer.style.display = "none";
carregarProdutos();

/* Preparar a animação inicial */
window.addEventListener("load", function() {
    setTimeout(function() {
        document.body.classList.remove("animando");
    }, 1200);
});

/* Reduzir o cabeçalho ao rolar a página */
window.addEventListener("scroll", function() {
    if (window.scrollY > 30) {
        document.body.classList.add("loja-revelada");
    }
});
