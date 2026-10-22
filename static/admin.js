
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
    textoConfirmacao.textContent =
        "Tem certeza que deseja excluir o pedido?";

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

document.addEventListener("keydown", (evento) => {
    if (
        evento.key === "Escape" &&
        modalExcluir.classList.contains("ativo")
    ) {
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
    if (!valor) {
        return "Data não disponível";
    }

    const data = new Date(String(valor).replace(" ", "T") + "Z");

    if (Number.isNaN(data.getTime())) {
        return "Data não disponível";
    }

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

async function carregarPedidos() {
    if (carregandoPedidos) {
        return;
    }

    carregandoPedidos = true;

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

        pedidos.forEach((pedido, indice) => {
    const cartao = document.createElement("article");
    cartao.className = "pedido";

    const cabecalho = document.createElement("div");
    cabecalho.className = "cabecalho-pedido";

    const titulo = document.createElement("h3");
    titulo.textContent = `Pedido #${indice + 1}`;

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir pedido";
            botaoExcluir.className = "botao-excluir";

            cabecalho.append(titulo, botaoExcluir);

            const cliente = document.createElement("p");
            cliente.textContent = `Cliente: ${pedido.nome}`;

            const endereco = document.createElement("p");
            endereco.textContent = `Endereço: ${pedido.endereco}`;

            const pagamento = document.createElement("p");
            pagamento.textContent = `Pagamento: ${pedido.pagamento}`;

            const itens = document.createElement("p");
            itens.textContent = "Itens: " + (pedido.itens || [])
                .map(item => `${item.quantidade}x ${item.produto}`)
                .join(", ");

            const total = document.createElement("p");
            total.textContent = `Total: ${formatarMoeda(pedido.total)}`;

            const data = document.createElement("p");
            data.textContent = `Pedido realizado em ${formatarData(
                pedido.data
            )}`;

            const statusAtual = document.createElement("p");
            statusAtual.className = "status";
            statusAtual.textContent = `Status: ${pedido.status}`;

            const seletorStatus = document.createElement("select");
            seletorStatus.setAttribute(
                "aria-label",
                `Status do pedido ${pedido.id}`
            );

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
                            resultado.erro ||
                            "Falha ao atualizar o status."
                        );
                    }

                    pedido.status = seletorStatus.value;
                    statusAtual.textContent = `Status: ${pedido.status}`;

                    pedidosAndamento.textContent = pedidos.filter(
                        item => item.status !== "Concluído"
                    ).length;

                    mensagem.textContent =
                        `Status do pedido #${pedido.id} atualizado!`;

                } catch (erro) {
                    mensagem.textContent = erro.message;
                } finally {
                    botaoStatus.disabled = false;
                }
            });

            botaoExcluir.addEventListener("click", async () => {
                const confirmar = await pedirConfirmacaoExclusao(pedido.id);

                if (!confirmar) {
                    return;
                }

                botaoExcluir.disabled = true;

                try {
                    const resposta = await fetch(
                        `/api/admin/pedidos/${pedido.id}`,
                        { method: "DELETE" }
                    );

                    const resultado = await lerResposta(resposta);

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro ||
                            "Não foi possível excluir o pedido."
                        );
                    }

                    mensagem.textContent =
                        `Pedido #${pedido.id} excluído com sucesso!`;

                    await carregarPedidos();

                } catch (erro) {
                    mensagem.textContent = erro.message;
                    botaoExcluir.disabled = false;
                }
            });

            cartao.append(
                cabecalho,
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
