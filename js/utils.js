export function $(seletor) {
    return document.querySelector(seletor) ?? null;
}

export function $$(seletor) {
    return document.querySelectorAll(seletor) ?? null;
}

export function $id(seletor) {
    return document.getElementById(seletor) ?? null;
}