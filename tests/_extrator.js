// Utilitário de teste: extrai funções/constantes de index.html e carrega num contexto isolado (sem DOM, sem rede)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

function fnSrc(nome) {
  const ini = html.indexOf(`function ${nome}(`);
  if (ini === -1) throw new Error(`Função ${nome} não encontrada em index.html`);
  const inicioReal = html.lastIndexOf('async ', ini) === ini - 6 ? ini - 6 : ini;
  let i = html.indexOf(') {', ini) + 2;
  let prof = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') prof++;
    else if (html[i] === '}') { prof--; if (prof === 0) break; }
  }
  return html.slice(inicioReal, i + 1);
}
function constSrc(nome, fim) {
  const ini = html.indexOf(`const ${nome} = `);
  if (ini === -1) throw new Error(`Constante ${nome} não encontrada em index.html`);
  return html.slice(ini, html.indexOf(fim, ini) + fim.length).replace(`const ${nome}`, `var ${nome}`);
}

function criarContexto({ funcoes = [], constantes = [], extras = {} } = {}) {
  const ctx = { console, window: {}, globalThis: null, PontuacaoModule: require('../js/pontuacao.js'), NarracaoModule: require('../js/narracao.js'), CitacaoModule: require('../js/citacao.js'), CronologiaModule: require('../js/cronologia.js'), ...extras };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  constantes.forEach(([nome, fim]) => vm.runInContext(constSrc(nome, fim), ctx));
  funcoes.forEach(n => vm.runInContext(fnSrc(n), ctx));
  return ctx;
}

module.exports = { html, fnSrc, constSrc, criarContexto };
