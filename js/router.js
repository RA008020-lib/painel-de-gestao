import * as utils from "./utils.js"

const ROTAS_APP = [
    {
        titulo: 'Cadastro',
        chave: 'cadastro',
        ativa: true
    },
    {
        titulo: 'Reports',
        chave: 'reports',
        ativa: true
    }
]

export function carregaMenusLaterais() {
    const navBar = utils.$id('navBar');

    ROTAS_APP.forEach(rota => {
        if (!rota.ativa) return '';

        const button = document.createElement('button');
        button.className = 'botaoMenuLateral';
        button.textContent = rota.titulo;
        button.onclick = () => {
            carregaPagina(rota)
        }
        navBar.append(button);
    })
}

async function carregaPagina(rota) {

}