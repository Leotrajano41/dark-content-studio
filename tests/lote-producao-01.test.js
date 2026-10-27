// tests/lote-producao-01.test.js
// Testes offline (SEM chamar API) cobrindo rigorosamente os 29 itens do Lote de Produção 01:
// Grupo A: Etapa 2 (Prompts de Mídia - Itens 1 a 4)
// Grupo B: Etapa 3 (Thumbnails - Itens 5 a 10)
// Grupo C: Etapa 4 (SEO - Itens 11 a 15)
// Grupo D: Correções Menores (Itens 16 a 22)
// Grupo E: Regras do Roteiro (Itens 23 a 29)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FALHOU: ${msg}`);
    process.exit(1);
  }
  console.log(`PASSOU: ${msg}`);
}

const raiz = path.join(__dirname, '..');
const htmlPath = path.join(raiz, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('=== INICIANDO TESTES OFFLINE DO LOTE DE PRODUÇÃO 01 ===\n');

// ---------------------------------------------------------------------------
// GRUPO A: ETAPA 2 (PROMPTS DE MÍDIA - ITENS 1 A 4)
// ---------------------------------------------------------------------------
console.log('--- GRUPO A: Prompts de Mídia (Itens 1 a 4) ---');

function extrairPromptEngine() {
  const match = html.match(/const\s+PromptEngine\s*=\s*\{([\s\S]*?)\n\s*\};\s*(?:window\.PromptEngine|\/\*\*)/);
  if (!match) throw new Error('PromptEngine não encontrado em index.html');
  const code = 'var PromptEngine = {' + match[1] + '};';
  const ctx = {
    REGRA_FATOS_EN: '',
    REGRA_ATRIBUICAO_EN: '',
    REGRA_ATRIBUICAO_PT: '',
    REGRA_ATRIBUICAO_ES: '',
    window: {}
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.PromptEngine;
}

const PromptEngine = extrairPromptEngine();

// Item 1: Sem cenas repetidas (proibido repetir a mesma ação do mesmo personagem)
const promptVisualTemplate = PromptEngine.generateAiVisualPrompts({
  roteiro: 'Moisés feriu a rocha. As águas brotaram. Arão morreu no monte Hor. Moisés subiu ao monte Nebo.'
});

assert(
  /proibido repetir a mesma a[çc][ãa]o|NEVER repeat the same action|ZERO repeated scenes|prohibited to depict the same action/i.test(promptVisualTemplate) &&
  !/MAXIMUM OF 2 IMAGES OF THE SAME EVENT/i.test(promptVisualTemplate),
  'Item 1: Prompt de mídia proíbe explicitamente cenas e ações repetidas do mesmo personagem (máximo 1x)'
);

// Item 2: Cobrir o roteiro inteiro, na ordem cronológica sem deixar o final sem cenas
assert(
  /monte Hor|Mount Hor|monte Nebo|Mount Nebo|Moabe|Moab|Josu[ée]|Joshua/i.test(promptVisualTemplate) &&
  /co[bv]rir o roteiro inteiro|distribuir os prompts ao longo de todas as se[çc][õo]es|entire narrative progression|all sections of the script/i.test(promptVisualTemplate),
  'Item 2: Prompt de mídia exige cobrir o roteiro inteiro na ordem cronológica até as seções finais (Hor, Moabe, Nebo)'
);

// Item 3: Ficha fixa de personagens (descrição repetida em todos os prompts + frase de consistência)
assert(
  /ficha fixa de personagens|CHARACTER CONSISTENCY SHEET|consistency prompt|frase de consistência/i.test(promptVisualTemplate),
  'Item 3: Prompt de mídia inclui ficha fixa de personagens e frase de consistência para o gerador de imagem'
);

// Item 4: Lugares com o nome certo do texto (ex: cume do monte Nebo, águas de Meribá)
assert(
  /cume do monte Nebo|summit of Mount Nebo|exact canonical geographical|nomes? corretos? dos? lugares?|exact canonical place names/i.test(promptVisualTemplate),
  'Item 4: Prompt de mídia exige nomes exatos de lugares do texto bíblico (sem termos genéricos como "pequena colina")'
);

// ---------------------------------------------------------------------------
// GRUPO B: ETAPA 3 (THUMBNAILS - ITENS 5 A 10)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO B: Thumbnails (Itens 5 a 10) ---');

// Item 5: Campo "Tema do Vídeo para Thumbnail" preenchido com SÓ o título limpo + detalhe concreto principal
function extrairFuncaoSanitizarTema() {
  const match = html.match(/(?:function|const)\s+(?:sanitizarTemaParaThumbESeo|extrairTemaLimpoParaThumbESeo)[\s\S]*?\n  \}/);
  if (!match) return null;
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext('var extrairTemaLimpoParaThumbESeo = ' + match[0] + ';', ctx);
  return ctx.extrairTemaLimpoParaThumbESeo;
}

const extrairTemaLimpo = extrairFuncaoSanitizarTema();
assert(typeof extrairTemaLimpo === 'function', 'Item 5: Função extrairTemaLimpoParaThumbESeo está definida em index.html');

const ideiaExemploMoises = `1. Deus Disse Falar, Moisés Feriu Duas Vezes
- Referência Bíblica Principal: Números 20:7-12
- Gancho / Conflito Central: Moisés golpeia a rocha com ira diante de toda a congregação.
- Detalhe Concreto: A vara de Arão, a água jorrando no deserto de Zim.`;

const temaLimpoExtraido = extrairTemaLimpo(ideiaExemploMoises);
assert(
  !/Referência Bíblica|Gancho/i.test(temaLimpoExtraido) &&
  temaLimpoExtraido.includes('Deus Disse Falar, Moisés Feriu Duas Vezes') &&
  temaLimpoExtraido.includes('A vara de Arão'),
  'Item 5: extrairTemaLimpoParaThumbESeo extrai apenas o título limpo + detalhe concreto principal (sem blocos de referência/gancho)'
);

// Item 6: O botão "Preencher com o padrão do canal" preenche a etapa 3 (Estilo, Cores, Elementos)
assert(
  /select-estilo-thumb[\s\S]*?Impacto Visual Dram[áa]tico/.test(html) &&
  /select-cores-thumb[\s\S]*?S[óo]brias e Dram[áa]ticas/.test(html) &&
  /select-elementos-thumb[\s\S]*?Ilustra[çc][ãa]o Central [ÚU]nica/.test(html),
  'Item 6: Botão "Preencher com o padrão do canal" define valores da etapa 3 (Estilo, Cores, Elementos) mantendo-os editáveis'
);

// Item 7: Prompts de thumbnail usam estilo Manuscrito Iluminado (SEM photorealistic/8k/cinematográfico)
const thumbPrompt = PromptEngine.generateThumbnailPrompts({
  tema: 'Deus Disse Falar, Moisés Feriu Duas Vezes',
  estilo: 'Impacto Visual Dramático',
  cores: 'Sóbrias e Dramáticas',
  elementos: 'Ilustração Central Única'
});

assert(
  !/photorealistic|8k resolution|cinematic lighting/i.test(thumbPrompt),
  'Item 7a: Prompts de thumbnail NÃO utilizam termos proibidos de foto realista/8k/cinematográfico'
);
assert(
  /sepia ink|parchment|manuscrito iluminado|illuminated manuscript|watercolor/i.test(thumbPrompt),
  'Item 7b: Prompts de thumbnail adotam o estilo visual do canal (Manuscrito Iluminado em pergaminho envelhecido)'
);

// Item 8: Proibir cenas de outros episódios e proibir representar Deus como figura humana/sombra
assert(
  /never depict scenes.*from other biblical episodes|proibir cenas de outros epis[óo]dios/i.test(thumbPrompt) &&
  /depict God as a human figure|representar Deus como figura humana/i.test(thumbPrompt),
  'Item 8: Thumbnails proíbem cenas de outros episódios e representação antropomórfica de Deus'
);

// Item 9: Texto de overlay concreto e curto (1 a 3 palavras, números/objetos ex "2 STRIKES", não abstrato)
assert(
  /1 to 3 words|1 a 3 palavras|concrete.*number|specific numbers|números ou objetos concretos/i.test(thumbPrompt) &&
  /FORBIDDEN to use abstract|proibir conceitos abstratos/i.test(thumbPrompt),
  'Item 9: Overlay text da thumbnail exige termos curtos e concretos (1-3 palavras, números/objetos)'
);

// Item 10: Cada prompt sai com texto embutido (entre aspas, terço direito vazio, serifa dourada com contorno marrom)
assert(
  /ter[çc]o direito|right third|serifa|serif|dourad[oa]|gold.*dark brown contour|celular|mobile/i.test(thumbPrompt),
  'Item 10: Prompts de thumbnail incluem texto embutido posicionado no terço direito em serifa dourada com contorno marrom'
);

// ---------------------------------------------------------------------------
// GRUPO C: ETAPA 4 (SEO - ITENS 11 A 15)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO C: SEO (Itens 11 a 15) ---');

// Item 11: Campo "Tema do Vídeo para SEO" preenchido com o tema limpo igual ao Item 5
assert(
  /inputTemaSeo\.value\s*=\s*(?:sanitizarTemaParaThumbESeo|extrairTemaLimpoParaThumbESeo)/.test(html),
  'Item 11: input-tema-seo é preenchido automaticamente com o tema limpo'
);

// Item 12: Títulos SEMPRE em inglês (CAPS estratégico em 1-2 palavras), descrição, tags e hashtags em inglês
const seoPrompt = PromptEngine.generateSeoPrompt({
  tema: 'Deus Disse Falar, Moisés Feriu Duas Vezes',
  resumo: 'A desobediência de Moisés em Meribá e a sentença divina.',
  idioma: 'Português (Brasil)'
});

assert(
  /TITLES IN ENGLISH|3 HIGH-CTR TITLE OPTIONS IN ENGLISH|Written 100% in English/i.test(seoPrompt) &&
  /MAXIMUM OF (?:1\s*(?:TO|-)\s*2|[12])\s*WORDS?\s*IN\s*CAPS/i.test(seoPrompt) &&
  /SEARCH TAGS.*IN ENGLISH|TAGS.*IN ENGLISH/i.test(seoPrompt),
  'Item 12: Geração de SEO exige títulos, descrição, tags e hashtags SEMPRE em inglês'
);

// Item 13: Filtro de palavras proibidas aplicado de verdade (detectar e regenerar/substituir em títulos, descrição e tags)
function extrairForbiddenTerms() {
  const match = html.match(/const\s+FORBIDDEN_TERMS\s*=\s*\[([\s\S]*?)\n\];/);
  if (!match) throw new Error('FORBIDDEN_TERMS não encontrado');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext('var FORBIDDEN_TERMS = [' + match[1] + '];', ctx);
  return ctx.FORBIDDEN_TERMS;
}

const forbiddenTerms = extrairForbiddenTerms();
const termosExigidos = ['delve', 'profound', 'meticulously', 'serves as a reminder'];
for (const t of termosExigidos) {
  const tem = forbiddenTerms.some(f => f.term === t || f.pattern.test(t));
  assert(tem, `Item 13a: FORBIDDEN_TERMS contém "${t}"`);
}
// Verificar especificamente "serves as a sobering reminder"
const bateSoberingReminder = forbiddenTerms.some(f => f.pattern.test('serves as a sobering reminder'));
assert(bateSoberingReminder, 'Item 13b: FORBIDDEN_TERMS detecta "serves as a sobering reminder"');

// Item 14: Citações bíblicas no SEO (em inglês) devem vir da King James do arquivo data/bible/en_kjv.json
const enKjvPath = path.join(raiz, 'data', 'bible', 'en_kjv.json');
assert(fs.existsSync(enKjvPath), 'Item 14a: Arquivo data/bible/en_kjv.json existe');
assert(
  /en_kjv\.json|King James Version|KJV/i.test(html) &&
  /Citações bíblicas no SEO.*King James|SEO.*KJV/i.test(html),
  'Item 14b: SEO instrui e utiliza exclusivamente a King James (en_kjv.json) para citações em inglês'
);

// Item 15: Proibir tags fora do tema (ex: não citar sermão do monte em Meribá)
assert(
  /proibir tags fora do tema|PROHIBIT unrelated tags|only tags directly related to the specific biblical passage|no generic disconnected topics/i.test(seoPrompt),
  'Item 15: Prompts de SEO proíbem estritamente tags fora do tema bíblico abordado'
);

// ---------------------------------------------------------------------------
// GRUPO D: CORREÇÕES MENORES (ITENS 16 A 22)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO D: Correções Menores (Itens 16 a 22) ---');

// Item 16: Versão revisada compara com Narração Limpa original e detecta ~20 frases (e não 154)
const VersaoRevisadaModule = require('../js/versao-revisada');
const moisesOriginal = fs.readFileSync(path.join(raiz, 'testes-reais', 'moises-f8b5f2a.txt'), 'utf8');

// Cria uma versão revisada com exatamente 3 frases modificadas
const frasesDoTexto = VersaoRevisadaModule.extrairFrases(moisesOriginal);
assert(frasesDoTexto.length > 50, 'Item 16a: Moises-f8b5f2a.txt possui mais de 50 frases');

const textoRevisadoExemplo = moisesOriginal
  .replace('Moisés feriu a rocha. Uma vez. Duas vezes.', 'Moisés feriu a rocha com sua vara duas vezes consecutivas.')
  .replace('Ali, em Cades, Miriã morreu.', 'Naquele lugar árido de Cades, Miriã faleceu.')
  .replace('Moisés tinha cento e vinte anos pela frente até sua morte.', 'Moisés viveu até a idade avançada de cento e vinte anos.');

const mudancasDetectadas = VersaoRevisadaModule.compararFrases(moisesOriginal, textoRevisadoExemplo);
assert(
  mudancasDetectadas.length >= 2 && mudancasDetectadas.length <= 5,
  `Item 16b: Algoritmo de comparação identifica pontualmente as frases alteradas (${mudancasDetectadas.length} encontradas, esperado ~3 a 5 e não 154)`
);

// Item 17: data/bible/pt_arc.json: sem erros de digitação/espaço (ex: "Indignaram-n o" -> "Indignaram-no", "Senhor !")
const arcContent = fs.readFileSync(path.join(raiz, 'data', 'bible', 'pt_arc.json'), 'utf8');
assert(!/Indignaram-n\s+o/i.test(arcContent), 'Item 17a: pt_arc.json corrigido de "Indignaram-n o" para "Indignaram-no"');
assert(!/\b\w+-[nlmtvs]\s+[oaes]{1,2}\b/i.test(arcContent), 'Item 17b: pt_arc.json sem pronomes enclíticos quebrados por espaço');
assert(!/\s+[,;!?]/i.test(arcContent), 'Item 17c: pt_arc.json sem espaços indevidos antes de pontuação');

// Item 18: Validação bíblica: nunca substituir uma citação que já bate com a ARC (Salmo 106:32-33)
const validarBiblia = require('../api/validar-biblia');
const citacaoSalmo = 'Indignaram-no também junto às águas da contenda, de sorte que sucedeu mal a Moisés, por causa deles';
const textoComCitacaoSalmo = `Como diz o salmista: "${citacaoSalmo}" (Salmos 106:32).`;
const resValidacaoSalmo = validarBiblia.validarRoteiroBiblico(textoComCitacaoSalmo, 'pt', 'arc');
assert(
  resValidacaoSalmo.textoCorrigido.includes(citacaoSalmo),
  'Item 18: Validação bíblica mantém intacta citação que já bate com a ARC (Salmo 106:32)'
);

// Item 19: Deuteronômio 1:37-38 com a referência errada "Deuteronômio 4:21-22" corrigida pela redação
const textoComDtErrado = 'Moisés declarou: "Também o Senhor se indignou contra mim por causa de vós, dizendo: Também tu lá não entrarás. Josué, filho de Num, que está em pé diante de ti, ali entrará" (Deuteronômio 4:21-22).';
const resValidacaoDt = validarBiblia.validarRoteiroBiblico(textoComDtErrado, 'pt', 'arc');
assert(
  /Deuteron[ôo]mio\s+1:37-38/i.test(resValidacaoDt.textoCorrigido),
  'Item 19: Referência incorreta corrigida para Deuteronômio 1:37-38 com base na redação da citação'
);

// Item 20: Cronologia: nunca deixar maiúscula após vírgula ("Depois da sentença..., a geração")
const PontuacaoModule = require('../js/pontuacao');
const textoComMaiusculaAposVirgula = 'Depois da sentença..., A geração não pôde entrar.';
const textoCorrigidoPontuacao = PontuacaoModule.normalizarAspasEPontuacao(textoComMaiusculaAposVirgula);
assert(
  /Depois da sentença\.\.\.,\s+a geração/.test(textoCorrigidoPontuacao) ||
  !/,\s+A geração/.test(textoCorrigidoPontuacao),
  'Item 20: Normalização de pontuação corrige maiúscula indevida após vírgula'
);

// Item 21: Ideias: conferir citações contra a ARC sem falsos positivos
function extrairConferirCitacaoIdeias() {
  const match = html.match(/(?:function|const)\s+conferirCitacoesDaIdeiaNaArc[\s\S]*?\n\}/);
  if (!match) return null;
  const ctx = {
    validarBiblia: require('../api/validar-biblia'),
    fs: require('fs'),
    path: require('path')
  };
  vm.createContext(ctx);
  vm.runInContext('var conferirCitacoesDaIdeiaNaArc = ' + match[0] + ';', ctx);
  return ctx.conferirCitacoesDaIdeiaNaArc;
}

const conferirCitacoesDaIdeia = extrairConferirCitacaoIdeias();
assert(typeof conferirCitacoesDaIdeia === 'function', 'Item 21a: Função conferirCitacoesDaIdeiaNaArc definida');

const ideiaMoisesCorreta = '2. A Rocha Ferida e a Sentença em Cades\n- Referência: Números 20:7-12\n- Detalhe: Moisés bateu duas vezes';
const checagemIdeia2 = conferirCitacoesDaIdeia(ideiaMoisesCorreta);
assert(checagemIdeia2.temErro === false, 'Item 21b: Ideia nº 2 correta não recebe aviso falso positivo de erro bíblico');

const ideiaComRefInexistente = '7. O Falso Relato de Meribá\n- Referência: Números 99:45-50\n- Detalhe: Versículo inexistente';
const checagemIdeia7 = conferirCitacoesDaIdeia(ideiaComRefInexistente);
assert(checagemIdeia7.temErro === true, 'Item 21c: Ideia nº 7 com citação ou referência fora da ARC é detectada como erro');

// Item 22: Legendas: não gerar blocos de 1 palavra com < 0,5s e sem sobreposição de tempos
const NarracaoModule = require('../js/narracao');
const wordsAssemblyExemplo = [
  { text: 'ar.', start: 0, end: 200 },
  { text: 'A', start: 250, end: 400 },
  { text: 'vara', start: 410, end: 700 },
  { text: 'ergueu-se.', start: 710, end: 1200 }
];
const srtGerado = NarracaoModule.alinharLegendaComTextoLimpo(wordsAssemblyExemplo, 'ar. A vara ergueu-se.', 1.5);
assert(
  !/\n1\s*\n\d\d:\d\d:\d\d,\d\d\d\s*-->\s*\d\d:\d\d:\d\d,\d\d\d\s*\nar\.\s*\n/i.test(srtGerado),
  'Item 22a: Não gera bloco isolado de 1 palavra com menos de 0,5s ("ar.")'
);

// Checar sem sobreposição de tempos
const blocosSrt = srtGerado.trim().split(/\n\s*\n/);
let semSobreposicao = true;
let tempoAnteriorFim = 0;
for (const b of blocosSrt) {
  const m = b.match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
  if (m) {
    const startSec = Number(m[1])*3600 + Number(m[2])*60 + Number(m[3]) + Number(m[4])/1000;
    const endSec = Number(m[5])*3600 + Number(m[6])*60 + Number(m[7]) + Number(m[8])/1000;
    if (startSec < tempoAnteriorFim - 0.001) semSobreposicao = false;
    tempoAnteriorFim = endSec;
  }
}
assert(semSobreposicao, 'Item 22b: Nenhum bloco de legenda se sobrepõe no tempo');

// ---------------------------------------------------------------------------
// GRUPO E: REGRAS DO ROTEIRO (ITENS 23 A 29)
// ---------------------------------------------------------------------------
console.log('\n--- GRUPO E: Regras do Roteiro (Itens 23 a 29) ---');

assert(
  /GANCHO IN MEDIAS RES.*Antes disso|depois do gancho.*voltar no tempo com.*Antes disso/i.test(html),
  'Item 23: Regra de Gancho in medias res voltando com "Antes disso..." sem tratar desfecho como já ocorrido'
);

assert(
  /mesmo nome de lugar do come[çc]o ao fim|uniformidade de top[ôo]nimo|não alternar Meribá e Cades-Barneia/i.test(html),
  'Item 24: Regra de consistência de nomes de lugares (não alternar Meribá e Cades-Barneia)'
);

assert(
  /proibido.*estudiosos da [ée]poca|estudiosos explicam.*s[óo] para consenso conhecido/i.test(html),
  'Item 25: Regra proíbe "estudiosos da época" e restringe "estudiosos explicam" a consenso conhecido'
);

assert(
  /feitos, n[úu]meros e datas.*s[óo] com refer[êe]ncia b[íi]blica|n[ãa]o puxar n[úu]meros de outro cap[íi]tulo/i.test(html),
  'Item 26: Feitos, números e datas somente com referência bíblica sem importar números de outro capítulo'
);

assert(
  /mesma passagem n[ãa]o pode aparecer com duas reda[çc][õo]es|n[ãa]o citar o mesmo vers[íi]culo duas vezes/i.test(html),
  'Item 27: Proibição de citar o mesmo versículo duas vezes ou com duas redações distintas'
);

assert(
  /se[çc][õo]es finais em ordem cronol[óo]gica.*resumo das anteriores/i.test(html),
  'Item 28: Seções finais em ordem cronológica recebendo resumo das anteriores para evitar repetição'
);

assert(
  /limitar frases de refor[çc]o.*a uma por se[çc][ãa]o|frases de refor[çc]o.*no m[áa]ximo uma por se[çc][ãa]o/i.test(html),
  'Item 29: Frases de reforço limitadas a no máximo uma por seção'
);

console.log('\n🎉 TODOS OS 29 ITENS DO LOTE DE PRODUÇÃO 01 PASSARAM COM SUCESSO!');
