
const listaProdutos = document.querySelector("#lista-produtos");
const botoesCategoria = document.querySelectorAll(".categoria-admin");

let categoriaAtual = "Cupcakes";
const mensagemProdutos = document.querySelector("#mensagem-produtos");

const formularioProduto = document.querySelector("#form-produto");
const campoId = document.querySelector("#produto-id");
const campoNome = document.querySelector("#nome-produto");
const campoCategoria = document.querySelector("#categoria-produto");
const campoDescricao = document.querySelector("#descricao-produto");
const campoDescricaoDetalhada = document.querySelector("#descricao-detalhada-produto");
const campoIngredientes = document.querySelector("#ingredientes-produto");
const campoAlergenicos = document.querySelector("#alergenicos-produto");
const campoPreco = document.querySelector("#preco-produto");
const campoImagem = document.querySelector("#imagem-produto");
const campoImagemContainer = document.querySelector("#campo-imagem-produto");
const nomeArquivoImagem = document.querySelector("#nome-arquivo-imagem");

const botaoSalvar = document.querySelector("#botao-salvar-produto");
const botaoCancelarEdicao = document.querySelector("#botao-cancelar-edicao");
const botaoCancelarCadastro = document.querySelector("#botao-cancelar-cadastro");

const tituloFormulario = document.querySelector("#titulo-formulario");
const subtituloFormulario = document.querySelector("#subtitulo-formulario");
const erroFormulario = document.querySelector("#erro-formulario-produto");

const modalProduto = document.querySelector("#modal-produto");
const botaoAbrirCadastro = document.querySelector("#botao-abrir-cadastro");
const botaoFecharModal = document.querySelector("#botao-fechar-modal");

const sucessoProduto = document.querySelector("#sucesso-produto");
const tituloSucessoProduto = document.querySelector("#titulo-sucesso-produto");
const textoSucessoProduto = document.querySelector("#texto-sucesso-produto");
const botaoSucessoOk = document.querySelector("#botao-sucesso-ok");

const modalExcluir = document.querySelector("#modal-excluir");
const nomeCupcakeExcluir = document.querySelector("#nome-cupcake-excluir");
const botaoCancelarExclusao = document.querySelector("#cancelar-exclusao");
const botaoConfirmarExclusao = document.querySelector("#confirmar-exclusao");

const extensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];

// Editor de recorte de imagens
const modalRecorte = document.querySelector("#modal-recorte");
const canvasRecorte = document.querySelector("#canvas-recorte");
const contextoRecorte = canvasRecorte.getContext("2d");
const zoomRecorte = document.querySelector("#zoom-recorte");
const erroRecorte = document.querySelector("#erro-recorte");
const botaoConfirmarRecorte = document.querySelector("#confirmar-recorte");

// Elementos da pré-visualização dos cards
const previewImagemNormal = document.querySelector("#preview-imagem-normal");
const previewImagemComprimida = document.querySelector("#preview-imagem-comprimida");

const previewNomeNormal = document.querySelector("#preview-nome-normal");
const previewNomeComprimido = document.querySelector("#preview-nome-comprimido");

const previewDescricaoNormal = document.querySelector("#preview-descricao-normal");
const previewDescricaoComprimida = document.querySelector("#preview-descricao-comprimida");

const previewPrecoNormal = document.querySelector("#preview-preco-normal");
const previewPrecoComprimido = document.querySelector("#preview-preco-comprimido");

let dadosProdutoPreview = {
    nome: "Nome do produto",
    descricao: "Descrição do produto aparecerá aqui.",
    preco: "R$ 0,00"
};

function atualizarTextoPreview() {
    const formularioEstaAberto = modalProduto.classList.contains("aberto");

    const nome = formularioEstaAberto
        ? campoNome.value.trim() || dadosProdutoPreview.nome
        : dadosProdutoPreview.nome;

    const descricao = formularioEstaAberto
        ? campoDescricao.value.trim() || dadosProdutoPreview.descricao
        : dadosProdutoPreview.descricao;

    const preco = formularioEstaAberto && campoPreco.value.trim()
        ? formatarMoeda(Number(campoPreco.value))
        : dadosProdutoPreview.preco;

    previewNomeNormal.textContent = nome;
    previewNomeComprimido.textContent = nome;

    previewDescricaoNormal.textContent = descricao;
    previewDescricaoComprimida.textContent = descricao;

    previewPrecoNormal.textContent = preco;
    previewPrecoComprimido.textContent = preco;
}

function atualizarImagemPreview() {
    if (!imagemOriginal) return;

    const imagemAtual = canvasRecorte.toDataURL("image/jpeg", 0.9);

    previewImagemNormal.src = imagemAtual;
    previewImagemComprimida.src = imagemAtual;
}

// Atualizar os textos enquanto o funcionário preenche o formulário
campoNome.addEventListener("input", atualizarTextoPreview);
campoDescricao.addEventListener("input", atualizarTextoPreview);
campoPreco.addEventListener("input", atualizarTextoPreview);

let imagemOriginal = null;
let arquivoRecortado = null;
let arquivoPendente = null;
let acaoAposRecorte = null;

let zoomAtual = 1;
let posicaoX = 0;
let posicaoY = 0;
let arrastandoImagem = false;
let ponteiroAnteriorX = 0;
let ponteiroAnteriorY = 0;

const TAMANHO_RECORTE = 400;


function desenharRecorte() {
    if (!imagemOriginal) return;

    const escalaBase = Math.max(
        TAMANHO_RECORTE / imagemOriginal.naturalWidth,
        TAMANHO_RECORTE / imagemOriginal.naturalHeight
    );

    const escala = escalaBase * zoomAtual;

    const largura = imagemOriginal.naturalWidth * escala;
    const altura = imagemOriginal.naturalHeight * escala;

    const limiteX = Math.max(0, (largura - TAMANHO_RECORTE) / 2);
    const limiteY = Math.max(0, (altura - TAMANHO_RECORTE) / 2);

    posicaoX = Math.min(limiteX, Math.max(-limiteX, posicaoX));
    posicaoY = Math.min(limiteY, Math.max(-limiteY, posicaoY));

    contextoRecorte.clearRect(
        0,
        0,
        TAMANHO_RECORTE,
        TAMANHO_RECORTE
    );

    contextoRecorte.drawImage(
        imagemOriginal,
        (TAMANHO_RECORTE - largura) / 2 + posicaoX,
        (TAMANHO_RECORTE - altura) / 2 + posicaoY,
        largura,
        altura
    );

    // Atualiza os dois cards com o enquadramento atual
    atualizarImagemPreview();
}

function abrirEditorRecorte(arquivo, aoConfirmar, produtoPreview = null) {
    if (!arquivo || !arquivo.type.startsWith("image/")) {
        mostrarMensagem("Selecione um arquivo de imagem válido.");
        return;
    }

    arquivoPendente = arquivo;
    acaoAposRecorte = aoConfirmar;
    erroRecorte.textContent = "";

if (produtoPreview) {
    dadosProdutoPreview = {
        nome: produtoPreview.nome || "Nome do produto",
        descricao: produtoPreview.descricao || "Descrição do produto aparecerá aqui.",
        preco: formatarMoeda(Number(produtoPreview.preco) || 0)
    };

} else {
    dadosProdutoPreview = {
        nome: "Nome do produto",
        descricao: "Descrição do produto aparecerá aqui.",
        preco: "R$ 0,00"
    };
}

atualizarTextoPreview();

    const leitor = new FileReader();

    leitor.onload = () => {
        const imagem = new Image();

        imagem.onload = () => {
            imagemOriginal = imagem;
            zoomAtual = 1;
            posicaoX = 0;
            posicaoY = 0;
            zoomRecorte.value = "1";

            desenharRecorte();
            abrirModal(modalRecorte);
        };

        imagem.onerror = () => {
            erroRecorte.textContent = "Não foi possível abrir essa imagem.";
        };

        imagem.src = leitor.result;
    };

    leitor.onerror = () => {
        erroRecorte.textContent = "Não foi possível ler o arquivo selecionado.";
    };

    leitor.readAsDataURL(arquivo);
}

function fecharEditorRecorte() {
    fecharModal(modalRecorte);

    imagemOriginal = null;
    arquivoPendente = null;
    acaoAposRecorte = null;
    arrastandoImagem = false;
}

zoomRecorte.addEventListener("input", () => {
    zoomAtual = Number(zoomRecorte.value);
    desenharRecorte();
});

canvasRecorte.addEventListener("pointerdown", evento => {
    if (!imagemOriginal) return;

    arrastandoImagem = true;
    ponteiroAnteriorX = evento.clientX;
    ponteiroAnteriorY = evento.clientY;

    canvasRecorte.setPointerCapture(evento.pointerId);
});

canvasRecorte.addEventListener("pointermove", evento => {
    if (!arrastandoImagem) return;

    const escalaX = canvasRecorte.width / canvasRecorte.clientWidth;
    const escalaY = canvasRecorte.height / canvasRecorte.clientHeight;

    posicaoX += (evento.clientX - ponteiroAnteriorX) * escalaX;
    posicaoY += (evento.clientY - ponteiroAnteriorY) * escalaY;

    ponteiroAnteriorX = evento.clientX;
    ponteiroAnteriorY = evento.clientY;

    desenharRecorte();
});

canvasRecorte.addEventListener("pointerup", () => {
    arrastandoImagem = false;
});

canvasRecorte.addEventListener("pointercancel", () => {
    arrastandoImagem = false;
});

document.querySelector("#fechar-recorte").addEventListener("click", fecharEditorRecorte);
document.querySelector("#cancelar-recorte").addEventListener("click", fecharEditorRecorte);

modalRecorte.addEventListener("click", evento => {
    if (evento.target === modalRecorte) {
        fecharEditorRecorte();
    }
});

botaoConfirmarRecorte.addEventListener("click", () => {
    if (!imagemOriginal || !arquivoPendente || !acaoAposRecorte) {
        return;
    }

    botaoConfirmarRecorte.disabled = true;
    botaoConfirmarRecorte.textContent = "Preparando imagem...";

    canvasRecorte.toBlob(blob => {
        botaoConfirmarRecorte.disabled = false;
        botaoConfirmarRecorte.textContent = "Confirmar recorte";

        if (!blob) {
            erroRecorte.textContent = "Não foi possível gerar o recorte.";
            return;
        }

        const nome = arquivoPendente.name.replace(/\.[^.]+$/, "");

        arquivoRecortado = new File(
            [blob],
            `${nome}-recortado.jpg`,
            { type: "image/jpeg" }
        );

        const callback = acaoAposRecorte;

        fecharEditorRecorte();
        callback(arquivoRecortado);
    }, "image/jpeg", 0.92);
});

let modoFormulario = "cadastro";

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function lerResposta(resposta) {
    try {
        return await resposta.json();
    } catch {
        return {};
    }
}

function mostrarMensagem(texto) {
    mensagemProdutos.textContent = texto;
}

function abrirModal(modal) {
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function fecharModal(modal) {
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");

    const algumAberto = [
    modalProduto,
    modalExcluir,
    modalRecorte
].some(item => item.classList.contains("aberto"));

    if (!algumAberto) {
        document.body.style.overflow = "";
    }
}

function limparFormularioProduto() {
    formularioProduto.reset();
    arquivoRecortado = null;
    campoId.value = "";
    nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
    erroFormulario.textContent = "";
    modoFormulario = "cadastro";

    tituloFormulario.textContent = "Cadastrar novo produto";
    subtituloFormulario.textContent = "Preencha os dados do produto.";

    botaoSalvar.textContent = "Finalizar cadastro";
    botaoCancelarCadastro.hidden = false;
    botaoCancelarEdicao.hidden = true;

    campoImagemContainer.hidden = false;
    campoImagem.required = true;
}

function abrirCadastro() {
    limparFormularioProduto();

    formularioProduto.hidden = false;
    sucessoProduto.hidden = true;

    mostrarMensagem("");
    abrirModal(modalProduto);
    campoNome.focus();
}

function abrirEdicao(produto) {
    limparFormularioProduto();

    modoFormulario = "edicao";

    campoId.value = produto.id;
    campoNome.value = produto.nome || "";
    campoCategoria.value = produto.categoria || "Cupcakes";
    campoDescricao.value = produto.descricao || "";
    campoDescricaoDetalhada.value = produto.descricao_detalhada || "";
    campoIngredientes.value = produto.ingredientes || "";
    campoAlergenicos.value = produto.alergenicos || "";
    campoPreco.value = Number(produto.preco).toFixed(2);

    tituloFormulario.textContent = "Editar informações do produto";
    subtituloFormulario.textContent =
        `Atualize as informações de ${produto.nome}.`;

    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelarCadastro.hidden = true;
    botaoCancelarEdicao.hidden = false;

    // A foto continua sendo alterada pelo botão "Trocar foto".
    campoImagemContainer.hidden = true;
    campoImagem.required = false;

    formularioProduto.hidden = false;
    sucessoProduto.hidden = true;

    mostrarMensagem("");
    abrirModal(modalProduto);
    campoNome.focus();
}

botaoAbrirCadastro.addEventListener("click", abrirCadastro);

botaoFecharModal.addEventListener("click", () => {
    fecharModal(modalProduto);
});

botaoCancelarCadastro.addEventListener("click", () => {
    fecharModal(modalProduto);
});

botaoCancelarEdicao.addEventListener("click", () => {
    fecharModal(modalProduto);
});

botaoSucessoOk.addEventListener("click", () => {
    fecharModal(modalProduto);
});

modalProduto.addEventListener("click", evento => {
    if (evento.target === modalProduto) {
        fecharModal(modalProduto);
    }
});


campoImagem.addEventListener("change", () => {
    const arquivo = campoImagem.files[0];

    if (!arquivo) {
        arquivoRecortado = null;
        nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
        return;
    }

    const erro = validarImagem(arquivo);

    if (erro) {
        campoImagem.value = "";
        arquivoRecortado = null;
        nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
        erroFormulario.textContent = erro;
        return;
    }

    abrirEditorRecorte(arquivo, imagem => {
        arquivoRecortado = imagem;
        nomeArquivoImagem.textContent =
            "Imagem recortada e pronta para cadastro.";
        erroFormulario.textContent = "";
    });
});


function validarImagem(arquivo) {
    if (!arquivo) {
        return "Escolha uma imagem.";
    }

    const ponto = arquivo.name.lastIndexOf(".");
    const extensao = ponto >= 0
        ? arquivo.name.slice(ponto).toLowerCase()
        : "";

    if (!extensoesPermitidas.includes(extensao)) {
        return "Use uma imagem JPG, JPEG, PNG ou WEBP.";
    }

    return "";
}

function criarImagem(produto) {
    const imagem = document.createElement("img");

    imagem.className = "foto-produto-admin";
    imagem.src = `/static/imagens/${encodeURIComponent(produto.imagem)}`;
    imagem.alt = `Foto do produto ${produto.nome}`;
    imagem.loading = "lazy";

    imagem.addEventListener("error", () => {
        imagem.alt = `Imagem indisponível: ${produto.nome}`;
        imagem.classList.add("imagem-indisponivel");
    });

    return imagem;
}

async function carregarProdutos() {
    try {
        const resposta = await fetch("/api/admin/produtos", {
            cache: "no-store"
        });

        const produtos = await lerResposta(resposta);

        if (!resposta.ok || !Array.isArray(produtos)) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        listaProdutos.replaceChildren();

        const produtosFiltrados = produtos.filter(produto =>
    (produto.categoria || "Cupcakes") === categoriaAtual
);

if (produtosFiltrados.length === 0) {
    listaProdutos.replaceChildren();
    mostrarMensagem(`Nenhum produto cadastrado na categoria ${categoriaAtual}.`);
    return;
}

mostrarMensagem("");

produtosFiltrados.forEach(produto => {
            const cartao = document.createElement("article");
            cartao.className = "produto-admin";

            const imagem = criarImagem(produto);

            const informacoes = document.createElement("div");
            informacoes.className = "informacoes-produto-admin";

            const titulo = document.createElement("h4");
            titulo.textContent = produto.nome;

            const categoria = document.createElement("p");
            categoria.textContent = `Categoria: ${produto.categoria || "Cupcakes"}`;

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao;

            const preco = document.createElement("p");
            preco.className = "preco-produto-admin";
            preco.textContent = formatarMoeda(produto.preco);

            const situacao = document.createElement("p");
            situacao.textContent = produto.ativo ? "Ativo" : "Inativo";

            const acoes = document.createElement("div");
            acoes.className = "acoes-produto";

            // Seletor de imagem.
            const seletorArquivo = document.createElement("input");
            seletorArquivo.type = "file";
            seletorArquivo.accept = ".jpg,.jpeg,.png,.webp";
            seletorArquivo.hidden = true;

            seletorArquivo.setAttribute(
                "aria-label",
                `Escolher foto para ${produto.nome}`
            );

            // Botão para trocar foto.
            const botaoTrocarFoto = document.createElement("button");
            botaoTrocarFoto.type = "button";
            botaoTrocarFoto.textContent = "Trocar foto";

            botaoTrocarFoto.addEventListener("click", () => {
                seletorArquivo.click();
            });

            seletorArquivo.addEventListener("change", () => {
    const arquivo = seletorArquivo.files[0];

    if (!arquivo) return;

    const erro = validarImagem(arquivo);

    if (erro) {
        mostrarMensagem(erro);
        seletorArquivo.value = "";
        return;
    }

    abrirEditorRecorte(arquivo, async imagemRecortada => {
        botaoTrocarFoto.disabled = true;
        botaoTrocarFoto.textContent = "Enviando foto...";

        try {
            const dados = new FormData();
            dados.append("imagem", imagemRecortada);

            const resposta = await fetch(
                `/api/admin/produtos/${produto.id}/imagem`,
                {
                    method: "PUT",
                    body: dados
                }
            );

            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível trocar a foto."
                );
            }

            produto.imagem = resultado.imagem;

            imagem.src =
                `/static/imagens/${encodeURIComponent(produto.imagem)}?t=${Date.now()}`;

            imagem.alt = `Foto do produto ${produto.nome}`;
            imagem.classList.remove("imagem-indisponivel");

            mostrarMensagem(
                `Foto do produto "${produto.nome}" atualizada com sucesso!`
            );

        } catch (erro) {
            mostrarMensagem(erro.message);
        } finally {
            botaoTrocarFoto.disabled = false;
            botaoTrocarFoto.textContent = "Trocar foto";
            seletorArquivo.value = "";
        }
        }, produto);
});

            // Botão para editar todas as informações.
            const botaoEditarInformacoes = document.createElement("button");
            botaoEditarInformacoes.type = "button";
            botaoEditarInformacoes.textContent = "Editar informações";
            botaoEditarInformacoes.className = "botao-editar-informacoes";

            botaoEditarInformacoes.addEventListener("click", () => {
                abrirEdicao(produto);
            });

            // Botão para excluir.
            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.className = "botao-excluir-produto";

            botaoExcluir.addEventListener("click", () => {
                nomeCupcakeExcluir.textContent =
                    `Tem certeza de que deseja excluir "${produto.nome}"?`;

                modalExcluir.dataset.produtoId = produto.id;
                abrirModal(modalExcluir);
            });

            acoes.append(
                botaoTrocarFoto,
                botaoEditarInformacoes,
                botaoExcluir
            );

            informacoes.append(
                titulo,
                categoria,
                descricao,
                preco,
                situacao,
                seletorArquivo,
                acoes
            );

            cartao.append(imagem, informacoes);
            listaProdutos.appendChild(cartao);
        });
    } catch (erro) {
        mostrarMensagem(
            "Erro ao carregar os produtos. Confira se o servidor está funcionando."
        );

        console.error(erro);
    }
}

formularioProduto.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const categoria = campoCategoria.value;
    const descricao = campoDescricao.value.trim();
    const descricaoDetalhada = campoDescricaoDetalhada.value.trim();
    const ingredientes = campoIngredientes.value.trim();
    const alergenicos = campoAlergenicos.value.trim();
    const preco = Number(campoPreco.value);
    const arquivo = arquivoRecortado;

    erroFormulario.textContent = "";

    if (!nome || !descricao) {
        erroFormulario.textContent =
            "Preencha o nome e a descrição curta do produto.";
        return;
    }

    if (!["Cupcakes", "Doces", "Bebidas"].includes(categoria)) {
        erroFormulario.textContent = "Selecione uma categoria válida.";
        return;
    }

    if (!Number.isFinite(preco) || preco <= 0) {
        erroFormulario.textContent = "Informe um preço maior que zero.";
        return;
    }

    if (modoFormulario === "cadastro") {
        const erroImagem = validarImagem(arquivo);

        if (erroImagem) {
            erroFormulario.textContent = erroImagem;
            return;
        }
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = modoFormulario === "cadastro"
        ? "Cadastrando..."
        : "Salvando alterações...";

    try {
        let resposta;

        if (modoFormulario === "cadastro") {
            const dados = new FormData();

            dados.append("nome", nome);
            dados.append("categoria", categoria);
            dados.append("descricao", descricao);
            dados.append("descricao_detalhada", descricaoDetalhada);
            dados.append("ingredientes", ingredientes);
            dados.append("alergenicos", alergenicos);
            dados.append("preco", campoPreco.value);
            dados.append("imagem", arquivo);

            resposta = await fetch("/api/admin/produtos", {
                method: "POST",
                body: dados
            });
        } else {
            const produtoId = campoId.value;

            if (!produtoId) {
                throw new Error("Não foi possível identificar o produto.");
            }

            const dados = {
                nome,
                categoria,
                descricao,
                descricao_detalhada: descricaoDetalhada,
                ingredientes,
                alergenicos,
                preco: campoPreco.value
            };

            resposta = await fetch(
                `/api/admin/produtos/${produtoId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                }
            );
        }

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível salvar o produto."
            );
        }

        await carregarProdutos();

        formularioProduto.hidden = true;
        sucessoProduto.hidden = false;

        if (modoFormulario === "cadastro") {
            tituloSucessoProduto.textContent = "Cadastro realizado!";
        } else {
            tituloSucessoProduto.textContent = "Alterações salvas!";
        }

        textoSucessoProduto.textContent =
            resultado.mensagem || "Operação realizada com sucesso!";
    } catch (erro) {
        erroFormulario.textContent = erro.message;
    } finally {
        botaoSalvar.disabled = false;

        botaoSalvar.textContent = modoFormulario === "cadastro"
            ? "Finalizar cadastro"
            : "Salvar alterações";
    }
});

// Modal de exclusão.

function fecharModalExcluir() {
    fecharModal(modalExcluir);
}

botaoCancelarExclusao.addEventListener("click", fecharModalExcluir);

modalExcluir.addEventListener("click", evento => {
    if (evento.target === modalExcluir) {
        fecharModalExcluir();
    }
});

botaoConfirmarExclusao.addEventListener("click", async () => {
    const produtoId = modalExcluir.dataset.produtoId;

    if (!produtoId) {
        mostrarMensagem("Não foi possível identificar o produto.");
        fecharModalExcluir();
        return;
    }

    botaoConfirmarExclusao.disabled = true;
    botaoConfirmarExclusao.textContent = "Excluindo...";

    try {
        const resposta = await fetch(
            `/api/admin/produtos/${produtoId}`,
            { method: "DELETE" }
        );

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível excluir o produto."
            );
        }

        fecharModalExcluir();

        mostrarMensagem(
            resultado.mensagem || "Produto excluído com sucesso!"
        );

        await carregarProdutos();
    } catch (erro) {
        fecharModalExcluir();
        mostrarMensagem(erro.message);
    } finally {
        botaoConfirmarExclusao.disabled = false;
        botaoConfirmarExclusao.textContent = "Sim, excluir";
    }
});

// Fechar janelas com a tecla Escape.

document.addEventListener("keydown", evento => {
    if (evento.key !== "Escape") {
        return;
    }

    if (modalProduto.classList.contains("aberto")) {
        fecharModal(modalProduto);
    }

    if (modalExcluir.classList.contains("aberto")) {
        fecharModal(modalExcluir);
    }

    if (modalRecorte.classList.contains("aberto")) {
    fecharEditorRecorte();
}
});

// Alternar entre as categorias sem sair da página.

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", () => {
        categoriaAtual = botao.dataset.categoria;

        botoesCategoria.forEach(item => {
            const selecionado = item === botao;

            item.classList.toggle("ativa", selecionado);
            item.setAttribute("aria-pressed", selecionado);
        });

        carregarProdutos();
    });
});

// Carrega os produtos quando a página abre.
carregarProdutos();
