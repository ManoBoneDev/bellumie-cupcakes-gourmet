
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

// Controla a visualização das comandas em entrega.
document.addEventListener("click", (evento) => {
    const comandaClicada = evento.target.closest(".pedido-em-entrega");

    const comandaAberta = document.querySelector(
        ".pedido-em-entrega.pedido-revelado"
    );

    // Clicou dentro da mesma comanda: mantém aberta.
    if (comandaClicada === comandaAberta) {
        return;
    }

    // Fecha a comanda anterior.
    if (comandaAberta) {
        comandaAberta.classList.remove("pedido-revelado");
    }

    // Abre a nova comanda, caso tenha clicado em outra.
    if (comandaClicada) {
        comandaClicada.classList.add("pedido-revelado");
    }
});


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

// Mantém pedidos em entrega no final da fila.
pedidos.sort((a, b) => {
    const aEmEntrega = a.status === "Saiu para entrega";
    const bEmEntrega = b.status === "Saiu para entrega";

    return Number(aEmEntrega) - Number(bEmEntrega);
});

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

// Efeito especial para pedidos que saíram para entrega.
if (pedido.status === "Saiu para entrega") {
    cartao.classList.add("pedido-em-entrega");

    const desenhoMotoboy = document.createElement("div");
    desenhoMotoboy.className = "pedido-entrega-overlay";

    desenhoMotoboy.innerHTML = `
    <svg viewBox="0 0 240 165" aria-hidden="true">
        <g fill="none" stroke="#49332d"
           stroke-linecap="round" stroke-linejoin="round">

            <!-- Linhas de velocidade -->
            <g stroke-width="5">
                <path d="M12 83 H68"/>
                <path d="M3 98 H59"/>
                <path d="M20 113 H65"/>
                <path d="M35 128 H78"/>
                <path d="M42 68 H75"/>
            </g>

            <!-- Rodas -->
            <g stroke-width="10">
                <circle cx="78" cy="132" r="21"/>
                <circle cx="188" cy="132" r="21"/>
            </g>

            <!-- Caixa de entrega -->
            <path d="M48 45 Q48 41 53 41 H101
                     Q106 41 105 46 L97 91 H42 Z"
                  fill="#49332d" stroke="none"/>

            <!-- Estrutura e carenagem da moto -->
            <path d="M74 111 L98 93 L145 91
                     L171 110 L205 91
                     Q218 89 227 102
                     L201 119 H69 Z"
                  fill="#49332d" stroke="none"/>

            <!-- Banco -->
            <path d="M99 91 Q117 84 139 91"
                  stroke-width="9"/>

            <!-- Guidão e frente -->
            <path d="M166 73 L184 117"
                  stroke-width="9"/>
            <path d="M159 72 L184 68"
                  stroke-width="8"/>
            <path d="M178 65 L196 62"
                  stroke-width="6"/>

            <!-- Corpo do motoboy -->
            <path d="M111 78 Q118 54 133 40
                     Q143 34 150 47
                     L163 72 L177 77"
                  fill="#49332d" stroke="none"/>

            <!-- Braço -->
            <path d="M143 53 L166 70 L188 68"
                  stroke-width="12"/>

            <!-- Perna -->
            <path d="M133 77 L157 96 L142 125"
                  stroke-width="15"/>
            <path d="M124 79 L107 106 L91 119"
                  stroke-width="14"/>

            <!-- Cabeça -->
            <path d="M117 35
                     Q111 15 129 7
                     Q151 1 161 20
                     L164 29 L145 23
                     L140 39 Z"
                  fill="#49332d" stroke="none"/>

            <!-- Pescoço -->
            <path d="M132 36 L140 47"
                  stroke-width="9"/>

            <!-- Detalhe da viseira -->
            <path d="M143 25 L158 31"
                  stroke="#fffdf9" stroke-width="3"/>

        </g>
    </svg>

    <strong>SAIU PARA ENTREGA</strong>
    <span>Clique para visualizar a comanda</span>
`;

    cartao.appendChild(desenhoMotoboy);
}

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

            // Comanda visível no cartão do pedido.
const comanda = document.createElement("div");
comanda.className = "pedido-comanda";

const tituloComanda = document.createElement("h4");
tituloComanda.textContent = "Produtos do pedido";

const tabelaComanda = document.createElement("div");
tabelaComanda.className = "pedido-lista-produtos";

(pedido.itens || []).forEach(item => {
    const linha = document.createElement("div");
    linha.className = "pedido-produto-linha";

    const nomeProduto = document.createElement("span");
    nomeProduto.textContent = `${item.quantidade}x ${item.produto}`;

    linha.appendChild(nomeProduto);
    tabelaComanda.appendChild(linha);
});

comanda.append(tituloComanda, tabelaComanda);

// Observações ficam visíveis na comanda.
const observacoesComanda = document.createElement("div");
observacoesComanda.className = "pedido-observacoes";

const tituloObservacoes = document.createElement("strong");
tituloObservacoes.textContent = "Observações";

const textoObservacoes = document.createElement("p");
textoObservacoes.textContent = pedido.observacoes || "Nenhuma observação.";

observacoesComanda.append(tituloObservacoes, textoObservacoes);
comanda.appendChild(observacoesComanda);

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

            const secaoPagamento = document.createElement("div");
            secaoPagamento.className = "pedido-detalhe-bloco";

            const tituloPagamento = document.createElement("h4");
            tituloPagamento.textContent = "Informações adicionais";

            const informacoesPagamento = document.createElement("p");
            informacoesPagamento.textContent = pedido.troco_para
                ? `Troco para: ${formatarMoeda(pedido.troco_para)}`
                : "Troco: Não solicitado";


            const taxa = document.createElement("p");
            taxa.textContent = `Taxa de entrega: ${formatarMoeda(pedido.taxa_entrega || 0)}`;

            secaoPagamento.append(
                tituloPagamento,
                informacoesPagamento,
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
    comanda,
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
