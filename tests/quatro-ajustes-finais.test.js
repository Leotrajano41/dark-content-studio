/**
 * tests/quatro-ajustes-finais.test.js
 * Validação dos 4 novos ajustes requisitados:
 * 1) FICHA SÓ PARA QUEM APARECE NA CENA (e não para quem é citado em fala, oração ou genealogia)
 * 2) NÃO REPETIR A MESMA CENA NO VÍDEO INTEIRO (combinação de plano + personagens + ação)
 * 3) NOME DO ZIP CURTO (antes de ":", máx 6 palavras, máx 60 caracteres)
 * 4) ROTEIRO INCOMPLETO OU EMBARALHADO (reprovação automática das 2 narrações ruins)
 */

const assert = require('assert');
const PlanoCenasModule = require('../js/plano-cenas.js');

function checar(condicao, mensagem) {
  assert.ok(condicao, mensagem);
  console.log(`  ✓ ${mensagem}`);
}

async function rodarTestes() {
  console.log('=== TESTES DOS 4 AJUSTES FINAIS ===\n');

  // =========================================================================
  // PONTO 1: FICHA SÓ PARA QUEM APARECE NA CENA
  // =========================================================================
  console.log('--- Ponto 1: Ficha só para quem aparece na cena ---');

  const fichasContexto = {
    fichasPersonagens: {
      Elijah: 'Elijah: robust elderly Hebrew prophet in late sixties, wild grey beard, coarse camel-hair mantle',
      Abraham: 'Abraham: venerable patriarch with white beard and ancient linen tunic',
      Isaac: 'Isaac: gentle elderly patriarch in earth-toned woolen robes',
      Ahab: 'Ahab: arrogant Hebrew monarch in late forties, royal bronze circlet, purple tunic'
    }
  };

  // Cena 11 de Elias: o texto bíblico contém oração citando "Deus de Abraão, de Isaque e de Israel"
  const trechoCena11 = 'Então orou: Ó Senhor Deus de Abraão, de Isaque e de Israel, manifeste-se hoje que tu és Deus em Israel.';
  const descCena11 = 'Elijah kneeling with arms outstretched toward the heavens in earnest fervent prayer beside the stone altar atop Mount Carmel';

  const promptFinalCena11 = PlanoCenasModule.montarPromptFinalCena(descCena11, trechoCena11, fichasContexto);

  checar(promptFinalCena11.includes('Elijah: robust elderly Hebrew prophet'), 'Prompt da cena 11 inclui a ficha de Elias');
  checar(!promptFinalCena11.includes('Abraham: venerable patriarch'), 'Prompt da cena 11 NÃO inclui a ficha de Abraão (ele é citado apenas em oração)');
  checar(!promptFinalCena11.includes('Isaac: gentle elderly patriarch'), 'Prompt da cena 11 NÃO inclui a ficha de Isaque (ele é citado apenas em oração)');
  checar(!promptFinalCena11.includes('Ahab: arrogant Hebrew monarch'), 'Prompt da cena 11 NÃO inclui a ficha de Acabe');

  // Cena 03 de Elias: o trecho menciona Acabe, mas a descrição visual foca exclusivamente em Elias
  const trechoCena03 = 'Elias confrontou a Acabe com autoridade sagrada diante de todo o povo reunido.';
  const descCena03 = 'Elijah standing resolute on the windswept summit of Mount Carmel under dramatic overcast skies';

  const promptFinalCena03 = PlanoCenasModule.montarPromptFinalCena(descCena03, trechoCena03, fichasContexto);
  checar(promptFinalCena03.includes('Elijah: robust elderly Hebrew prophet'), 'Prompt da cena 03 inclui a ficha de Elias');
  checar(!promptFinalCena03.includes('Ahab: arrogant Hebrew monarch'), 'Prompt da cena 03 NÃO inclui a ficha de Acabe pois Acabe não aparece na imagem');

  // Limpeza de expressões genealógicas
  const genealogicaLimpa = PlanoCenasModule.limparExpressoesGenealogicas('Ó Senhor Deus de Abraão, de Isaque e de Israel, filhos de Jacó');
  checar(!/\babra[aã]o\b/i.test(genealogicaLimpa), 'limparExpressoesGenealogicas remove "Deus de Abraão"');
  checar(!/\bisaque\b/i.test(genealogicaLimpa), 'limparExpressoesGenealogicas remove "de Isaque"');
  checar(!/\bjac[oó]\b/i.test(genealogicaLimpa), 'limparExpressoesGenealogicas remove "filhos de Jacó"');

  // =========================================================================
  // PONTO 2: NÃO REPETIR A MESMA CENA NO VÍDEO INTEIRO
  // =========================================================================
  console.log('\n--- Ponto 2: Não repetir a mesma cena no vídeo inteiro ---');

  // Simulação de plano com descrições anteriores (Cena 01 foi aberto com Elias no Carmelo)
  const contextoDescricoes = {
    descricoesAnteriores: [
      'Wide panoramic landscape shot of Mount Carmel depicting Elijah standing alone pointing toward the gathered Hebrew multitude under morning sky', // Cena 01
      'Dynamic medium shot showing Elijah and Ahab facing each other in royal confrontation', // Cena 02
      'Dramatic intense close-up on Elijah with focused facial expression and determined gaze', // Cena 03
      'Macro detail shot capturing the pagan ceremonial blades and unlit stone altar of Baal' // Cena 04
    ]
  };

  // Tentativa de Cena 05 com a mesma combinação de plano (aberto) + mesmo personagem (Elias) + mesma ação (no Carmelo diante da multidão) da Cena 01
  const descCena05Repetida = 'Wide panoramic landscape shot of Mount Carmel depicting Elijah standing and gesturing to the multitude under atmospheric clouds';
  const validacaoRepetida = PlanoCenasModule.validarDescricaoVisualCena(descCena05Repetida, 'Elias então falou ao povo', contextoDescricoes);

  checar(!validacaoRepetida.valido, 'validarDescricaoVisualCena reprova Cena 05 repetindo plano + personagens + ação da Cena 01');
  checar(validacaoRepetida.motivo.includes('já usada na Cena 01'), 'Motivo indica colisão com a Cena 01 do vídeo');

  // Fallback semântico para o ciclo de Elias: garante que nenhuma combinação se repita em 12 cenas
  const descricoesAcumuladasElias = [];
  const trechosElias = [
    'O profeta Elias subiu ao cume do monte Carmelo.',
    'Acabe reuniu os profetas de Baal para a disputa sagrada.',
    'Os falsos profetas clamaram desde a manhã até o meio-dia.',
    'O silêncio tomou conta de todo o monte Carmelo.',
    'Elias reparou o altar quebrado de doze pedras.',
    'Três vezes derramaram água sobre o sacrifício e o rego encheu-se.',
    'Então orou: Ó Senhor Deus de Abraão, responde-me.',
    'O fogo do Senhor caiu do céu e consumiu todo o holocausto.',
    'Todo o povo caiu com o rosto em terra e clamou: O Senhor é Deus.',
    'Elias mandou descer ao ribeiro de Quisom.',
    'Uma pequena nuvem do tamanho da mão de um homem subiu do mar.',
    'Uma grande chuva torrencial caiu sobre toda a terra ressequida.'
  ];

  for (let i = 0; i < trechosElias.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const desc = PlanoCenasModule.gerarDescricaoVisualFallback(
      trechosElias[i],
      num,
      { tema: 'Elias e os profetas de Baal', descricoesAnteriores: descricoesAcumuladasElias }
    );
    descricoesAcumuladasElias.push(desc);
  }

  // Verifica que não há repetição de combinação de plano + personagens + ação no plano inteiro
  let colisaoEncontrada = false;
  for (let i = 0; i < descricoesAcumuladasElias.length; i++) {
    for (let j = i + 1; j < descricoesAcumuladasElias.length; j++) {
      const enqI = PlanoCenasModule.detectarTipoEnquadramento(descricoesAcumuladasElias[i]);
      const enqJ = PlanoCenasModule.detectarTipoEnquadramento(descricoesAcumuladasElias[j]);
      const persI = PlanoCenasModule.detectarPersonagensNaDescricao(descricoesAcumuladasElias[i]);
      const persJ = PlanoCenasModule.detectarPersonagensNaDescricao(descricoesAcumuladasElias[j]);
      const taxa = PlanoCenasModule.calcularSemelhancaDescricoes(descricoesAcumuladasElias[i], descricoesAcumuladasElias[j]);

      const mesmosPers = (persI.length > 0 || persJ.length > 0) &&
        persI.length === persJ.length &&
        persI.every(p => persJ.includes(p));

      if (enqI === enqJ && mesmosPers && taxa >= 0.35) {
        colisaoEncontrada = true;
        break;
      }
    }
  }
  checar(!colisaoEncontrada, 'Nenhuma combinação "plano + personagens + ação" repetida em todo o plano de Elias');

  // =========================================================================
  // PONTO 3: NOME DO ZIP CURTO
  // =========================================================================
  console.log('\n--- Ponto 3: Nome do ZIP curto ---');

  const ideiaLonga = 'Elias e os profetas de Baal: o que 1 Reis 18 realmente ensina sobre o fogo divino no monte carmelo e a soberania do Deus de Israel';
  const nomeCurto = PlanoCenasModule.gerarNomeZipCurto(ideiaLonga);

  checar(nomeCurto === 'elias-e-os-profetas-de-baal.zip', `gerarNomeZipCurto resulta em "elias-e-os-profetas-de-baal.zip" (obtido: ${nomeCurto})`);
  checar(nomeCurto.length <= 60, `Nome do zip possui no máximo 60 caracteres (${nomeCurto.length} chars)`);

  const nomeViaScriptoriumSemSufixo = PlanoCenasModule.gerarNomeZipScriptorium(ideiaLonga, { sufixoScriptorium: false });
  checar(nomeViaScriptoriumSemSufixo === 'elias-e-os-profetas-de-baal.zip', 'gerarNomeZipScriptorium com sufixoScriptorium:false devolve zip curto sem sufixo');

  // Teste de ideia com mais de 6 palavras sem ":"
  const ideiaSemDoisPontos = 'A grande batalha de Davi contra o gigante filisteu no vale de Ela';
  const nomeSeisPalavras = PlanoCenasModule.gerarNomeZipCurto(ideiaSemDoisPontos);
  checar(nomeSeisPalavras === 'a-grande-batalha-de-davi-contra.zip', `Corta em 6 palavras no máximo: ${nomeSeisPalavras}`);

  // =========================================================================
  // PONTO 4: ROTEIRO INCOMPLETO OU EMBARALHADO
  // =========================================================================
  console.log('\n--- Ponto 4: Roteiro incompleto ou embaralhado ---');

  // Narração ruim 1 citada pelo usuário:
  // "um trecho da oração de Elias ficou fora de lugar, a frase 'três vezes' saiu repetida e faltou fechar aspas."
  const narracaoRuim1 = `O profeta Elias convocou todo o povo de Israel ao monte Carmelo.
Elias desafiou os falsos profetas. "Clamai em altas vozes, porque ele é um deus; pode ser que esteja meditando (1 Reis 18:27).
Elias então preparou o altar. Três vezes derramaram os cântaros de água sobre o altar.
O povo observava com grande temor. Três vezes derramaram os cântaros de água sobre o altar.
Então Elias se aproximou e clamou ao Senhor: "Ó Senhor Deus de Abraão, responde-me (1 Reis 18:36).
Se este vídeo fortaleceu sua fé, inscreva-se no canal e compartilhe.`;

  const valRuim1 = PlanoCenasModule.validarIntegridadeEstruturalRoteiro(narracaoRuim1, { tema: 'Elias e os profetas de Baal' });
  checar(!valRuim1.valido, 'Validação reprova a 1ª narração ruim');
  checar(valRuim1.erros.some(e => e.includes('Aspas') || e.includes('repetida') || e.includes('desfecho')), 'Erros apontam aspas desbalanceadas, frase repetida e falta de desfecho');

  // Narração ruim 2 citada pelo usuário:
  // "o roteiro terminou na oração de Elias sem narrar o que aconteceu (faltou o desfecho)."
  const narracaoRuim2 = `O fogo do céu era a única prova que definiria quem é o verdadeiro Deus.
Elias confrontou os quatrocentos e cinquenta profetas de Baal no topo do Carmelo.
Eles clamaram até o cair da tarde, mas não houve voz nem resposta.
Elias restaurou o altar do Senhor que estava em ruínas e cavou um rego ao redor.
À hora do sacrifício da tarde, Elias aproximou-se e orou: "Ó Senhor Deus de Abraão, de Isaque e de Israel, manifeste-se hoje que tu és Deus em Israel" (1 Reis 18:36):
Se este estudo fortaleceu sua fé, inscreva-se no canal para mais vídeos bíblicos.`;

  const valRuim2 = PlanoCenasModule.validarIntegridadeEstruturalRoteiro(narracaoRuim2, { tema: 'Elias e os profetas de Baal' });
  checar(!valRuim2.valido, 'Validação reprova a 2ª narração ruim (narrativa interrompida no meio da ação sem desfecho)');
  checar(valRuim2.erros.some(e => e.includes('desfecho') || e.includes('interrompido')), 'Erro aponta interrupção antes do desfecho final do episódio');

  // Teste com história de Daniel na cova dos leões (sem palavras de Elias - deve ser APROVADA sem bloqueio indevido)
  const narracaoDaniel = `A cova dos leões estava selada com a pedra e o anel real do rei Dario.
Antes disso, os príncipes do império babilônico conspiraram contra Daniel por causa de sua fidelidade inabalável a Deus.
Mesmo sabendo do decreto irrevogável que proibia orações por trinta dias, Daniel manteve suas janelas abertas em direção a Jerusalém e orou três vezes ao dia.
Lançado na cova escura com animais famintos, Daniel repousou sob o cuidado do Altíssimo durante toda a noite.
Ao romper da alvorada, o rei apressou-se à cova e chamou com voz triste: "Daniel, servo do Deus vivo, dar-se-ia o caso que o teu Deus, a quem tu continuamente serves, tenha podido livrar-te dos leões?" (Daniel 6:20).
Daniel respondeu em triunfo: "O meu Deus enviou o seu anjo e fechou a boca dos leões, para que não me fizessem dano" (Daniel 6:22).
O profeta foi retirado intacto da cova, sem que se achasse nele dano algum, e a glória do Deus vivo foi proclamada por todo o império.
Se este estudo sobre a fidelidade e o livramento divino fortaleceu sua fé, inscreva-se no canal e ative as notificações.`;

  const valDaniel = PlanoCenasModule.validarIntegridadeEstruturalRoteiro(narracaoDaniel, { tema: 'Daniel na cova dos leões' });
  checar(valDaniel.valido, 'História de Daniel na cova dos leões é aprovada sem falso positivo de palavras de Elias');

  // Narração íntegra e completa de Elias (deve ser aprovada)
  const narracaoBoa = `O fogo caiu do céu e consumiu o holocausto.
Antes disso, o profeta Elias reuniu todo o povo de Israel no monte Carmelo diante de Acabe.
Durante todo o dia, os profetas de Baal clamaram e se feriram, mas nenhum fogo acendeu o sacrifício.
Elias restaurou o altar com doze pedras e ordenou que derramassem água sobre a lenha até encher o rego.
À hora do sacrifício da tarde, Elias orou solenemente: "Ó Senhor Deus de Abraão, de Isaque e de Israel, manifeste-se hoje que tu és Deus" (1 Reis 18:36).
Imediatamente o fogo do Senhor desceu dos céus e consumiu a carne, a lenha, as pedras e lambeu a água da valeta.
Ao presenciarem o poder divino, todo o povo caiu com os rostos em terra e proclamou: "O Senhor é Deus! O Senhor é Deus!" (1 Reis 18:39).
Se este relato fortaleceu sua confiança na soberania do Altíssimo, inscreva-se no canal e ative as notificações.`;

  const valBoa = PlanoCenasModule.validarIntegridadeEstruturalRoteiro(narracaoBoa, { tema: 'Elias e os profetas de Baal' });
  checar(valBoa.valido, 'Narração bíblica completa com desfecho e aspas balanceadas é aprovada com sucesso');

  console.log('\n🎉 TODOS OS TESTES DOS 4 AJUSTES FINAIS PASSARAM COM SUCESSO!');
}

rodarTestes().catch(err => {
  console.error('\n❌ Falha no teste:', err);
  process.exit(1);
});

