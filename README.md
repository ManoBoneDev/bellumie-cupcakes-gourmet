# 🧁 Bellumiê Cupcakes Gourmet

> Projeto acadêmico de uma loja virtual de confeitaria, desenvolvido para aplicar conhecimentos de desenvolvimento web, banco de dados, interface do usuário e testes de software.

---

## 📌 Sobre o projeto

O **Bellumiê Cupcakes Gourmet** é uma aplicação web que simula uma loja virtual de confeitaria. O sistema permite que os clientes visualizem o catálogo de produtos, consultem suas informações, adicionem itens ao carrinho e realizem pedidos informando seus dados de contato, recebimento e forma de pagamento.

A aplicação também conta com um painel administrativo, desenvolvido para facilitar o gerenciamento dos produtos e o acompanhamento dos pedidos recebidos.

## ✨ Funcionalidades

### 🛍️ Área do cliente

- Visualização do catálogo de produtos.
- Navegação entre as categorias Cupcakes, Doces e Bebidas.
- Consulta de informações, descrições e ingredientes dos produtos.
- Adição e remoção de produtos do carrinho.
- Alteração da quantidade de itens.
- Cálculo automático do valor total.
- Finalização de pedidos com informações do cliente.
- Seleção da forma de recebimento e pagamento.

### ⚙️ Painel administrativo

- Visualização e gerenciamento dos pedidos recebidos.
- Consulta dos dados dos clientes e dos produtos de cada pedido.
- Atualização do status dos pedidos.
- Cadastro de novos produtos.
- Edição de informações e preços.
- Alteração e gerenciamento das imagens dos produtos.
- Editor de recorte e ajuste de imagens.
- Exclusão de produtos.
- Organização dos produtos por categoria.

### 💾 Banco de dados

- Armazenamento de produtos, pedidos e itens associados.
- Persistência das informações utilizando SQLite.
- Integração entre o banco de dados e as funcionalidades da aplicação.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| Python | Linguagem utilizada no back-end |
| Flask | Framework para desenvolvimento web |
| SQLite | Armazenamento e gerenciamento dos dados |
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade da interface |
| JavaScript | Interatividade e funcionalidades do sistema |
| Git | Controle de versão |
| GitHub | Hospedagem do código-fonte |

## 🚀 Como executar o projeto localmente

### 1. Pré-requisitos

- Python instalado no computador.
- Git instalado (opcional, caso escolha clonar o repositório).

### 2. Baixar o projeto

Você pode baixar o repositório pelo botão **Code → Download ZIP** no GitHub e extrair os arquivos.

Ou, caso tenha o Git instalado, execute:

```bash
git clone https://github.com/ManoBoneDev/bellumie-cupcakes-gourmet.git
```

### 3. Abrir a pasta do projeto

Abra o terminal dentro da pasta `loja-cupcakes`, onde está localizado o arquivo `app.py`.

### 4. Instalar as dependências

Execute:

```bash
python -m pip install -r requirements.txt
```

### 5. Executar a aplicação

Execute:

```bash
python app.py
```

### 6. Acessar no navegador

Com a aplicação em execução, acesse:

- **Loja:** http://127.0.0.1:5000
- **Painel administrativo:** http://127.0.0.1:5000/admin

## 🗄️ Banco de dados

O projeto utiliza SQLite para armazenar os produtos, pedidos e respectivos itens.

O banco de dados é mantido localmente, permitindo que as informações sejam consultadas e atualizadas durante a utilização da aplicação.

O repositório disponibiliza uma base de dados com informações fictícias para demonstração do funcionamento do sistema.

## 📚 Objetivo acadêmico

Este projeto foi desenvolvido como parte de uma atividade acadêmica do curso de Engenharia de Software, com o objetivo de aplicar conhecimentos relacionados ao desenvolvimento de aplicações web, organização de código, persistência de dados, criação de interfaces e documentação de software.

## ⚠️ Observações

- O projeto foi desenvolvido para fins acadêmicos.
- A aplicação é executada localmente seguindo as instruções deste documento.
- Os dados presentes no banco disponibilizado são fictícios e utilizados para demonstração.
- A forma de pagamento é registrada no pedido, mas não existe confirmação de integração com serviços reais de pagamento.
- O sistema não possui confirmação de integração com serviços externos de entrega.

---

**Bellumiê Cupcakes Gourmet** — Projeto acadêmico de desenvolvimento web.
