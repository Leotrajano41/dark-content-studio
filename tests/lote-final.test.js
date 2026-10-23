// tests/lote-final.test.js — testes OFFLINE do lote final. Cada bloco reproduz o erro ANTES da correção.
const { html, criarContexto } = require('./_extrator.js');
const Catalogo = require('../js/catalogo.js');

let total = 0;
function assert(c, m) { total++; if (!c) { console.error(`  ❌ [FALHOU] ${m}`); process.exitCode = 1; } else console.log(`  ✅ [PASSOU] ${m}`); }

const ctxP = criarContexto({
  funcoes: ['normalizarAspasEPontuacao', 'validarECorrigirAspas', 'garantirEspacamentoEPontuacaoCitacoes', 'limparPontuacaoDuplicada', 'limparTextoParaNarracao', 'garantirCtaNoUltimoParagrafo', 'limitarTermosCanonicos', 'limitarDeclaracoesDeSilencioBiblico']
});
const cadeia = (t) => ctxP.limparPontuacaoDuplicada(ctxP.validarECorrigirAspas(ctxP.garantirEspacamentoEPontuacaoCitacoes(t)));
const limpa = (t) => ctxP.limparTextoParaNarracao(t, 'YouTube Longo (18-20 minutos)').split('\n\n')[0];

console.log('\n📋 39. Ponto solto depois de aspas de fechamento + palavra minúscula');
for (const [nome, f] of [['cadeia do roteiro', cadeia], ['Narração Limpa', limpa], ['Catálogo', (t) => Catalogo.padronizarAspasEPontuacao(t)]]) {
  assert(f('O povo foi chamado de "implacável". sobe o monte e vê a luz.') === 'O povo foi chamado de "implacável" sobe o monte e vê a luz.', `${nome}: "implacável". sobe → sem o ponto solto`);
  assert(f('Disse que era "implacável". Sobe o monte.') === 'Disse que era "implacável". Sobe o monte.', `${nome}: ponto legítimo (próxima frase em maiúscula) é mantido`);
}

console.log('\n📋 40. "ponto espaço ponto", ";." e ",."');
for (const [nome, f] of [['cadeia do roteiro', cadeia], ['Narração Limpa', limpa], ['Catálogo', (t) => Catalogo.padronizarAspasEPontuacao(t)]]) {
  assert(f('Moisés feriu. . a rocha com a vara.') === 'Moisés feriu. a rocha com a vara.', `${nome}: "feriu. . a rocha" → "feriu. a rocha"`);
  assert(f('Foi assim;. Depois saiu,. Fim.') === 'Foi assim. Depois saiu. Fim.', `${nome}: ";." e ",." viram "."`);
  assert(f('Ele "feriu a rocha" . . e saiu.') === 'Ele "feriu a rocha" e saiu.', `${nome}: aspas + " . ." também são limpas`);
  assert(f('Eles disseram: "Antes tivéssemos expirado!". Depois calaram.') === 'Eles disseram: "Antes tivéssemos expirado!" Depois calaram.', `${nome}: !". (ponto a mais depois de ! dentro das aspas) é limpo`);
  assert(f('Moisés disse: "Ouvi agora, rebeldes, porventura tiraremos água desta rocha para vós?". A rocha ficou.').includes('vós?" A rocha'), `${nome}: ?". também é limpo`);
  assert(f('Esperou muito...') === 'Esperou muito...', `${nome}: reticências "..." continuam`);
  assert(/\betc\.,/.test(f('Havia ouro, prata, etc., em abundância.')), `${nome}: "etc.," legítimo não é alterado`);
}


console.log('\n📋 43. Citação truncada: tem que terminar no fim de uma oração do versículo');
const fs = require('fs');
const Citacao = (() => { try { return require('../js/citacao.js'); } catch (e) { return null; } })();
assert(Citacao && typeof Citacao.analisarFimDaCitacao === 'function', 'js/citacao.js existe e exporta analisarFimDaCitacao');
const Validar = require('../api/validar-biblia.js');
const nm2012 = 'E o Senhor disse a Moisés e a Arão: Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado.';
const valida = (citacao, ref = 'Números 20:12') => Validar.validarRoteiroBiblico(`Moisés ouviu. "${citacao}" (${ref})`, 'Português (Brasil)', 'arc');
let r = valida('Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não');
assert(/por isso não metereis esta congregação na terra que lhes tenho dado/.test(r.textoCorrigido), 'Citação cortada em "por isso não" é COMPLETADA com o texto da ARC');
assert(r.alteracoes.some(a => a.tipo === 'CITACAO_COMPLETADA'), 'A conferência registra CITACAO_COMPLETADA');
r = valida('Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel');
assert(r.textoCorrigido.includes('"Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel"'), 'Citação que termina no fim de uma oração (vírgula do versículo) fica como está');
r = valida('por isso não metereis esta congregação na terra que lhes tenho dado');
assert(r.textoCorrigido.includes('"por isso não metereis esta congregação na terra que lhes tenho dado"'), 'Citação que termina no fim do versículo fica como está');
r = valida('Porquanto não me crestes, para me santificardes');
assert(!/santificardes/.test(r.textoCorrigido) && /para me santificar diante/.test(r.textoCorrigido), 'Citação com redação diferente da ARC ("santificardes") é trocada pela redação da ARC');
// extensão grande demais: tira as aspas em vez de inventar um trecho enorme
const longo = 'um dois três quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove vinte.';
let an = Citacao && Citacao.analisarFimDaCitacao(longo, 'um dois três quatro');
assert(an && an.status === 'truncada' && an.completada === null, 'Se faltarem mais de 14 palavras até o fim da oração, a ação é tirar as aspas (sem completada)');
an = Citacao && Citacao.analisarFimDaCitacao('um dois, três quatro cinco seis.', 'um dois, três quatro');
assert(an && an.status === 'truncada' && an.completada === 'um dois, três quatro cinco seis.', 'Se faltam poucas palavras, completa com o texto do versículo');
an = Citacao && Citacao.analisarFimDaCitacao('um dois, três quatro cinco seis.', 'um dois');
assert(an && an.status === 'ok', 'Termina em palavra com vírgula no versículo = fim de oração = ok');
r = valida(longo.split(' ').slice(0, 1).join(' ') + ' xx'); // citação que não existe no versículo não é tratada como truncada
assert(!r.alteracoes.some(a => a.tipo === 'CITACAO_COMPLETADA'), 'Texto que não aparece no versículo não é "completado"');
// Moisés (teste real do usuário): as duas citações problemáticas
const moises = fs.existsSync(require('path').join(__dirname, '..', 'testes-reais', 'moises-f8b5f2a.txt')) ? fs.readFileSync(require('path').join(__dirname, '..', 'testes-reais', 'moises-f8b5f2a.txt'), 'utf-8') : '';
assert(/por isso não metereis esta congregação na terra que lhes tenho dado/.test(moises) && /Porquanto não me crestes, para me santificardes/.test(moises), 'Fixture do teste real do Moisés carregada (testes-reais/moises-f8b5f2a.txt)');
// Catálogo: confere só contra o versículo citado e acusa citação truncada
const versosCitados = '[Números 20:12] "E o Senhor disse a Moisés e a Arão: Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado."';
let c = Catalogo.verificarCitacoesEmCodigo('Deus disse: "Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não" e Moisés calou.', versosCitados);
assert(!c.todasValidas && c.citacoesInvalidas.some(x => x.truncada), 'Catálogo: citação cortada no meio da oração é inválida (truncada)');
c = Catalogo.verificarCitacoesEmCodigo('Deus disse: "por isso não metereis esta congregação na terra que lhes tenho dado" e Moisés calou.', versosCitados);
assert(c.todasValidas, 'Catálogo: citação que termina no fim do versículo é válida');
c = Catalogo.verificarCitacoesEmCodigo('Disse o povo: "Antes tivéssemos expirado quando expiraram nossos irmãos" e foi assim.', versosCitados);
assert(!c.todasValidas, 'Catálogo: citação de outro versículo (por exemplo do contexto) é inválida para o versículo citado');
const rem = Catalogo.remediarItem('Deus disse: "Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não" e Moisés calou. Ele entrou.', [{ tipo: 'citacao_incorreta', frase: 'Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não', truncada: true, completada: 'Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado.' }], versosCitados);
assert(/metereis esta congregação na terra que lhes tenho dado/.test(rem.texto) && /Ele entrou/.test(rem.texto), 'Catálogo: remediação completa a citação em vez de apagar a frase inteira');
assert(/NÃO do contexto|nunca do contexto/i.test(require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'catalogo.js'), 'utf-8')), 'Prompts do Catálogo mandam citar só os versículos citados, nunca o contexto');

console.log(`\n${process.exitCode ? '❌ HÁ FALHAS' : '🎉'} ${total} verificações.\n`);
