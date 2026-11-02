# 🐾 PETEC — Painel de Gestão Administrativa (Squad 3)

Repositório oficial do **Produto 3: Painel de Gestão Administrativa** do ecossistema **PETEC (Pets na Tecnologia)**, desenvolvido como projeto de extensão universitária para a transformação digital da **ONG Anjos de Resgate**.

---

## 📌 1. Visão Geral e Propósito
O Painel de Gestão é uma **Single Page Application (SPA)** de acesso restrito para administradores e voluntários da ONG. Seu objetivo é centralizar:
- **Cadastro e Gestão de Pets (CRUD):** Controle de fichas clínicas e status (`disponível`, `em tratamento`, `adotado`).
- **Triagem & Adoções:** Avaliação das solicitações de guarda responsável vindas do Catálogo Público.
- **Reportes de Rua:** Visualização dos alertas comunitários geolocalizados de animais em situação de risco.
- **Rifas & PIX:** Controle de campanhas solidárias e arrecadações.

### Equipe Responsável (Squad 3)
- **Desenvolvimento:** João Futebol, Itamar
- **Design:** Estefane, José Antonio
- **Marketing:** Kaua, Gabriel Soares
- **Documentação:** Luiza

---

## 🗂️ 2. Estrutura de Arquivos do Projeto

```text
painel-de-gestao/
├── index.html              # Tela de Login (Acesso Restrito)
├── README.md               # Documentação técnica e contexto para próximas sessões
├── css/
│   └── style.css           # Estilos globais da Casca, Menu Lateral e Design System PETEC
├── imagens/
│   └── cao-gato.png        # Ativos visuais do painel
├── js/
│   ├── app.js              # Ponto de entrada (Bootstrap) do SPA
│   ├── router.js           # Motor de roteamento SPA, segurança (XSS/Whitelist), cache e menu lateral
│   ├── utils.js            # Funções utilitárias de seleção DOM ($, $$, $id)
│   └── pages/              # Scripts modulares específicos de cada página
│       ├── pets.js         # Lógica da página de Cadastro de Pets
│       ├── adocoes.js      # Lógica da página de Triagem & Adoções
│       └── pix.js          # Lógica da página de Rifas & PIX
└── pages/
    ├── casca.html          # Casca principal do SPA (Menu Lateral, Barra Superior e #viewerPagina)
    └── cadastro.html       # Template parcial da página de Cadastro de Pets
```

---

## ⚙️ 3. Arquitetura do SPA e Roteamento (`js/router.js`)

A plataforma funciona como um SPA modular onde `pages/casca.html` permanece carregada e apenas o conteúdo interno de `<main id="viewerPagina">` é trocado dinamicamente.

### Recursos Implementados no Roteador:
1. **Lista Segura de Rotas (`ROTAS_APP`):**
   - Objeto congelado (`Object.freeze`) que define título, subtítulo, chave, caminho do arquivo HTML, módulo JS opcional, ícone e flag `ativa`.
   - Qualquer tentativa de navegar para uma rota fora da lista ou com caracteres inválidos (prevenção de *Path Traversal*) redireciona com segurança para a rota padrão (`#cadastro`).
2. **Sanitização contra XSS (`sanitizarHtmlParaFragmento`):**
   - Antes de injetar qualquer HTML carregado via `fetch()`, o conteúdo passa pelo `DOMParser`, removendo tags críticas (`<script>`, `<iframe>`, `<object>`, `<embed>`) e atributos inline de execução (`on*`, URLs `javascript:`).
3. **Cache em Memória + Controle de Concorrência (`AbortController`):**
   - Páginas visitadas ficam armazenadas em um `Map` (`cachePaginas`) para alternância instantânea.
   - Cliques rápidos consecutivos no menu lateral abortam automaticamente a requisição HTTP anterior, evitando *race conditions*.
4. **Sincronização por Hash (`#cadastro`, `#adocoes`, `#reports`, `#pix`):**
   - Suporte nativo aos botões Voltar/Avançar do navegador (`hashchange`) e recarregamento mantendo a aba selecionada.
5. **Carregamento Dinâmico de Scripts de Página:**
   - Se a rota possuir um `scriptModulo` configurado em `ROTAS_APP`, o roteador importa o módulo ES6 correspondente e executa sua função `init()` ou `default()` após injetar o HTML, além de disparar o evento global `spa:paginaCarregada`.
6. **Esqueleto de Carregamento e Cartão de Aviso (Fallback):**
   - Exibe *Skeleton Loader* durante requisições de rede e um cartão estilizado de **"Módulo em Construção"** caso o arquivo `.html` da rota ainda não tenha sido criado na pasta `/pages`.

---

## 🎨 4. Padrões de Código e Design System PETEC

### Convenção de Nomenclatura (Obrigatória)
- **Classes CSS, IDs e funções:** Seguem o padrão **`camelCase` descritivo em português** (ex.: `containerMenusLaterais`, `cabecalhoMenuLateral`, `botaoMenuLateral`, `cartaoEsqueletoCarregamento`, `menuLateralRecolhido`).

### Tokens de Design (`css/style.css`)
- **Regra 60-30-10:**
  - `--azul-institucional: #0A2540` (Fundo principal)
  - `--azul-profundo: #06182C` (Menu lateral)
  - `--azul-superficie: #0F3156` (Botões inativos e superfícies secundárias)
  - `--branco-puro: #FFFFFF` (Barra superior e cartões de conteúdo)
  - `--amarelo-otimista: #F4B41A` (Destaques, bordas ativas e CTAs primários)
  - `--vermelho-alerta: #DC2626` (Ações críticas e saída)
- **Tipografia & Ícones:**
  - Títulos de impacto: `'Anton', sans-serif` (uppercase)
  - Interface e formulários: `'Inter', sans-serif`
  - Biblioteca de ícones: Flaticon UIcons Regular Rounded (`fi fi-rr-*`)
- **Animação do Menu Lateral:**
  - O recolhimento no desktop (`body.menuLateralRecolhido`) mantém todos os ícones ancorados à esquerda (`justify-content: flex-start`) com larguras fixas, recolhendo os textos via `max-width: 0`, `opacity: 0` e `overflow: hidden` para criar o efeito de cortina fechando por cima sem saltos de centralização.

---

## 🚀 5. Como Adicionar uma Nova Página ao Painel

Para que outro integrante da Squad crie uma nova tela (ex.: `reports.html`):
1. Crie apenas o conteúdo interno da seção dentro de `pages/reports.html` (sem tags `<html>`, `<head>` ou `<body>`, pois ela será injetada dentro do `#viewerPagina` da `casca.html`).
2. Caso a página precise de JavaScript próprio, crie ou edite o módulo em `js/pages/` exportando uma função `export function init() { ... }` e vincule o caminho na propriedade `scriptModulo` dentro de `ROTAS_APP` em `js/router.js`.
