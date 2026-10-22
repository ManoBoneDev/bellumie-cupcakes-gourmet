# 🧁 Bellumiê Cupcakes Gourmet

> Projeto acadêmico de uma loja virtual de cupcakes gourmet, desenvolvido para aplicar conhecimentos de desenvolvimento web, banco de dados e testes de software.

---

## 📌 Sobre o projeto

O **Bellumiê Cupcakes Gourmet** é uma aplicação web que permite aos clientes visualizar cupcakes disponíveis, adicionar produtos ao carrinho e realizar pedidos informando seus dados de entrega e forma de pagamento.

O sistema também possui uma área administrativa para gerenciar produtos e acompanhar os pedidos recebidos.

## ✨ Funcionalidades

### 🛍️ Área do cliente
- Visualização do catálogo de cupcakes com informações dos produtos.
- Adição de produtos ao carrinho de compras.
- Cálculo do valor total do pedido.
- Finalização de pedidos com dados de entrega e forma de pagamento.

### ⚙️ Área administrativa
- Consulta dos pedidos recebidos.
- Visualização dos itens de cada pedido.
- Atualização do status dos pedidos.
- Cadastro de produtos.
- Alteração de preços e imagens.
- Exclusão de produtos.

### 💾 Banco de dados
- Armazenamento de produtos, pedidos e itens dos pedidos utilizando SQLite.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Python | Linguagem utilizada no back-end |
| Flask | Framework web |
| SQLite | Banco de dados |
| HTML | Estrutura das páginas |
| CSS | Estilização da interface |
| JavaScript | Interatividade da aplicação |
| GitHub | Hospedagem do código-fonte e versionamento |

## 🚀 Como executar o projeto localmente

### 1. Pré-requisitos

- Python instalado no computador.
- Git instalado, caso escolha clonar o repositório.

### 2. Baixar o projeto

Você pode baixar o repositório pelo botão **Code → Download ZIP** no GitHub e extrair os arquivos.

Ou, se tiver Git instalado, executar:

```bash
git clone https://github.com/ManoBoneDev/bellumie-cupcakes-gourmet.git
```

### 3. Abrir a pasta do projeto

Abra um terminal na pasta onde está o arquivo `app.py`.

### 4. Instalar as dependências

Execute o comando:

```bash
pip install -r requirements.txt
```
ou
```bash
python -m pip install -r requirements.txt
```

### 5. Executar a aplicação

Execute:

```bash
python app.py
```

### 6. Acessar no navegador

Com a aplicação em execução, abra:

- **Loja:** http://127.0.0.1:5000
- **Painel administrativo:** http://127.0.0.1:5000/admin

## 🗄️ Banco de dados

O projeto utiliza SQLite para armazenar os produtos, os pedidos e os itens associados a cada pedido.

Os dados ficam armazenados localmente no banco de dados utilizado pela aplicação.

## 📚 Objetivo acadêmico

Este projeto foi desenvolvido como parte de uma atividade acadêmica de Engenharia de Software, envolvendo desenvolvimento web, persistência de dados, documentação e testes de software.

## ⚠️ Observações

- O projeto foi desenvolvido para fins acadêmicos.
- A aplicação é executada localmente seguindo as instruções deste documento.
- A forma de pagamento é registrada no pedido; a integração com um serviço de pagamento real não foi confirmada.
- A integração com serviços externos de entrega também não foi confirmada.

---

**Bellumiê Cupcakes Gourmet** — Projeto acadêmico de desenvolvimento web.
