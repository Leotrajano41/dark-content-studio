// tests/fichas-ester-rute-e-palavras-proibidas.test.js
// Validação estrita dos pontos:
// 1) Fichas dinâmicas criadas para personagens bíblicos:
//    - Categoria e palavras genéricas (Personagens Bíblicos, Bíblia, Deus, Senhor, Israel, povo, rei, rainha, profeta) NUNCA viram ficha
//    - Chaves duplicadas com maiúscula/minúscula (Haman / haman) unificadas em uma chave canônica
//    - Isolamento por sessão (zeramento e transição de Ester para Rute)
//    - Retry na chamada à IA com emissão de aviso amarelo (nunca fica vazio)
// 2) Cena de reserva SEM elementos de outra história:
//    - "Essas palavras colocaram uma rainha judia diante da escolha entre o silêncio seguro e a intervenção arriscada"
//      Gera cena com Esther e Palácio de Susã, SEM "prophets", "pagan", "Baal" ou "Carmel"
// 3) Auto-recuperação de termos proibidos (viewers/audience/subscribe/channel):
//    - Termo legítimo "royal audience with the king" preservado/sanitizado sem reprovação
//    - Termos proibidos meta são sanitizados e aprovados (nunca PENDENTE)

const assert = require('assert');
const PlanoCenasModule = require('../js/plano-cenas.js');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, mensagem) {
  totalChecks++;
  assert.strictEqual(Boolean(condicao), true, mensagem);
  passedChecks++;
  console.log(`  ✓ ${mensagem}`);
}

console.log('=== TESTES: FICHAS DINÂMICAS & AUTO-RECUPERAÇÃO DE PALAVRAS PROIBIDAS ===\n');

if (typeof global.window === 'undefined') {
  global.window = {};
}

// ===========================================================================
// TESTE 1: TEMA ESTER FORA DA LISTA FIXA (Esther, Ahasuerus, Haman, Mordecai)
//          + NUNCA CRIAR FICHA PARA CATEGORIA / GENÉRICOS + UNIFICAÇÃO DE CHAVES
// ===========================================================================
console.log('--- TESTE 1: Fichas dinâmicas para Ester diante do rei Assuero & Unificação ---');

const narracaoEster = `No palácio de Susã, o rei Assuero reinava sobre cento e vinte e sete províncias.
Mardoqueu descobriu a conspiração de Hamã para destruir todo o povo judeu.
Mardoqueu enviou uma mensagem urgente à rainha Ester para interceder junto ao rei.
Ester jejuou por três dias e vestiu seus trajes reais para entrar no pátio interior.
O rei Assuero estendeu o cetro de ouro para Ester ao vê-la no pátio.
Ester convidou o rei Assuero e Hamã para um banquete especial no palácio.
No banquete, Ester revelou o plano perverso de Hamã diante do rei Assuero.
O rei ordenou que Hamã fosse punido e exaltou Mardoqueu como primeiro-ministro.`;

const planoEster = PlanoCenasModule.gerarPlanoDeCenas(narracaoEster, {
  tema: 'Ester diante do rei Assuero',
  personagemPrincipal: 'Personagens Bíblicos' // Simula passagem da categoria do select-tema
});

const fichasEster = global.window._fichasPersonagensAtual;
checar(Boolean(fichasEster && Object.keys(fichasEster).length > 0), 'window._fichasPersonagensAtual preenchido com fichas (não vazio)');

// AJUSTE 1: Categoria e termos genéricos NUNCA viram ficha
const chavesEsterRaw = Object.keys(fichasEster);
checar(!chavesEsterRaw.includes('Personagens Bíblicos') && !chavesEsterRaw.includes('personagens bíblicos'), 'NUNCA cria ficha para categoria "Personagens Bíblicos"');
checar(!chavesEsterRaw.includes('Bíblia') && !chavesEsterRaw.includes('biblia'), 'NUNCA cria ficha para "Bíblia"');
checar(!chavesEsterRaw.includes('Deus') && !chavesEsterRaw.includes('deus'), 'NUNCA cria ficha para "Deus"');
checar(!chavesEsterRaw.includes('Senhor') && !chavesEsterRaw.includes('senhor'), 'NUNCA cria ficha para "Senhor"');
checar(!chavesEsterRaw.includes('Israel') && !chavesEsterRaw.includes('israel'), 'NUNCA cria ficha para "Israel"');
checar(!chavesEsterRaw.includes('povo') && !chavesEsterRaw.includes('Povo'), 'NUNCA cria ficha para "povo"');
checar(!chavesEsterRaw.includes('rei') && !chavesEsterRaw.includes('Rei'), 'NUNCA cria ficha para substantivo comum isolado "rei"');
checar(!chavesEsterRaw.includes('rainha') && !chavesEsterRaw.includes('Rainha'), 'NUNCA cria ficha para substantivo comum isolado "rainha"');
checar(!chavesEsterRaw.includes('profeta') && !chavesEsterRaw.includes('Profeta'), 'NUNCA cria ficha para substantivo comum isolado "profeta"');

// AJUSTE 1: Juntar chaves duplicadas com maiúscula/minúscula (Haman / haman)
checar(chavesEsterRaw.includes('Haman'), 'Fichas contêm chave canônica "Haman"');
checar(!chavesEsterRaw.includes('haman'), 'Chave duplicada minúscula "haman" NÃO existe (unificada em "Haman")');
checar(chavesEsterRaw.includes('Esther'), 'Fichas contêm chave canônica "Esther"');
checar(!chavesEsterRaw.includes('esther'), 'Chave duplicada minúscula "esther" NÃO existe (unificada em "Esther")');
checar(chavesEsterRaw.includes('Ahasuerus'), 'Fichas contêm chave canônica "Ahasuerus"');
checar(!chavesEsterRaw.includes('ahasuerus'), 'Chave duplicada minúscula "ahasuerus" NÃO existe (unificada em "Ahasuerus")');
checar(chavesEsterRaw.includes('Mordecai'), 'Fichas contêm chave canônica "Mordecai"');
checar(!chavesEsterRaw.includes('mordecai'), 'Chave duplicada minúscula "mordecai" NÃO existe (unificada em "Mordecai")');

// Conferir consistência das fichas nas cenas onde cada um aparece
let cenasComEsther = 0;
let cenasComAhasuerus = 0;
let textoFichaEsther = null;
let textoFichaAhasuerus = null;

for (const c of planoEster.cenas) {
  if (c.promptIngles.includes('Esther:')) {
    cenasComEsther++;
    const match = c.promptIngles.match(/\[Character Sheet - Esther: (.*?)\]/);
    if (match) {
      if (!textoFichaEsther) {
        textoFichaEsther = match[1];
      } else {
        checar(textoFichaEsther === match[1], `Cena ${c.numero} repete exatamente a mesma ficha de Esther`);
      }
    }
  }
  if (c.promptIngles.includes('Ahasuerus:') || c.promptIngles.includes('King Ahasuerus:')) {
    cenasComAhasuerus++;
    const match = c.promptIngles.match(/\[Character Sheet - (?:King )?Ahasuerus: (.*?)\]/);
    if (match) {
      if (!textoFichaAhasuerus) {
        textoFichaAhasuerus = match[1];
      } else {
        checar(textoFichaAhasuerus === match[1], `Cena ${c.numero} repete exatamente a mesma ficha de Ahasuerus`);
      }
    }
  }
}

checar(cenasComEsther >= 2, `Esther aparece com ficha em pelo menos 2 cenas (${cenasComEsther} cenas)`);
checar(cenasComAhasuerus >= 2, `Ahasuerus aparece com ficha em pelo menos 2 cenas (${cenasComAhasuerus} cenas)`);

// ===========================================================================
// TESTE 1B (AJUSTE 2): CENA DE RESERVA SEM ELEMENTOS DE OUTRA HISTÓRIA
// ===========================================================================
console.log('\n--- TESTE 1B: Cena de reserva de Ester não vaza profetas de Baal nem Carmelo ---');

const fraseCena02Ester = 'Essas palavras colocaram uma rainha judia diante da escolha entre o silêncio seguro e a intervenção arriscada.';
const planoCena02 = PlanoCenasModule.gerarPlanoDeCenas(fraseCena02Ester, {
  tema: 'Ester diante do rei Assuero'
});

const cena02Reserva = planoCena02.cenas[0];
const desc02Lower = cena02Reserva.descricaoVisual.toLowerCase();
const prompt02Lower = cena02Reserva.promptIngles.toLowerCase();

checar(
  desc02Lower.includes('esther') || desc02Lower.includes('queen') || desc02Lower.includes('susa') || desc02Lower.includes('palace'),
  'Descrição de reserva da cena 02 da Ester refere-se a Esther ou ao palácio de Susã'
);
checar(!desc02Lower.includes('prophet') && !prompt02Lower.includes('prophet'), 'Cena da Ester NÃO contém "prophets"');
checar(!desc02Lower.includes('pagan') && !prompt02Lower.includes('pagan'), 'Cena da Ester NÃO contém "pagan"');
checar(!desc02Lower.includes('baal') && !prompt02Lower.includes('baal'), 'Cena da Ester NÃO contém "Baal"');
checar(!desc02Lower.includes('carmel') && !prompt02Lower.includes('carmel'), 'Cena da Ester NÃO contém "Carmel"');

// ===========================================================================
// TESTE 2: SESSÃO SEQUENCIAL COM NOVO TEMA FORA DA LISTA (Rute e Boaz)
// ===========================================================================
console.log('\n--- TESTE 2: Transição de sessão para 2º tema (Rute e Boaz) ---');

const narracaoRute = `Noemi retornou de Moabe para a terra de Belém acompanhada de sua nora Rute.
Rute foi respigar espigas nos campos de cevada que pertenciam a Boaz.
Boaz reparou na dedicação de Rute e ordenou aos ceifeiros que deixassem espigas para ela.
Boaz redimiu as terras da família de Noemi e tomou Rute por esposa sob a bênção dos anciãos.`;

const planoRute = PlanoCenasModule.gerarPlanoDeCenas(narracaoRute, {
  tema: 'Rute e Boaz',
  personagemPrincipal: 'Rute'
});

const fichasRute = global.window._fichasPersonagensAtual;
const chavesRute = Object.keys(fichasRute).map(k => k.toLowerCase());

// Não pode sobrar nenhum personagem de Ester
checar(!chavesRute.includes('esther') && !chavesRute.includes('ester'), 'Fichas de Rute NÃO contêm Esther do projeto anterior');
checar(!chavesRute.includes('ahasuerus') && !chavesRute.includes('assuero'), 'Fichas de Rute NÃO contêm Ahasuerus do projeto anterior');
checar(!chavesRute.includes('haman') && !chavesRute.includes('hama'), 'Fichas de Rute NÃO contêm Haman do projeto anterior');
checar(!chavesRute.includes('mordecai') && !chavesRute.includes('mardoqueu'), 'Fichas de Rute NÃO contêm Mordecai do projeto anterior');

// Deve conter Ruth e Boaz
checar(chavesRute.includes('ruth'), 'Fichas de Rute contêm Ruth');
checar(chavesRute.includes('boaz'), 'Fichas de Rute contêm Boaz');

// Cenas de Boaz e Rute devem receber as fichas no prompt
const cenasComRuth = planoRute.cenas.filter(c => c.promptIngles.includes('Ruth:'));
const cenasComBoaz = planoRute.cenas.filter(c => c.promptIngles.includes('Boaz:'));
checar(cenasComRuth.length >= 1, `Cenas com ficha de Ruth inseridas (${cenasComRuth.length})`);
checar(cenasComBoaz.length >= 1, `Cenas com ficha de Boaz inseridas (${cenasComBoaz.length})`);

// ===========================================================================
// TESTE 3: RETRY NA IA E AVISO AMARELO COM FALLBACK DETERMINÍSTICO
// ===========================================================================
console.log('\n--- TESTE 3: Retry da IA de fichas e aviso amarelo ---');

let chamadasIa = 0;
const chamarIaComFalha = async () => {
  chamadasIa++;
  throw new Error('Falha de rede simulada na IA de fichas');
};

let avisosEmitidos = [];
const contextoTeste = {
  tema: 'Sansão e Dalila',
  avisos: [],
  UI: {
    showToast: (msg, tipo) => {
      avisosEmitidos.push({ msg, tipo });
    }
  }
};

(async () => {
  const narracaoSansao = 'Sansão revelou seu segredo a Dalila no vale de Soreque.';
  const fichasSansao = await PlanoCenasModule.extrairOuGerarFichasDoRoteiro(
    narracaoSansao,
    contextoTeste,
    chamarIaComFalha
  );

  checar(chamadasIa === 2, `IA tentou 2 vezes (chamada inicial + 1 retry): chamadas = ${chamadasIa}`);
  checar(
    avisosEmitidos.some(a => a.tipo === 'warning'),
    'Aviso amarelo (warning) emitido após as falhas da IA'
  );
  checar(
    Boolean(fichasSansao && Object.keys(fichasSansao).length > 0),
    'Fallback determinístico gerou fichas (nunca fica vazio)'
  );
  const chavesSansao = Object.keys(fichasSansao).map(k => k.toLowerCase());
  checar(chavesSansao.includes('samson') || chavesSansao.includes('delilah'), 'Fichas determinísticas incluem Samson ou Delilah');
})().then(() => {

  // ===========================================================================
  // TESTE 4: AUDIÊNCIA LEGÍTIMA E SANITIZAÇÃO DE PALAVRAS PROIBIDAS
  // ===========================================================================
  console.log('\n--- TESTE 4: Auto-recuperação de palavras proibidas e audiência legítima ---');

  // Caso 4A: Termo legítimo de audiência com o rei não deve ser reprovado
  const descAudiencia = 'Queen Esther enters the throne room requesting a royal audience with the king in Susa palace.';
  const validacaoAudiencia = PlanoCenasModule.validarDescricaoVisualCena(descAudiencia);
  checar(validacaoAudiencia.valido === true, 'royal audience with the king NÃO é reprovado por termos de bastidor');

  // Caso 4B: Termos proibidos reais de YouTube/bastidor são sanitizados e aprovados
  const descComProibidas = 'Wide shot of the temple courtyard while viewers and audience subscribe to our channel for more biblical stories.';
  const sanitizada = PlanoCenasModule.limparPalavrasProibidasAudiencia(descComProibidas);
  checar(!sanitizada.toLowerCase().includes('viewers'), 'Palavra "viewers" removida pela sanitização');
  checar(!sanitizada.toLowerCase().includes('subscribe'), 'Palavra "subscribe" removida pela sanitização');
  checar(!sanitizada.toLowerCase().includes('channel'), 'Palavra "channel" removida pela sanitização');

  // Simular regeneração de cena com termos de audiência proibidos
  const cenaComProblema = {
    numero: '11',
    descricaoVisual: 'High angle of the throne room. Viewers are invited to subscribe to the channel as the queen kneels.',
    status: 'PENDENTE',
    motivoPendente: 'Contém termos de audiência ou bastidor proibidos no prompt visual (viewers/audience/subscribe/channel)',
    promptIngles: '',
    frases: ['Ester se ajoelhou diante do trono.']
  };

  // Simula regeneração onde a IA ainda devolveria palavra proibida
  const chamarIaTeimosa = async () => '[{"numero": "11", "descricaoVisual": "Dramatic wide shot of the throne room with majestic columns for our channel audience."}]';

  PlanoCenasModule.regenerarCenasPendentes([cenaComProblema], 'Ester se ajoelhou diante do trono.', chamarIaTeimosa).then(resultado => {
    const cenasRegeradas = resultado.cenas;
    const cena11 = cenasRegeradas.find(c => String(c.numero) === '11');
    checar(cena11.status === 'CONCLUIDA', `Cena 11 após auto-recuperação tem status "CONCLUIDA" (nunca PENDENTE). Status atual: ${cena11.status}`);
    checar(!cena11.promptIngles.toLowerCase().includes('channel'), 'Prompt da cena 11 não contém "channel"');
    checar(!cena11.descricaoVisual.toLowerCase().includes('channel'), 'descricaoVisual da cena 11 não contém "channel"');

    console.log(`\n🎉 Todos os ${passedChecks}/${totalChecks} testes passaram com sucesso!`);
  }).catch(err => {
    console.error('Erro no teste assíncrono:', err);
    process.exit(1);
  });

}).catch(err => {
  console.error('Erro no teste assíncrono:', err);
  process.exit(1);
});
