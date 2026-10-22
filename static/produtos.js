
const listaProdutos = document.querySelector("#lista-produtos");
const mensagemProdutos = document.querySelector("#mensagem-produtos");

const formularioProduto = document.querySelector("#form-produto");
const campoNome = document.querySelector("#nome-produto");
const campoDescricao = document.querySelector("#descricao-produto");
const campoPreco = document.querySelector("#preco-produto");
const campoImagem = document.querySelector("#imagem-produto");
const nomeArquivoImagem = document.querySelector("#nome-arquivo-imagem");
const botaoSalvar = document.querySelector("#botao-salvar-produto");

const modalProduto = document.querySelector("#modal-produto");
const botaoAbrirCadastro = document.querySelector("#botao-abrir-cadastro");
const botaoFecharModal = document.querySelector("#botao-fechar-modal");
const botaoCancelarCadastro = document.querySelector("#botao-cancelar-cadastro");

const sucessoProduto = document.querySelector("#sucesso-produto");
const textoSucessoProduto = document.querySelector("#texto-sucesso-produto");
const botaoSucessoOk = document.querySelector("#botao-sucesso-ok");

const modalPreco = document.querySelector("#modal-preco");
const formularioPreco = document.querySelector("#formulario-preco");
const campoNovoPreco = document.querySelector("#novo-preco");
const erroPreco = document.querySelector("#erro-preco");
const botaoSalvarPreco = document.querySelector("#salvar-preco");

const modalExcluir = document.querySelector("#modal-excluir");
const nomeCupcakeExcluir = document.querySelector("#nome-cupcake-excluir");
const botaoCancelarExclusao = document.querySelector("#cancelar-exclusao");
const botaoConfirmarExclusao = document.querySelector("#confirmar-exclusao");

const extensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];

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
        modalPreco,
        modalExcluir
    ].some(item => item.classList.contains("aberto"));

    if (!algumAberto) {
        document.body.style.overflow = "";
    }
}

function abrirCadastro() {
    formularioProduto.reset();
    nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
    formularioProduto.hidden = false;
    sucessoProduto.hidden = true;
    mostrarMensagem("");
    abrirModal(modalProduto);
    campoNome.focus();
}

botaoAbrirCadastro.addEventListener("click", abrirCadastro);
botaoFecharModal.addEventListener("click", () => fecharModal(modalProduto));
botaoCancelarCadastro.addEventListener("click", () => fecharModal(modalProduto));
botaoSucessoOk.addEventListener("click", () => fecharModal(modalProduto));

modalProduto.addEventListener("click", evento => {
    if (evento.target === modalProduto) {
        fecharModal(modalProduto);
    }
});

campoImagem.addEventListener("change", () => {
    nomeArquivoImagem.textContent = campoImagem.files.length
        ? `Imagem selecionada: ${campoImagem.files[0].name}`
        : "Nenhuma imagem selecionada.";
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
    imagem.alt = `Foto do cupcake ${produto.nome}`;
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

        if (produtos.length === 0) {
            mostrarMensagem("Nenhum cupcake cadastrado.");
            return;
        }

        mostrarMensagem("");

        produtos.forEach(produto => {
            const cartao = document.createElement("article");
            cartao.className = "produto-admin";

            const imagem = criarImagem(produto);

            const informacoes = document.createElement("div");
            informacoes.className = "informacoes-produto-admin";

            const titulo = document.createElement("h4");
            titulo.textContent = produto.nome;

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao;

            const preco = document.createElement("p");
            preco.className = "preco-produto-admin";
            preco.textContent = formatarMoeda(produto.preco);

            const situacao = document.createElement("p");
            situacao.textContent = produto.ativo ? "Ativo" : "Inativo";

            const acoes = document.createElement("div");
            acoes.className = "acoes-produto";

            const seletorArquivo = document.createElement("input");
            seletorArquivo.type = "file";
            seletorArquivo.accept = ".jpg,.jpeg,.png,.webp";
            seletorArquivo.hidden = true;
            seletorArquivo.setAttribute(
                "aria-label",
                `Escolher foto para ${produto.nome}`
            );

            const botaoTrocarFoto = document.createElement("button");
            botaoTrocarFoto.type = "button";
            botaoTrocarFoto.textContent = "Trocar foto";

            botaoTrocarFoto.addEventListener("click", () => {
                seletorArquivo.click();
            });

            seletorArquivo.addEventListener("change", async () => {
                const arquivo = seletorArquivo.files[0];

                if (!arquivo) {
                    return;
                }

                const erro = validarImagem(arquivo);

                if (erro) {
                    mostrarMensagem(erro);
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

                    const resultado = await lerResposta(resposta);

                    if (!resposta.ok) {
                        throw new Error(
                            resultado.erro || "Não foi possível trocar a foto."
                        );
                    }

                    produto.imagem = resultado.imagem;

                    imagem.src =
                        `/static/imagens/${encodeURIComponent(produto.imagem)}?t=${Date.now()}`;

                    imagem.alt = `Foto do cupcake ${produto.nome}`;
                    imagem.classList.remove("imagem-indisponivel");

                    mostrarMensagem(
                        `Foto do cupcake "${produto.nome}" atualizada com sucesso!`
                    );
                } catch (erro) {
                    mostrarMensagem(erro.message);
                } finally {
                    botaoTrocarFoto.disabled = false;
                    botaoTrocarFoto.textContent = "Trocar foto";
                    seletorArquivo.value = "";
                }
            });

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar preço";
            botaoEditar.className = "botao-editar-preco";

            botaoEditar.addEventListener("click", () => {
                document.querySelector("#nome-cupcake-preco").textContent =
                    `Digite o novo preço de ${produto.nome}.`;

                campoNovoPreco.value = Number(produto.preco).toFixed(2);
                erroPreco.textContent = "";
                modalPreco.dataset.produtoId = produto.id;

                abrirModal(modalPreco);
                campoNovoPreco.focus();
            });

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
                botaoEditar,
                botaoExcluir
            );

            informacoes.append(
                titulo,
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
            "Erro ao carregar os cupcakes. Confira se o servidor está funcionando."
        );
        console.error(erro);
    }
}

formularioProduto.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const descricao = campoDescricao.value.trim();
    const preco = Number(campoPreco.value);
    const arquivo = campoImagem.files[0];

    if (!nome || !descricao) {
        mostrarMensagem("Preencha o nome e a descrição do cupcake.");
        return;
    }

    if (!Number.isFinite(preco) || preco <= 0) {
        mostrarMensagem("Informe um preço maior que zero.");
        return;
    }

    const erroImagem = validarImagem(arquivo);

    if (erroImagem) {
        mostrarMensagem(erroImagem);
        return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Cadastrando...";

    try {
        const dados = new FormData();
        dados.append("nome", nome);
        dados.append("descricao", descricao);
        dados.append("preco", campoPreco.value);
        dados.append("imagem", arquivo);

        const resposta = await fetch("/api/admin/produtos", {
            method: "POST",
            body: dados
        });

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível cadastrar o cupcake."
            );
        }

        formularioProduto.reset();
        nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";

        await carregarProdutos();

        formularioProduto.hidden = true;
        sucessoProduto.hidden = false;
        textoSucessoProduto.textContent =
            resultado.mensagem || "Cupcake cadastrado com sucesso!";
    } catch (erro) {
        mostrarMensagem(erro.message);
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Finalizar cadastro";
    }
});

function fecharModalPreco() {
    fecharModal(modalPreco);
}

document.querySelector("#fechar-modal-preco")
    .addEventListener("click", fecharModalPreco);

document.querySelector("#cancelar-preco")
    .addEventListener("click", fecharModalPreco);

modalPreco.addEventListener("click", evento => {
    if (evento.target === modalPreco) {
        fecharModalPreco();
    }
});

formularioPreco.addEventListener("submit", async evento => {
    evento.preventDefault();

    const preco = Number(campoNovoPreco.value);
    const produtoId = modalPreco.dataset.produtoId;

    if (!Number.isFinite(preco) || preco <= 0) {
        erroPreco.textContent = "Informe um preço maior que zero.";
        return;
    }

    if (!produtoId) {
        erroPreco.textContent = "Não foi possível identificar o cupcake.";
        return;
    }

    botaoSalvarPreco.disabled = true;
    botaoSalvarPreco.textContent = "Salvando...";

    try {
        const resposta = await fetch(
            `/api/admin/produtos/${produtoId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ preco })
            }
        );

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível atualizar o preço."
            );
        }

        fecharModalPreco();
        mostrarMensagem(resultado.mensagem || "Preço atualizado com sucesso!");

        await carregarProdutos();
    } catch (erro) {
        erroPreco.textContent = erro.message;
    } finally {
        botaoSalvarPreco.disabled = false;
        botaoSalvarPreco.textContent = "Salvar alteração";
    }
});

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
        mostrarMensagem("Não foi possível identificar o cupcake.");
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
                resultado.erro || "Não foi possível excluir o cupcake."
            );
        }

        fecharModalExcluir();
        mostrarMensagem(resultado.mensagem || "Cupcake excluído com sucesso!");

        await carregarProdutos();
    } catch (erro) {
        fecharModalExcluir();
        mostrarMensagem(erro.message);
    } finally {
        botaoConfirmarExclusao.disabled = false;
        botaoConfirmarExclusao.textContent = "Sim, excluir";
    }
});

document.addEventListener("keydown", evento => {
    if (evento.key !== "Escape") {
        return;
    }

    if (modalProduto.classList.contains("aberto")) {
        fecharModal(modalProduto);
    }

    if (modalPreco.classList.contains("aberto")) {
        fecharModal(modalPreco);
    }

    if (modalExcluir.classList.contains("aberto")) {
        fecharModal(modalExcluir);
    }
});

carregarProdutos();
