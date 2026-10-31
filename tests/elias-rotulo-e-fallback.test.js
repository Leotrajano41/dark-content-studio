// tests/elias-rotulo-e-fallback.test.js
// Validação estrita dos 2 bugs relatados:
// 1) Rótulo de seção entre colchetes vazando na Narração Limpa e no cenas.txt
// 2) Fallback de cena semântico com personagens + ação + lugar citados, sem repetição, mantendo ação com ficha

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const PlanoCenasModule = require('../js/plano-cenas.js');
const VersaoRevisadaModule = require('../js/versao-revisada.js');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, mensagem) {
  totalChecks++;
  assert.strictEqual(Boolean(condicao), true, mensagem);
  passedChecks++;
  console.log(`  ✓ ${mensagem}`);
}

console.log('=== TESTES: 2 BUGS CRÍTICOS (RÓTULO ENTRE COLCHETES & FALLBACK SEMÂNTICO) ===');

// ===========================================================================
// BUG 1: RÓTULO DE SEÇÃO ENTRE COLCHETES VAZANDO NA NARRAÇÃO LIMPA E CENAS.TXT
// ===========================================================================
console.log('\n--- BUG 1: Rótulo de seção entre colchetes vazando ---');

// Extrai a função limparTextoParaNarracao do index.html para testar de forma fiel
const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const matchLimpar = indexHtmlContent.match(/function limparTextoParaNarracao\([\s\S]*?\n\}/);
if (!matchLimpar) {
  throw new Error('Não foi possível localizar limparTextoParaNarracao em index.html');
}
const limparTextoParaNarracao = new Function(`
  ${matchLimpar[0]}
  return limparTextoParaNarracao;
`)();

const roteiroComRotulo = 'Nada aconteceu.\n\n**[O FOGO DO CÉU]**\n\nEntão Elias reparou o altar';
const narracaoLimpa = limparTextoParaNarracao(roteiroComRotulo);

checar(!narracaoLimpa.includes('[O FOGO DO CÉU]'), 'Narração limpa não contém [O FOGO DO CÉU]');
checar(!narracaoLimpa.includes('['), 'Narração limpa não contém caractere "["');
checar(!narracaoLimpa.includes(']'), 'Narração limpa não contém caractere "]"');
checar(narracaoLimpa.includes('Nada aconteceu.'), 'Narração limpa preserva "Nada aconteceu."');
checar(narracaoLimpa.includes('Elias reparou o altar'), 'Narração limpa preserva "Elias reparou o altar"');

// Testa no fluxo "Usar versão revisada"
const textoRevisadoColado = 'Nada aconteceu.\n\n**[O FOGO DO CÉU]**\n\nEntão Elias reparou o altar de pedras.';
const revisadoNormalizado = VersaoRevisadaModule.normalizarTextoRevisado(textoRevisadoColado);
checar(!revisadoNormalizado.includes('['), 'Versão revisada normalizada não contém "["');
checar(!revisadoNormalizado.includes(']'), 'Versão revisada normalizada não contém "]"');
checar(!revisadoNormalizado.includes('O FOGO DO CÉU'), 'Versão revisada normalizada não contém rótulo de seção em CAPS');

// Testa geração do cenas.txt a partir do plano de cenas
const planoEliasCurto = PlanoCenasModule.gerarPlanoDeCenas(narracaoLimpa, { tema: 'Elias e os profetas de Baal' });
const cenasTxtGerado = PlanoCenasModule.gerarCenasTxt(planoEliasCurto.cenas, narracaoLimpa);
const linhasCenas = cenasTxtGerado.split('\n');

for (let i = 0; i < linhasCenas.length; i++) {
  const linha = linhasCenas[i];
  checar(!linha.includes('['), `Linha ${i + 1} do cenas.txt não contém "[" ("${linha}")`);
  checar(!linha.includes(']'), `Linha ${i + 1} do cenas.txt não contém "]" ("${linha}")`);
}

// ===========================================================================
// BUG 2: FALLBACK DE CENA SEMÂNTICO (PERSONAGENS + AÇÃO + LUGAR, SEM REPETIÇÃO)
// ===========================================================================
console.log('\n--- BUG 2: Fallback de cena semântico rico ---');

const narracaoEliasCompleta = `Os profetas de Baal dançavam e gritavam ao redor do altar desde o romper da manhã.
O silêncio tomou conta do lugar e nenhuma voz respondeu aos seus clamores desesperados.
Então Elias chamou todo o povo para perto e reparou o altar do Senhor com doze pedras.
Elias cavou uma valeta ao redor do altar e mandou derramar quatro cântaros de água sobre o sacrifício.
Ao cair da tarde, Elias orou fervorosamente ao Deus de Abraão, Isaque e Israel suplicando por resposta.
O fogo do Senhor caiu do céu consumindo o holocausto, a lenha, as pedras e lambendo a água da valeta.
Ao verem o fogo celestial, todos caíram com o rosto em terra proclamando que o Senhor é Deus.
Elias mandou prender os profetas de Baal e os levou ao ribeiro de Quisom onde executou o juízo divino.
Uma pequena nuvem do tamanho da mão de um homem subiu do mar trazendo abundância de chuva sobre a terra.`;

// 1. Gera o plano de cenas completo (offline / fallback)
const planoElias = PlanoCenasModule.gerarPlanoDeCenas(narracaoEliasCompleta, {
  tema: 'Elias e os profetas de Baal',
  personagemPrincipal: 'Elias'
});

checar(planoElias.cenas.length >= 7, `Plano de cenas gerou ${planoElias.cenas.length} cenas`);

// 2. Confere que NENHUMA cena recebeu a frase genérica fixa antiga
const fraseGenericaAntiga = "Wide panoramic landscape shot of the historic biblical location with ancient encampment under dramatic atmospheric sky";
for (const c of planoElias.cenas) {
  checar(c.descricaoVisual !== fraseGenericaAntiga, `Cena ${c.numero} não usa a frase genérica fixa antiga`);
}

// 3. Confere que DUAS CENAS DO MESMO PLANO NUNCA TÊM descricaoVisual IDÊNTICA
const descricoes = planoElias.cenas.map(c => c.descricaoVisual.trim());
const descricoesUnicas = new Set(descricoes);
checar(descricoesUnicas.size === descricoes.length, `Todas as ${descricoes.length} cenas têm descrições visuais 100% distintas e únicas`);

// 4. Confere a cena de silêncio vs cena de oração e fogo
const cenaSilencio = planoElias.cenas.find(c => c.frases.join(' ').toLowerCase().includes('silêncio') || c.frases.join(' ').toLowerCase().includes('silencio'));
checar(Boolean(cenaSilencio), 'Cena do silêncio encontrada');
checar(/silence|quiet/i.test(cenaSilencio.descricaoVisual), `Cena do silêncio retrata silêncio/quietude: "${cenaSilencio.descricaoVisual}"`);

const cenaFogo = planoElias.cenas.find(c => c.frases.join(' ').toLowerCase().includes('fogo do senhor') || c.frases.join(' ').toLowerCase().includes('fogo'));
checar(Boolean(cenaFogo), 'Cena do fogo encontrada');
checar(/fire|pillar of blazing|celestial/i.test(cenaFogo.descricaoVisual), `Cena do fogo retrata fogo do céu: "${cenaFogo.descricaoVisual}"`);
checar(/altar|Mount Carmel/i.test(cenaFogo.descricaoVisual), `Cena do fogo retrata altar ou Monte Carmelo: "${cenaFogo.descricaoVisual}"`);

// 5. Confere que quando a ficha é injetada, a AÇÃO continua no prompt (ficha + ação + lugar)
checar(cenaFogo.promptIngles.includes('Elijah:'), 'Prompt final da cena do fogo inclui a ficha do Elias');
checar(/fire|altar/i.test(cenaFogo.promptIngles), 'Prompt final da cena do fogo preserva a ação física e o altar');
checar(!cenaFogo.promptIngles.endsWith('Elijah:. Full bleed image'), 'Prompt final não é apenas a ficha isolada');

// 6. Confere que antes de usar o fallback, tenta de novo a IA para aquela cena
(async () => {
  let chamadasIndividuaisIa = 0;
  const stubIaFalhandoNoLote = async (prompt) => {
    if (prompt.includes('Scene 02') || prompt.includes('ONE visual description for Scene 02')) {
      chamadasIndividuaisIa++;
      // A IA responde com sucesso na tentativa dedicada individual
      return JSON.stringify([{
        numero: "02",
        descricaoVisual: "Dramatic intense close-up on Elijah looking toward heaven with tears of earnest prayer beside the stone altar"
      }]);
    }
    // No lote inicial, devolve a cena 02 repetindo enquadramento e personagens da cena 01
    return JSON.stringify([
      {
        numero: "01",
        descricaoVisual: "Wide panoramic view of Mount Carmel with Elijah standing beside the altar"
      },
      {
        numero: "02",
        descricaoVisual: "Wide panoramic view of Mount Carmel with Elijah standing beside the altar"
      }
    ]);
  };

  const cenasTesteIa = [
    { numero: "01", frases: ["Os profetas de Baal dançavam ao redor do altar."] },
    { numero: "02", frases: ["Elias orou fervorosamente ao Deus de Israel."] }
  ];

  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasTesteIa,
    narracaoEliasCompleta,
    stubIaFalhandoNoLote,
    { tema: 'Elias e os profetas de Baal' }
  );

  checar(chamadasIndividuaisIa >= 1, `IA foi acionada individualmente para tentar a cena que faltou no lote (chamadas: ${chamadasIndividuaisIa})`);
  checar(cenasTesteIa[1].status === 'CONCLUIDA', 'Cena 02 concluída após tentativa individual');
  checar(cenasTesteIa[1].descricaoVisual.includes('Elijah looking toward heaven'), 'Cena 02 recebeu a descrição corrigida da IA');

  console.log(`\n🎉 Todos os testes dos 2 bugs passaram: ${passedChecks}/${totalChecks} verificações aprovadas!`);
})();
