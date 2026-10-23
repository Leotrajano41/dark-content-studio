// tests/atribuicao-pontuacao.test.js
// Testes das correções de atribuição, pontuação da Narração Limpa, palavras proibidas e ideia vazia.
// Sem rede: extrai as funções puras diretamente do index.html.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const Catalogo = require('../js/catalogo.js');

let total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) {
    console.error(`  ❌ [FALHOU] ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASSOU] ${msg}`);
}

function extrairFuncao(nome) {
  const ini = html.indexOf(`function ${nome}(`);
  if (ini === -1) throw new Error(`Função ${nome} não encontrada`);
  let i = html.indexOf('{', ini);
  let prof = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') prof++;
    else if (html[i] === '}') { prof--; if (prof === 0) break; }
  }
  return html.slice(ini, i + 1);
}

function extrairArray(nome) {
  const ini = html.indexOf(`const ${nome} = [`);
  const fim = html.indexOf('\n];', ini);
  return html.slice(ini, fim + 3);
}

const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(extrairArray('FORBIDDEN_TERMS').replace('const FORBIDDEN_TERMS', 'var FORBIDDEN_TERMS'), ctx);
['normalizarAspasEPontuacao', 'validarECorrigirAspas', 'garantirEspacamentoEPontuacaoCitacoes',
  'limparPontuacaoDuplicada', 'detectarSuspeitasGramaticais', 'aplicarCorrecoesGramaticais']
  .forEach(n => vm.runInContext(extrairFuncao(n), ctx));
const run = (expr) => vm.runInContext(expr, ctx);

console.log('\n📋 4. Pontuação da Narração Limpa');
let r = ctx.normalizarAspasEPontuacao('Ele disse:"Vem" e saiu.');
assert(r === 'Ele disse: "Vem" e saiu.', 'Espaço entre dois-pontos e aspas de abertura');
r = ctx.normalizarAspasEPontuacao('Ele disse: " Vem agora ".');
assert(r === 'Ele disse: "Vem agora".', 'Sem espaço depois da abertura nem antes do fechamento');
r = ctx.normalizarAspasEPontuacao('Uma coisa e "outra".. Depois seguiu.');
assert(r === 'Uma coisa e "outra". Depois seguiu.', 'Ponto duplicado depois das aspas ("outra".. vira "outra".)');
r = ctx.normalizarAspasEPontuacao('Ela disse "sim" e "não" ao rei.');
assert(r === 'Ela disse "sim" e "não" ao rei.', 'Aspas de fechamento seguidas de palavra mantêm um espaço');
r = ctx.normalizarAspasEPontuacao('Ele esperou "..." e foi.');
assert(r.includes('"..."'), 'Reticências dentro das aspas permanecem intactas');
r = ctx.validarECorrigirAspas('Moisés disse a Arão: "Tome o incensário" e Arão obedeceu.');
assert(r === 'Moisés disse a Arão: "Tome o incensário" e Arão obedeceu.', 'validarECorrigirAspas não cola o fechamento na palavra seguinte');
r = ctx.limparPontuacaoDuplicada('Ele falou. "Vem agora." Depois foi embora.');
assert(r.includes('falou. "Vem agora". Depois') || r.includes('falou. "Vem agora".'), 'Aspa de abertura depois de ponto não é movida; fechamento recebe o ponto fora');
assert(!/falou"\./.test(r), 'Ponto da frase anterior não é arrastado para dentro das aspas de abertura');
r = ctx.garantirEspacamentoEPontuacaoCitacoes('Disse:"Eu sou" (Êxodo 3:14).');
assert(r === 'Disse: "Eu sou" (Êxodo 3:14).', 'Espaço depois do fechamento antes de referência entre parênteses');

console.log('\n📋 6. Palavras proibidas em português (frase é regenerada, nunca trocada)');
const achou = (t) => run(`FORBIDDEN_TERMS.some(f => f.pattern.test(${JSON.stringify(t)}))`);
['Vamos desvendar o mistério.', 'Desvendando o texto antigo.', 'A profundidade do tema.',
  'Com precisão cirúrgica, o juiz decidiu.', 'Vamos mergulhar fundo na história.']
  .forEach(t => assert(achou(t), `Detecta: "${t}"`));
assert(!run(`/\\bprofundidades?\\b/i.test("Um poço profundo e uma voz profunda.")`), 'Regex de "profundidade" não pega "profundo/profunda"');
assert(!run(`FORBIDDEN_TERMS.filter(f => f.term === 'profundidade').some(f => f.pattern.test("um poço profundo"))`), '"profundo" não é flexão de "profundidade"');
const catAchou = (t) => Catalogo.detectarProibidas(t).map(x => x.rotulo);
assert(catAchou('Ele quis desvendar o caso.').includes('desvendar'), 'catalogo.js detecta "desvendar"');
assert(catAchou('Isso mostra profundidade.').includes('profundidade'), 'catalogo.js detecta "profundidade"');
assert(catAchou('Foi feito com precisão cirúrgica.').includes('precisão cirúrgica'), 'catalogo.js detecta "precisão cirúrgica"');
assert(catAchou('Vamos mergulhar fundo.').includes('mergulhar fundo'), 'catalogo.js detecta "mergulhar fundo"');
assert(!catAchou('Um poço profundo.').includes('profundidade'), 'catalogo.js não proíbe "profundo"');
assert(catAchou('Ele disse: "Desvendar" ao povo.').length === 0, 'Palavra entre aspas (citação) é tolerada');
assert(!html.includes('Para continuar desvendando a profundidade'), 'CTA fixo em português não usa mais "desvendando a profundidade"');

console.log('\n📋 7. Revisão gramatical da Narração Limpa');
const susp = ctx.detectarSuspeitasGramaticais('Ele foi até o. O povo povo seguiu. Tudo certo aqui.');
assert(susp.length === 2, 'Detecta frase terminando em artigo e palavra repetida (2 suspeitas)');
let g = ctx.aplicarCorrecoesGramaticais('Ele foi até o. Tudo certo aqui.', [
  { fraseOriginal: 'Ele foi até o.', fraseCorrigida: 'Ele foi até o monte.' }]);
assert(g.texto === 'Ele foi até o monte. Tudo certo aqui.' && g.aplicadas.length === 1, 'Aplica correção de frase quebrada');
g = ctx.aplicarCorrecoesGramaticais('Ele disse: "Vem agora." Foi.', [
  { fraseOriginal: 'Ele disse: "Vem agora."', fraseCorrigida: 'Ele disse: "Vai agora."' }]);
assert(g.aplicadas.length === 0, 'Nunca altera texto entre aspas');
g = ctx.aplicarCorrecoesGramaticais('Ele foi até o. Tudo certo.', [
  { fraseOriginal: 'Ele foi até o.', fraseCorrigida: 'Ele foi até a profundidade.' }]);
assert(g.aplicadas.length === 0, 'Rejeita correção que contenha palavra proibida');

console.log('\n📋 1-3, 5. Prompts de atribuição / generalização / citação / repetição');
['REGRA DE ATRIBUIÇÃO', 'naquela cultura', 'VARIE os marcadores', 'SOMENTE quando houver de fato interpretação ou costume',
  'qualquer judeu podia ser', 'CITAÇÃO x CENA', 'NÃO use aspas', 'ÚNICO parágrafo de fechamento', 'precisão cirúrgica']
  .forEach(t => assert(html.includes(t), `index.html contém: "${t}"`));
['ATRIBUIÇÃO INDEVIDA', 'GENERALIZAÇÃO', 'CITAÇÃO FORA DE CONTEXTO', 'CONCLUSÃO DUPLICADA']
  .forEach(t => assert(html.includes(`"${t}"`), `Revisão automática reconhece a categoria ${t}`));
assert(!html.includes('MAXIMUM OF 3 PHRASES'), 'Teto de 3 marcadores de interpretação foi removido');
const nBloco = (html.match(/\$\{REGRA_ATRIBUICAO_PT\}/g) || []).length;
assert(nBloco >= 4, `Regra de atribuição aplicada em ${nBloco} prompts de geração`);
assert(/rewriteOnly|nunca apenas troque a palavra por sinônimo/.test(html), 'Prompt manda reescrever a frase, não trocar por sinônimo');

console.log('\n📋 8. Ideia de Vídeo Escolhida vazia');
const ini = html.indexOf("document.getElementById('btn-gerar-prompt-roteiro').addEventListener('click'");
const trecho = html.slice(ini, ini + 2500);
assert(trecho.includes('const ideia = inputIdeiaEscolhida.value.trim();'), 'Ideia vem só do campo, sem fallback para o tema');
assert(/if \(!ideia\) \{[\s\S]*UI\.showToast[\s\S]*return;/.test(trecho), 'Campo vazio mostra aviso e interrompe a geração');
assert(trecho.indexOf('if (!ideia)') < trecho.indexOf('limparResultadosEtapasPosteriores()'), 'A checagem acontece antes de limpar as etapas posteriores');

console.log('\n📋 Frases fixas do código (CTA, reservas, fallbacks) sem termos proibidos');
function stringsDe(inicio, fim) {
  const a = html.indexOf(inicio);
  const b = html.indexOf(fim, a);
  return (html.slice(a, b).match(/'((?:[^'\\\n]|\\.)*)'/g) || []).map(x => x.slice(1, -1)).filter(x => x.length > 25);
}
const fixas = [
  ...stringsDe('const complementos = [', '];'),
  ...stringsDe('const frasesComplemento = [', '];'),
  ...stringsDe('const ctaCurto =', 'const ctaPadrao')
];
assert(fixas.length >= 8, `Encontrou ${fixas.length} frases fixas para conferir`);
fixas.forEach(f => {
  const hit = run(`FORBIDDEN_TERMS.filter(t => t.pattern.test(${JSON.stringify(f)})).map(t => t.term)`);
  assert(hit.length === 0 && Catalogo.detectarProibidas(f).length === 0, `Frase fixa limpa: "${f.slice(0, 55)}..."`);
});
assert(!/\bcan[oô]nic/i.test(stringsDe('const frasesComplemento = [', '];').join(' ')), 'Frases de reserva não usam "canônico"');

console.log(`\n🎉 ${total} verificações passaram.\n`);
