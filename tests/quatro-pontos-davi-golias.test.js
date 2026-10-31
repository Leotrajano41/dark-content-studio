const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PlanoCenasModule = require('../js/plano-cenas.js');

console.log('=== TESTES: 3 AJUSTES CRÍTICOS (GANCHO, FICHAS DINÂMICAS, VALIDADOR) ===\n');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, mensagem) {
  totalChecks++;
  try {
    assert.ok(condicao, mensagem);
    passedChecks++;
    console.log(`  ✓ ${mensagem}`);
  } catch (err) {
    console.error(`  ✗ FALHA: ${mensagem}`);
    throw err;
  }
}

(async () => {
  // =========================================================================
  // AJUSTE A: GANCHO — NÃO DIVIDIR EM VÍRGULA (,) NEM TRAVESSÃO (—)
  // Dividir SOMENTE em ; : . ! ? …
  // Se a primeira frase não tiver nenhum desses sinais, NÃO dividir (deixar inteira).
  // =========================================================================
  console.log('--- AJUSTE A: Gancho sem divisão em vírgulas nem travessões ---');

  // Teste obrigatório especificado pelo usuário:
  const fraseExemploUsuario = "Tu vens a mim com espada, e com lança, e com escudo; porém eu venho a ti em nome do Senhor dos Exércitos";
  const planoGanchoA = PlanoCenasModule.gerarPlanoDeCenas(fraseExemploUsuario, { tema: 'Davi e Golias' });

  checar(
    planoGanchoA.cenas.length === 2,
    `Frase com vírgulas e um ";" gerou exatamente 2 trechos (obtido: ${planoGanchoA.cenas.length}) — nunca 3 ou 4`
  );

  const trechoCena1 = planoGanchoA.cenas[0].fraseInicio;
  const trechoCena2 = planoGanchoA.cenas[1].fraseInicio;
  checar(trechoCena1.includes('espada') && trechoCena1.includes('escudo;'), `Cena 01 termina no ponto e vírgula: "${trechoCena1}"`);
  checar(trechoCena2.startsWith('porém eu venho'), `Cena 02 começa exatamente após o ponto e vírgula: "${trechoCena2}"`);

  // Se a frase for longa mas NÃO contiver ; : . ! ? …, NÃO dividir (deixar inteira numa cena só)
  const fraseSemSinal = "Davi correu rapidamente pelo leito pedregoso do vale com sua funda rústica de pastor e cinco pedras lisas guardadas na bolsa de couro sem parar nem recuar";
  const planoSemSinal = PlanoCenasModule.gerarPlanoDeCenas(fraseSemSinal, { tema: 'Davi e Golias' });
  checar(
    planoSemSinal.cenas.length === 1,
    `Frase longa sem nenhum dos sinais permitidos não é dividida (mantida em 1 única cena: ${planoSemSinal.cenas.length})`
  );

  // O texto no cenas.txt começa exatamente após o sinal
  const cenasTxtA = PlanoCenasModule.gerarCenasTxt(planoGanchoA.cenas, fraseExemploUsuario);
  const linhasCenasA = cenasTxtA.split('\n').filter(Boolean);
  checar(linhasCenasA[0].includes('Tu vens a mim com espada'), 'Linha 1 do cenas.txt começa no início da citação');
  checar(linhasCenasA[1].includes('porém eu venho a ti em nome'), 'Linha 2 do cenas.txt começa logo após o ponto e vírgula');

  // =========================================================================
  // AJUSTE B: FICHA DE PERSONAGEM DINÂMICA (PARA QUALQUER ROTEIRO)
  // Elias e Acabe: fichas curtas em inglês (idade, rosto, cabelo, barba, roupa, cores)
  // Injetadas de forma idêntica em todas as cenas de ambos os personagens
  // =========================================================================
  console.log('\n--- AJUSTE B: Fichas de personagem dinâmicas (ex.: Elias e Acabe) ---');

  const narracaoElias = [
    "Elias, o tisbita, subiu ao cume do monte Carmelo perante todo o povo de Israel.",
    "O rei Acabe reuniu os quatrocentos e cinquenta profetas de Baal no monte.",
    "Elias clamou ao Senhor Deus de Abraão, de Isaque e de Israel para que respondesse com fogo.",
    "Então caiu fogo do céu e consumiu o holocausto, a lenha, as pedras e lambeu a água na vala.",
    "O rei Acabe desceu em sua carruagem enquanto o céu se escurecia com nuvens pesadas e vento.",
    "A mão do Senhor estava sobre Elias, que cingiu os lombos e correu à frente da carruagem de Acabe até Jezreel."
  ].join(' ');

  // Simula callback de IA gerando fichas dinâmicas para personagens que não estão na lista fixa
  const stubIaFichas = async (prompt) => {
    if (prompt.includes('visual identity card') || prompt.includes('Elijah')) {
      return JSON.stringify({
        Elijah: "Elijah: robust elderly prophet in late sixties, piercing fiery eyes, weathered sun-browned face, wild unkempt grey beard and long grey hair, coarse dark camel-hair mantle, thick leather girdle belt",
        Ahab: "Ahab: arrogant middle-aged Hebrew king in late forties, conflicted brooding face, trimmed dark beard, royal bronze circlet crown, royal purple linen tunic with gold trim, ornate dagger at belt"
      });
    }
    // Para as cenas individuais
    return JSON.stringify([
      { numero: "01", descricaoVisual: "Elijah standing atop Mount Carmel overlooking the assembly" },
      { numero: "02", descricaoVisual: "Ahab standing proud with royal entourage watching the altar" },
      { numero: "03", descricaoVisual: "Elijah lifting hands in fervent prayer toward heaven beside the trench" },
      { numero: "04", descricaoVisual: "heavenly supernatural fire descending from stormy sky upon the altar" },
      { numero: "05", descricaoVisual: "Ahab riding his royal two-wheeled bronze chariot under torrential dark clouds" },
      { numero: "06", descricaoVisual: "Elijah running with prophetic strength along the muddy highway ahead of royal chariot" }
    ]);
  };

  const planoElias = PlanoCenasModule.gerarPlanoDeCenas(narracaoElias, { tema: 'Elias no Monte Carmelo' });
  const contextoElias = { tema: 'Elias no Monte Carmelo' };

  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    planoElias.cenas,
    narracaoElias,
    stubIaFichas,
    contextoElias
  );

  checar(Boolean(contextoElias.fichasPersonagens), 'Fichas de personagens foram geradas e anexadas ao contexto do projeto');
  const fichaElias = contextoElias.fichasPersonagens['Elijah'] || contextoElias.fichasPersonagens['Elias'];
  const fichaAcabe = contextoElias.fichasPersonagens['Ahab'] || contextoElias.fichasPersonagens['Acabe'];

  checar(Boolean(fichaElias), 'Ficha de Elias gerada com sucesso');
  checar(Boolean(fichaAcabe), 'Ficha de Acabe gerada com sucesso');
  checar(fichaElias.includes('late sixties') && fichaElias.includes('camel-hair mantle'), 'Ficha de Elias contém idade, barba e vestes');
  checar(fichaAcabe.includes('late forties') && fichaAcabe.includes('royal purple'), 'Ficha de Acabe contém idade, rosto, coroa e vestes reais');

  // Confere que a MESMA linha idêntica de Elias aparece em todas as cenas onde ele é citado
  const cenasComElias = planoElias.cenas.filter(c => c.frases.join(' ').toLowerCase().includes('elias'));
  checar(cenasComElias.length >= 2, `Elias aparece em múltiplas cenas (${cenasComElias.length})`);
  for (const c of cenasComElias) {
    checar(c.promptIngles.includes(fichaElias), `Prompt da cena ${c.numero} inclui a ficha canônica idêntica de Elias`);
  }

  // Confere que a MESMA linha idêntica de Acabe aparece em todas as cenas onde ele aparece na imagem (descricaoVisual)
  const cenasComAcabe = planoElias.cenas.filter(c => PlanoCenasModule.detectarPersonagensNaDescricao(c.descricaoVisual).includes('ahab'));
  checar(cenasComAcabe.length >= 2, `Acabe aparece visualmente em múltiplas cenas (${cenasComAcabe.length})`);
  for (const c of cenasComAcabe) {
    checar(c.promptIngles.includes(fichaAcabe), `Prompt da cena ${c.numero} inclui a ficha canônica idêntica de Acabe`);
  }

  // PONTO 1: Na cena onde o personagem é só mencionado na frase mas NÃO aparece na imagem, NÃO injeta
  const cena06 = planoElias.cenas.find(c => c.numero === '06');
  if (cena06) {
    checar(!cena06.promptIngles.includes(fichaAcabe), 'Cena 06 não inclui ficha de Acabe pois ele é só mencionado na fala');
  }

  // Se o personagem estiver na lista fixa (ex: Davi e Golias), USA A LISTA FIXA em vez de pedir à IA
  const fichasDavi = await PlanoCenasModule.extrairOuGerarFichasDoRoteiro("Davi enfrentou Golias no vale de Elá.", null);
  checar(fichasDavi['David'] === PlanoCenasModule.FICHAS_PERSONAGENS['David'], 'Personagens do catálogo canônico usam a ficha fixa pronta');

  // =========================================================================
  // AJUSTE C: VALIDADOR DE ENQUADRAMENTO REPETIDO
  // Se a IA devolver o mesmo enquadramento e mesmos personagens da anterior:
  // Tenta até 2 vezes; se ainda falhar, usa o fallback trocando o tipo de plano.
  // NUNCA DEIXAR A CENA COMO PENDENTE POR CAUSA DESSA REGRA!
  // =========================================================================
  console.log('\n--- AJUSTE C: Validador de enquadramento repetido com auto-recuperação ---');

  // Usamos frases com comprimento suficiente para que o agrupador gere a Cena 01 e a Cena 02
  const narracaoDuasCenas = "Davi desceu apressadamente pelas encostas íngremes do vale de Elá com sua funda e seu cajado de pastor na mão. Do outro lado o gigante Golias marchou com passos pesados exibindo sua armadura de bronze e sua espada afiada.";
  const planoCenasC = PlanoCenasModule.gerarPlanoDeCenas(narracaoDuasCenas, { tema: 'Davi e Golias' });
  checar(planoCenasC.cenas.length >= 2, `Cenas geradas para o teste: ${planoCenasC.cenas.length} cenas`);

  // Stub de IA teimosa: na cena 2 ela sempre tenta devolver wide shot com Davi e Golias
  let tentativasCena2 = 0;
  const stubIaTeimosa = async (prompt) => {
    if (prompt.includes('Scene 02') || prompt.includes('Scene 2') || prompt.includes('Davi e Golias se encararam')) {
      tentativasCena2++;
      // A IA insiste em devolver o mesmo enquadramento repetido
      return JSON.stringify([{
        numero: "02",
        descricaoVisual: "Wide panoramic establishing landscape shot of the Valley of Elah with both David and Goliath standing in the distance under the sunset"
      }]);
    }
    return JSON.stringify([
      {
        numero: "01",
        descricaoVisual: "Wide panoramic establishing landscape shot of the Valley of Elah with both David and Goliath standing in the distance under the sunset"
      },
      {
        numero: "02",
        descricaoVisual: "Wide panoramic establishing landscape shot of the Valley of Elah with both David and Goliath standing in the distance under the sunset"
      }
    ]);
  };

  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    planoCenasC.cenas,
    narracaoDuasCenas,
    stubIaTeimosa,
    { tema: 'Davi e Golias' }
  );

  const cena1 = planoCenasC.cenas[0];
  const cena2 = planoCenasC.cenas[1];

  checar(cena1.status === 'CONCLUIDA', 'Cena 01 concluída com sucesso');
  checar(cena2.status === 'CONCLUIDA', 'Cena 02 NUNCA fica como PENDENTE por repetição de enquadramento');
  checar(!cena2.promptIngles.includes('[PENDENTE:'), 'Prompt da cena 02 não contém marcação de PENDENTE');
  checar(tentativasCena2 >= 1, `IA foi chamada para tentar corrigir o enquadramento (tentativas: ${tentativasCena2})`);

  // O fallback trocou o enquadramento para close-up ou detalhe
  const enq1 = PlanoCenasModule.detectarTipoEnquadramento ? PlanoCenasModule.detectarTipoEnquadramento(cena1.descricaoVisual) : 'aberto';
  const desc2Lower = cena2.descricaoVisual.toLowerCase();
  checar(
    desc2Lower.includes('close-up') || desc2Lower.includes('macro') || desc2Lower.includes('detail'),
    `Cena 02 recebeu plano alternativo (close-up ou detalhe) em vez de repetir wide shot: "${cena2.descricaoVisual}"`
  );

  // Confere também o comportamento direto da função de fallback alternativo
  const fallbackAlternativo = PlanoCenasModule.gerarFallbackEnquadramentoAlternativo('Davi encarou o gigante', '02', 'aberto');
  checar(fallbackAlternativo.includes('close-up') || fallbackAlternativo.includes('Macro'), `Fallback trocou plano aberto por close/macro: "${fallbackAlternativo}"`);

  console.log(`\n🎉 Todos os testes dos 3 ajustes passaram: ${passedChecks}/${totalChecks} verificações aprovadas!`);
})();
