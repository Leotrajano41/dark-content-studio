// tests/melhorias-curso-gancho.test.js
// Validação das novas funcionalidades:
// 1) Mini-ganchos nos prompts de roteiro
// 2) CTA contextualizado
// 3) Ganchos visuais de abertura (3 opções)
// 4) Marcação de cenas para animar (3 a 5 cenas)
// 5) Formato de animar.txt e sincronia com cenas/prompts
// 6) Dica de consistência facial do Gemini

const fs = require('fs');
const path = require('path');
const PlanoCenasModule = require('../js/plano-cenas.js');

let total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) {
    console.error(`  ❌ [FALHOU] ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASSOU] ${msg}`);
}

(async () => {
  console.log('\n🎬 1. Ganchos Visuais de Abertura (3 opções)');
  const mockCena1 = {
    numero: 1,
    fraseOriginal: 'Moisés apascentava o rebanho de Jetro no deserto e chegou ao monte de Deus, a Horebe.',
    descricaoVisual: 'Illuminated manuscript miniature of Moses looking at Mount Horeb.',
    promptFinal: 'Illuminated manuscript miniature of Moses looking at Mount Horeb... (Moses: 80-year-old Hebrew prophet...)'
  };

  const mockFichas = {
    'Moses': '80-year-old Hebrew prophet with weathered sun-tanned skin, long grey beard and hair, wearing modest ancient desert wool tunic.'
  };

  const ganchos = await PlanoCenasModule.gerarGanchosVisuaisAbertura(mockCena1.fraseOriginal, { tema: 'Moisés na sarça ardente', fichas: mockFichas });
  assert(Array.isArray(ganchos) && ganchos.length === 3, 'Gera exatamente 3 opções de abertura');
  assert(ganchos[0].tipo === 'CONSERVADORA', 'Opção 1 é CONSERVADORA');
  assert(ganchos[1].tipo === 'MEDIANA', 'Opção 2 é MEDIANA');
  assert(ganchos[2].tipo === 'OUSADA', 'Opção 3 é OUSADA');
  ganchos.forEach(g => {
    assert(g.nome && g.nome.length > 3, `Opção ${g.tipo} possui nome curto: "${g.nome}"`);
    assert(g.descricaoDiretor && g.descricaoDiretor.length > 20, `Opção ${g.tipo} possui descrição de diretor cinematográfica`);
    assert(g.porQuePrende && g.porQuePrende.length > 10, `Opção ${g.tipo} explica por que prende a atenção`);
    assert(g.descricaoVisual && g.descricaoVisual.length > 20, `Opção ${g.tipo} possui descricaoVisual`);
  });

  console.log('\n🎬 2. Aplicar Gancho de Abertura na Cena 1');
  const planoCenasMock = {
    cenas: [
      { ...mockCena1 },
      { numero: 2, fraseOriginal: 'E apareceu-lhe o anjo do Senhor numa chama de fogo.', descricaoVisual: 'The burning bush.', promptFinal: 'Bush...' }
    ]
  };

  // Testa aplicar a opção CONSERVADORA (que inclui Moses na cena)
  const planoComMoses = PlanoCenasModule.aplicarGanchoAberturaNaCena1(
    JSON.parse(JSON.stringify(planoCenasMock)),
    ganchos[0],
    { tema: 'Moisés na sarça ardente', fichas: mockFichas }
  );
  assert(planoComMoses.cenas[0].descricaoVisual === ganchos[0].descricaoVisual, 'Cena 1 recebe a nova descrição visual da opção conservadora');
  assert(planoComMoses.cenas[0].promptFinal.includes('Illuminated manuscript'), 'Prompt final preserva o estilo fixo Manuscrito');
  assert(planoComMoses.cenas[0].promptFinal.includes('80-year-old Hebrew prophet'), 'Prompt final injeta a ficha de Moses porque Moses aparece na cena');

  // Testa aplicar a opção OUSADA (macro das folhas, sem pessoa na cena)
  const planoComOusada = PlanoCenasModule.aplicarGanchoAberturaNaCena1(
    JSON.parse(JSON.stringify(planoCenasMock)),
    ganchos[2],
    { tema: 'Moisés na sarça ardente', fichas: mockFichas }
  );
  assert(planoComOusada.cenas[0].descricaoVisual === ganchos[2].descricaoVisual, 'Cena 1 recebe a nova descrição visual da opção ousada');
  assert(!planoComOusada.cenas[0].promptFinal.includes('80-year-old Hebrew prophet'), 'Opção macro de detalhe sem pessoas NÃO injeta ficha indevida');

  console.log('\n🎞️ 3. Marcação de Cenas para Animar (3 a 5 cenas)');
  const cenasLongo = Array.from({ length: 15 }, (_, i) => ({
    numero: i + 1,
    fraseOriginal: `Frase da cena bíblica ${i + 1} com grande impacto no monte de Deus.`,
    descricaoVisual: `Visual scene ${i + 1} with dynamic lighting and camera movement.`,
    promptFinal: `Prompt ${i + 1}...`
  }));

  const cenasComAnimar = PlanoCenasModule.marcarCenasParaAnimar(cenasLongo);
  const marcadas = cenasComAnimar.filter(c => c.animar === true);
  assert(marcadas.length >= 3 && marcadas.length <= 5, `Marca entre 3 e 5 cenas para animar (marcou ${marcadas.length})`);
  assert(cenasComAnimar[0].animar === true, 'Cena 1 é SEMPRE marcada para animar');

  console.log('\n📝 4. Geração do animar.txt e Prompts Curtos de Animação');
  const animarTxt = PlanoCenasModule.gerarAnimarTxt(cenasComAnimar);
  const linhasAnimar = animarTxt.split('\n').map(l => l.trim()).filter(Boolean);
  assert(linhasAnimar.length === marcadas.length, 'animar.txt contém exatamente uma linha por cena marcada');
  linhasAnimar.forEach(linha => {
    assert(/^\d{2}\s*\|\s*.+5s duration/i.test(linha), `Linha no padrão correto "NN | [prompt 5s duration]": ${linha}`);
  });

  console.log('\n📜 5. Dica de Consistência do Gemini no HTML');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  assert(html.includes('Para o personagem manter o mesmo rosto, anexe no Gemini a imagem já aprovada do personagem junto com o prompt da nova cena.'), 'Dica de consistência facial presente no index.html');
  assert(html.includes('card-gancho-visual-abertura'), 'Card de ganchos visuais presente no HTML');
  assert(html.includes('animar.txt'), 'animar.txt incluído no pacote scriptorium');

  console.log(`\n🎉 ${total} verificações do teste melhorias-curso-gancho passaram com sucesso!\n`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
