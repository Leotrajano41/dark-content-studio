// tests/jonas-validador-mar-e-reserva.test.js
// Valida os 3 requisitos específicos do teste com "Jonas e o grande peixe":
// 1) Validador de mar/água não bloqueia cenas com contexto de mar/embarcação/peixe (plurais e contexto global).
// 2) Nenhuma cena fica PENDENTE por qualquer regra do validador (auto-recuperação universal, status CONCLUIDA).
// 3) Descrição de reserva rica, contextual, sem "solemn historical events" e com "Jonah" capitalizado.

const assert = require('assert');
const PlanoCenasModule = require('../js/plano-cenas.js');

function checar(condicao, mensagem) {
  assert.ok(condicao, mensagem);
  console.log(`  ✓ ${mensagem}`);
}

async function rodarTestesJonas() {
  console.log('=== TESTES: JONAS, VALIDADOR MAR/ÁGUA E DESCRIÇÃO DE RESERVA ===\n');

  // Narração simulando Jonas e o grande peixe (inclui trechos exatos do relato do usuário)
  const narracaoJonas = [
    'Na minha angústia clamei ao Senhor, e ele me respondeu; do ventre do abismo gritei, e tu ouviste a minha voz.',
    'A palavra do Senhor veio a Jonas pela primeira vez: Levanta-te, vai à grande cidade de Nínive.',
    'Mas Jonas se levantou para fugir para Társis, para longe da presença do Senhor.',
    'Ele desceu a Jope e embarcou num navio que ia para Társis, pagando a sua passagem.',
    'O Senhor, porém, lançou sobre o mar um forte vento, e levantou-se no mar uma grande tempestade.',
    'Os marinheiros ficaram com muito medo e cada um clamava ao seu deus, lançando a carga ao mar.',
    'Jonas, porém, havia descido ao porão do navio, onde se deitara e dormia profundamente.',
    'Lançaram sortes, e a sorte caiu sobre Jonas; ele confessou ser servo do Deus que fez o mar e a terra seca.',
    'Disseram-lhe: Que te faremos para que o mar se acalme? Ele respondeu: Lançai-me nas ondas.',
    'Eles levantaram a Jonas e o lançaram ao mar; e o mar cessou a sua fúria.',
    'Fui lançado nas profundezas, no coração dos mares, e a corrente me envolveu; todas as tuas ondas passaram sobre mim.',
    'O Senhor proveu um grande peixe para que engolisse a Jonas; e esteve no ventre do peixe três dias e três noites.',
    'E falou o Senhor ao peixe, e ele vomitou a Jonas na terra seca.',
    'Pela segunda vez veio a palavra do Senhor: vai a Nínive e proclama a mensagem.',
    'Jonas entrou na cidade, pregando: Ainda quarenta dias, e Nínive será destruída.',
    'Os homens de Nínive creram em Deus, proclamaram um jejum e vestiram-se de pano de saco.',
    'Deus viu as suas obras, como se converteram do seu mau caminho, e teve compaixão.',
    'Inscreva-se no canal e ative as notificações para mais estudos bíblicos profundos.'
  ].join('\n\n');

  const contextoProjeto = {
    tema: 'Jonas e o grande peixe',
    ideia: 'Jonas e o grande peixe: o que realmente aconteceu no ventre do animal',
    narracaoLimpa: narracaoJonas,
    personagemPrincipal: 'Jonas'
  };

  // --- TESTE 1: Validador de mar/água e reconhecimento contextual amplo ---
  console.log('--- TESTE 1: Validador de mar/água e plurais marítimos ---');

  // Cena 01: "Na minha angústia clamei..." com IA sugerindo mar
  const descCena01 = 'Dramatic medium shot of Jonah inside the aquatic deep waters praying with heartfelt anguish';
  const val01 = PlanoCenasModule.validarDescricaoVisualCena(
    descCena01,
    'Na minha angústia clamei ao Senhor, e ele me respondeu',
    contextoProjeto
  );
  checar(val01.valido === true, 'Cena 01 aprovada pelo validador graças ao contexto global marítimo do roteiro');

  // Cena 06: "...desceu a Jope e embarcou num navio..."
  const descCena06 = 'Wide panoramic shot showing Jonah boarding a weathered wooden ship at the ancient port of Joppa with ocean waves';
  const val06 = PlanoCenasModule.validarDescricaoVisualCena(
    descCena06,
    'Ele desceu a Jope e embarcou num navio que ia para Társis',
    contextoProjeto
  );
  checar(val06.valido === true, 'Cena 06 ("embarcou num navio") aprovada sem falso bloqueio de mar');

  // Cena 11: "...lançado nas profundezas, no coração dos mares..." (plural)
  const descCena11 = 'Jonah being cast into the tempestuous surging ocean waves and deep waters';
  const val11 = PlanoCenasModule.validarDescricaoVisualCena(
    descCena11,
    'Fui lançado nas profundezas, no coração dos mares, e a corrente me envolveu',
    contextoProjeto
  );
  checar(val11.valido === true, 'Cena 11 ("coração dos mares", plural) aprovada sem falso bloqueio');

  // --- TESTE 2: Plano de Cenas completo (Modo offline / fallback) ---
  console.log('\n--- TESTE 2: Geração de Plano de Cenas e eliminação de clichês proibidos ---');

  const plano = PlanoCenasModule.gerarPlanoDeCenas(narracaoJonas, contextoProjeto);

  checar(plano.cenas.length >= 10, `Gerou ${plano.cenas.length} cenas (esperado >= 10)`);

  const pendentesOffline = plano.cenas.filter(c => c.status === 'PENDENTE');
  checar(pendentesOffline.length === 0, `Zero cenas PENDENTE no plano offline (obtido: ${pendentesOffline.length})`);

  for (const c of plano.cenas) {
    checar(Boolean(c.descricaoVisual && c.descricaoVisual.trim()), `Cena ${c.numero} possui descrição visual preenchida`);
    checar(c.status === 'CONCLUIDA', `Cena ${c.numero} tem status CONCLUIDA`);
    checar(!c.descricaoVisual.includes('solemn historical events'), `Cena ${c.numero} NÃO contém "solemn historical events"`);
    checar(!c.descricaoVisual.includes('ancient biblical landscape'), `Cena ${c.numero} NÃO contém "ancient biblical landscape"`);
    checar(!/\bjonah\b/.test(c.descricaoVisual), `Cena ${c.numero} não usa "jonah" em minúsculas (usa "Jonah")`);
  }

  // --- TESTE 3: Auto-recuperação universal com IA devolvendo descrições rejeitadas ---
  console.log('\n--- TESTE 3: Auto-recuperação universal de qualquer reprovação da IA ---');

  // Simula uma IA que devolve descrições com diferentes tipos de infração:
  // - Cena 01: termos proibidos de bastidor
  // - Cena 02: palavras em português
  // - Cena 03: genérico ("tableau depicting")
  // - Cena 04: descrição vazia
  const stubIaInfrações = async (promptLote) => {
    return JSON.stringify([
      { numero: '01', descricaoVisual: 'Dramatic scene encouraging viewers to follow the journey' },
      { numero: '02', descricaoVisual: 'Jonah disse diante do povo no navio' },
      { numero: '03', descricaoVisual: 'solemn biblical historical tableau depicting figures' },
      { numero: '04', descricaoVisual: '' }
    ]);
  };

  const cenasParaIa = plano.cenas.slice(0, 4).map(c => ({
    numero: c.numero,
    frases: [...c.frases],
    status: 'PENDENTE',
    descricaoVisual: '',
    promptIngles: '',
    motivoPendente: ''
  }));

  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasParaIa,
    narracaoJonas,
    stubIaInfrações,
    contextoProjeto
  );

  const pendentesIa = cenasParaIa.filter(c => c.status === 'PENDENTE');
  checar(pendentesIa.length === 0, `Zero cenas PENDENTE após IA com descrições rejeitadas (obtido: ${pendentesIa.length})`);

  for (const c of cenasParaIa) {
    checar(c.status === 'CONCLUIDA', `Cena ${c.numero} auto-recuperada com status CONCLUIDA`);
    checar(Boolean(c.descricaoVisual && c.descricaoVisual.trim()), `Cena ${c.numero} tem descrição visual válida e rica`);
    checar(!c.descricaoVisual.includes('viewers'), `Cena ${c.numero} não contém "viewers"`);
    checar(!c.descricaoVisual.includes('solemn historical events'), `Cena ${c.numero} não contém "solemn historical events"`);
    checar(!c.descricaoVisual.includes('ancient biblical landscape'), `Cena ${c.numero} não contém "ancient biblical landscape"`);
    checar(c.promptIngles.includes('Depicting'), `Cena ${c.numero} possui prompt final montado`);
  }

  // --- TESTE 4: Fichas de personagem fixas geradas para Jonah ---
  console.log('\n--- TESTE 4: Fichas de personagem do Jonas ---');

  const fichas = contextoProjeto.fichasPersonagens || (typeof window !== 'undefined' && window._fichasPersonagensAtual);
  checar(Boolean(fichas && fichas['Jonah']), 'Ficha de Jonah criada e registrada no contexto');
  checar(!fichas['Personagens Bíblicos'], 'Não criou ficha para categoria "Personagens Bíblicos"');
  checar(!fichas['Bíblia'], 'Não criou ficha para "Bíblia"');

  console.log('\n🎉 Todos os testes de Jonas, Validador Mar/Água e Auto-Recuperação passaram com sucesso!');
}

rodarTestesJonas().catch(err => {
  console.error('❌ Falha nos testes de Jonas:', err);
  process.exit(1);
});
