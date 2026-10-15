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

// Elementos da janela de edição de preço
const modalPreco = document.querySelector("#modal-preco");
const formularioPreco = document.querySelector("#formulario-preco");
const campoNovoPreco = document.querySelector("#novo-preco");
const erroPreco = document.querySelector("#erro-preco");
const botaoSalvarPreco = document.querySelector("#salvar-preco");

// Elementos da janela de exclusão
const modalExcluir = document.querySelector("#modal-excluir");
const nomeCupcakeExcluir = document.querySelector("#nome-cupcake-excluir");
const botaoCancelarExclusao = document.querySelector("#cancelar-exclusao");
const botaoConfirmarExclusao = document.querySelector("#confirmar-exclusao");


// CADASTRO DE CUPCAKES

function abrirModal() {
    modalProduto.classList.add("aberto");
    modalProduto.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function fecharModal() {
    modalProduto.classList.remove("aberto");
    modalProduto.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function limparFormulario() {
    formularioProduto.reset();
    nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
}

function mostrarFormulario() {
    formularioProduto.hidden = false;
    sucessoProduto.hidden = true;
}

function mostrarSucesso(mensagem) {
    formularioProduto.hidden = true;
    sucessoProduto.hidden = false;
    textoSucessoProduto.textContent = mensagem;
}

botaoAbrirCadastro.addEventListener("click", () => {
    limparFormulario();
    mostrarFormulario();
    mensagemProdutos.textContent = "";
    abrirModal();
    campoNome.focus();
});

botaoFecharModal.addEventListener("click", fecharModal);
botaoCancelarCadastro.addEventListener("click", fecharModal);
botaoSucessoOk.addEventListener("click", fecharModal);

modalProduto.addEventListener("click", (evento) => {
    if (evento.target === modalProduto) {
        fecharModal();
    }
});

campoImagem.addEventListener("change", () => {
    if (campoImagem.files.length > 0) {
        nomeArquivoImagem.textContent =
            `Imagem selecionada: ${campoImagem.files[0].name}`;
    } else {
        nomeArquivoImagem.textContent = "Nenhuma imagem selecionada.";
    }
});


 // CARREGAR E EXIBIR OS CUPCAKES

async function carregarProdutos() {
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

            // FOTO DO CUPCAKE
            const imagem = document.createElement("img");
            imagem.className = "foto-produto-admin";
            imagem.src = `/static/imagens/${encodeURIComponent(produto.imagem)}`;
            imagem.alt = `Foto do cupcake ${produto.nome}`;

            imagem.addEventListener("error", () => {
                imagem.alt = `Imagem indisponível: ${produto.nome}`;
                imagem.classList.add("imagem-indisponivel");
            });

            // INFORMAÇÕES
            const informacoes = document.createElement("div");
            informacoes.className = "informacoes-produto-admin";

            const titulo = document.createElement("h4");
            titulo.textContent = produto.nome;

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao;

            const preco = document.createElement("p");
            preco.className = "preco-produto-admin";
            preco.textContent = Number(produto.preco).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

            const situacao = document.createElement("p");
            situacao.textContent = produto.ativo ? "Ativo" : "Inativo";

            // BOTÃO PARA TROCAR A FOTO
            const seletorArquivo = document.createElement("input");
            seletorArquivo.type = "file";
            seletorArquivo.accept = ".jpg,.jpeg,.png,.webp";
            seletorArquivo.hidden = true;

            const botaoTrocarFoto = document.createElement("button");
            botaoTrocarFoto.type = "button";
            botaoTrocarFoto.textContent = "Trocar foto";

            botaoTrocarFoto.addEventListener("click", () => {
                seletorArquivo.click();
            });

            seletorArquivo.addEventListener("change", async () => {
                const arquivo = seletorArquivo.files[0];

                if (!arquivo) return;

                botaoTrocarFoto.disabled = true;
                botaoTrocarFoto.textContent = "Enviando foto...";

                try {
                    const dados = new FormData();
                    dados.append("imagem", arquivo);

                    const respostaFoto = await fetch(
                        `/api/admin/produtos/${produto.id}/imagem`,
                        {
                            method: "PUT",
                            body: dados
                        }
                    );

                    const resultado = await respostaFoto.json();

                    if (!respostaFoto.ok) {
                        throw new Error(
                            resultado.erro || "Não foi possível trocar a foto."
                        );
                    }

                    produto.imagem = resultado.imagem;

                    imagem.src =
                        `/static/imagens/${encodeURIComponent(produto.imagem)}?t=${Date.now()}`;

                    imagem.classList.remove("imagem-indisponivel");

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

            // BOTÕES JÁ EXISTENTES
            const acoes = document.createElement("div");
            acoes.className = "acoes-produto";

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
                modalPreco.classList.add("aberto");
                modalPreco.setAttribute("aria-hidden", "false");

                document.body.style.overflow = "hidden";
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
                modalExcluir.classList.add("aberto");
                modalExcluir.setAttribute("aria-hidden", "false");

                document.body.style.overflow = "hidden";
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
        mensagemProdutos.textContent =
            "Erro ao carregar os cupcakes. Confira se o servidor está funcionando.";

        console.error(erro);
    }
}


// CADASTRAR UM NOVO CUPCAKE

formularioProduto.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!campoImagem.files.length) {
        mensagemProdutos.textContent = "Escolha uma imagem para o cupcake.";
        return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Cadastrando...";

    const dados = new FormData();
    dados.append("nome", campoNome.value.trim());
    dados.append("descricao", campoDescricao.value.trim());
    dados.append("preco", campoPreco.value);
    dados.append("imagem", campoImagem.files[0]);

    try {
        const resposta = await fetch("/api/admin/produtos", {
            method: "POST",
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível cadastrar o cupcake."
            );
        }

        limparFormulario();
        await carregarProdutos();

        mostrarSucesso(
            resultado.mensagem || "Cupcake cadastrado com sucesso!"
        );

    } catch (erro) {
        mensagemProdutos.textContent = erro.message;
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Finalizar cadastro";
    }
});


// FECHAR A JANELA DE EDITAR PREÇO

function fecharModalPreco() {
    modalPreco.classList.remove("aberto");
    modalPreco.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

document.querySelector("#fechar-modal-preco")
    .addEventListener("click", fecharModalPreco);

document.querySelector("#cancelar-preco")
    .addEventListener("click", fecharModalPreco);

modalPreco.addEventListener("click", (evento) => {
    if (evento.target === modalPreco) {
        fecharModalPreco();
    }
});


// SALVAR O NOVO PREÇO

formularioPreco.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const preco = Number(campoNovoPreco.value);
    const produtoId = modalPreco.dataset.produtoId;

    if (!Number.isFinite(preco) || preco <= 0) {
        erroPreco.textContent = "Informe um preço maior que zero.";
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

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível atualizar o preço."
            );
        }

        fecharModalPreco();
        mensagemProdutos.textContent = resultado.mensagem;

        await carregarProdutos();

    } catch (erro) {
        erroPreco.textContent = erro.message;
    } finally {
        botaoSalvarPreco.disabled = false;
        botaoSalvarPreco.textContent = "Salvar alteração";
    }
});


// FECHAR A JANELA DE EXCLUSÃO

function fecharModalExcluir() {
    modalExcluir.classList.remove("aberto");
    modalExcluir.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

botaoCancelarExclusao.addEventListener("click", fecharModalExcluir);

modalExcluir.addEventListener("click", (evento) => {
    if (evento.target === modalExcluir) {
        fecharModalExcluir();
    }
});


// CONFIRMAR A EXCLUSÃO DO CUPCAKE

botaoConfirmarExclusao.addEventListener("click", async () => {
    const produtoId = modalExcluir.dataset.produtoId;

    if (!produtoId) {
        mensagemProdutos.textContent = "Não foi possível identificar o cupcake.";
        fecharModalExcluir();
        return;
    }

    botaoConfirmarExclusao.disabled = true;
    botaoConfirmarExclusao.textContent = "Excluindo...";

    try {
        const resposta = await fetch(
            `/api/admin/produtos/${produtoId}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível excluir o cupcake."
            );
        }

        fecharModalExcluir();
        mensagemProdutos.textContent = resultado.mensagem;

        await carregarProdutos();

    } catch (erro) {
        fecharModalExcluir();
        mensagemProdutos.textContent = erro.message;
    } finally {
        botaoConfirmarExclusao.disabled = false;
        botaoConfirmarExclusao.textContent = "Sim, excluir";
    }
});


// FECHAR JANELAS COM A TECLA ESC

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        if (modalProduto.classList.contains("aberto")) {
            fecharModal();
        }

        if (modalPreco.classList.contains("aberto")) {
            fecharModalPreco();
        }

        if (modalExcluir.classList.contains("aberto")) {
            fecharModalExcluir();
        }
    }
});


// INICIAR A LISTAGEM

carregarProdutos();