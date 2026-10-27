// tests/lote-producao-02.test.js — Suíte de Testes Offline do Lote de Produção 02
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

console.log('=== INICIANDO TESTES OFFLINE DO LOTE DE PRODUÇÃO 02 ===\n');

// ---------------------------------------------------------------------------
// GRUPO A: NOVO FLUXO DE IMAGENS (PLANO DE CENAS — ETAPA 2)
// ---------------------------------------------------------------------------
console.log('--- GRUPO A: Novo Fluxo de Imagens (Plano de Cenas - Itens 1 a 8) ---');

let totalAsserts = 0;
function checar(cond, msg) {
  assert(cond, msg);
  totalAsserts++;
  console.log(`  ✅ [PASSOU] ${msg}`);
}

// Carrega o módulo PlanoCenasModule
let PlanoCenasModule;
try {
  PlanoCenasModule = require('../js/plano-cenas.js');
} catch (e) {
  PlanoCenasModule = null;
}

checar(PlanoCenasModule, 'Item 1a: Módulo js/plano-cenas.js existe e pode ser carregado');

// Item 1: Prompts gerados a partir da Narração Limpa final
const narracaoExemplo = `O Mar Vermelho se abriu diante dos hebreus. As muralhas de água se ergueram à direita e à esquerda com força descomunal. Moisés estendeu a sua vara sobre as águas impetuosas. O povo marchou pelo leito seco em direção à liberdade prometida. Os cavaleiros egípcios avançaram furiosos com seus carros de guerra pelas profundezas do mar. As águas desabaram repentinamente sobre os opressores, sepultando todo o exército de Faraó no abismo. Ninguém sobreviveu.`;

const planoGerado = PlanoCenasModule.gerarPlanoDeCenas(narracaoExemplo, { tema: 'Mar Vermelho', personagemPrincipal: 'Moisés' });
checar(Array.isArray(planoGerado.cenas) && planoGerado.cenas.length > 0, 'Item 1b: Gera plano de cenas estruturado a partir da Narração Limpa');

// Item 2: Cortes SOMENTE no começo de frase da Narração Limpa; cena 1 na primeira frase
checar(planoGerado.cenas[0].fraseInicio.startsWith('O Mar Vermelho se abriu'), 'Item 2a: Cena 01 começa exatamente na primeira frase da Narração Limpa');
for (const cena of planoGerado.cenas) {
  checar(
    narracaoExemplo.includes(cena.fraseInicio),
    `Item 2b: Ponto de corte da cena ${cena.numero} ("${cena.fraseInicio.slice(0, 30)}...") coincide exatamente com início de frase da Narração Limpa`
  );
}

// Item 3 e Ajuste 1: Ritmo do vídeo em 3 faixas com 2.5 palavras/segundo
const gerarTextoComPalavras = (qtd) => {
  const fraseBase = 'O Senhor manifestou o seu poder glorioso no meio do deserto árido para libertar os cativos. ';
  let t = '';
  while ((t.match(/\S+/g) || []).length < qtd) {
    t += fraseBase;
  }
  return t.trim();
};

const texto3Min = gerarTextoComPalavras(450); // ~450 palavras = 180s = 3 minutos
const plano3Min = PlanoCenasModule.gerarPlanoDeCenas(texto3Min, { tema: 'Deserto', personagemPrincipal: 'Moisés' });
checar(
  plano3Min.cenas.length >= 13 && plano3Min.cenas.length <= 18,
  `Item 3a: Quantidade de cenas para 3 minutos fica entre 13 e 18 (obtido: ${plano3Min.cenas.length})`
);

// Teste com roteiro de 18 minutos (~2700 palavras):
const texto18Min = gerarTextoComPalavras(2700); // ~2700 palavras = 1080s = 18 minutos
const plano18Min = PlanoCenasModule.gerarPlanoDeCenas(texto18Min, { tema: 'Êxodo', personagemPrincipal: 'Moisés' });
checar(
  plano18Min.cenas.length >= 45 && plano18Min.cenas.length <= 60,
  `Item 3b: Quantidade de cenas para 18 minutos é ~50 (obtido: ${plano18Min.cenas.length})`
);

// Checagem de duração máxima: nenhuma cena com mais de 30s quando frases têm duração normal
for (const c of plano3Min.cenas) {
  checar(c.duracaoEstimadaSegundos <= 30.5, `Item 3c: Cena ${c.numero} respeita teto de 30s (duracao: ${c.duracaoEstimadaSegundos}s)`);
}

// Checagem do Ajuste 2: Frase única muito longa (>30s) não é cortada ao meio, gerando aviso
const fraseGigante = 'Esta é uma frase absolutamente monumental e gigantesca escrita pelo autor que ultrapassa tranquilamente setenta e cinco palavras contínuas sem qualquer ponto final ou interrupção de pontuação intermediária porque o narrador decidiu encadear orações coordenadas e subordinadas com conjunções e preposições sem colocar nenhum ponto final até completar mais de oitenta palavras de narração ininterrupta no áudio sagrado da história bíblica para testar o limite de duração contínua de uma imagem na tela e garantir que o validador emita o alerta de frase única longa com fidelidade e clareza no relatório final.';
const planoFraseLonga = PlanoCenasModule.gerarPlanoDeCenas(fraseGigante, { tema: 'Teste' });
checar(planoFraseLonga.cenas.length === 1, 'Item 3d: Frase única > 30s não é cortada no meio');
checar(planoFraseLonga.avisos && planoFraseLonga.avisos.length > 0, 'Item 3e: Frase única > 30s gera aviso indicando a cena');

// Item 4: Cada imagem ilustra o trecho em tela; proibido repetir mesma ação do mesmo personagem
const promptCena1 = planoGerado.cenas[0].promptIngles;
const promptCena2 = planoGerado.cenas[1].promptIngles;
checar(promptCena1 && promptCena2 && promptCena1 !== promptCena2, 'Item 4: Prompts das cenas são distintos e correlacionados aos trechos');

// Item 5: Ficha fixa de personagens repetida em todo prompt em que o personagem aparece
const fichaMoises = "elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff";
const planoComMoises = PlanoCenasModule.gerarPlanoDeCenas(
  'Moisés caminhou no deserto. Moisés orou ao Senhor com fervor. Moisés ergueu a sua vara.',
  { tema: 'Moisés', personagemPrincipal: 'Moisés' }
);
for (const c of planoComMoises.cenas) {
  if (c.personagens && c.personagens.includes('Moisés')) {
    checar(c.promptIngles.includes(fichaMoises), 'Item 5: Ficha fixa canônica de Moisés repetida em todos os prompts em que aparece');
  }
}

// Item 6: Estilo SEM moldura: sem "delicate thin gold corner ornaments" e terminando com o sufixo oficial
for (const c of planoGerado.cenas) {
  checar(!c.promptIngles.includes('delicate thin gold corner ornaments'), 'Item 6a: Sem ornamentos de canto no estilo');
  checar(
    c.promptIngles.endsWith('Full bleed image, no border, no frame, no decorative corners. No text.'),
    'Item 6b: Todo prompt termina com "Full bleed image, no border, no frame, no decorative corners. No text."'
  );
}

// Item 7: Lugares com o nome certo do texto
const planoLugar = PlanoCenasModule.gerarPlanoDeCenas('Moisés subiu ao cume do monte Nebo e contemplou a terra.', { tema: 'Moisés' });
checar(
  planoLugar.cenas[0].promptIngles.includes('summit of Mount Nebo'),
  'Item 7: Topônimo traduzido com exatidão bíblica ("summit of Mount Nebo")'
);

// Item 8: Detector de desatualização quando a Narração Limpa mudar
checar(
  typeof PlanoCenasModule.verificarDesatualizacao === 'function',
  'Item 8a: Função de verificação de desatualização existe'
);
const hashOriginal = PlanoCenasModule.gerarHashTexto(narracaoExemplo);
checar(!PlanoCenasModule.verificarDesatualizacao(hashOriginal, narracaoExemplo), 'Item 8b: Texto inalterado não é considerado desatualizado');
checar(PlanoCenasModule.verificarDesatualizacao(hashOriginal, narracaoExemplo + ' Nova frase adicionada.'), 'Item 8c: Texto modificado é detectado como desatualizado');

// ---------------------------------------------------------------------------
// GRUPO B: EXPORTAÇÃO PARA O SCRIPTORIUM (ITENS 9 A 14)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO B: Exportação para o Scriptorium (Itens 9 a 14) ---');

// Item 9 e Ajuste 3: cenas.txt — formato "01 | Frase exata (>= 5 palavras)"
// Teste com início real do Moisés ("A vara de Moisés se ergueu no ar. Desceu uma vez. Desceu duas vezes.")
const inicioMoises = 'A vara de Moisés se ergueu no ar. Desceu uma vez. Desceu duas vezes. As águas brotaram da rocha diante do povo reunido.';
const planoMoisesReal = PlanoCenasModule.gerarPlanoDeCenas(inicioMoises, { tema: 'Moisés', personagemPrincipal: 'Moisés' });
const cenasTxtMoises = PlanoCenasModule.gerarCenasTxt(planoMoisesReal.cenas, inicioMoises);
const linhasCenasMoises = cenasTxtMoises.trim().split('\n');

checar(/^01\s*\|\s*.+/.test(linhasCenasMoises[0]), 'Item 9a: Primeira linha do cenas.txt formatada com número de 2 dígitos "01 | ..."');
for (const l of linhasCenasMoises) {
  const partes = l.split('|');
  checar(partes.length === 2, `Item 9b: Linha "${l}" tem formato "NN | Trecho"`);
  const trecho = partes[1].trim();
  const palavras = trecho.match(/\S+/g) || [];
  checar(palavras.length >= 5, `Item 9c: Linha traz pelo menos 5 palavras (encontradas ${palavras.length} em "${trecho}")`);
  checar(inicioMoises.includes(trecho), `Item 9d: Trecho "${trecho}" existe EXATAMENTE na Narração Limpa`);
}

// Item 10: descricoes.txt — formato "NN | Prompt em inglês completo"
const descricoesTxt = PlanoCenasModule.gerarDescricoesTxt(planoGerado.cenas);
const linhasDesc = descricoesTxt.trim().split('\n');
checar(linhasDesc.length === planoGerado.cenas.length, 'Item 10a: descricoes.txt tem a mesma quantidade de linhas das cenas');
checar(/^01\s*\|\s*.+Full bleed image, no border, no frame, no decorative corners\. No text\.$/.test(linhasDesc[0]), 'Item 10b: Formato correto no descricoes.txt');

// Item 11: prompts.txt — prompts numerados 01, 02, 03... na mesma ordem e quantidade
const promptsTxt = PlanoCenasModule.gerarPromptsTxt(planoGerado.cenas);
const blocosPrompts = promptsTxt.trim().split(/\n\s*\n/);
checar(blocosPrompts.length === planoGerado.cenas.length, 'Item 11a: prompts.txt tem a mesma quantidade de prompts');
checar(blocosPrompts[0].startsWith('01.'), 'Item 11b: prompts.txt numerado como 01., 02....');

// Item 12: Nomes fixos de arquivos no pacote e botões
const NOMES_FIXOS = PlanoCenasModule.NOMES_ARQUIVOS_FIXOS;
checar(NOMES_FIXOS.narracao === 'narracao.mp3', 'Item 12a: Nome fixo narracao.mp3');
checar(NOMES_FIXOS.legenda === 'legenda.srt', 'Item 12b: Nome fixo legenda.srt');
checar(NOMES_FIXOS.cenas === 'cenas.txt', 'Item 12c: Nome fixo cenas.txt');
checar(NOMES_FIXOS.descricoes === 'descricoes.txt', 'Item 12d: Nome fixo descricoes.txt');
checar(NOMES_FIXOS.prompts === 'prompts.txt', 'Item 12e: Nome fixo prompts.txt');

// Item 13: Nome do ZIP com slug do tema atual (ex: mar-vermelho-scriptorium.zip)
const nomeZip1 = PlanoCenasModule.gerarNomeZipScriptorium('Mar Vermelho');
checar(nomeZip1 === 'mar-vermelho-scriptorium.zip', `Item 13a: Nome do zip usa slug do tema atual ("${nomeZip1}")`);
const nomeZip2 = PlanoCenasModule.gerarNomeZipScriptorium('A Queda de Jericó!');
checar(nomeZip2 === 'a-queda-de-jerico-scriptorium.zip', `Item 13b: Slug limpo sem pontuação ("${nomeZip2}")`);

// Item 14: Validador do Pacote Scriptorium antes de exportar
const validacaoOk = PlanoCenasModule.validarPacoteScriptorium({
  cenasTxt: linhasCenasMoises.join('\n'),
  descricoesTxt: linhasCenasMoises.map((_, i) => `${String(i+1).padStart(2, '0')} | Prompt ${i+1} Full bleed image, no border, no frame, no decorative corners. No text.`).join('\n'),
  promptsTxt: linhasCenasMoises.map((_, i) => `${String(i+1).padStart(2, '0')}. Prompt ${i+1}`).join('\n\n'),
  narracaoLimpa: inicioMoises,
  cenas: planoMoisesReal.cenas
});
checar(validacaoOk.valido === true, 'Item 14a: Pacote perfeitamente alinhado é validado como válido');

const validacaoErroQtd = PlanoCenasModule.validarPacoteScriptorium({
  cenasTxt: linhasCenasMoises.join('\n'),
  descricoesTxt: '01 | Apenas uma linha',
  promptsTxt: '01. Prompt',
  narracaoLimpa: inicioMoises,
  cenas: planoMoisesReal.cenas
});
checar(validacaoErroQtd.valido === false, 'Item 14b: Pacote com quantidade divergente de linhas é rejeitado');

// ---------------------------------------------------------------------------
// GRUPO C: BUGS DO TESTE "MAR VERMELHO" (ITENS 15 A 18)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO C: Bugs do Teste "Mar Vermelho" (Itens 15 a 18) ---');

// Extrai limparTextoParaNarracao de index.html
function extrairLimparTexto() {
  const match = html.match(/function\s+limparTextoParaNarracao[\s\S]*?\n\}/);
  if (!match) return null;
  const ctx = {
    console,
    limitarTermosCanonicos: (t) => t,
    limitarDeclaracoesDeSilencioBiblico: (t) => t
  };
  vm.createContext(ctx);
  vm.runInContext('var limparTextoParaNarracao = ' + match[0] + ';', ctx);
  return ctx.limparTextoParaNarracao;
}
const limparTextoParaNarracao = extrairLimparTexto();
checar(typeof limparTextoParaNarracao === 'function', 'Item 15a: Função limparTextoParaNarracao extraída');

// Item 15: Citação bíblica na linha de título preservada na Narração Limpa
const textoComCitacaoNaLinhaDeTitulo = `# "Não temais, estai quietos, e vede o livramento do Senhor" (Êxodo 14:13)
O exército egípcio marchava velozmente.`;
const limpoComCitacao = limparTextoParaNarracao(textoComCitacaoNaLinhaDeTitulo);
checar(
  limpoComCitacao.includes('Não temais, estai quietos, e vede o livramento do Senhor'),
  `Item 15b: Citação bíblica na linha de título não é apagada (resultado: "${limpoComCitacao}")`
);

// Item 16: Garantir CTA único no final em todos os formatos (Longo, Shorts, Catálogo)
function extrairGarantirCta() {
  const match = html.match(/function\s+garantirCtaNoUltimoParagrafo[\s\S]*?\n\}/);
  if (!match) return null;
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext('var garantirCtaNoUltimoParagrafo = ' + match[0] + ';', ctx);
  return ctx.garantirCtaNoUltimoParagrafo;
}
const garantirCta = extrairGarantirCta();
checar(typeof garantirCta === 'function', 'Item 16a: Função garantirCtaNoUltimoParagrafo extraída');

const roteiroDoisCtas = `O Mar Vermelho se abriu diante dos hebreus com grande majestade.\n\nSe você gosta deste canal inscreva-se para não perder nada. Vamos em frente.\n\nA travessia continuou com tremor e temor.\n\nInscreva-se no canal para mais estudos bíblicos. Inscreva-se no canal para acompanhar os próximos vídeos.`;
const roteiroCtaAjustado = garantirCta(roteiroDoisCtas, 'pt', 'YouTube Longo (18-20 minutos)');
const ocorrenciasCta = (roteiroCtaAjustado.match(/inscreva-se/gi) || []).length;
checar(ocorrenciasCta === 1, `Item 16b: Roteiro Longo fica com exatamente 1 CTA de inscrição no final (encontrados: ${ocorrenciasCta})`);
checar(!roteiroCtaAjustado.includes('Vamos em frente'), 'Item 16c: CTA intermediário e frases anexas removidos no Longo');

const shortsDuplo = `Moisés ergueu a vara. O mar se abriu. Inscreva-se no canal para mais histórias. Inscreva-se no canal para mais estudos e relatos bíblicos sagrados.`;
const shortsAjustado = garantirCta(shortsDuplo, 'pt', 'Shorts (50-60 segundos)');
const ctasShorts = (shortsAjustado.match(/inscreva-se/gi) || []).length;
checar(ctasShorts === 1, `Item 16d: Shorts com 2 CTAs quase idênticos unificado em apenas 1 (encontrados: ${ctasShorts})`);

// Item 17: Nomes de download avulsos no index.html
checar(
  /download\s*=\s*["']narracao\.mp3["']/.test(html) || /baixarNarracaoAudio[\s\S]*?narracao\.mp3/i.test(html),
  'Item 17a: Botão de baixar narração baixa fixo como "narracao.mp3"'
);
checar(
  /download\s*=\s*["']legenda\.srt["']/.test(html) || /baixarLegendaSrt[\s\S]*?legenda\.srt/i.test(html),
  'Item 17b: Botão de baixar legenda baixa fixo como "legenda.srt"'
);

// Item 18: Função de limpeza de estado do tema anterior definida em index.html
checar(
  /function\s+limparEstadoTemaAnterior/i.test(html),
  'Item 18: Função limparEstadoTemaAnterior definida em index.html para zerar estado prévio ao trocar tema'
);

// ---------------------------------------------------------------------------
// GRUPO D: CORREÇÃO DO LOTE ANTERIOR (ITEM 19)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO D: Correção do Lote Anterior (Item 19) ---');

// Item 19: Nenhuma palavra do SEO é trocada por sinônimo (MAPA_FALLBACK_CLICHES removido)
checar(
  !html.includes('MAPA_FALLBACK_CLICHES'),
  'Item 19a: MAPA_FALLBACK_CLICHES foi completamente removido de index.html'
);
checar(
  !html.includes('limparClichésDeterministicamente'),
  'Item 19b: limparClichésDeterministicamente foi completamente removido de index.html'
);

// ---------------------------------------------------------------------------
// GRUPO E: TESTES COM ROTEIRO REAL DO MOISÉS (testes-reais/moises-f8b5f2a.txt)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO E: Testes com o Roteiro Real do Moisés (Itens 1, 2 e 3 do Feedback) ---');

const caminhoMoisesReal = path.join(raiz, 'testes-reais', 'moises-f8b5f2a.txt');
checar(fs.existsSync(caminhoMoisesReal), 'Item E0: Arquivo testes-reais/moises-f8b5f2a.txt existe');

const narracaoMoisesReal = fs.readFileSync(caminhoMoisesReal, 'utf8');
const planoReal = PlanoCenasModule.gerarPlanoDeCenas(narracaoMoisesReal, {
  tema: 'Moisés em Meribá',
  personagemPrincipal: 'Moisés'
});

checar(planoReal.cenas.length === 54, `Item E1: Roteiro real do Moisés agrupado em 54 cenas (obtido: ${planoReal.cenas.length})`);

// 1. Validador de Descrições Visuais:
// Rejeita falso mar em trecho sem mar
const rejFalsoMar = PlanoCenasModule.validarDescricaoVisualCena(
  'stretching forth rustic wooden staff over the roaring waters of the sea',
  'A vara ergueu-se no ar. Moisés feriu a rocha. Uma vez. Duas vezes.'
);
checar(rejFalsoMar.valido === false, 'Item E2a: Descrição com "sea" é rejeitada quando o trecho não fala de mar');

// Aceita água legítima quando o trecho fala de água
const aceitaAgua = PlanoCenasModule.validarDescricaoVisualCena(
  'fresh water gushing forth from the cracked desert boulder as Hebrew people drink',
  'A água jorrou com abundância da rocha ferida no deserto de Cades.'
);
checar(aceitaAgua.valido === true, 'Item E2b: Descrição com "water" é aceita quando o trecho fala de água');

// Rejeita palavras em português
const rejPt = PlanoCenasModule.validarDescricaoVisualCena(
  'Moses striking the rocha no deserto diante do povo',
  'Moisés feriu a rocha diante do povo'
);
checar(rejPt.valido === false, 'Item E2c: Descrição com palavras em português é rejeitada');

// Rejeita clichê genérico vazio
const rejGenerico = PlanoCenasModule.validarDescricaoVisualCena(
  'solemn biblical historical tableau depicting moises em meriba',
  'Moisés em Meribá'
);
checar(rejGenerico.valido === false, 'Item E2d: Descrição com "solemn biblical historical tableau" é rejeitada');

// 2. Teste do gerador com respostas simuladas da IA em lotes de 10 cenas:
(async () => {
  let chamadasLoteIa = 0;
  const stubIa = async (promptLote) => {
    chamadasLoteIa++;
    checar(/You are an expert biblical art director/i.test(promptLote), `Item E3a: Chamada de lote ${chamadasLoteIa} envia prompt com regras artísticas estritas`);
    checar(/FORBIDDEN to include elements from other biblical events/i.test(promptLote), 'Item E3b: Regras proíbem elementos de outros episódios');
    
    // Retorna JSON válido com 10 cenas simuladas com enquadramentos variados
    const descricoesVariadas = [
      'Dramatic close-up of Moses with long beard and determined eyes looking forward under bright sun',
      'Wide panoramic view of the dry desert canyon in Kadesh with thousands of nomadic Hebrew tents',
      'Detail shot of the weathered wooden staff striking against the cracked limestone boulder',
      'Medium shot of Aaron high priest in white linen standing solemnly beside the tabernacle tent',
      'High-angle perspective looking down at thirsty Hebrew families gathering near the dry rock',
      'Grounded view of dusty sandals and garments of Hebrew elders moving across the stony ground',
      'Radiant celestial beam of golden glory descending over the sanctuary entrance curtains',
      'Elders of Israel murmuring with worried hand gestures in the parched wilderness heat',
      'Vast open sky above Mount Hor with distant rocky desert horizon stretching outward',
      'Ancient weathered stone altar resting quietly in the arid valley under evening twilight'
    ];
    const arraySimulado = [];
    for (let i = 1; i <= 10; i++) {
      arraySimulado.push({
        numero: String(i).padStart(2, '0'),
        descricaoVisual: descricoesVariadas[i - 1]
      });
    }
    return JSON.stringify(arraySimulado);
  };

  const cenasAmostra = planoReal.cenas.slice(0, 10);
  await PlanoCenasModule.gerarDescricoesVisuaisComIa(cenasAmostra, narracaoMoisesReal, stubIa, { tema: 'Moisés' });
  checar(chamadasLoteIa === 1, 'Item E3c: IA acionada em lote de 10 cenas por chamada');
  checar(cenasAmostra[0].promptIngles.includes('elderly man, long white beard'), 'Item E3d: Pós-processamento injetou ficha canônica de Moisés');
  checar(cenasAmostra[0].promptIngles.endsWith('Full bleed image, no border, no frame, no decorative corners. No text.'), 'Item E3e: Pós-processamento injetou sufixo fixo oficial');
  
  // 3. Verificação de pureza no roteiro real do Moisés (SEM falso mar e SEM "tableau"):
  for (const c of planoReal.cenas) {
    const trechoPt = c.frases.join(' ');
    if (!/\b(?:mar|oceano)\b/i.test(trechoPt)) {
      checar(!/\b(?:sea|ocean)\b/i.test(c.promptIngles), `Item E4a: Cena ${c.numero} não contém mar indevido`);
    }
    checar(!c.promptIngles.includes('solemn biblical historical tableau'), `Item E4b: Cena ${c.numero} não usa template genérico`);
  }

  // 4. Item 2 do Feedback: Validador do Pacote com o arquivo real (54 cenas consistentes)
  const cenasTxtReal = PlanoCenasModule.gerarCenasTxt(planoReal.cenas, narracaoMoisesReal);
  const descricoesTxtReal = PlanoCenasModule.gerarDescricoesTxt(planoReal.cenas);
  const promptsTxtReal = PlanoCenasModule.gerarPromptsTxt(planoReal.cenas);

  const linhasCenasReal = cenasTxtReal.split('\n');
  const linhasDescReal = descricoesTxtReal.split('\n');
  const blocosPromptsReal = promptsTxtReal.split(/\n\s*\n/);

  checar(linhasCenasReal.length === 54, `Item E5a: cenas.txt tem exatamente 54 linhas (obtido: ${linhasCenasReal.length})`);
  checar(linhasDescReal.length === 54, `Item E5b: descricoes.txt tem exatamente 54 linhas (obtido: ${linhasDescReal.length})`);
  checar(blocosPromptsReal.length === 54, `Item E5c: prompts.txt tem exatamente 54 blocos (obtido: ${blocosPromptsReal.length})`);

  const validacaoMoisesReal = PlanoCenasModule.validarPacoteScriptorium({
    cenasTxt: cenasTxtReal,
    descricoesTxt: descricoesTxtReal,
    promptsTxt: promptsTxtReal,
    narracaoLimpa: narracaoMoisesReal,
    cenas: planoReal.cenas
  });
  checar(validacaoMoisesReal.valido === true && validacaoMoisesReal.erros.length === 0, `Item E5d: validarPacoteScriptorium aprova 100% o pacote real do Moisés (${validacaoMoisesReal.erros.join(', ') || 'sem erros'})`);

  // 5. Item 3 do Feedback: TODAS as linhas do cenas.txt com >= 5 palavras
  let totalComMenosDe5 = 0;
  for (const l of linhasCenasReal) {
    const trecho = (l.split('|')[1] || '').trim();
    const countPalavras = (trecho.match(/\S+/g) || []).length;
    if (countPalavras < 5) {
      totalComMenosDe5++;
    }
  }
  checar(totalComMenosDe5 === 0, `Item E6a: Nenhuma das 54 linhas do cenas.txt tem menos de 5 palavras (encontradas com falha: ${totalComMenosDe5})`);

  // Linha 35 específica ("A sentença era irrevogável.")
  const linha35 = linhasCenasReal[34];
  checar(linha35.startsWith('35 | A sentença era irrevogável.'), `Item E6b: Linha 35 começa com a frase completa ("${linha35.slice(0, 40)}...")`);
  const palavrasLinha35 = (linha35.split('|')[1].trim().match(/\S+/g) || []).length;
  checar(palavrasLinha35 >= 5, `Item E6c: Linha 35 expandida possui >= 5 palavras (total: ${palavrasLinha35} palavras: "${linha35.split('|')[1].trim()}")`);
  checar(!linha35.includes('\n'), 'Item E6d: Linha 35 não contém quebras de linha');

  // ---------------------------------------------------------------------------
  // GRUPO F: CENAS PENDENTES, BLOQUEIO DE EXPORTAÇÃO E REGENERAÇÃO
  // ---------------------------------------------------------------------------
  console.log('\n--- GRUPO F: Cenas Pendentes, Bloqueio de Exportação e Regeneração ---');

  // Checagem de elementos na UI (index.html)
  checar(html.includes('id="card-cenas-pendentes"'), 'Item F0a: Painel card-cenas-pendentes presente no HTML');
  checar(html.includes('id="btn-regenerar-cenas-pendentes"'), 'Item F0b: Botão btn-regenerar-cenas-pendentes presente no HTML');
  checar(html.includes('id="lista-cenas-pendentes"'), 'Item F0c: Container lista-cenas-pendentes presente no HTML');
  checar(html.includes('id="count-cenas-pendentes"'), 'Item F0d: Contador count-cenas-pendentes presente no HTML');

  // Simulação de IA falhando em exatamente 3 cenas (ex: 02, 05 e 08)
  const cenasTesteFalha = JSON.parse(JSON.stringify(planoReal.cenas.slice(0, 10)));
  for (const c of cenasTesteFalha) {
    delete c.status;
    delete c.motivoPendente;
    delete c.descricaoVisual;
  }
  const stubIaFalhandoEm3 = async (promptLote) => {
    // Se for uma tentativa de correção de uma das cenas que falharam, a IA persiste na falha
    if (promptLote.includes('Scene 02') || promptLote.includes('Scene 05') || promptLote.includes('Scene 08')) {
      return JSON.stringify([{ numero: '00', descricaoVisual: 'still invalid description with roaring sea and Portuguese palavras' }]);
    }
    const arraySimulado = [];
    for (let i = 1; i <= 10; i++) {
      const numStr = String(i).padStart(2, '0');
      if (i === 2) {
        // Falha 1: Falso mar ("sea") em trecho sem mar
        arraySimulado.push({
          numero: numStr,
          descricaoVisual: 'Moses standing before the raging sea waves with roaring waters'
        });
      } else if (i === 5) {
        // Falha 2: Texto em português rejeitado pelo validador
        arraySimulado.push({
          numero: numStr,
          descricaoVisual: 'Moisés conversando com o povo hebreu no acampamento do deserto'
        });
      } else if (i === 8) {
        // Falha 3: Clichê vazio proibido
        arraySimulado.push({
          numero: numStr,
          descricaoVisual: 'solemn biblical historical tableau depicting biblical figures'
        });
      } else {
        // Cenas válidas com descrições e enquadramentos variados
        const descricoesVariadasF1 = {
          1: 'Extreme close-up on Moses holding a rustic wooden staff under the blazing sun',
          3: 'Wide panoramic view of thousands of Hebrew tents pitched in the dry canyon of Kadesh',
          4: 'Medium shot of Aaron high priest in clean white linen vestments standing by the sanctuary tent',
          6: 'High-angle aerial perspective looking down at parched limestone cliffs and stony ravines',
          7: 'Detail shot of dusty sandals and rough linen hem of an elder stepping across stony desert path',
          9: 'Vast open sky above Mount Hor with distant jagged desert mountain ridges at sundown',
          10: 'Ancient bronze oil lamp resting quietly on an earthen pedestal beside woven tent fabrics'
        };
        arraySimulado.push({
          numero: numStr,
          descricaoVisual: descricoesVariadasF1[i] || `Unique biblical composition of arid desert valley scene ${numStr}`
        });
      }
    }
    return JSON.stringify(arraySimulado);
  };

  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasTesteFalha,
    narracaoMoisesReal,
    stubIaFalhandoEm3,
    { tema: 'Moisés em Meribá', personagemPrincipal: 'Moisés' }
  );

  const pendentes = cenasTesteFalha.filter(c => c.status === 'PENDENTE');
  checar(pendentes.length === 3, `Item F1a: Exatamente 3 cenas marcadas como PENDENTE após falhas da IA (obtido: ${pendentes.length})`);
  checar(cenasTesteFalha[1].status === 'PENDENTE', 'Item F1b: Cena 02 marcada como PENDENTE');
  checar(cenasTesteFalha[4].status === 'PENDENTE', 'Item F1c: Cena 05 marcada como PENDENTE');
  checar(cenasTesteFalha[7].status === 'PENDENTE', 'Item F1d: Cena 08 marcada como PENDENTE');

  checar(cenasTesteFalha[1].promptIngles.startsWith('[PENDENTE:'), 'Item F1e: Prompt da cena 02 sinaliza status [PENDENTE: ...]');
  checar(Boolean(cenasTesteFalha[1].motivoPendente), 'Item F1f: Cena 02 possui motivo de pendência explícito');
  checar(cenasTesteFalha[0].status === 'CONCLUIDA', 'Item F1g: Cenas sem falha são marcadas como CONCLUIDA');

  // Validador do Pacote DEVE bloquear exportação enquanto houver cenas pendentes
  const cenasTxtPendentes = PlanoCenasModule.gerarCenasTxt(cenasTesteFalha, narracaoMoisesReal);
  const descricoesTxtPendentes = PlanoCenasModule.gerarDescricoesTxt(cenasTesteFalha);
  const promptsTxtPendentes = PlanoCenasModule.gerarPromptsTxt(cenasTesteFalha);

  const validacaoComPendentes = PlanoCenasModule.validarPacoteScriptorium({
    cenasTxt: cenasTxtPendentes,
    descricoesTxt: descricoesTxtPendentes,
    promptsTxt: promptsTxtPendentes,
    narracaoLimpa: narracaoMoisesReal,
    cenas: cenasTesteFalha
  });

  checar(validacaoComPendentes.valido === false, 'Item F2a: Validador do pacote Scriptorium rejeita pacote com cenas pendentes');
  checar(
    validacaoComPendentes.erros.some(e => e.includes('PENDENTE') && e.includes('02') && e.includes('05') && e.includes('08')),
    `Item F2b: Mensagem de erro do validador acusa as 3 cenas pendentes nominalmente`
  );

  // Teste de regeneração de cenas pendentes
  const stubIaRegeneracao = async (promptLote) => {
    // Retorna descrições válidas para as 3 cenas pendentes (02, 05, 08)
    return JSON.stringify([
      { numero: '02', descricaoVisual: 'Moses standing thoughtfully near desert rocks and sand dunes' },
      { numero: '05', descricaoVisual: 'Ancient Hebrew people gathering in the arid desert plain' },
      { numero: '08', descricaoVisual: 'Elders listening attentively in front of nomadic tents under sunlight' }
    ]);
  };

  const resRegeneracao = await PlanoCenasModule.regenerarCenasPendentes(
    cenasTesteFalha,
    narracaoMoisesReal,
    stubIaRegeneracao,
    { tema: 'Moisés em Meribá', personagemPrincipal: 'Moisés' }
  );

  checar(resRegeneracao.pendentesRestantes.length === 0, 'Item F3a: Regeneração resolve todas as 3 cenas pendentes');
  checar(cenasTesteFalha[1].status === 'CONCLUIDA', 'Item F3b: Cena 02 atualizada para CONCLUIDA após regeneração');
  checar(cenasTesteFalha[4].status === 'CONCLUIDA', 'Item F3c: Cena 05 atualizada para CONCLUIDA após regeneração');
  checar(cenasTesteFalha[7].status === 'CONCLUIDA', 'Item F3d: Cena 08 atualizada para CONCLUIDA após regeneração');
  checar(!cenasTesteFalha[1].promptIngles.includes('[PENDENTE'), 'Item F3e: Prompt da cena 02 não possui mais marcador de pendência');

  // Validador do Pacote passa com 100% de sucesso após regeneração
  const descricoesTxtPosRegen = PlanoCenasModule.gerarDescricoesTxt(cenasTesteFalha);
  const promptsTxtPosRegen = PlanoCenasModule.gerarPromptsTxt(cenasTesteFalha);

  const validacaoPosRegen = PlanoCenasModule.validarPacoteScriptorium({
    cenasTxt: cenasTxtPendentes,
    descricoesTxt: descricoesTxtPosRegen,
    promptsTxt: promptsTxtPosRegen,
    narracaoLimpa: narracaoMoisesReal,
    cenas: cenasTesteFalha
  });
  checar(validacaoPosRegen.valido === true, 'Item F4: Validador do pacote Scriptorium aprova 100% o pacote após a regeneração das pendentes');

  // ===========================================================================
  // GRUPO G: REFINAMENTOS DE PRODUÇÃO REAL (6 ITENS NOVOS)
  // ===========================================================================
  console.log('\n--- GRUPO G: Refinamentos de Produção Real (Itens 1 a 6) ---');

  // ---------------------------------------------------------------------------
  // ITEM 1: MP3 REAL NO .ZIP (SEM "[object Blob]")
  // ---------------------------------------------------------------------------
  console.log('📋 Teste Item 1: MP3 gravado em bytes binários reais no ZIP');
  // Cria um buffer simulado de MP3 de 32 bytes (com header ID3 real)
  const bytesMp3Simulado = new Uint8Array(32);
  bytesMp3Simulado[0] = 0x49; // 'I'
  bytesMp3Simulado[1] = 0x44; // 'D'
  bytesMp3Simulado[2] = 0x33; // '3'
  for (let b = 3; b < 32; b++) bytesMp3Simulado[b] = (b * 7) % 256;

  // Simula um Blob em Node com .arrayBuffer()
  const blobMp3Simulado = {
    size: bytesMp3Simulado.length,
    type: 'audio/mp3',
    arrayBuffer: async () => bytesMp3Simulado.buffer.slice(bytesMp3Simulado.byteOffset, bytesMp3Simulado.byteOffset + bytesMp3Simulado.byteLength)
  };

  const arquivosParaZip = [
    { nome: 'cenas.txt', conteudo: '01 | A vara ergueu-se no ar Moisés feriu a rocha' },
    { nome: 'descricoes.txt', conteudo: '01 | Moses striking boulder' },
    { nome: 'prompts.txt', conteudo: '01. Moses striking boulder' },
    { nome: 'narracao.mp3', conteudo: blobMp3Simulado }
  ];

  const zipGerado = await PlanoCenasModule.criarZipScriptorium(arquivosParaZip);
  checar(zipGerado !== null && zipGerado !== undefined, 'Item 1a: criarZipScriptorium gera o pacote ZIP com sucesso');

  const arquivosDescompactados = await PlanoCenasModule.lerArquivosDeZip(zipGerado);
  const entradaMp3 = arquivosDescompactados.find(a => a.nome === 'narracao.mp3');

  checar(Boolean(entradaMp3), 'Item 1b: Arquivo narracao.mp3 está presente dentro do ZIP gerado');
  checar(entradaMp3.tamanho === 32, `Item 1c: narracao.mp3 tem exatamente 32 bytes reais (recebido: ${entradaMp3.tamanho} bytes, não 13 bytes)`);
  checar(
    entradaMp3.bytes[0] === 0x49 && entradaMp3.bytes[1] === 0x44 && entradaMp3.bytes[2] === 0x33,
    'Item 1d: Bytes iniciais do MP3 preservam a assinatura binária ID3'
  );
  const textoMp3 = new TextDecoder().decode(entradaMp3.bytes);
  checar(!textoMp3.includes('[object Blob]'), 'Item 1e: narracao.mp3 NÃO foi gravado como a string "[object Blob]"');

  // ---------------------------------------------------------------------------
  // ITEM 2: NOME DO .ZIP (SLUG VEM DO TEMA, NUNCA DA CATEGORIA DO MENU)
  // ---------------------------------------------------------------------------
  console.log('\n📋 Teste Item 2: Nome do .ZIP baseado exclusivamente no tema do vídeo');
  const nomeZip1 = PlanoCenasModule.gerarNomeZipScriptorium({
    categoria: 'Acontecimentos-chave da Bíblia',
    temaCustom: 'Mar Vermelho'
  });
  checar(nomeZip1 === 'mar-vermelho-scriptorium.zip', `Item 2a: Slug gerado a partir de temaCustom ("${nomeZip1}")`);

  const nomeZip2 = PlanoCenasModule.gerarNomeZipScriptorium({
    categoria: 'Fins Trágicos Bíblicos',
    ideiaEscolhida: 'O Trágico Fim de Judas Iscariotes'
  });
  checar(nomeZip2 === 'o-tragico-fim-de-judas-iscariotes-scriptorium.zip', `Item 2b: Slug gerado a partir de ideiaEscolhida ("${nomeZip2}")`);

  const nomeZip3 = PlanoCenasModule.gerarNomeZipScriptorium({
    categoria: 'Acontecimentos-chave da Bíblia',
    temaCustom: '',
    ideiaEscolhida: ''
  });
  checar(nomeZip3 === 'roteiro-scriptorium.zip', `Item 2c: Categoria do menu é ignorada gerando fallback seguro ("${nomeZip3}")`);
  checar(!nomeZip3.includes('acontecimentos-chave'), 'Item 2d: O nome do ZIP nunca contém o nome da categoria do menu');

  // ---------------------------------------------------------------------------
  // ITEM 3: TERMOS DE BASTIDOR NA NARRAÇÃO
  // ---------------------------------------------------------------------------
  console.log('\n📋 Teste Item 3: Detecção e eliminação de termos de bastidor na narração');
  checar(
    html.includes('STRICT PROHIBITION OF BEHIND-THE-SCENES') || html.includes('PROIBIÇÃO DE TERMOS DE BASTIDOR'),
    'Item 3a: Prompt do roteiro em index.html proíbe termos de bastidor no texto narrado'
  );

  const fraseRealBastidor1 = 'Moisés respondeu com as palavras do gancho diante de todo o acampamento reunido.';
  const fraseRealBastidor2 = 'Se este roteiro fortaleceu sua fé, guarde as palavras das Escrituras em seu coração.';
  const fraseLegitimaCena = 'A cena diante do mar impressionou profundamente os filhos de Israel.';
  const fraseLegitimaSecao = 'A seção dos sacerdotes levitas avançou solenemente pelo leito seco.';
  const fraseLegitimaGanchos = 'Fizeram também ganchos de prata para suspender as cortinas sagradas.';

  const suspeitas1 = PlanoCenasModule.detectarTermosBastidor(fraseRealBastidor1);
  checar(suspeitas1.length === 1 && suspeitas1[0].termo === 'gancho', 'Item 3b: Detecta "palavras do gancho" como termo de bastidor');

  const suspeitas2 = PlanoCenasModule.detectarTermosBastidor(fraseRealBastidor2);
  checar(suspeitas2.length === 1 && suspeitas2[0].termo === 'roteiro', 'Item 3c: Detecta "este roteiro" como termo de bastidor');

  checar(PlanoCenasModule.detectarTermosBastidor(fraseLegitimaCena).length === 0, 'Item 3d: Não gera falso positivo para "cena" em contexto bíblico');
  checar(PlanoCenasModule.detectarTermosBastidor(fraseLegitimaSecao).length === 0, 'Item 3e: Não gera falso positivo para "seção" em contexto bíblico');
  checar(PlanoCenasModule.detectarTermosBastidor(fraseLegitimaGanchos).length === 0, 'Item 3f: Não gera falso positivo para "ganchos de prata" do Tabernáculo');

  // Regra de Ouro do Projeto: NUNCA trocar palavras automaticamente na limpeza
  const limpoSemTroca = limparTextoParaNarracao(fraseRealBastidor1);
  checar(
    limpoSemTroca.includes('palavras do gancho'),
    'Item 3g: limparTextoParaNarracao NUNCA troca palavras automaticamente (frase permanece intacta na limpeza)'
  );

  // Cenário 1: IA simulada reescreve a frase -> reescrita aceita e aplicada
  const chamarIaSimulada = async (prompt) => {
    if (prompt.includes('palavras do gancho')) {
      return 'Moisés respondeu com fé e autoridade diante de todo o acampamento reunido.';
    }
    if (prompt.includes('este roteiro')) {
      return 'Se esta palavra sagrada fortaleceu sua fé, guarde as palavras das Escrituras em seu coração.';
    }
    return null;
  };

  const resIaSucesso = await PlanoCenasModule.regenerarFrasesComBastidor(
    `${fraseRealBastidor1} ${fraseRealBastidor2}`,
    chamarIaSimulada
  );
  checar(!resIaSucesso.texto.includes('palavras do gancho'), 'Item 3h: IA simulada elimina "palavras do gancho"');
  checar(!resIaSucesso.texto.includes('este roteiro'), 'Item 3i: IA simulada elimina "este roteiro"');
  checar(resIaSucesso.texto.includes('fé e autoridade'), 'Item 3j: Texto final contém a nova frase reescrita pela IA');
  checar(resIaSucesso.reescritas.length === 2, 'Item 3k: Ambas as frases foram reescritas com sucesso pela IA');
  checar(resIaSucesso.falhas.length === 0, 'Item 3l: Zero falhas quando a IA reescreve com sucesso');

  // Cenário 2: IA falhando (lança erro / sem chave / nula) -> frase permanece 100% INTACTA + aviso registrado
  const chamarIaFalha = async () => {
    throw new Error('OpenRouter offline ou cota indisponível');
  };

  const textoComBastidor = `${fraseRealBastidor1} ${fraseRealBastidor2}`;
  const resIaFalha = await PlanoCenasModule.regenerarFrasesComBastidor(
    textoComBastidor,
    chamarIaFalha
  );
  checar(
    resIaFalha.texto === textoComBastidor,
    'Item 3m: Quando a IA falha, a frase permanece 100% INTACTA (sem troca automática)'
  );
  checar(resIaFalha.texto.includes('palavras do gancho'), 'Item 3n: Frase original 1 preservada intacta');
  checar(resIaFalha.texto.includes('este roteiro'), 'Item 3o: Frase original 2 preservada intacta');
  checar(resIaFalha.reescritas.length === 0, 'Item 3p: Nenhuma reescrita é forçada mecanicamente');
  checar(resIaFalha.falhas.length === 2, 'Item 3q: Registra as 2 frases com falha para decisão manual do usuário');
  checar(resIaFalha.falhas[0].termo === 'gancho' && resIaFalha.falhas[0].frase === fraseRealBastidor1, 'Item 3r: Falha 1 contém termo "gancho" e frase exata');
  checar(resIaFalha.falhas[1].termo === 'roteiro' && resIaFalha.falhas[1].frase === fraseRealBastidor2, 'Item 3s: Falha 2 contém termo "roteiro" e frase exata');

  // Cenário 3: Interface no index.html possui aviso destacado e atalho para versão revisada
  checar(html.includes('id="alerta-termos-bastidor"'), 'Item 3t: Elemento de alerta destacado id="alerta-termos-bastidor" presente em index.html');
  checar(html.includes('id="btn-alerta-abrir-revisao"'), 'Item 3u: Botão de atalho para "Usar versão revisada" presente no alerta');
  checar(html.includes('function exibirAvisoTermosBastidor'), 'Item 3v: Função exibirAvisoTermosBastidor definida em index.html');
  checar(html.includes('function ocultarAvisoTermosBastidor'), 'Item 3w: Função ocultarAvisoTermosBastidor definida em index.html');

  // ---------------------------------------------------------------------------
  // ITEM 4: PROMPTS PARECIDOS DEMAIS (VARIEDADE E VALIDADOR DE SEMELHANÇA)
  // ---------------------------------------------------------------------------
  console.log('\n📋 Teste Item 4: Variedade obrigatória e validador de semelhança entre cenas');
  const descCenaA = 'Moses standing with wooden staff before the Hebrew people in Kadesh under parched desert sun';
  const descCenaB_QuaseIgual = 'Moses standing with wooden staff before the Hebrew crowd in Kadesh under desert sun';
  const descCenaC_Variada = 'High-angle wide panoramic shot of the parched desert canyon of Kadesh, distant rocky plateau at twilight';

  const taxaSemelhancaAlta = PlanoCenasModule.calcularSemelhancaDescricoes(descCenaA, descCenaB_QuaseIgual);
  checar(taxaSemelhancaAlta >= 0.60, `Item 4a: Calcula semelhança alta entre prompts repetitivos (${Math.round(taxaSemelhancaAlta * 100)}% >= 60%)`);

  const validacaoRepetida = PlanoCenasModule.validarDescricaoVisualCena(descCenaB_QuaseIgual, 'Moisés diante do povo', {
    descricoesAnteriores: [descCenaA]
  });
  checar(validacaoRepetida.valido === false, 'Item 4b: Validador rejeita cena por semelhança excessiva (> 60%) com cena anterior');
  checar(validacaoRepetida.motivo.includes('Semelhança excessiva'), 'Item 4c: Motivo indica semelhança excessiva e exigência de variedade');

  const validacaoVariada = PlanoCenasModule.validarDescricaoVisualCena(descCenaC_Variada, 'Visão do deserto', {
    descricoesAnteriores: [descCenaA]
  });
  checar(validacaoVariada.valido === true, 'Item 4d: Validador aprova cena com enquadramento e composição variados');

  // ---------------------------------------------------------------------------
  // ITEM 5: AÇÃO ANTECIPADA E FRASE DE BASTIDOR NO PROMPT
  // ---------------------------------------------------------------------------
  console.log('\n📋 Teste Item 5: Rejeição de frases de audiência e bastidor no prompt');
  const promptAudience1 = 'Moses looking at the sky, encouraging viewers to strengthen their faith';
  const promptAudience2 = 'Sacred parchment scroll with text urging audience to subscribe to the channel';
  const promptValidoCta = 'Ancient illuminated parchment scroll resting on rustic cedar desk beside an antique brass oil lamp glowing warm in evening twilight';

  const valAudience1 = PlanoCenasModule.validarDescricaoVisualCena(promptAudience1, 'Olhou para o céu');
  checar(valAudience1.valido === false, 'Item 5a: Validador rejeita prompt com "encouraging viewers"');
  checar(valAudience1.motivo.includes('viewers') || valAudience1.motivo.includes('audiência'), 'Item 5b: Motivo acusa termos de audiência proibidos');

  const valAudience2 = PlanoCenasModule.validarDescricaoVisualCena(promptAudience2, 'Inscreva-se no canal');
  checar(valAudience2.valido === false, 'Item 5c: Validador rejeita prompt com "audience" e "subscribe"');

  const valCtaValido = PlanoCenasModule.validarDescricaoVisualCena(promptValidoCta, 'Inscreva-se no canal e ative as notificações');
  checar(valCtaValido.valido === true, 'Item 5d: Validador aceita prompt de fechamento com objeto histórico concreto');

  // ---------------------------------------------------------------------------
  // ITEM 6: IMAGEM QUE 'SOBRA' (CORTE EM TRANSIÇÃO DE ACONTECIMENTO)
  // ---------------------------------------------------------------------------
  console.log('\n📋 Teste Item 6: Preferência de corte em transição de acontecimento');
  const fraseCarrosFarao = 'Os seiscentos carros escolhidos de Faraó avançavam velozmente com ferozes cavaleiros armados.'; // 12 palavras = 4.8s (>= 4s meta.min)
  const fraseAcampamentoIsrael = 'Israel acampou junto ao mar em frente a Baal-Zefom ao pôr do sol.'; // 13 palavras = 5.2s

  const ehTransicao = PlanoCenasModule.detectarTransicaoAcontecimento([fraseCarrosFarao], fraseAcampamentoIsrael);
  checar(ehTransicao === true, 'Item 6a: detectarTransicaoAcontecimento detecta transição de carros de Faraó para Israel acampando');

  const narracaoTransicao = `${fraseCarrosFarao} ${fraseAcampamentoIsrael}`;
  const frasesTransicao = PlanoCenasModule.dividirEmFrases(narracaoTransicao);
  const planoTransicao = PlanoCenasModule.agruparFrasesEmCenas(frasesTransicao, narracaoTransicao);

  checar(planoTransicao.cenas.length === 2, `Item 6b: Divide em 2 cenas distintas na fronteira de acontecimento (cenas geradas: ${planoTransicao.cenas.length})`);
  checar(planoTransicao.cenas[0].fraseInicio.includes('Faraó'), 'Item 6c: Cena 1 concentra o trecho dos carros de Faraó');
  checar(planoTransicao.cenas[1].fraseInicio.includes('Israel acampou'), 'Item 6d: Cena 2 inicia exatamente na transição "Israel acampou junto ao mar"');

  console.log(`\n🎉 ESTRUTURA DE TESTES OFFLINE DO LOTE 02 PASSOU COM SUCESSO (${totalAsserts} verificações)!`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});

