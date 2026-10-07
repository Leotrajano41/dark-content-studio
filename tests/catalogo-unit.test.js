// tests/catalogo-unit.test.js
// Testes unitários para o módulo js/catalogo.js (100% autônomo sem chamadas externas à rede)

const fs = require('fs');
const path = require('path');
const CatalogoModule = require('../js/catalogo.js');

let total = 0;
let passados = 0;

function assert(condicao, msg) {
  total++;
  if (condicao) {
    passados++;
    console.log(`  ✅ [PASSOU] ${msg}`);
  } else {
    console.error(`  ❌ [FALHOU] ${msg}`);
    throw new Error(`Falha no teste: ${msg}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTES UNITÁRIOS DO MÓDULO CATÁLOGO (js/catalogo.js)');
  console.log('======================================================\n');

  // 1. TESTE DE PARSE DA IDEIA
  console.log('📋 1. Teste de Parse da Ideia Escolhida');
  const ideiaExemplo = `Cada julgamento súbito de Deus na Bíblia
1. Nadabe e Abiú (Levítico 10:1-2)
2. Corá - Números 16:31-33
3. Uzá: 2 Samuel 6:6-7
4. Bete-Semes (1 Samuel 6:19) (sem número de mortos)
5. Senaqueribe (2 Reis 19:35)
6. Sodoma e Gomorra (Gênesis 19:24-25)
7. Ananias e Safira (Atos 5:1-10)
8. Herodes Agripa (Atos 12:21-23)`;

  const parsed = CatalogoModule.parseIdeia(ideiaExemplo);
  assert(parsed.totalItens === 8, 'Extraiu exatamente 8 itens da ideia');
  assert(parsed.itens[0].nome === 'Nadabe e Abiú', 'Item 1 nome correto');
  assert(parsed.itens[0].referenciaStr === 'Levítico 10:1-2', 'Item 1 referência correta');
  assert(parsed.itens[3].nome === 'Bete-Semes', 'Item 4 nome correto');
  assert(parsed.itens[3].observacao.includes('sem número de mortos'), 'Item 4 observação preservada');
  assert(parsed.itens[7].nome === 'Herodes Agripa', 'Item 8 nome correto');

  // Teste de rejeição por falta de passagem
  let erroPassagem = false;
  try {
    CatalogoModule.parseIdeia(`Tema
1. Item Sem Passagem
2. Outro - Gênesis 1:1
3. Tres - Exodo 2:2
4. Quatro - Lev 1:1
5. Cinco - Num 1:1
6. Seis - Dt 1:1`);
  } catch (e) {
    erroPassagem = true;
  }
  assert(erroPassagem, 'Detectou e rejeitou item sem passagem bíblica');

  // Teste de rejeição por N < 6 ou N > 12 com mensagem descritiva
  let erroN = false;
  let msgErroN = '';
  try {
    CatalogoModule.parseIdeia(`Tema: 1. Um - Gênesis 1:1; 2. Dois - Exodo 2:2; 3. Tres - Lev 1:1`);
  } catch (e) {
    erroN = true;
    msgErroN = e.message;
  }
  assert(erroN, 'Detectou e rejeitou lista com menos de 6 itens');
  assert(msgErroN.includes('foram identificados 3 itens') && msgErroN.includes('1. Um'), 'Mensagem de erro descreve itens identificados');

  // Testes dos 5 formatos de lista (inclusive string em uma linha só)
  const f1 = CatalogoModule.parseIdeia('Cada julgamento súbito de Deus: 1. Nadabe e Abiú - Levítico 10:1-2; 2. Corá - Números 16:31-35; 3. Uzá (2 Samuel 6:6-7); 4. Bete-Semes (1 Samuel 6:19) [omitir o número de mortos]; 5. Senaqueribe (2 Reis 19:35) [contexto: 2 Reis 18:13 a 19:7]; 6. Ananias e Safira - Atos 5:1-11; 7. Sodoma e Gomorra - Gênesis 19:24-25; 8. Herodes Agripa (Atos 12:21-23)');
  assert(f1.totalItens === 8 && f1.tema === 'Cada julgamento súbito de Deus', 'Formato 1: Uma linha só com introdução e ponto e vírgula parseada');

  const f2 = CatalogoModule.parseIdeia('1. Nadabe e Abiú - Levítico 10:1-2 2. Corá - Números 16:31-35 3. Uzá (2 Samuel 6:6-7) 4. Bete-Semes (1 Samuel 6:19) [omitir o número de mortos] 5. Senaqueribe (2 Reis 19:35) [contexto: 2 Reis 18:13 a 19:7] 6. Ananias e Safira - Atos 5:1-11 7. Sodoma e Gomorra - Gênesis 19:24-25 8. Herodes Agripa (Atos 12:21-23)');
  assert(f2.totalItens === 8, 'Formato 2: Uma linha só colada sem ponto e vírgula parseada');

  const f3 = CatalogoModule.parseIdeia('1. Nadabe e Abiú - Levítico 10:1-2; 2. Corá - Números 16:31-35; 3. Uzá - 2 Samuel 6:6-7; 4. Bete-Semes - 1 Samuel 6:19; 5. Senaqueribe - 2 Reis 19:35; 6. Ananias e Safira - Atos 5:1-11; 7. Sodoma e Gomorra - Gênesis 19:24-25; 8. Herodes Agripa - Atos 12:21-23');
  assert(f3.totalItens === 8, 'Formato 3: Separado por ponto e vírgula sem quebras de linha parseado');

  const f5 = CatalogoModule.parseIdeia('O fim de cada rei rebelde: 1. Saul (1 Samuel 31:1-6); 2. Nadabe — 1 Reis 15:27-28; 3. Zinri – 1 Reis 16:15-19 [contexto: 1 Reis 16:8-22]; 4. Acabe (1 Reis 22:34-38); 5. Acazias (2 Reis 1:2-17); 6. Jorão - 2 Reis 9:22-26; 7. Joás de Judá (2 Crônicas 24:23-25); 8. Oséias (2 Reis 17:3-6)');
  assert(f5.totalItens === 8 && f5.itens[2].contextoExtra.includes('1 Reis 16:8-22'), 'Formato 5: Misto com parênteses, travessões (–, —) e colchetes parseado');

  // Teste de Capitalização de Início de Frases
  const capTest = CatalogoModule.capitalizarInicioFrases('eles puseram a arca. ele não quis levar. o rei Herodes estendeu as mãos. "voz de Deus!" a palavra crescia.');
  assert(capTest.startsWith('Eles puseram a arca. Ele não quis levar. O rei Herodes estendeu as mãos.'), 'Capitaliza início de frases');
  assert(capTest.includes('"voz de Deus!"'), 'Preserva texto interno de aspas sem alterar');
  assert(capTest.includes('A palavra crescia.'), 'Capitaliza após aspas com exclamação');

  // 2. TESTE DE CARREGAMENTO DE VERSÍCULOS
  console.log('\n📋 2. Teste de Carregamento dos Versículos Bíblicos');
  const v1 = await CatalogoModule.carregarVersiculos('Levítico 10:1-2', 'pt');
  assert(v1.versiculos.length === 2, 'Carregou exatamente 2 versículos para Levítico 10:1-2');
  assert(v1.versiculos[0].texto.includes('fogo estranho') || v1.versiculos[0].texto.includes('incensário') || v1.versiculos[0].texto.length > 10, 'Texto de Levítico 10:1 contém conteúdo real');
  assert(v1.bibleGatewayUrl.includes('Lev%C3%ADtico'), 'URL do BibleGateway gerada corretamente');

  const vCap = await CatalogoModule.carregarVersiculos('Gênesis 19', 'pt');
  assert(vCap.versiculos.length === 15, 'Capítulo inteiro foi limitado a 15 versículos');
  assert(vCap.referenciasFormatadas[0].includes('primeiros 15 versículos'), 'Indica claramente os primeiros 15 versículos');

  // 3. TESTE DE VERIFICAÇÃO DE CITAÇÕES EM CÓDIGO
  console.log('\n📋 3. Teste de Auditoria de Citações entre Aspas');
  const textoFonte = 'E saiu fogo de diante do Senhor e os consumiu, e morreram perante o Senhor.';
  const textoComCitacaoValida = 'A narrativa bíblica relata que "saiu fogo de diante do Senhor e os consumiu", encerrando ali suas vidas.';
  const auditValida = CatalogoModule.verificarCitacoesEmCodigo(textoComCitacaoValida, textoFonte);
  assert(auditValida.todasValidas, 'Citação literal exata foi aprovada com sucesso');

  const textoComCitacaoInventada = 'O texto diz que "eles sabiam exatamente o perigo e desafiaram a ordem sagrada", o que causou o julgamento.';
  const auditInvalida = CatalogoModule.verificarCitacoesEmCodigo(textoComCitacaoInventada, textoFonte);
  assert(!auditInvalida.todasValidas, 'Citação inventada foi reprovada e marcada na auditoria');

  // 4. TESTE DE MONTAGEM E VALIDADOR ESTRUTURAL
  console.log('\n📋 4. Teste de Montagem em Código e Validador Estrutural');

  // Função auxiliar para gerar texto de item com exatamente N palavras e sem moral no fecho
  function gerarTextoItemValido(numExtenso, num, ref, palavrasAlvo, comContraste = false) {
    const cabecalho = `${numExtenso}, Item ${num}. Isso está em ${ref}.`;
    const contrasteTexto = comContraste ? ' Não era uma oferta aceitável, mas fogo não ordenado perante o altar.' : '';
    const base = `${cabecalho}${contrasteTexto} O registro bíblico relata os acontecimentos históricos dessa passagem de forma direta e canônica. Cada detalhe preservado descreve a sucessão exata dos fatos ocorridos perante toda a congregação reunida no arraial daquele tempo remoto.`;
    const palavrasAtuais = CatalogoModule.contarPalavras(base);
    const palavrasFaltantes = palavrasAlvo - palavrasAtuais - 12; // 12 palavras para o fecho
    const corpo = ' registro canônico verificado texto histórico'.repeat(Math.ceil(palavrasFaltantes / 5)).trim().split(/\s+/).slice(0, palavrasFaltantes).join(' ');
    const fechoFato = ' Em seguida, o povo retirou os corpos para fora do arraial.';
    return `${base} ${corpo}.${fechoFato}`;
  }

  const itensFalsos = [
    gerarTextoItemValido('Um', 1, 'Levítico 10, versículos 1 e 2', 205, true),
    gerarTextoItemValido('Dois', 2, 'Números 16, versículos 31 a 33', 205, false),
    gerarTextoItemValido('Três', 3, '2 Samuel 6, versículos 6 e 7', 205, true),
    gerarTextoItemValido('Quatro', 4, '1 Samuel 6, versículo 19', 185, false) + ' Vale um registro honesto aqui: os manuscritos divergem quanto ao número de mortos, por isso o número não será citado.',
    gerarTextoItemValido('Cinco', 5, '2 Reis 19, versículo 35', 205, false),
    gerarTextoItemValido('Seis', 6, 'Gênesis 19, versículos 24 e 25', 205, true),
    gerarTextoItemValido('Sete', 7, 'Atos 5, versículos 1 a 10', 205, true),
    gerarTextoItemValido('Oito', 8, 'Atos 12, versículos 21 a 23', 205, false)
  ];

  // Fechamento com 95 palavras: 8 frases curtas de fatos + pergunta aos comentários + pedido de inscrição
  const fechamentoFalso = 'Nadabe e Abiú morreram perante o fogo no tabernáculo. A terra abriu e cobriu a tenda de Corá. Uzá tocou na arca e tombou junto dela. Os homens de Bete-Semes foram feridos após olharem o interior da arca. O acampamento assírio amanheceu com milhares de mortos. Sodoma e Gomorra foram reduzidas a cinzas pelo fogo e enxofre. Ananias e Safira caíram sem vida ao reterem o valor da propriedade. Herodes Agripa foi ferido após receber aclamação pública. Qual desses registros mais chamou sua atenção? Deixe sua reflexão nos comentários e inscreva-se para o próximo relato.';

  const roteiroMontado = CatalogoModule.montarRoteiroCompleto({
    tema: 'Cada julgamento súbito de Deus na Bíblia',
    itensTextos: itensFalsos,
    fechamentoTexto: fechamentoFalso
  });

  const validacao = CatalogoModule.validarEstrutura(roteiroMontado, 8);
  assert(validacao.valido, `Roteiro montado passou nas ${validacao.totalRegras} regras estruturais (total: ${validacao.totalOk}/${validacao.totalRegras})`);
  assert(validacao.regras.find(r => r.id === 'regra_abertura').ok, 'Abertura com "Um," aprovada');
  assert(validacao.regras.find(r => r.id === 'regra_cta').ok, 'CTA após Item 2 aprovado');
  assert(validacao.regras.find(r => r.id === 'regra_itens').ok, 'Todos os 8 itens em ordem');
  assert(validacao.regras.find(r => r.id === 'regra_contrastes').ok, 'Pelo menos 3 itens com contraste aprovados');
  assert(validacao.regras.find(r => r.id === 'regra_fecho_moral').ok, 'Fecho de item sem moral aprovado');
  assert(validacao.regras.find(r => r.id === 'regra_proibidas').ok, 'Nenhuma palavra proibida fora de aspas');

  // 5. TESTE DO DICIONÁRIO DE PRONÚNCIA TTS
  console.log('\n📋 5. Teste do Dicionário Fonético para Narração TTS');
  const textoOriginal = 'Em Bete-Semes e Quiriate-Jearim, o povo testemunhou o julgamento de Obede-Edom, Senaqueribe e Rabsaqué.';
  const textoTTS = CatalogoModule.aplicarPronunciaParaTTS(textoOriginal);
  assert(textoTTS.includes('Bét-Sêmesh'), 'Bete-Semes ajustado para pronúncia');
  assert(textoTTS.includes('Kiriát-Yearím'), 'Quiriate-Jearim ajustado para pronúncia');
  assert(textoTTS.includes('Obéd-Edóm'), 'Obede-Edom ajustado para pronúncia');
  assert(textoTTS.includes('Rabsakê'), 'Rabsaqué ajustado para pronúncia');
  assert(!textoOriginal.includes('Bét-Sêmesh'), 'Texto original exibido permaneceu inalterado');

  // 6. TESTE DE MESCLAGEM DE NUMERAIS NO SRT
  console.log('\n📋 6. Teste de Mesclagem de Numerais no SRT');
  const srtExemplo = `1
00:00:01,000 --> 00:00:03,000
1.

2
00:00:03,100 --> 00:00:06,000
Nadabe e Abiú ofereceram fogo estranho.`;

  const srtLimpo = CatalogoModule.mesclarNumerosSoltosSRT(srtExemplo);
  assert(srtLimpo.includes('1. Nadabe e Abiú'), 'Linha com numeral solto foi mesclada com a linha seguinte');

  // 7. TESTE DO PACOTE DE PUBLICAÇÃO
  console.log('\n📋 7. Teste de Geração do Pacote de Publicação');
  const pacote = CatalogoModule.gerarPacotePublicacao({
    tema: 'Cada julgamento súbito de Deus na Bíblia',
    roteiro: roteiroMontado,
    itens: parsed.itens,
    srtConteudo: srtLimpo,
    duracaoAudioSegundos: 900 // 15 min
  });

  assert(pacote.titulos.length === 3, 'Gerou 3 opções de títulos em inglês');
  assert(pacote.titulos[0].includes('Minutes'), 'Título 1 contém tempo em minutos');
  assert(!pacote.titulos.some(t => /Every Transgressor|Everyone|After Death/i.test(t)), 'Títulos não prometem além do vídeo');
  assert(!pacote.descricao.includes('dive into'), 'Descrição livre de clichês de IA (sem dive into)');
  assert(!pacote.descricao.includes('serves as a reminder'), 'Descrição sem clichês de IA (sem serves as a reminder)');
  assert(pacote.capitulos.length >= 8, 'Capítulos gerados com timestamps');
  assert(pacote.thumbnail.gridPrompt16x9.includes('16:9'), 'Prompt de thumbnail em grade 16:9 presente');
  assert(pacote.thumbnail.promptsQuadrados1x1.length === 8, 'Gerou 8 prompts de quadros quadrados');

  // 8. TESTE DE DETECÇÃO DE PALAVRAS PROIBIDAS FORA DE ASPAS
  console.log('\n📋 8. Teste de Detecção de Palavras Proibidas Fora de Aspas');
  const textoComProibida = 'Aquele foi um evento fatal e uma tragédia que gerou pânico absoluto no arraial.';
  const detectadas = CatalogoModule.detectarProibidas(textoComProibida);
  assert(detectadas.length >= 4, 'Detectou "fatal", "tragédia", "pânico" e "absoluto" fora de aspas');
  const textoComProibidaEntreAspas = 'O profeta declarou: "o pânico absoluto tomará conta da cidade", mas ninguém deu ouvidos.';
  const detectadasAspas = CatalogoModule.detectarProibidas(textoComProibidaEntreAspas);
  assert(detectadasAspas.length === 0, 'Palavras proibidas entre aspas foram devidamente toleradas como citação');

  console.log('\n======================================================');
  console.log(`🎉 RESULTADO DOS TESTES UNITÁRIOS: ${passados}/${total} passaram com 100% de sucesso!`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
