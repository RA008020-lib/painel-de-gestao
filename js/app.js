import {
    carregaMenusLaterais,
    inicializarControlesCasca,
    navegarPara
} from "./router.js";

async function initApp() {
    // 1. Renderiza os botões do menu lateral a partir da Whitelist de rotas
    carregaMenusLaterais();

    // 2. Ativa os controles da casca (colapsar sidebar, drawer mobile e listener de hashchange)
    inicializarControlesCasca();

    // 3. Resolve a rota inicial pela URL (ex: casca.html#reports) ou abre 'cadastro' por padrão
    const rotaInicial = window.location.hash.replace('#', '') || 'cadastro';
    navegarPara(rotaInicial, { substituirHistorico: true });
}

initApp();
