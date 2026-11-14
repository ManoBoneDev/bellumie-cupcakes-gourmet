
let pedidos = [];
let produtosDisponiveis = [];
let categoriaAtual = "Cupcakes";

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
let quantidadeDetalhe = 1;

/* Elementos das categorias */

const botoesCategoria = document.querySelectorAll(".botao-categoria");
const tituloProdutos = document.getElementById("titulo-produtos");

/* Controles de quantidade do modal */

const controleQuantidadeDetalhe = document.createElement("div");
controleQuantidadeDetalhe.className = "controle-quantidade controle-modal";

const diminuirDetalhe = document.createElement("button");
diminuirDetalhe.type = "button";
diminuirDetalhe.textContent = "−";

const quantidadeDetalheTexto = document.createElement("span");
quantidadeDetalheTexto.textContent = "1";

const aumentarDetalhe = document.createElement("button");
aumentarDetalhe.type = "button";
aumentarDetalhe.textContent = "+";

diminuirDetalhe.addEventListener("click", function() {
    if (quantidadeDetalhe > 1) {
        quantidadeDetalhe--;
        quantidadeDetalheTexto.textContent = quantidadeDetalhe;
    }
});

aumentarDetalhe.addEventListener("click", function() {
    quantidadeDetalhe++;
    quantidadeDetalheTexto.textContent = quantidadeDetalhe;
});

controleQuantidadeDetalhe.appendChild(diminuirDetalhe);
controleQuantidadeDetalhe.appendChild(quantidadeDetalheTexto);
controleQuantidadeDetalhe.appendChild(aumentarDetalhe);

if (detalheAdicionar) {
    detalheAdicionar.parentNode.insertBefore(
        controleQuantidadeDetalhe,
        detalheAdicionar
    );
}

/* Formatar preços */

function formatarPreco(preco) {
    return Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* Notificação temporária */

function mostrarNotificacao(nomeProduto) {
    if (!notificacaoProduto || !textoNotificacao) {
        return;
    }

    clearTimeout(temporizadorNotificacao);

    textoNotificacao.textContent = nomeProduto === ""
        ? "Adicione um produto para começar seu pedido."
        : nomeProduto + " adicionado ao carrinho";

    notificacaoProduto.classList.add("visivel");

    temporizadorNotificacao = setTimeout(function() {
        notificacaoProduto.classList.remove("visivel");
    }, 2000);
}

/* Adicionar produto ao carrinho */

function adicionarAoCarrinho(produto, quantidade = 1) {
    for (let i = 0; i < quantidade; i++) {
        pedidos.push({
            nome: produto.nome,
            preco: Number(produto.preco)
        });
    }

    atualizarCarrinho();
    mostrarNotificacao(produto.nome);
}

/* Abrir detalhes do produto */

function abrirDetalhesProduto(produto) {
    produtoDetalheAtual = produto;
    quantidadeDetalhe = 1;
    quantidadeDetalheTexto.textContent = "1";

    detalheImagem.src = `/static/imagens/${encodeURIComponent(produto.imagem)}`;
    detalheImagem.alt = produto.nome;
    detalheNome.textContent = produto.nome;
    detalhePreco.textContent = formatarPreco(produto.preco);

    detalheDescricao.textContent =
        produto.descricao_detalhada || produto.descricao || "";

    detalheIngredientes.textContent =
        produto.ingredientes || "Não informado.";

    detalheAlergenicos.textContent =
        produto.alergenicos || "Não informado.";

    const conteudo = modalDetalhesProduto.querySelector(
        ".modal-detalhes-conteudo"
    );

    modalDetalhesProduto.classList.add("ativo");
    modalDetalhesProduto.classList.remove("fechando");

    conteudo.animate(
        [
            { transform: "scale(0.94) translateY(12px)" },
            { transform: "scale(1) translateY(0)" }
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

/* Fechar detalhes do produto */

let fechandoDetalhes = false;

function fecharModalDetalhes() {
    if (
        fechandoDetalhes ||
        !modalDetalhesProduto.classList.contains("ativo")
    ) {
        return;
    }

    fechandoDetalhes = true;

    const conteudo = modalDetalhesProduto.querySelector(
        ".modal-detalhes-conteudo"
    );

    const animacaoFechamento = conteudo.animate(
        [
            { transform: "scale(1) translateY(0)" },
            { transform: "scale(0.96) translateY(8px)" }
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

        adicionarAoCarrinho(produtoDetalheAtual, quantidadeDetalhe);
        fecharModalDetalhes();
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

/* Criar cartão de produto */

function criarCardProduto(produto) {
    const card = document.createElement("div");

    card.className = "produto";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.setAttribute(
        "aria-label",
        "Ver detalhes de " + produto.nome
    );

    /* Imagem */

    const imagem = document.createElement("img");

    imagem.src =
        "/static/imagens/" + encodeURIComponent(produto.imagem);

    imagem.alt = produto.nome;

    imagem.onerror = function() {
        imagem.onerror = null;
        imagem.style.display = "none";

        const placeholder = document.createElement("div");

        placeholder.className = "imagem-placeholder";
        placeholder.textContent = "🍰";

        placeholder.setAttribute(
            "aria-label",
            "Imagem indisponível"
        );

        card.insertBefore(placeholder, card.firstChild);
    };

    /* Nome */

    const titulo = document.createElement("h3");
    titulo.textContent = produto.nome;

    /* Descrição */

    const descricao = document.createElement("p");
    descricao.textContent = produto.descricao || "";

    /* Área de ações */

    const acoesProduto = document.createElement("div");
    acoesProduto.className = "produto-acoes";

    /* Preço */

    const preco = document.createElement("strong");
    preco.textContent = formatarPreco(produto.preco);

    /* Controles de quantidade */

    let quantidadeCard = 1;

    const controleQuantidade = document.createElement("div");
    controleQuantidade.className = "controle-quantidade";

    const diminuir = document.createElement("button");
    diminuir.type = "button";
    diminuir.textContent = "−";
    diminuir.setAttribute("aria-label", "Diminuir quantidade");

    const quantidadeTexto = document.createElement("span");
    quantidadeTexto.textContent = quantidadeCard;

    const aumentar = document.createElement("button");
    aumentar.type = "button";
    aumentar.textContent = "+";
    aumentar.setAttribute("aria-label", "Aumentar quantidade");

    diminuir.addEventListener("click", function(evento) {
        evento.stopPropagation();

        if (quantidadeCard > 1) {
            quantidadeCard--;
            quantidadeTexto.textContent = quantidadeCard;
        }
    });

    aumentar.addEventListener("click", function(evento) {
        evento.stopPropagation();

        quantidadeCard++;
        quantidadeTexto.textContent = quantidadeCard;
    });

    controleQuantidade.appendChild(diminuir);
    controleQuantidade.appendChild(quantidadeTexto);
    controleQuantidade.appendChild(aumentar);

    /* Botão adicionar */

    const botao = document.createElement("button");

    botao.type = "button";
    botao.textContent = "Adicionar ao carrinho";

    botao.addEventListener("click", function(evento) {
        evento.stopPropagation();

        adicionarAoCarrinho(produto, quantidadeCard);

        quantidadeCard = 1;
        quantidadeTexto.textContent = quantidadeCard;
    });

    acoesProduto.appendChild(preco);
    acoesProduto.appendChild(controleQuantidade);
    acoesProduto.appendChild(botao);

    /* Abrir detalhes */

    card.addEventListener("click", function() {
        abrirDetalhesProduto(produto);
    });

    card.addEventListener("keydown", function(evento) {
        if (
            evento.target === card &&
            (evento.key === "Enter" || evento.key === " ")
        ) {
            evento.preventDefault();
            abrirDetalhesProduto(produto);
        }
    });

    card.appendChild(imagem);
    card.appendChild(titulo);
    card.appendChild(descricao);
    card.appendChild(acoesProduto);

    return card;
}

/* Mostrar produtos da categoria selecionada */

function mostrarProdutos(categoria) {
    categoriaAtual = categoria;

    listaProdutos.innerHTML = "";

    const produtosFiltrados = produtosDisponiveis.filter(function(produto) {
        return (produto.categoria || "Cupcakes") === categoria;
    });

    if (tituloProdutos) {
        tituloProdutos.textContent =
            categoria === "Cupcakes" ? "Nossos Cupcakes" :
            categoria === "Doces" ? "Nossos Doces" :
            "Nossas Bebidas";
    }

    if (produtosFiltrados.length === 0) {
        const mensagem = document.createElement("p");

        mensagem.className = "mensagem-categoria-vazia";
        mensagem.textContent =
            "Nenhum produto disponível nesta categoria no momento.";

        listaProdutos.appendChild(mensagem);
        return;
    }

    produtosFiltrados.forEach(function(produto) {
        listaProdutos.appendChild(criarCardProduto(produto));
    });
}

/* Selecionar categoria */

botoesCategoria.forEach(function(botao) {
    botao.addEventListener("click", function() {
        const categoria = botao.dataset.categoria;

        botoesCategoria.forEach(function(outroBotao) {
            outroBotao.classList.remove("ativo");
            outroBotao.setAttribute("aria-pressed", "false");
        });

        botao.classList.add("ativo");
        botao.setAttribute("aria-pressed", "true");

        mostrarProdutos(categoria);
    });
});

/* Carregar produtos */

async function carregarProdutos() {
    try {
        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        produtosDisponiveis = await resposta.json();

        mostrarProdutos(categoriaAtual);
        atualizarCarrinho();

    } catch (erro) {
        listaProdutos.textContent =
            "Erro ao carregar os produtos. Atualize a página e tente novamente.";

        console.error(erro);
    }
}

/* Atualizar carrinho */

function atualizarCarrinho() {
    listaPedidos.innerHTML = "";

    const contadorCarrinho = document.getElementById("contador-carrinho");

    if (contadorCarrinho) {
        contadorCarrinho.textContent = pedidos.length;
    }

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
        item.className = "item-carrinho";

        const texto = document.createElement("span");

        const subtotal = produto.preco * produto.quantidade;

        texto.textContent =
            produto.nome + " - " + formatarPreco(subtotal);

        const controles = document.createElement("div");
        controles.className = "controles-carrinho";

        /* Diminuir quantidade */

        const diminuir = document.createElement("button");
        diminuir.type = "button";
        diminuir.textContent = "−";
        diminuir.setAttribute("aria-label", "Diminuir quantidade");

        diminuir.addEventListener("click", function() {
            const indice = pedidos.findIndex(function(item) {
                return item.nome === produto.nome;
            });

            if (indice !== -1) {
                pedidos.splice(indice, 1);
            }

            atualizarCarrinho();
        });

        /* Mostrar quantidade */

        const quantidade = document.createElement("span");
        quantidade.textContent = produto.quantidade;

        /* Aumentar quantidade */

        const aumentar = document.createElement("button");
        aumentar.type = "button";
        aumentar.textContent = "+";
        aumentar.setAttribute("aria-label", "Aumentar quantidade");

        aumentar.addEventListener("click", function() {
            pedidos.push({
                nome: produto.nome,
                preco: produto.preco
            });

            atualizarCarrinho();
        });

        /* Remover produto */

        const remover = document.createElement("button");
        remover.type = "button";
        remover.textContent = "Remover";
        remover.className = "remover-item";

        remover.addEventListener("click", function() {
            pedidos = pedidos.filter(function(item) {
                return item.nome !== produto.nome;
            });

            atualizarCarrinho();
        });

        controles.appendChild(diminuir);
        controles.appendChild(quantidade);
        controles.appendChild(aumentar);

        item.appendChild(texto);
        item.appendChild(controles);
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

/* Abrir checkout */

irParaCheckout.addEventListener("click", function() {
    if (pedidos.length === 0) {
        return;
    }

    mensagemErro.textContent = "";

    atualizarResumoCheckout();

    checkoutContainer.classList.add("ativo");
    nomeCliente.focus();
});

/* Fechar checkout */

function fecharJanelaCheckout() {
    checkoutContainer.classList.remove("ativo");
    mensagemErro.textContent = "";
}

fecharCheckout.addEventListener("click", fecharJanelaCheckout);
voltarCheckout.addEventListener("click", fecharJanelaCheckout);

/* Endereço conforme recebimento */

tipoRecebimento.addEventListener("change", function() {
    const entregaSelecionada = tipoRecebimento.value === "Entrega";

    grupoEndereco.hidden = !entregaSelecionada;
    enderecoCliente.required = entregaSelecionada;

    atualizarResumoCheckout();
});

/* Opção de troco */

formaPagamento.addEventListener("change", function() {
    const pagamentoEmDinheiro = formaPagamento.value === "Dinheiro";

    grupoTroco.hidden = !pagamentoEmDinheiro;

    if (!pagamentoEmDinheiro) {
        precisaTroco.value = "Não";
        grupoValorTroco.hidden = true;
        valorTroco.value = "";
    }
});

precisaTroco.addEventListener("change", function() {
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

    if (
        pagamento === "Dinheiro" &&
        querTroco &&
        (!trocoPara || Number(trocoPara) <= 0)
    ) {
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

/* Botão do carrinho no menu */

const botaoCarrinhoMenu = document.getElementById("botao-carrinho");

if (botaoCarrinhoMenu) {
    botaoCarrinhoMenu.addEventListener("click", function() {
        const layoutPrincipal = document.querySelector("main.container");

        if (pedidos.length > 0) {
            const carrinhoEstaAberto =
                carrinhoContainer.classList.contains("carrinho-aberto");

            if (carrinhoEstaAberto) {
                carrinhoContainer.classList.remove("carrinho-aberto");
                layoutPrincipal.classList.remove("carrinho-visivel");

            } else {
                carrinhoContainer.classList.add("carrinho-aberto");
                layoutPrincipal.classList.add("carrinho-visivel");

                carrinhoContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        } else {
            const catalogo = document.getElementById("titulo-produtos");

            if (catalogo) {
                catalogo.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            mostrarNotificacao("");
        }
    });
}

/* Iniciar loja */

document.querySelector("main.container").classList.remove("carrinho-visivel");
carrinhoContainer.classList.remove("carrinho-aberto");

carregarProdutos();

/* Animação inicial */

window.addEventListener("load", function() {
    setTimeout(function() {
        document.body.classList.remove("animando");
    }, 1200);
});

/* Reduzir cabeçalho ao rolar */

window.addEventListener("scroll", function() {
    if (window.scrollY > 30) {
        document.body.classList.add("loja-revelada");
    }
});

/* Abrir e fechar Sobre Nós */

const botaoAbrirSobre = document.getElementById("abrir-sobre");
const botaoFecharSobre = document.getElementById("fechar-sobre");
const secaoSobre = document.getElementById("sobre-nos");

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
