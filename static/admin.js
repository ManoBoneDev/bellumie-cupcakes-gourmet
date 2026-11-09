
const listaPedidos = document.querySelector("#lista-pedidos");
const mensagem = document.querySelector("#mensagem");
const totalPedidos = document.querySelector("#total-pedidos");
const pedidosAndamento = document.querySelector("#pedidos-andamento");

const modalExcluir = document.querySelector("#modal-excluir");
const textoConfirmacao = document.querySelector("#texto-confirmacao");
const cancelarExclusao = document.querySelector("#cancelar-exclusao");
const confirmarExclusao = document.querySelector("#confirmar-exclusao");

let resolverConfirmacao = null;
let carregandoPedidos = false;
let atualizacaoAutomatica = null;

function pedirConfirmacaoExclusao(id) {
    textoConfirmacao.textContent = "Tem certeza que deseja excluir o pedido?";
    modalExcluir.classList.add("ativo");

    return new Promise((resolve) => {
        resolverConfirmacao = resolve;
    });
}

function fecharModalExclusao(resultado) {
    modalExcluir.classList.remove("ativo");

    if (resolverConfirmacao) {
        resolverConfirmacao(resultado);
        resolverConfirmacao = null;
    }
}

cancelarExclusao.addEventListener("click", () => fecharModalExclusao(false));
confirmarExclusao.addEventListener("click", () => fecharModalExclusao(true));

modalExcluir.addEventListener("click", (evento) => {
    if (evento.target === modalExcluir) fecharModalExclusao(false);
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && modalExcluir.classList.contains("ativo")) {
        fecharModalExclusao(false);
    }
});

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(valor) {
    if (!valor) return "Data não disponível";

    const data = new Date(String(valor).replace(" ", "T") + "Z");

    if (Number.isNaN(data.getTime())) return "Data não disponível";

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

async function lerResposta(resposta) {
    try {
        return await resposta.json();
    } catch {
        return {};
    }
}

function criarCampo(rotulo, valor) {
    const campo = document.createElement("div");
    campo.className = "pedido-campo";

    const titulo = document.createElement("span");
    titulo.textContent = rotulo;

    const conteudo = document.createElement("strong");
    conteudo.textContent = valor;

    campo.append(titulo, conteudo);
    return campo;
}

async function carregarPedidos() {
    if (carregandoPedidos) return;

    carregandoPedidos = true;

    // Guarda quais pedidos estavam abertos antes da atualização.
    const pedidosAbertos = new Set(
        [...listaPedidos.querySelectorAll(".pedido-expandir")]
            .filter(botao => botao.getAttribute("aria-expanded") === "true")
            .map(botao => botao.dataset.pedidoId)
    );

    try {
        const resposta = await fetch("/api/admin/pedidos", {
            cache: "no-store"
        });

        const pedidos = await lerResposta(resposta);

        if (!resposta.ok || !Array.isArray(pedidos)) {
            throw new Error("Não foi possível carregar os pedidos.");
        }

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

        pedidos.forEach((pedido) => {
            const cartao = document.createElement("article");
            cartao.className = "pedido";

            // Cabeçalho compacto
            const cabecalho = document.createElement("div");
            cabecalho.className = "cabecalho-pedido";

            const identificacao = document.createElement("div");
            identificacao.className = "pedido-identificacao";

            const titulo = document.createElement("h3");
            titulo.textContent = `Pedido #${pedido.numero}`;

            const dataResumo = document.createElement("span");
            dataResumo.textContent = formatarData(pedido.data);

            identificacao.append(titulo, dataResumo);

            const statusResumo = document.createElement("span");
            statusResumo.className = "pedido-status-resumo";
            statusResumo.textContent = pedido.status;

            cabecalho.append(identificacao, statusResumo);

            // Informações que aparecem sem expandir
            const resumo = document.createElement("div");
            resumo.className = "pedido-resumo";

            resumo.append(
                criarCampo("CLIENTE", pedido.nome || "Não informado"),
                criarCampo("CONTATO", pedido.telefone || "Não informado"),
                criarCampo("RECEBIMENTO", pedido.tipo_recebimento || "Não informado"),
                criarCampo("PAGAMENTO", pedido.pagamento || "Não informado")
            );

            const linhaInferior = document.createElement("div");
            linhaInferior.className = "pedido-linha-inferior";

            const totalResumo = document.createElement("strong");
            totalResumo.className = "pedido-total-resumo";
            totalResumo.textContent = formatarMoeda(pedido.total);

            const botaoDetalhes = document.createElement("button");
            botaoDetalhes.type = "button";
            botaoDetalhes.className = "pedido-expandir";
            botaoDetalhes.textContent = "Ver detalhes";
            botaoDetalhes.dataset.pedidoId = String(pedido.id);
            botaoDetalhes.setAttribute("aria-expanded", "false");

            linhaInferior.append(totalResumo, botaoDetalhes);

            // Área expansível
            const detalhes = document.createElement("div");
            detalhes.className = "pedido-conteudo";
            detalhes.hidden = true;

            const endereco = document.createElement("p");
            endereco.textContent = pedido.tipo_recebimento === "Retirada"
                ? "Retirada no local"
                : (pedido.endereco || "Não informado");

            const secaoEndereco = document.createElement("div");
            secaoEndereco.className = "pedido-detalhe-bloco";

            const tituloEndereco = document.createElement("h4");
            tituloEndereco.textContent = "Endereço";

            secaoEndereco.append(tituloEndereco, endereco);

            const secaoProdutos = document.createElement("div");
            secaoProdutos.className = "pedido-detalhe-bloco";

            const tituloProdutos = document.createElement("h4");
            tituloProdutos.textContent = "Produtos do pedido";

            const tabela = document.createElement("div");
            tabela.className = "pedido-lista-produtos";

            (pedido.itens || []).forEach(item => {
                const linha = document.createElement("div");
                linha.className = "pedido-produto-linha";

                const nomeProduto = document.createElement("span");
                nomeProduto.textContent = `${item.quantidade}x ${item.produto}`;

                linha.appendChild(nomeProduto);
                tabela.appendChild(linha);
            });

            secaoProdutos.append(tituloProdutos, tabela);

            const secaoPagamento = document.createElement("div");
            secaoPagamento.className = "pedido-detalhe-bloco";

            const tituloPagamento = document.createElement("h4");
            tituloPagamento.textContent = "Informações adicionais";

            const informacoesPagamento = document.createElement("p");
            informacoesPagamento.textContent = pedido.troco_para
                ? `Troco para: ${formatarMoeda(pedido.troco_para)}`
                : "Troco: Não solicitado";

            const observacoes = document.createElement("p");
            observacoes.textContent = `Observações: ${pedido.observacoes || "Nenhuma"}`;

            const taxa = document.createElement("p");
            taxa.textContent = `Taxa de entrega: ${formatarMoeda(pedido.taxa_entrega || 0)}`;

            secaoPagamento.append(
                tituloPagamento,
                informacoesPagamento,
                observacoes,
                taxa
            );

            // Controles de status
            const secaoStatus = document.createElement("div");
            secaoStatus.className = "pedido-acoes";

            const statusAtual = document.createElement("p");
            statusAtual.className = "status";
            statusAtual.textContent = `Status: ${pedido.status}`;

            const seletorStatus = document.createElement("select");
            seletorStatus.setAttribute(
                "aria-label",
                `Status do pedido ${pedido.numero}`
            );

            const statusDisponiveis = [
                "Recebido",
                "Em preparação",
                "Saiu para entrega",
                "Concluído"
            ];

            statusDisponiveis.forEach(status => {
                const opcao = document.createElement("option");
                opcao.value = status;
                opcao.textContent = status;
                opcao.selected = status === pedido.status;
                seletorStatus.appendChild(opcao);
            });

            const botaoStatus = document.createElement("button");
            botaoStatus.type = "button";
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

                    const resultado = await lerResposta(resposta);

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro || "Falha ao atualizar o status."
                        );
                    }

                    mensagem.textContent =
                        `Status do pedido #${pedido.numero} atualizado!`;

                    await carregarPedidos();

                } catch (erro) {
                    mensagem.textContent = erro.message;
                    botaoStatus.disabled = false;
                }
            });

            // Exclusão
            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir pedido";
            botaoExcluir.className = "botao-excluir";

            botaoExcluir.addEventListener("click", async () => {
                const confirmar = await pedirConfirmacaoExclusao(pedido.id);

                if (!confirmar) return;

                botaoExcluir.disabled = true;

                try {
                    const resposta = await fetch(
                        `/api/admin/pedidos/${pedido.id}`,
                        { method: "DELETE" }
                    );

                    const resultado = await lerResposta(resposta);

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro || "Não foi possível excluir o pedido."
                        );
                    }

                    mensagem.textContent =
                        `Pedido #${pedido.numero} excluído com sucesso!`;

                    await carregarPedidos();

                } catch (erro) {
                    mensagem.textContent = erro.message;
                    botaoExcluir.disabled = false;
                }
            });

            secaoStatus.append(statusAtual, seletorStatus, botaoStatus);

            detalhes.append(
                secaoEndereco,
                secaoProdutos,
                secaoPagamento,
                secaoStatus,
                botaoExcluir
            );

            // Abrir e fechar detalhes
            botaoDetalhes.addEventListener("click", () => {
                const aberto = botaoDetalhes.getAttribute("aria-expanded") === "true";

                botaoDetalhes.setAttribute("aria-expanded", String(!aberto));
                botaoDetalhes.textContent = aberto ? "Ver detalhes" : "Ocultar detalhes";
                detalhes.hidden = aberto;
            });

            cartao.append(
                cabecalho,
                resumo,
                linhaInferior,
                detalhes
            );

            listaPedidos.appendChild(cartao);

            // Mantém aberto após atualização automática, se já estava aberto.
            if (pedidosAbertos.has(String(pedido.id))) {
                botaoDetalhes.click();
            }
        });

    } catch (erro) {
        mensagem.textContent =
            "Erro ao carregar os pedidos. Confira se o servidor está funcionando.";

        console.error(erro);

    } finally {
        carregandoPedidos = false;
    }
}

listaPedidos.addEventListener("focusin", () => {
    clearInterval(atualizacaoAutomatica);
});

listaPedidos.addEventListener("focusout", () => {
    setTimeout(() => {
        if (!listaPedidos.contains(document.activeElement)) {
            iniciarAtualizacaoAutomatica();
        }
    }, 150);
});

function iniciarAtualizacaoAutomatica() {
    clearInterval(atualizacaoAutomatica);

    atualizacaoAutomatica = setInterval(() => {
        const modalAberto = modalExcluir.classList.contains("ativo");
        const painelEmUso = listaPedidos.contains(document.activeElement);

        if (!modalAberto && !painelEmUso) {
            carregarPedidos();
        }
    }, 5000);
}

carregarPedidos();
iniciarAtualizacaoAutomatica();
