const listaPedidos = document.querySelector("#lista-pedidos");
const mensagem = document.querySelector("#mensagem");
const totalPedidos = document.querySelector("#total-pedidos");
const pedidosAndamento = document.querySelector("#pedidos-andamento");

// Elementos da janela de confirmação
const modalExcluir = document.querySelector("#modal-excluir");
const textoConfirmacao = document.querySelector("#texto-confirmacao");
const cancelarExclusao = document.querySelector("#cancelar-exclusao");
const confirmarExclusao = document.querySelector("#confirmar-exclusao");

let resolverConfirmacao = null;
let carregandoPedidos = false;

// Abre a janela de confirmação
function pedirConfirmacaoExclusao(id) {
    textoConfirmacao.textContent =
        `Tem certeza que deseja excluir esse pedido?`;

    modalExcluir.classList.add("ativo");

    return new Promise((resolve) => {
        resolverConfirmacao = resolve;
    });
}

// Fecha a janela de confirmação
function fecharModalExclusao(resultado) {
    modalExcluir.classList.remove("ativo");

    if (resolverConfirmacao) {
        resolverConfirmacao(resultado);
        resolverConfirmacao = null;
    }
}

cancelarExclusao.addEventListener("click", () => {
    fecharModalExclusao(false);
});

confirmarExclusao.addEventListener("click", () => {
    fecharModalExclusao(true);
});

modalExcluir.addEventListener("click", (evento) => {
    if (evento.target === modalExcluir) {
        fecharModalExclusao(false);
    }
});

// Carrega os pedidos
async function carregarPedidos() {
    if (carregandoPedidos) {
        return;
    }

    carregandoPedidos = true;

    try {
        const resposta = await fetch("/api/admin/pedidos");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os pedidos.");
        }

        const pedidos = await resposta.json();

        totalPedidos.textContent = pedidos.length;

        pedidosAndamento.textContent = pedidos.filter(
            pedido => pedido.status !== "Concluído"
        ).length;

        listaPedidos.replaceChildren();

        if (pedidos.length === 0) {
            mensagem.textContent = "Nenhum pedido foi realizado ainda.";
            return;
        }

        mensagem.textContent = "";

        pedidos.forEach((pedido, indice) => {
            const cartao = document.createElement("article");
            cartao.className = "pedido";

            // Cabeçalho com número e botão de exclusão
            const cabecalhoPedido = document.createElement("div");
            cabecalhoPedido.className = "cabecalho-pedido";

            const titulo = document.createElement("h3");
            titulo.textContent = `Pedido #${indice + 1}`;

            const botaoExcluir = document.createElement("button");
            botaoExcluir.textContent = "Excluir pedido";
            botaoExcluir.className = "botao-excluir";

            cabecalhoPedido.append(titulo, botaoExcluir);

            const cliente = document.createElement("p");
            cliente.textContent = `Cliente: ${pedido.nome}`;

            const endereco = document.createElement("p");
            endereco.textContent = `Endereço: ${pedido.endereco}`;

            const pagamento = document.createElement("p");
            pagamento.textContent = `Pagamento: ${pedido.pagamento}`;

            const itens = document.createElement("p");
            itens.textContent = "Itens: " + pedido.itens
                .map(item => `${item.quantidade}x ${item.produto}`)
                .join(", ");

            const total = document.createElement("p");
            total.textContent = `Total: ${Number(pedido.total).toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            )}`;

            const data = document.createElement("p");
            const dataPedido = new Date(pedido.data.replace(" ", "T"));

data.textContent = `Pedido realizado em ${dataPedido.toLocaleDateString(
    "pt-BR"
)} às ${dataPedido.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
})}`;

            const statusAtual = document.createElement("p");
            statusAtual.className = "status";
            statusAtual.textContent = `Status: ${pedido.status}`;

            const seletorStatus = document.createElement("select");

            const statusDisponiveis = [
                "Recebido",
                "Em preparação",
                "Saiu para entrega",
                "Concluído"
            ];

            statusDisponiveis.forEach((status) => {
                const opcao = document.createElement("option");
                opcao.value = status;
                opcao.textContent = status;
                opcao.selected = status === pedido.status;
                seletorStatus.appendChild(opcao);
            });

            // Atualizar status
            const botaoStatus = document.createElement("button");
            botaoStatus.textContent = "Salvar status";

            botaoStatus.addEventListener("click", async () => {
                botaoStatus.disabled = true;

                try {
                    const resposta = await fetch(
                        `/api/admin/pedidos/${pedido.id}/status`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                status: seletorStatus.value
                            })
                        }
                    );

                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro || "Falha ao atualizar."
                        );
                    }

                    statusAtual.textContent =
                        `Status: ${seletorStatus.value}`;

                    pedido.status = seletorStatus.value;

                    pedidosAndamento.textContent = pedidos.filter(
                        item => item.status !== "Concluído"
                    ).length;

                    mensagem.textContent =
                        `Pedido #${indice + 1} atualizado com sucesso!`;

                } catch (erro) {
                    mensagem.textContent = erro.message;
                } finally {
                    botaoStatus.disabled = false;
                }
            });

            // Excluir pedido com confirmação personalizada
            botaoExcluir.addEventListener("click", async () => {
                const confirmar = await pedirConfirmacaoExclusao(pedido.id);

                if (!confirmar) {
                    return;
                }

                botaoExcluir.disabled = true;

                try {
                    const resposta = await fetch(
                        `/api/admin/pedidos/${pedido.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro ||
                            "Não foi possível excluir o pedido."
                        );
                    }

                    mensagem.textContent =
                        `Pedido #${indice + 1} excluído com sucesso!`;

                    await carregarPedidos();

                } catch (erro) {
                    mensagem.textContent = erro.message;
                    botaoExcluir.disabled = false;
                }
            });

            cartao.append(
                cabecalhoPedido,
                cliente,
                endereco,
                pagamento,
                itens,
                total,
                data,
                statusAtual,
                seletorStatus,
                botaoStatus
            );

            listaPedidos.appendChild(cartao);
        });

    } catch (erro) {
        mensagem.textContent =
            "Erro ao carregar os pedidos. Confira se o servidor está funcionando.";

        console.error(erro);

    } finally {
        carregandoPedidos = false;
    }
}

// Carregamento inicial
carregarPedidos();

// Pausa a atualização automática enquanto o usuário interage
let interagindoComPainel = false;

listaPedidos.addEventListener("focusin", () => {
    interagindoComPainel = true;
});

listaPedidos.addEventListener("focusout", () => {
    setTimeout(() => {
        interagindoComPainel =
            listaPedidos.contains(document.activeElement);
    }, 100);
});

// Atualização automática a cada 5 segundos
setInterval(() => {
    const modalAberto = modalExcluir.classList.contains("ativo");

    if (!interagindoComPainel && !modalAberto) {
        carregarPedidos();
    }
}, 5000);


// Carregamento e gerenciamento dos produtos
const listaProdutos = document.querySelector("#lista-produtos");
const mensagemProdutos = document.querySelector("#mensagem-produtos");

async function carregarProdutos() {
    if (!listaProdutos || !mensagemProdutos) {
        return;
    }

    try {
        const resposta = await fetch("/api/admin/produtos");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        const produtos = await resposta.json();

        listaProdutos.replaceChildren();

        if (produtos.length === 0) {
            mensagemProdutos.textContent = "Nenhum cupcake cadastrado.";
            return;
        }

        mensagemProdutos.textContent = "";

        produtos.forEach((produto) => {
            const cartao = document.createElement("article");
            cartao.className = "produto-admin";

            // Prévia da foto
            const imagem = document.createElement("img");
            imagem.className = "foto-produto-admin";
            imagem.src = `/static/imagens/${encodeURIComponent(produto.imagem)}`;
            imagem.alt = `Foto do cupcake ${produto.nome}`;
            imagem.loading = "lazy";

            imagem.addEventListener("error", () => {
                imagem.alt = "Foto do cupcake indisponível";
            });

            // Informações do produto
            const informacoes = document.createElement("div");
            informacoes.className = "informacoes-produto-admin";

            const titulo = document.createElement("h4");
            titulo.textContent = produto.nome;

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao;

            const preco = document.createElement("p");
            preco.className = "preco-produto-admin";
            preco.textContent = Number(produto.preco).toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );

            const situacao = document.createElement("p");
            situacao.textContent = produto.ativo ? "Ativo" : "Inativo";

            // Botão para escolher uma nova foto
            const botaoTrocarFoto = document.createElement("button");
            botaoTrocarFoto.type = "button";
            botaoTrocarFoto.textContent = "Trocar foto";

            const seletorArquivo = document.createElement("input");
            seletorArquivo.type = "file";
            seletorArquivo.accept = ".jpg,.jpeg,.png,.webp";
            seletorArquivo.hidden = true;
            seletorArquivo.setAttribute(
                "aria-label",
                `Escolher nova foto para ${produto.nome}`
            );

            botaoTrocarFoto.addEventListener("click", () => {
                seletorArquivo.click();
            });

            seletorArquivo.addEventListener("change", async () => {
                const arquivo = seletorArquivo.files[0];

                if (!arquivo) {
                    return;
                }

                const extensao = arquivo.name
                    .slice(arquivo.name.lastIndexOf("."))
                    .toLowerCase();

                const extensoesPermitidas = [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                ];

                if (!extensoesPermitidas.includes(extensao)) {
                    mensagemProdutos.textContent =
                        "Escolha uma imagem JPG, JPEG, PNG ou WEBP.";
                    seletorArquivo.value = "";
                    return;
                }

                botaoTrocarFoto.disabled = true;
                botaoTrocarFoto.textContent = "Enviando foto...";

                try {
                    const dados = new FormData();
                    dados.append("imagem", arquivo);

                    const resposta = await fetch(
                        `/api/admin/produtos/${produto.id}/imagem`,
                        {
                            method: "PUT",
                            body: dados
                        }
                    );

                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro || "Não foi possível trocar a foto."
                        );
                    }

                    // Atualiza a prévia sem precisar recarregar a página.
                    produto.imagem = resultado.imagem;
                    imagem.src =
                        `/static/imagens/${encodeURIComponent(produto.imagem)}`;

                    mensagemProdutos.textContent =
                        `Foto do cupcake "${produto.nome}" atualizada com sucesso!`;

                } catch (erro) {
                    mensagemProdutos.textContent = erro.message;

                } finally {
                    botaoTrocarFoto.disabled = false;
                    botaoTrocarFoto.textContent = "Trocar foto";
                    seletorArquivo.value = "";
                }
            });

            informacoes.append(
                titulo,
                descricao,
                preco,
                situacao,
                botaoTrocarFoto,
                seletorArquivo
            );

            cartao.append(imagem, informacoes);
            listaProdutos.appendChild(cartao);
        });

    } catch (erro) {
        mensagemProdutos.textContent =
            "Erro ao carregar os cupcakes. Confira se o servidor está funcionando.";

        console.error(erro);
    }
}

carregarProdutos();