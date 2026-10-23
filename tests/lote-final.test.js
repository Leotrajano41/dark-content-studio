// tests/lote-final.test.js — testes OFFLINE do lote final. Cada bloco reproduz o erro ANTES da correção.
const { html, criarContexto } = require('./_extrator.js');
const Catalogo = require('../js/catalogo.js');

let total = 0;
function assert(c, m) { total++; if (!c) { console.error(`  ❌ [FALHOU] ${m}`); process.exitCode = 1; } else console.log(`  ✅ [PASSOU] ${m}`); }

const ctxPT = criarContexto({ funcoes: ['detectarPalavrasEstrangeirasPT'], constantes: [['REGEX_INGLES_EM_PT', ';'], ['REGEX_ESPANHOL_EM_PT', ';']] });
const ctxFT = criarContexto({ constantes: [['FORBIDDEN_TERMS', '\n];']] });
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


console.log('\n📋 43. Citação truncada: tem que terminar no fim de uma oração do versículo');
const fs = require('fs');
const Citacao = (() => { try { return require('../js/citacao.js'); } catch (e) { return null; } })();
assert(Citacao && typeof Citacao.analisarFimDaCitacao === 'function', 'js/citacao.js existe e exporta analisarFimDaCitacao');
const Validar = require('../api/validar-biblia.js');
const nm2012 = 'E o Senhor disse a Moisés e a Arão: Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado.';
const valida = (citacao, ref = 'Números 20:12') => Validar.validarRoteiroBiblico(`Moisés ouviu. "${citacao}" (${ref})`, 'Português (Brasil)', 'arc');
let r = valida('Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não');
assert(/por isso não metereis esta congregação na terra que lhes tenho dado/.test(r.textoCorrigido), 'Citação cortada em "por isso não" é COMPLETADA com o texto da ARC');
assert(r.alteracoes.some(a => a.tipo === 'CITACAO_COMPLETADA'), 'A conferência registra CITACAO_COMPLETADA');
r = valida('Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel');
assert(r.textoCorrigido.includes('"Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel"'), 'Citação que termina no fim de uma oração (vírgula do versículo) fica como está');
r = valida('por isso não metereis esta congregação na terra que lhes tenho dado');
assert(r.textoCorrigido.includes('"por isso não metereis esta congregação na terra que lhes tenho dado"'), 'Citação que termina no fim do versículo fica como está');
r = valida('Porquanto não me crestes, para me santificardes');
assert(!/santificardes/.test(r.textoCorrigido) && /para me santificar diante/.test(r.textoCorrigido), 'Citação com redação diferente da ARC ("santificardes") é trocada pela redação da ARC');
// extensão grande demais: tira as aspas em vez de inventar um trecho enorme
const longo = 'um dois três quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove vinte.';
let an = Citacao && Citacao.analisarFimDaCitacao(longo, 'um dois três quatro');
assert(an && an.status === 'truncada' && an.completada === null, 'Se faltarem mais de 14 palavras até o fim da oração, a ação é tirar as aspas (sem completada)');
an = Citacao && Citacao.analisarFimDaCitacao('um dois, três quatro cinco seis.', 'um dois, três quatro');
assert(an && an.status === 'truncada' && an.completada === 'um dois, três quatro cinco seis.', 'Se faltam poucas palavras, completa com o texto do versículo');
an = Citacao && Citacao.analisarFimDaCitacao('um dois, três quatro cinco seis.', 'um dois');
assert(an && an.status === 'ok', 'Termina em palavra com vírgula no versículo = fim de oração = ok');
r = valida(longo.split(' ').slice(0, 1).join(' ') + ' xx'); // citação que não existe no versículo não é tratada como truncada
assert(!r.alteracoes.some(a => a.tipo === 'CITACAO_COMPLETADA'), 'Texto que não aparece no versículo não é "completado"');
// Moisés (teste real do usuário): as duas citações problemáticas
const moises = fs.existsSync(require('path').join(__dirname, '..', 'testes-reais', 'moises-f8b5f2a.txt')) ? fs.readFileSync(require('path').join(__dirname, '..', 'testes-reais', 'moises-f8b5f2a.txt'), 'utf-8') : '';
assert(/por isso não metereis esta congregação na terra que lhes tenho dado/.test(moises) && /Porquanto não me crestes, para me santificardes/.test(moises), 'Fixture do teste real do Moisés carregada (testes-reais/moises-f8b5f2a.txt)');
// Catálogo: confere só contra o versículo citado e acusa citação truncada
const versosCitados = '[Números 20:12] "E o Senhor disse a Moisés e a Arão: Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado."';
let c = Catalogo.verificarCitacoesEmCodigo('Deus disse: "Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não" e Moisés calou.', versosCitados);
assert(!c.todasValidas && c.citacoesInvalidas.some(x => x.truncada), 'Catálogo: citação cortada no meio da oração é inválida (truncada)');
c = Catalogo.verificarCitacoesEmCodigo('Deus disse: "por isso não metereis esta congregação na terra que lhes tenho dado" e Moisés calou.', versosCitados);
assert(c.todasValidas, 'Catálogo: citação que termina no fim do versículo é válida');
c = Catalogo.verificarCitacoesEmCodigo('Disse o povo: "Antes tivéssemos expirado quando expiraram nossos irmãos" e foi assim.', versosCitados);
assert(!c.todasValidas, 'Catálogo: citação de outro versículo (por exemplo do contexto) é inválida para o versículo citado');
const rem = Catalogo.remediarItem('Deus disse: "Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não" e Moisés calou. Ele entrou.', [{ tipo: 'citacao_incorreta', frase: 'Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não', truncada: true, completada: 'Porquanto não me crestes a mim, para me santificar diante dos filhos de Israel, por isso não metereis esta congregação na terra que lhes tenho dado.' }], versosCitados);
assert(/metereis esta congregação na terra que lhes tenho dado/.test(rem.texto) && /Ele entrou/.test(rem.texto), 'Catálogo: remediação completa a citação em vez de apagar a frase inteira');
assert(/NÃO do contexto|nunca do contexto/i.test(require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'catalogo.js'), 'utf-8')), 'Prompts do Catálogo mandam citar só os versículos citados, nunca o contexto');


console.log('\n📋 45. Jó e "Jo" no mapa de livros');
const arcJson = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'bible', 'pt_arc.json'), 'utf8').replace(/^\uFEFF/, ''));
(async () => {
  const ruins = [];
  for (const b of arcJson) {
    const r = await Catalogo.carregarVersiculos(`${b.name} 1:1`, 'pt', { traducao: 'arc' });
    if ((r.versiculos[0] || {}).livro !== b.name) ruins.push(b.name);
  }
  assert(ruins.length === 0, `Os 66 nomes oficiais carregam o próprio livro (falhas: ${ruins.join(', ') || 'nenhuma'})`);
  const livroDe = async (ref) => ((await Catalogo.carregarVersiculos(ref, 'pt', { traducao: 'arc' })).versiculos[0] || {}).livro;
  assert(await livroDe('Jó 1:1') === 'Jó', '"Jó 1:1" carrega Jó');
  assert(await livroDe('Job 1:1') === 'Jó', '"Job 1:1" carrega Jó');
  assert(await livroDe('Jo 3:16') === 'João', '"Jo 3:16" carrega João');
  assert(await livroDe('João 3:16') === 'João', '"João 3:16" carrega João');
  assert(await livroDe('Jn 1:1') === 'Jonas' && await livroDe('Jl 2:28') === 'Joel' && await livroDe('Js 6:1') === 'Josué', 'Jn/Jl/Js continuam Jonas/Joel/Josué');
  assert(Validar.findBook('Jó').id === 'job' && Validar.findBook('Job').id === 'job' && Validar.findBook('Jo').id === 'jo' && Validar.findBook('João').id === 'jo', 'Validador bíblico: Jó/Job = Jó e Jo/João = João');
  const jo316 = Validar.validarRoteiroBiblico('Jesus ensinou. "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito" (Jo 3:16)', 'Português (Brasil)', 'arc');
  assert(!jo316.alteracoes.some(a => /Jó/.test(JSON.stringify(a))) && jo316.textoCorrigido.includes('Porque Deus amou o mundo'), 'Validador: "(Jo 3:16)" não é tratado como Jó 3:16');
  assert(Catalogo.referenciaEmIngles('Jó 1:1') === 'Job 1:1' && Catalogo.referenciaEmIngles('Jo 3:16') === 'John 3:16', 'Pacote em inglês: Jó → Job e Jo → John');
  const parsed = Catalogo.parseIdeia('Tema\n1. Jó - Jó 1:12\n2. Uzias - 2 Crônicas 26:19\n3. Corá - Números 16:31\n4. Uzá - 2 Samuel 6:6\n5. Nadabe - Levítico 10:1\n6. Ananias - Atos 5:5');
  assert(parsed.itens[0].referenciaStr === 'Jó 1:12', 'parseIdeia aceita Jó como livro');
  tail();
})();
function tail() {

console.log('\n📋 41. Opção JFA desligada (português = só ARC)');
assert(!/<option value="aa"/.test(html) && !/Almeida Atualizada/.test(html), 'A tela não oferece mais "Almeida Atualizada / JFA"');
assert(/<select id="select-traducao-biblica"[^>]*disabled/.test(html) || !/select-traducao-biblica/.test(html), 'O seletor de tradução fica travado em ARC');
const catSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'catalogo.js'), 'utf-8');
assert(!/Almeida Atualizada/.test(catSrc), 'js/catalogo.js não cita mais "Almeida Atualizada"');
const valSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'api', 'validar-biblia.js'), 'utf-8');
const semComentarios = (src) => src.replace(/\/\/.*$/gm, '');
assert(!/pt_jfa/.test(semComentarios(valSrc)) && !/pt_jfa/.test(semComentarios(catSrc)), 'Nenhum código lê pt_jfa.json (o arquivo continua no repositório, sem uso)');
(async () => {
  for (const v of ['aa', 'jfa', 'ara', 'arc', undefined]) {
    const b = await Catalogo.obterBibliaJson('pt', v);
    const gn11 = b.find(x => x.abbrev === 'gn').chapters[0][0];
    assert(gn11 === 'No princípio, criou Deus os céus e a terra.', `obterBibliaJson('pt', ${v}) devolve a ARC`);
  }
  const dados = await Catalogo.carregarVersiculos('Números 20:12', 'pt', { traducao: 'jfa' });
  assert(/para me santificar diante/.test(dados.textoCompleto) && !/santificardes/.test(dados.textoCompleto), 'carregarVersiculos com traducao "jfa" usa o texto da ARC');
  const a1 = Validar.validarRoteiroBiblico('Deus falou. "Haja luz. E houve luz." (Gênesis 1:3)', 'Português (Brasil)', 'arc');
  const a2 = Validar.validarRoteiroBiblico('Deus falou. "Haja luz. E houve luz." (Gênesis 1:3)', 'Português (Brasil)', 'jfa');
  assert(a1.textoCorrigido === a2.textoCorrigido, 'Validador bíblico ignora o pedido de JFA (sempre ARC)');
  tail41();
})();
function tail41() {

console.log('\n📋 42. Maiúscula em "Deus/Senhor" só quando é o Deus de Israel');
const cap = (t) => Catalogo.corrigirCapitalizacaoSacra(t);
const mantem = (t) => cap(t) === t;
assert(mantem('O deus Dagom caiu diante da arca.'), '"o deus Dagom" (deus pagão) fica minúsculo');
assert(mantem('Os filisteus levaram a arca para o templo do seu deus.'), '"o seu deus" dos filisteus fica minúsculo');
assert(mantem('Moabe adorava Camos, deus dos moabitas.'), '"deus dos moabitas" fica minúsculo');
assert(mantem('Falso deus, outro deus, um deus qualquer.'), 'falso/outro/um deus continuam minúsculos');
assert(cap('Foi deus quem abriu o mar.') === 'Foi Deus quem abriu o mar.', 'O Deus de Israel (sem contexto pagão) recebe maiúscula');
assert(cap('Davi confiava em deus e clamou a deus.') === 'Davi confiava em Deus e clamou a Deus.', '"em deus" e "a deus" viram Deus');
assert(mantem('O senhor da casa saiu cedo.'), '"o senhor da casa" (dono da casa) fica minúsculo');
assert(mantem('Abner disse a Davi, meu senhor, o rei.'), '"meu senhor, o rei" (tratamento a um homem) fica minúsculo');
assert(mantem('Os servos obedeceram ao senhor deles.') && mantem('O senhor dos escravos os castigou.'), 'Senhores humanos (dos escravos, deles) ficam minúsculos');
assert(cap('Davi louvou o senhor.') === 'Davi louvou o Senhor.', '"louvou o senhor" vira Senhor (Deus)');
assert(cap('A palavra do senhor veio a Samuel.') === 'A palavra do Senhor veio a Samuel.', '"palavra do senhor" vira Senhor');
assert(cap('O anjo do senhor apareceu a Gideão.') === 'O anjo do Senhor apareceu a Gideão.', '"anjo do senhor" vira Senhor');
assert(cap('O senhor Deus formou o homem.') === 'O Senhor Deus formou o homem.', '"o senhor Deus" vira Senhor Deus');
assert(cap('Davi orou ao senhor.') === 'Davi orou ao Senhor.', '"orou ao senhor" vira Senhor');
assert(cap('Nosso senhor Jesus Cristo é fiel.') === 'Nosso Senhor Jesus Cristo é fiel.', '"Nosso senhor Jesus" vira Senhor');
assert(cap('Ele disse: "o senhor é meu pastor" e saiu.').includes('"o senhor é meu pastor"'), 'Dentro de aspas (citação) nada é alterado');

console.log('\n📋 44. Cronologia: linha do tempo de referência e proibição de intervalos que o texto não traz');
const Cronologia = (() => { try { return require('../js/cronologia.js'); } catch (e) { return null; } })();
assert(Cronologia && /40º ano/.test(Cronologia.LINHA_DO_TEMPO) && /Números 20/.test(Cronologia.LINHA_DO_TEMPO) && /Deuteronômio/.test(Cronologia.LINHA_DO_TEMPO), 'js/cronologia.js tem a linha do tempo (Números 20 e Deuteronômio no 40º ano)');
const moisesTxt = require('fs').readFileSync(require('path').join(__dirname, '..', 'testes-reais', 'moises-f8b5f2a.txt'), 'utf-8');
const conf = Cronologia ? Cronologia.detectarConflitos(moisesTxt) : [];
assert(conf.some(x => /Anos depois/.test(x.frase) && /40º ano/.test(x.motivo)), 'O teste real do Moisés: "Anos depois, ... Meribá-Cades ... Deuteronômio" é detectado (mesmo 40º ano)');
assert(Cronologia && Cronologia.detectarConflitos('Anos depois, Davi reinou em Jerusalém e construiu uma cidade.').length === 0, 'Intervalo sem eventos do mesmo período não é conflito');
assert(Cronologia && Cronologia.detectarConflitos('Quarenta anos depois da saída do Egito, Moisés falou na planície de Moabe, conforme Deuteronômio.').length === 0, 'Eventos de períodos diferentes (saída do Egito x Deuteronômio) não são conflito');
assert(Cronologia && Cronologia.detectarIntervalos('Moisés tinha cento e vinte anos pela frente até sua morte.').length === 1, 'Intervalo inventado ("cento e vinte anos pela frente") vira aviso para revisão');
assert(Cronologia && Cronologia.detectarIntervalos('A morte chegou ao terceiro dia do mês.').length === 0, 'Frase sem intervalo não gera aviso');
const srcAll = html + catSrc;
assert(/PROIBIDO afirmar intervalos de tempo/.test(srcAll) && /\$\{LINHA_DO_TEMPO_PT\}/.test(html), 'Prompts de roteiro trazem a regra de intervalos e a linha do tempo');
assert(/PROIBIDO afirmar intervalos de tempo/.test(catSrc), 'Prompts do Catálogo trazem a regra de intervalos');
assert(/LINHA DO TEMPO DE REFERÊNCIA/.test(html), 'A revisão automática recebe a linha do tempo (categoria CRONOLOGIA)');
assert(/corrigirConflitosDeCronologia\(resultText/.test(html), 'O fluxo do roteiro reescreve a frase em conflito de cronologia');

console.log('\n📋 27/26/25. Detectores em código: atribuição, costume sem marcador, absolutos, cenas, citação sem referência');
const Regras = (() => { try { return require('../js/regras-conteudo.js'); } catch (e) { return null; } })();
assert(Regras && typeof Regras.detectarCostumeSemMarcador === 'function', 'js/regras-conteudo.js existe');
assert(Regras && Regras.marcadorDeContexto('Prostrar-se com o rosto ao chão era, naquele tempo, sinal de submissão.') === 'naquele tempo', 'Reconhece "naquele tempo" como marcador de contexto');
assert(Regras && /^estudiosos/.test(Regras.marcadorDeContexto('Estudiosos do texto hebraico observam que a repetição indica ira.')), 'Reconhece "Estudiosos do texto hebraico observam" como marcador');
const semMarc = Regras ? Regras.detectarCostumeSemMarcador(moisesTxt).map(x => x.frase) : [];
assert(semMarc.some(f => /A vara representava a autoridade divina/.test(f)), 'Teste real do Moisés: "A vara representava a autoridade divina..." (interpretação sem marcador) é detectada');
assert(!semMarc.some(f => /figos, vides e romãs/.test(f)) && !semMarc.some(f => /Prostrar-se/.test(f)), 'Frases COM marcador ("Na época...", "naquele tempo") não são acusadas');
assert(Regras && Regras.detectarAtribuicaoIndevida('As Escrituras registram que, naquela cultura, o gesto era sinal de respeito.').length === 1, '"As Escrituras registram" antes de costume é detectado');
assert(Regras && Regras.detectarAtribuicaoIndevida('As Escrituras registram: "E morreu Arão ali" (Números 20:28).').length === 0, '"As Escrituras registram" antes de citação literal é permitido');
assert(Regras && Regras.detectarAtribuicaoIndevida('O texto diz que isso simbolizava a pureza do povo.').length === 1, '"O texto diz que ... simbolizava" é detectado');
const absolutos = Regras ? Regras.detectarAbsolutos(moisesTxt).map(x => x.frase).join(' | ') : '';
assert(/precisão absoluta|exatidão absoluta|obediência absoluta/.test(absolutos), 'Teste real do Moisés: "precisão/exatidão/obediência absoluta" são detectadas');
assert(/qualquer líder/.test(absolutos), 'Teste real do Moisés: "a missão de qualquer líder" é detectada');
assert(Regras && Regras.detectarAbsolutos('Para sempre será a tua misericórdia. Disse: "nunca mais" e saiu.').length === 0, '"para sempre" e palavras dentro de aspas não são acusadas');
const bateFT = (t) => ctxFT.FORBIDDEN_TERMS.some(f => f.pattern.test(t));
assert(bateFT('Ele agiu com precisão absoluta.') && !bateFT('Era um homem absolvido.'), '"absoluta" entrou na lista de palavras proibidas (frase é regenerada)');
assert(Regras && Regras.detectarCenasInventadas('Seu coração disparou e o suor escorria pela testa.').length >= 1, 'Cena/emoção inventada ("coração disparou", "suor escorria") gera aviso');
assert(Regras && Regras.detectarCenasInventadas('Moisés feriu a rocha duas vezes.').length === 0, 'Fato do texto não gera aviso de cena inventada');
assert(Regras && Regras.detectarCitacoesSemReferencia('Moisés disse: "Ouvi agora, rebeldes, porventura tiraremos água desta rocha para vós?"').length === 1, 'Citação sem referência é detectada');
assert(Regras && Regras.detectarCitacoesSemReferencia('Moisés disse: "Ouvi agora, rebeldes, porventura tiraremos água desta rocha para vós?" (Números 20:10)').length === 0, 'Citação com (Livro c:v) está ok');
assert(/corrigirRegrasDeConteudo\(resultText/.test(html), 'O fluxo do roteiro corrige atribuição/absolutos/costume sem marcador (reescrevendo a frase)');
assert(/auditarEstruturaFinal\(resultText, estiloRoteiro, globalThis\.__ancoraSecao7\)/.test(html), 'A auditoria final verifica a conclusão única usando a âncora da Seção 7');

console.log('\n📋 27. Correção em fluxo (IA simulada, sem rede) e conclusão única');
const promptsIA = [];
const ctxFluxo = criarContexto({
  funcoes: ['idiomaEhPortugues', 'reescreverFraseComIA', 'corrigirRegrasDeConteudo', 'auditarEstruturaFinal', 'indiceInicioFechamento'],
  extras: {
    SCRIPT_SYSTEM_PROMPT: 'sistema',
    OpenRouterAPI: { async generateContent(prompt) { promptsIA.push(prompt); return /attribute this custom/.test(prompt) ? 'Segundo historiadores, o gesto era sinal de respeito.' : /Remove the absolute/.test(prompt) ? 'A entrada na Terra Prometida era a esperança de Moisés.' : 'Segundo estudiosos, a vara representava a autoridade delegada por Deus.'; } }
  }
});
(async () => {
  ctxFluxo.__avisosPosProcessamento = [];
  const entrada = 'O povo bebeu a água.\n\nA vara representava a autoridade divina delegada ao líder de Israel. As Escrituras registram que o gesto era sinal de respeito. A entrada na Terra era o ápice da missão de qualquer líder.';
  const saida = await ctxFluxo.corrigirRegrasDeConteudo(entrada, 'Português (Brasil)', 'modelo');
  assert(saida.regeneradas === 3, `As 3 frases problemáticas foram reescritas pela IA (${saida.regeneradas})`);
  assert(/Segundo estudiosos, a vara representava/.test(saida.texto) && /Segundo historiadores, o gesto/.test(saida.texto) && !/qualquer líder/.test(saida.texto), 'Cada frase foi trocada pela versão reescrita (a frase inteira)');
  assert(saida.texto.startsWith('O povo bebeu a água.'), 'Frases sem problema ficam intactas');
  assert(promptsIA.every(pr => /NEVER just swap one word for a synonym/.test(pr)), 'Todos os pedidos à IA proíbem troca de palavra por sinônimo');
  const rot = ['P1.', 'P2.', 'Conclusão A do estudo bíblico narrado.', 'Conclusão B do estudo bíblico narrado.', 'Inscreva-se no canal.'].join('\n\n');
  assert(ctxFluxo.auditarEstruturaFinal(rot, 'Longo', 'Conclusão A do estudo').some(a => a.tipo === 'mais_de_uma_conclusao'), 'Dois parágrafos de fechamento antes do CTA geram aviso');
  const rotOk = ['P1.', 'P2.', 'Conclusão única do estudo bíblico narrado.', 'Inscreva-se no canal.'].join('\n\n');
  assert(!ctxFluxo.auditarEstruturaFinal(rotOk, 'Longo', 'Conclusão única do estudo').some(a => a.tipo === 'mais_de_uma_conclusao'), 'Um só parágrafo de fechamento não gera aviso');
  tail27();
})();
function tail27() {

console.log('\n📋 25. Inglês e espanhol na narração em português');
const estr = (t) => ctxPT.detectarPalavrasEstrangeirasPT(t);
assert(estr('Moses and Aaron foram ao Lord.') !== '' && estr('O povo disse unto thee que o God ouviu.') !== '', 'Nomes e palavras da KJV vazadas (Moses, Aaron, Lord, God, unto, thee) são detectados');
assert(estr('Moisés orou mientras el pueblo esperaba.') !== '' && estr('Después de muchos años, siempre volvia.') !== '', 'Espanhol (mientras, pueblo, después, siempre) é detectado');
assert(estr('Moisés e Arão foram ao Senhor, em Cades, no deserto de Zim.') === '', 'Texto normal em português não é acusado');
assert(/NO English or Spanish words|nenhuma palavra em inglês ou espanhol/i.test(html.match(/const REVIEWER_SYSTEM_PROMPT[\s\S]*?If NO problems/)[0]), 'A revisão automática verifica palavras em inglês/espanhol');

console.log('\n📋 10. Validador bíblico: siglas, citação fora do versículo e referência inexistente');
const vb = (t) => Validar.validarRoteiroBiblico(t, 'Português (Brasil)', 'arc');
let v = vb('A medida era na 2.5 e os 3.5 de largura, com 4.5 côvados.');
assert(v.textoCorrigido === 'A medida era na 2.5 e os 3.5 de largura, com 4.5 côvados.' && v.totalReferencias === 0, 'Números com ponto ("na 2.5", "os 3.5") não são tratados como Naum/Oseias');
v = vb('Isaías profetizou. "Mas ele foi ferido por causa das nossas transgressões" (Is 53:5)');
assert(v.totalReferencias === 1, 'Sigla oficial com maiúscula e dois-pontos ("Is 53:5") continua reconhecida');
v = vb('Moisés agiu. "Moisés feriu a rocha duas vezes diante do povo reunido" (Números 20:12)');
assert(v.textoCorrigido.includes('"Moisés feriu a rocha duas vezes diante do povo reunido"') && v.alteracoes.some(a => a.tipo === 'CITACAO_PARA_REVISAO'), 'Citação que NÃO é do versículo não é trocada pelo texto dele: fica como está e vai para revisão');
v = vb('Veja o que diz Salmos 200:1 sobre isso.');
assert(v.textoCorrigido === 'Veja o que diz Salmos 200:1 sobre isso.' && v.alteracoes.some(a => a.tipo === 'REFERENCIA_INEXISTENTE'), 'Referência inexistente NÃO é apagada em silêncio: o texto fica e o problema é registrado');

console.log('\n📋 9. Narração Limpa: colchetes e números de lista');
assert(limpa('[Hook (0-15s)] O fogo caiu do céu.') === 'O fogo caiu do céu.' && limpa('[pausa] Moisés orou.') === 'Moisés orou.', 'Marcadores de produção entre colchetes ainda são removidos');
assert(limpa('O povo cantou o hino [Selá] e Moisés orou.').includes('[Selá]'), 'Colchetes que fazem parte do texto ([Selá]) são preservados');
assert(limpa('1. Primeiro ponto da história.') === 'Primeiro ponto da história.', 'Numeração de lista ("1. ") ainda é removida');
assert(limpa('1948. Foi o ano da criação de Israel.').startsWith('1948.') && limpa('300. homens seguiram Gideão.').startsWith('300.'), 'Números que fazem parte da frase ("1948.", "300.") não são apagados');

console.log('\n📋 16. Frase repetida (explicação contada duas vezes)');
const rf = Regras ? Regras.removerFrasesRepetidas(moisesTxt) : null;
assert(rf && rf.removidas.some(x => /A desobediência não foi privada/.test(x)), 'Teste real do Moisés: "A desobediência não foi privada." repetida é removida na 2ª vez');
assert(rf && (rf.texto.match(/A desobediência não foi privada/g) || []).length === 1, 'Fica exatamente uma ocorrência');
assert(Regras && Regras.removerFrasesRepetidas('Moisés orou ao Senhor no deserto de Cades. Depois o povo seguiu viagem para Edom. Inscreva-se no canal. Inscreva-se no canal.').removidas.length === 0, 'Frases curtas/CTA não são tratadas como explicação repetida');
assert(/removerFrasesRepetidas\(/.test(html), 'O fluxo do roteiro remove frases repetidas');
console.log(`\n${process.exitCode ? '❌ HÁ FALHAS' : '🎉'} ${total} verificações.\n`);
}
}
}
