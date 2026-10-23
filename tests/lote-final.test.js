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

console.log(`\n${process.exitCode ? '❌ HÁ FALHAS' : '🎉'} ${total} verificações.\n`);
