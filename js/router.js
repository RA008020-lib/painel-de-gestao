import * as utils from "./utils.js";

/**
 * Catálogo Oficial de Rotas do Painel de Gestão (Lista Segura)
 * Apenas rotas listadas aqui e com `ativa: true` podem ser carregadas.
 */
export const ROTAS_APP = Object.freeze([
    {
        titulo: 'Cadastro de Pets',
        subtitulo: 'Gerenciamento e ficha clínica de animais',
        chave: 'cadastro',
        arquivo: '../pages/cadastro.html',
        scriptModulo: '../js/pages/pets.js',
        icone: 'fi-rr-paw',
        ativa: true
    },
    {
        titulo: 'Triagem & Adoções',
        subtitulo: 'Solicitações e entrevistas de guarda responsável',
        chave: 'adocoes',
        arquivo: '../pages/adocoes.html',
        scriptModulo: '../js/pages/adocoes.js',
        icone: 'fi-rr-diploma',
        ativa: true
    },
    {
        titulo: 'Reportes de Rua',
        subtitulo: 'Alertas geolocalizados de animais em risco',
        chave: 'reports',
        arquivo: '../pages/reports.html',
        scriptModulo: null,
        icone: 'fi-rr-map-marker-home',
        ativa: true
    },
    {
        titulo: 'Rifas & PIX',
        subtitulo: 'Controle de arrecadações e campanhas solidárias',
        chave: 'pix',
        arquivo: '../pages/pix.html',
        scriptModulo: '../js/pages/pix.js',
        icone: 'fi-rr-hand-holding-heart',
        ativa: true
    }
]);

// Cache em memória de páginas HTML já carregadas para troca instantânea
const cachePaginas = new Map();

// Controle de concorrência para cancelar requisições anteriores em cliques rápidos
let controladorRequisicaoAtual = null;
let rotaAtivaChave = null;

/**
 * Sanitiza o HTML carregado de um template parcial removendo vetores de XSS
 * (tags <script>, <iframe>, <object>, <embed> e atributos inline on* perigosos),
 * retornando um DocumentFragment seguro para inserção no DOM.
 */
function sanitizarHtmlParaFragmento(htmlBruto) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlBruto, 'text/html');

    const seletoresBloqueados = 'script, iframe, object, embed, base, meta, link[rel="import"]';
    doc.querySelectorAll(seletoresBloqueados).forEach(el => el.remove());

    const todosElementos = doc.body.querySelectorAll('*');
    todosElementos.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            const nomeAttr = attr.name.toLowerCase();
            const valorAttr = attr.value.trim().toLowerCase();

            if (nomeAttr.startsWith('on')) {
                el.removeAttribute(attr.name);
            } else if (
                (nomeAttr === 'href' || nomeAttr === 'src' || nomeAttr === 'action') &&
                (valorAttr.startsWith('javascript:') || valorAttr.startsWith('data:text/html'))
            ) {
                el.removeAttribute(attr.name);
            }
        });
    });

    const fragmento = document.createDocumentFragment();
    while (doc.body.firstChild) {
        fragmento.appendChild(doc.body.firstChild);
    }
    return fragmento;
}

/**
 * Valida se a chave da rota existe na lista permitida e está ativa,
 * prevenindo Path Traversal (ex: ../../etc) ou acesso não autorizado.
 */
function buscarRotaSegura(chaveOuRota) {
    const chave = typeof chaveOuRota === 'string'
        ? chaveOuRota.replace(/[^a-z0-9_-]/gi, '').toLowerCase()
        : chaveOuRota?.chave;

    return ROTAS_APP.find(r => r.ativa && r.chave === chave) ?? null;
}

/**
 * Renderiza os botões do Menu Lateral com ícones, indicadores e acessibilidade.
 */
export function carregaMenusLaterais() {
    const navBar = utils.$id('navBar');
    if (!navBar) return;

    navBar.innerHTML = '';
    const fragmento = document.createDocumentFragment();

    ROTAS_APP.forEach(rota => {
        if (!rota.ativa) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'botaoMenuLateral';
        button.dataset.rota = rota.chave;
        button.setAttribute('title', `${rota.titulo} — ${rota.subtitulo}`);

        const icone = document.createElement('i');
        icone.className = `fi ${rota.icone || 'fi-rr-apps'} iconeBotaoMenuLateral`;

        const spanTexto = document.createElement('span');
        spanTexto.className = 'textoBotaoMenuLateral';
        spanTexto.textContent = rota.titulo;

        button.append(icone, spanTexto);

        button.addEventListener('click', () => {
            navegarPara(rota.chave);
            fecharMenuMobile();
        });

        fragmento.appendChild(button);
    });

    navBar.appendChild(fragmento);
}

/**
 * Atualiza o estado visual dos botões do menu lateral e os títulos da barra superior.
 */
function atualizarEstadoVisualNavegacao(rota) {
    const botoes = utils.$$('.botaoMenuLateral');
    botoes.forEach(btn => {
        const ehAtiva = btn.dataset.rota === rota.chave;
        btn.classList.toggle('ativo', ehAtiva);
        if (ehAtiva) {
            btn.setAttribute('aria-current', 'page');
        } else {
            btn.removeAttribute('aria-current');
        }
    });

    const elTitulo = utils.$id('nomePaginaAtual');
    const elCaminho = utils.$id('caminhoNavegacaoRota');

    if (elTitulo) elTitulo.textContent = rota.titulo;
    if (elCaminho) elCaminho.textContent = `Painel Administrativo / ${rota.titulo}`;

    document.title = `PETEC — ${rota.titulo} | Gestão`;
}

/**
 * Renderiza o esqueleto de carregamento dentro do #viewerPagina durante requisições de rede.
 */
function exibirEstadoCarregamento(viewer, rota) {
    viewer.innerHTML = `
        <div class="containerCarregamentoPagina" role="status" aria-label="Carregando ${rota.titulo}">
            <div class="cabecalhoCarregamentoPagina">
                <i class="fi fi-rr-spinner iconeGiratorioCarregamento"></i>
                <span>Carregando módulo <strong>${rota.titulo}</strong>...</span>
            </div>
            <div class="cartaoEsqueletoCarregamento">
                <div class="linhaEsqueleto larguraEsqueleto40"></div>
                <div class="linhaEsqueleto larguraEsqueleto80"></div>
                <div class="gradeEsqueletoCarregamento">
                    <div class="blocoEsqueleto"></div>
                    <div class="blocoEsqueleto"></div>
                    <div class="blocoEsqueleto"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renderiza um aviso amigável caso o arquivo HTML da página ainda esteja em construção pela Squad
 * ou ocorra falha de rede.
 */
function exibirEstadoPaginaIndisponivel(viewer, rota, codigoStatus = 404) {
    viewer.innerHTML = '';

    const container = document.createElement('section');
    container.className = 'cartaoAvisoModulo animacaoEntradaPagina';

    const iconeWrapper = document.createElement('div');
    iconeWrapper.className = 'caixaIconeAvisoModulo';
    iconeWrapper.innerHTML = `<i class="fi ${rota.icone || 'fi-rr-tools'}"></i>`;

    const selo = document.createElement('span');
    selo.className = 'seloStatusModulo';
    selo.textContent = codigoStatus === 404 ? 'MÓDULO EM CONSTRUÇÃO' : `STATUS HTTP ${codigoStatus}`;

    const titulo = document.createElement('h2');
    titulo.textContent = rota.titulo;

    const descricao = document.createElement('p');
    descricao.textContent = codigoStatus === 404
        ? `A página "${rota.arquivo}" (${rota.subtitulo}) já está conectada ao roteador SPA, mas o template HTML ainda não foi criado na pasta /pages.`
        : `Não foi possível carregar o módulo "${rota.titulo}" no momento. Verifique sua conexão ou tente novamente.`;

    const acoes = document.createElement('div');
    acoes.className = 'grupoBotoesAvisoModulo';

    const btnRecarregar = document.createElement('button');
    btnRecarregar.type = 'button';
    btnRecarregar.className = 'botaoAcaoPrimario';
    btnRecarregar.innerHTML = '<i class="fi fi-rr-refresh"></i> Tentar Novamente';
    btnRecarregar.addEventListener('click', () => {
        cachePaginas.delete(rota.chave);
        carregaPagina(rota, { forcarRecarga: true });
    });

    const btnVoltarCadastro = document.createElement('button');
    btnVoltarCadastro.type = 'button';
    btnVoltarCadastro.className = 'botaoAcaoSecundario';
    btnVoltarCadastro.innerHTML = '<i class="fi fi-rr-paw"></i> Ir para Cadastro de Pets';
    btnVoltarCadastro.addEventListener('click', () => navegarPara('cadastro'));

    acoes.append(btnRecarregar);
    if (rota.chave !== 'cadastro') {
        acoes.append(btnVoltarCadastro);
    }

    container.append(iconeWrapper, selo, titulo, descricao, acoes);
    viewer.appendChild(container);
}

/**
 * Executa de forma opcional e segura o módulo JS correspondente à página carregada.
 */
async function inicializarScriptDaPagina(rota) {
    if (!rota.scriptModulo) return;
    try {
        const modulo = await import(rota.scriptModulo);
        if (typeof modulo.init === 'function') {
            await modulo.init();
        } else if (typeof modulo.default === 'function') {
            await modulo.default();
        }
    } catch (erro) {
        console.debug(`[Router] Script opcional de "${rota.chave}" ignorado:`, erro.message);
    }
}

/**
 * Carrega e injeta uma página no #viewerPagina com segurança, cache,
 * controle de concorrência (AbortController) e transições suaves.
 */
export async function carregaPagina(rotaOuChave, opcoes = {}) {
    const { forcarRecarga = false } = opcoes;
    const rota = buscarRotaSegura(rotaOuChave);
    const viewer = utils.$id('viewerPagina');

    if (!viewer) return;

    if (!rota) {
        const rotaPadrao = ROTAS_APP.find(r => r.ativa);
        if (rotaPadrao) return navegarPara(rotaPadrao.chave, { substituirHistorico: true });
        return;
    }

    if (rotaAtivaChave === rota.chave && !forcarRecarga && viewer.children.length > 0) {
        return;
    }

    if (controladorRequisicaoAtual) {
        controladorRequisicaoAtual.abort();
    }
    controladorRequisicaoAtual = new AbortController();
    const { signal } = controladorRequisicaoAtual;

    rotaAtivaChave = rota.chave;
    atualizarEstadoVisualNavegacao(rota);

    try {
        let htmlTexto = cachePaginas.get(rota.chave);

        if (!htmlTexto || forcarRecarga) {
            exibirEstadoCarregamento(viewer, rota);

            const resposta = await fetch(rota.arquivo, {
                method: 'GET',
                signal,
                headers: { 'Accept': 'text/html' },
                cache: forcarRecarga ? 'no-cache' : 'default'
            });

            if (!resposta.ok) {
                exibirEstadoPaginaIndisponivel(viewer, rota, resposta.status);
                return;
            }

            htmlTexto = await resposta.text();
            cachePaginas.set(rota.chave, htmlTexto);
        }

        if (signal.aborted) return;

        const fragmentoSeguro = sanitizarHtmlParaFragmento(htmlTexto);
        const containerConteudoPagina = document.createElement('div');
        containerConteudoPagina.className = 'containerConteudoPagina animacaoEntradaPagina';
        containerConteudoPagina.dataset.view = rota.chave;
        containerConteudoPagina.appendChild(fragmentoSeguro);

        viewer.innerHTML = '';
        viewer.appendChild(containerConteudoPagina);
        viewer.scrollTo({ top: 0, behavior: 'smooth' });

        await inicializarScriptDaPagina(rota);
        window.dispatchEvent(new CustomEvent('spa:paginaCarregada', {
            detail: { rota: rota.chave, titulo: rota.titulo }
        }));

    } catch (erro) {
        if (erro.name === 'AbortError') return;
        console.error(`[Router] Erro ao carregar a rota "${rota.chave}":`, erro);
        exibirEstadoPaginaIndisponivel(viewer, rota, 500);
    }
}

/**
 * Navega para uma rota atualizando o hash da URL (#cadastro, #reports, etc.)
 */
export function navegarPara(chave, opcoes = {}) {
    const rota = buscarRotaSegura(chave) || ROTAS_APP.find(r => r.ativa);
    if (!rota) return;

    const novoHash = `#${rota.chave}`;
    if (window.location.hash !== novoHash) {
        if (opcoes.substituirHistorico) {
            history.replaceState({ rota: rota.chave }, rota.titulo, novoHash);
            carregaPagina(rota, opcoes);
        } else {
            window.location.hash = novoHash;
        }
    } else {
        carregaPagina(rota, opcoes);
    }
}

/**
 * Controles de recolhimento do menu lateral (Desktop) e abertura de gaveta (Mobile)
 */
function fecharMenuMobile() {
    document.body.classList.remove('menuMobileAberto');
}

export function inicializarControlesCasca() {
    const btnAlternarMenuLateral = utils.$id('btnAlternarMenuLateral');
    const btnAbrirMenuMobile = utils.$id('btnAbrirMenuMobile');
    const fundoEscuro = utils.$id('fundoEscuroMenuLateral');

    if (localStorage.getItem('petec_menu_lateral_recolhido') === '1') {
        document.body.classList.add('menuLateralRecolhido');
    }

    if (btnAlternarMenuLateral) {
        btnAlternarMenuLateral.addEventListener('click', () => {
            if (window.innerWidth <= 991) {
                fecharMenuMobile();
            } else {
                const recolhido = document.body.classList.toggle('menuLateralRecolhido');
                localStorage.setItem('petec_menu_lateral_recolhido', recolhido ? '1' : '0');
            }
        });
    }

    if (btnAbrirMenuMobile) {
        btnAbrirMenuMobile.addEventListener('click', () => {
            document.body.classList.toggle('menuMobileAberto');
        });
    }

    if (fundoEscuro) {
        fundoEscuro.addEventListener('click', fecharMenuMobile);
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharMenuMobile();
    });

    window.addEventListener('hashchange', () => {
        const chaveHash = window.location.hash.replace('#', '');
        carregaPagina(chaveHash);
    });
}
