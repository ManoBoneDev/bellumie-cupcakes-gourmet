
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
const telefoneCliente = document.getElementById("telefone-cliente");
const tipoRecebimento = document.getElementById("tipo-recebimento");
const grupoEndereco = document.getElementById("grupo-endereco");

const grupoTroco = document.getElementById("grupo-troco");
const precisaTroco = document.getElementById("precisa-troco");
const grupoValorTroco = document.getElementById("grupo-valor-troco");
const valorTroco = document.getElementById("valor-troco");

const observacoesCliente = document.getElementById("observacoes-cliente");

const resumoCheckoutItens = document.getElementById("resumo-checkout-itens");
const subtotalCheckout = document.getElementById("subtotal-checkout");
const taxaEntregaCheckout = document.getElementById("taxa-entrega-checkout");
const totalCheckout = document.getElementById("total-checkout");
const notificacaoProduto = document.getElementById("notificacao-produto");
const textoNotificacao = document.getElementById("texto-notificacao");

/* Elementos do modal de detalhes */

const modalDetalhesProduto = document.getElementById("modal-detalhes-produto");
const fecharDetalhesProduto = document.getElementById("fechar-detalhes-produto");
const detalheImagem = document.getElementById("detalhe-imagem");
const detalheNome = document.getElementById("detalhe-nome");
const detalhePreco = document.getElementById("detalhe-preco");
const detalheDescricao = document.getElementById("detalhe-descricao");
const detalheIngredientes = document.getElementById("detalhe-ingredientes");
const detalheAlergenicos = document.getElementById("detalhe-alergenicos");
const detalheAdicionar = document.getElementById("detalhe-adicionar");

let produtoDetalheAtual = null;
let temporizadorNotificacao;

/* Formatar preços */

function formatarPreco(preco) {
    return Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* Notificação temporária de produto adicionado */

function mostrarNotificacao(nomeProduto) {
    if (!notificacaoProduto || !textoNotificacao) {
        return;
    }

    clearTimeout(temporizadorNotificacao);

    textoNotificacao.textContent =
        "Cupcake de " + nomeProduto + " adicionado ao carrinho";

    notificacaoProduto.classList.add("visivel");

    temporizadorNotificacao = setTimeout(function() {
        notificacaoProduto.classList.remove("visivel");
    }, 2000);
}

/* Adicionar produto ao carrinho */

function adicionarAoCarrinho(produto) {
    pedidos.push({
        nome: produto.nome,
        preco: Number(produto.preco)
    });

    atualizarCarrinho();
    mostrarNotificacao(produto.nome);
}

let origemAnimacaoDetalhes = null;
let animacaoDetalhesAtual = null;
let fechandoDetalhes = false;

/* Abrir detalhes do cupcake */


function abrirDetalhesProduto(produto, card) {
    produtoDetalheAtual = produto;

    detalheImagem.src = `/static/imagens/${encodeURIComponent(produto.imagem)}`;
    detalheImagem.alt = produto.nome;
    detalheNome.textContent = produto.nome;
    detalhePreco.textContent = Number(produto.preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
    detalheDescricao.textContent = produto.descricao_detalhada || produto.descricao || "";
    detalheIngredientes.textContent = produto.ingredientes || "Não informado.";
    detalheAlergenicos.textContent = produto.alergenicos || "Não informado.";

    const conteudo = modalDetalhesProduto.querySelector(".modal-detalhes-conteudo");

    modalDetalhesProduto.classList.add("ativo");
    modalDetalhesProduto.classList.remove("fechando");

    conteudo.animate(
        [
            {
                transform: "scale(0.94) translateY(12px)"
            },
            {
                transform: "scale(1) translateY(0)"
            }
        ],
        {
            duration: 350,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        }
    );

    modalDetalhesProduto.animate(
        [
            { backgroundColor: "rgba(50, 20, 35, 0)" },
            { backgroundColor: "rgba(50, 20, 35, 0.65)" }
        ],
        {
            duration: 350,
            easing: "ease-out"
        }
    );
}


function fecharModalDetalhes() {
    if (fechandoDetalhes || !modalDetalhesProduto.classList.contains("ativo")) {
        return;
    }

    fechandoDetalhes = true;

    const conteudo = modalDetalhesProduto.querySelector(".modal-detalhes-conteudo");

    const animacaoFechamento = conteudo.animate(
        [
            {
                transform: "scale(1) translateY(0)"
            },
            {
                transform: "scale(0.96) translateY(8px)"
            }
        ],
        {
            duration: 250,
            easing: "ease-in"
        }
    );

    modalDetalhesProduto.animate(
        [
            { backgroundColor: "rgba(50, 20, 35, 0.65)" },
            { backgroundColor: "rgba(50, 20, 35, 0)" }
        ],
        {
            duration: 250,
            easing: "ease-in"
        }
    );

    animacaoFechamento.onfinish = function() {
        modalDetalhesProduto.classList.remove("ativo", "fechando");
        fechandoDetalhes = false;
    };
}


/* Eventos do modal de detalhes */

if (
    modalDetalhesProduto &&
    fecharDetalhesProduto &&
    detalheAdicionar
) {
    fecharDetalhesProduto.addEventListener("click", function() {
        fecharModalDetalhes();
    });

    modalDetalhesProduto.addEventListener("click", function(evento) {
        if (evento.target === modalDetalhesProduto) {
            fecharModalDetalhes();
        }
    });

    detalheAdicionar.addEventListener("click", function() {
        if (!produtoDetalheAtual) {
            return;
        }

        adicionarAoCarrinho(produtoDetalheAtual);
    });

    document.addEventListener("keydown", function(evento) {
        if (
            evento.key === "Escape" &&
            modalDetalhesProduto.classList.contains("ativo")
        ) {
            fecharModalDetalhes();
        }
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
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute(
                "aria-label",
                "Ver detalhes do cupcake de " + produto.nome
            );

            /* Imagem do produto */

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
                placeholder.setAttribute(
                    "aria-label",
                    "Imagem indisponível"
                );

                card.insertBefore(placeholder, card.firstChild);
            };

            /* Nome do produto */

            const titulo = document.createElement("h3");
            titulo.textContent = "Cupcake de " + produto.nome;

            /* Descrição resumida */

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao || "";

           /* Preço */

const preco = document.createElement("strong");
preco.textContent = formatarPreco(produto.preco);

/* Área rosa com preço e botão */

const acoesProduto = document.createElement("div");
acoesProduto.className = "produto-acoes";

/* Botão de adicionar ao carrinho */

const botao = document.createElement("button");
botao.type = "button";
botao.textContent = "Adicionar ao carrinho";

botao.addEventListener("click", function(evento) {
    evento.stopPropagation();
    adicionarAoCarrinho(produto);
});

/* Montar a faixa lateral */

acoesProduto.appendChild(preco);
acoesProduto.appendChild(botao);

/* Abrir detalhes ao clicar no card */

card.addEventListener("click", function() {
    abrirDetalhesProduto(produto, card);
});

/* Abrir detalhes usando Enter ou Espaço */

card.addEventListener("keydown", function(evento) {
    if (
        evento.target === card &&
        (evento.key === "Enter" || evento.key === " ")
    ) {
        evento.preventDefault();
        abrirDetalhesProduto(produto, card);
    }
});

card.appendChild(imagem);
card.appendChild(titulo);
card.appendChild(descricao);
card.appendChild(acoesProduto);

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

    const layoutPrincipal = document.querySelector("main.container");

    if (pedidos.length === 0) {
        layoutPrincipal.classList.remove("carrinho-visivel");
        carrinhoContainer.classList.remove("carrinho-aberto");

        totalPedido.textContent = formatarPreco(0);
        return;
    }

    layoutPrincipal.classList.add("carrinho-visivel");
    carrinhoContainer.classList.add("carrinho-aberto");

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

/* Atualizar resumo do checkout */

function atualizarResumoCheckout() {
    resumoCheckoutItens.innerHTML = "";

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

    let subtotal = 0;

    Object.values(produtosAgrupados).forEach(function(produto) {
        const linha = document.createElement("p");
        const valor = produto.preco * produto.quantidade;

        linha.textContent =
            produto.quantidade + "x " +
            produto.nome + " — " +
            formatarPreco(valor);

        resumoCheckoutItens.appendChild(linha);

        subtotal += valor;
    });

    const taxaEntrega =
        tipoRecebimento.value === "Entrega" ? 5 : 0;

    const total = subtotal + taxaEntrega;

    subtotalCheckout.textContent = formatarPreco(subtotal);
    taxaEntregaCheckout.textContent = formatarPreco(taxaEntrega);
    totalCheckout.textContent = formatarPreco(total);
}

/* Abrir e fechar checkout */

irParaCheckout.addEventListener("click", function() {
    if (pedidos.length === 0) {
        return;
    }

    mensagemErro.textContent = "";
    atualizarResumoCheckout();
    checkoutContainer.classList.add("ativo");
    nomeCliente.focus();
    });

function fecharJanelaCheckout() {
    checkoutContainer.classList.remove("ativo");
    mensagemErro.textContent = "";
}

fecharCheckout.addEventListener("click", fecharJanelaCheckout);
voltarCheckout.addEventListener("click", fecharJanelaCheckout);

// Mostra ou esconde o endereço conforme o recebimento escolhido.
tipoRecebimento.addEventListener("change", function () {
    const entregaSelecionada = tipoRecebimento.value === "Entrega";

    grupoEndereco.hidden = !entregaSelecionada;
    enderecoCliente.required = entregaSelecionada;

    atualizarResumoCheckout();
});

// Mostra a opção de troco somente para pagamento em dinheiro.
formaPagamento.addEventListener("change", function () {
    const pagamentoEmDinheiro = formaPagamento.value === "Dinheiro";

    grupoTroco.hidden = !pagamentoEmDinheiro;

    if (!pagamentoEmDinheiro) {
        precisaTroco.value = "Não";
        grupoValorTroco.hidden = true;
        valorTroco.value = "";
    }
});

// Mostra o campo de valor quando o cliente precisa de troco.
precisaTroco.addEventListener("change", function () {
    const querTroco = precisaTroco.value === "Sim";

    grupoValorTroco.hidden = !querTroco;

    if (!querTroco) {
        valorTroco.value = "";
    }
});

/* Confirmar pedido */

confirmarPedido.addEventListener("click", async function() {
    const nome = nomeCliente.value.trim();
    const telefone = telefoneCliente.value.trim();
    const endereco = enderecoCliente.value.trim();
    const recebimento = tipoRecebimento.value;
    const pagamento = formaPagamento.value;
    const observacoes = observacoesCliente.value.trim();

    const querTroco = precisaTroco.value === "Sim";
    const trocoPara = querTroco ? valorTroco.value : null;

    mensagemErro.textContent = "";

    if (pedidos.length === 0) {
        mensagemErro.textContent =
            "Adicione pelo menos um produto ao carrinho.";
        return;
    }

    if (!nome) {
        mensagemErro.textContent = "Digite seu nome completo.";
        nomeCliente.focus();
        return;
    }

    if (!telefone) {
        mensagemErro.textContent = "Digite seu telefone.";
        telefoneCliente.focus();
        return;
    }

    if (recebimento === "Entrega" && !endereco) {
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

    if (pagamento === "Dinheiro" && querTroco && (
        !trocoPara || Number(trocoPara) <= 0
    )) {
        mensagemErro.textContent =
            "Informe o valor para o qual precisa de troco.";
        valorTroco.focus();
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
                telefone: telefone,
                endereco: endereco,
                tipo_recebimento: recebimento,
                pagamento: pagamento,
                troco_para: trocoPara,
                observacoes: observacoes,
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
        telefoneCliente.value = "";
        enderecoCliente.value = "";
        tipoRecebimento.value = "Entrega";
        formaPagamento.value = "";
        precisaTroco.value = "Não";
        valorTroco.value = "";
        observacoesCliente.value = "";

        grupoEndereco.hidden = false;
        enderecoCliente.required = false;
        grupoTroco.hidden = true;
        grupoValorTroco.hidden = true;

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

document.querySelector("main.container").classList.remove("carrinho-visivel");
carrinhoContainer.classList.remove("carrinho-aberto");
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

/* Abrir e fechar a seção Sobre Nós */

const botaoAbrirSobre = document.getElementById("abrir-sobre");
const botaoFecharSobre = document.getElementById("fechar-sobre");
const secaoSobre = document.getElementById("sobre-nos");
const tituloProdutos = document.getElementById("titulo-produtos");

if (botaoAbrirSobre && botaoFecharSobre && secaoSobre) {
    botaoAbrirSobre.addEventListener("click", function() {
        secaoSobre.hidden = false;

        botaoAbrirSobre.setAttribute("aria-expanded", "true");

        secaoSobre.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    botaoFecharSobre.addEventListener("click", function() {
        secaoSobre.hidden = true;

        botaoAbrirSobre.setAttribute("aria-expanded", "false");

        if (tituloProdutos) {
            tituloProdutos.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}
