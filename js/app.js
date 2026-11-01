import { carregaMenusLaterais } from "./router.js";

async function initApp() {
    carregaMenusLaterais();

    /*TEMPORARIO*/
    const pagCadastro = await fetch('../pages/cadastro.html');
    document.getElementById('viewerPagina').innerHTML = await pagCadastro.text()
    /*TEMPORARIO*/

}

initApp();