// tests/pos-processadores.test.js
// Testes OFFLINE (sem API) dos pós-processadores de texto: cada caso abaixo foi um erro real encontrado na auditoria.
// Rodar: node tests/pos-processadores.test.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const Catalogo = require('../js/catalogo.js');
const ValidarBiblia = require('../api/validar-biblia.js');
const narrarSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'narrar.js'), 'utf-8');

let total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { console.error(`  ❌ [FALHOU] ${msg}`); process.exit(1); }
  console.log(`  ✅ [PASSOU] ${msg}`);
}

function fn(nome) {
  const ini = html.indexOf(`function ${nome}(`);
  if (ini === -1) throw new Error(`Função ${nome} não encontrada`);
  const inicioReal = html.lastIndexOf('async ', ini) === ini - 6 ? ini - 6 : ini;
  let i = html.indexOf(') {', ini) + 2;
  let prof = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') prof++;
    else if (html[i] === '}') { prof--; if (prof === 0) break; }
  }
  return html.slice(inicioReal, i + 1);
}
function constante(nome, fim) {
  const ini = html.indexOf(`const ${nome} = `);
  if (ini === -1) throw new Error(`Constante ${nome} não encontrada`);
  const f = html.indexOf(fim, ini);
  return html.slice(ini, f + fim.length).replace(`const ${nome}`, `var ${nome}`);
}

// IA simulada: devolve uma frase sem o problema (para testar a lógica de regeneração sem rede)
const chamadas = [];
const ctx = {
  console, globalThis: null, PontuacaoModule: require('../js/pontuacao.js'), RegrasModule: require('../js/regras-conteudo.js'), CronologiaModule: require('../js/cronologia.js'),
  window: {},
  SCRIPT_SYSTEM_PROMPT: 'sistema',
  OpenRouterAPI: {
    async generateContent(prompt) {
      chamadas.push(prompt);
      if (/not Portuguese/.test(prompt)) return 'O povo seguiu o rei até o monte.';
      if (/repeats the previous one/.test(prompt)) return 'Segundo estudiosos, o gesto era comum.';
      return 'Frase reescrita pela IA para o teste.';
    }
  }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
const run = (codigo) => vm.runInContext(codigo, ctx);

run(constante('DEDUP_STOPWORDS', ']);'));
run(constante('FORBIDDEN_TERMS', '\n];'));
run(constante('TERMOS_TOM_CETICISMO', '\n];'));
run(constante('REGEX_PALAVRA_REPETIDA', ';'));
run(constante('REGEX_INGLES_EM_PT', ';'));
run(constante('REGEX_ESPANHOL_EM_PT', ';'));
run(constante('MARCADORES_CONTEXTO', ';'));
[
  'normalizarAspasEPontuacao', 'validarECorrigirAspas', 'garantirEspacamentoEPontuacaoCitacoes', 'limparPontuacaoDuplicada',
  'limparTextoParaNarracao', 'garantirCtaNoUltimoParagrafo', 'limitarTermosCanonicos', 'apararParaLimiteMaximo',
  'indiceInicioFechamento', 'inserirAntesDoFechamento', 'auditarEstruturaFinal', 'detectarPalavrasEstrangeirasPT',
  'idiomaEhPortugues', 'reescreverFraseComIA', 'corrigirPalavrasEstrangeiras', 'marcadorDeContexto', 'variarMarcadoresDeContexto',
  'verificarAlertasEvidencia', 'termoEstaEmNegacaoDeCeticismo', 'termoEstaComFonteNomeada', 'encontrarTermosCeticismoNoParagrafo',
  'removerParagrafosDuplicadosPorSimilaridade', 'limitarDeclaracoesDeSilencioBiblico', 'limitarFrasesHistoricas',
  'detectarSuspeitasGramaticais', 'aplicarCorrecoesGramaticais'
].forEach(n => run(fn(n)));
const E = (nome) => ctx[nome] || run(nome);

console.log('\n📋 1. "força → paraça": nenhuma troca de palavra no texto (não existe mais removerAnglicismosAcidentais)');
assert(!/function removerAnglicismosAcidentais/.test(html), 'Função de troca cega foi removida');
assert(!/removerAnglicismosAcidentais\(/.test(html), 'Nenhuma chamada restante à troca cega');
assert(E('detectarPalavrasEstrangeirasPT')('A força de Davi e o início de tudo, forçar o ofício.') === '', 'Palavras com acento e "for" dentro de "força" NÃO são detectadas como inglês');
assert(E('detectarPalavrasEstrangeirasPT')('Davi foi with the king.') !== '', 'Detecta inglês de verdade (with/the)');
assert(E('detectarPalavrasEstrangeirasPT')('Disse: "the Lord is my shepherd" e seguiu.') === '', 'Inglês dentro de aspas (citação) é ignorado');
assert(E('detectarPalavrasEstrangeirasPT')('Ele esperou también por Dios.') !== '', 'Detecta espanhol');

console.log('\n📋 2. Palavra repetida não apaga artigo depois de palavra acentuada');
const rep = (t) => t.replace(ctx.REGEX_PALAVRA_REPETIDA, '$1');
assert(rep('Davi levantou então o rei do monte.') === 'Davi levantou então o rei do monte.', '"então o rei" intacto');
assert(rep('Salomão o chamou e Deus o ouviu.') === 'Salomão o chamou e Deus o ouviu.', '"Salomão o chamou" intacto');
assert(rep('Ele tomou a mão o filho.') === 'Ele tomou a mão o filho.', '"mão o filho" intacto');
assert(rep('tomou a espada de de Golias') === 'tomou a espada de Golias', 'Repetição real "de de" ainda é corrigida');

console.log('\n📋 3. Narração Limpa não apaga palavra no meio da frase');
const L = (t) => E('limparTextoParaNarracao')(t, 'YouTube Longo (18-20 minutos)');
assert(L('Davi fez uma afirmação: o Senhor é meu pastor.').includes('Davi fez uma afirmação: o Senhor é meu pastor.'), '"afirmação:" no meio da frase é preservado');
assert(L('Aqui está a conclusão: ele morreu no deserto.').includes('a conclusão: ele morreu'), '"conclusão:" no meio da frase é preservado');
assert(!/^Afirmação:/m.test(L('Afirmação: Moisés subiu o monte.')) && L('Afirmação: Moisés subiu o monte.').startsWith('Moisés subiu'), 'Rótulo "Afirmação:" no INÍCIO da linha continua sendo removido');
assert(L('Moisés orou.\n\nAMÉM.').includes('AMÉM.'), 'Linha curta em maiúsculas com ponto final ("AMÉM.") é conteúdo e fica');
assert(/Impacto: três dias/.test(narrarSrc) === false && /\^\[\^\\S\\r\\n\]\*\(\?:\\\*\{1,2\}\)\?\(\?:Afirmação/.test(narrarSrc), 'api/narrar.js também só remove rótulo no início da linha');

console.log('\n📋 4. "canônico": sem troca automática e sem inglês no texto');
const cano = 'O cânon canônico e o texto canônico e o registro canônico e o relato canônico e o canonical record.';
assert(E('limitarTermosCanonicos')(cano) === cano, 'limitarTermosCanonicos não troca mais palavras');
assert(!/biblical|Holy Scripture/.test(E('limitarTermosCanonicos')(cano)), 'Nenhuma palavra em inglês é injetada');

console.log('\n📋 5/7. Pontuação e aspas');
const P = (t) => E('limparPontuacaoDuplicada')(E('validarECorrigirAspas')(E('garantirEspacamentoEPontuacaoCitacoes')(t)));
assert(P('Uma coisa e "outra"..') === 'Uma coisa e "outra".', '"outra".. vira "outra".');
assert(P('Ele disse:"Vem" e saiu.') === 'Ele disse: "Vem" e saiu.', 'Espaço depois de dois-pontos antes da abertura');
assert(P('Ele disse: " Vem agora ".') === 'Ele disse: "Vem agora".', 'Sem espaço dentro das aspas');
assert(P('Ele disse: “Vem agora”.Depois foi.') === 'Ele disse: "Vem agora". Depois foi.', 'Espaço depois de ". Depois" (regressão corrigida)');
assert(P('Moisés orou: "Senhor, ouve",e Deus ouviu.') === 'Moisés orou: "Senhor, ouve", e Deus ouviu.', 'Espaço depois de vírgula após aspas');
assert(P('Disse o rei: "Venha"!. Ele veio.') === 'Disse o rei: "Venha"! Ele veio.', '"!. vira "!');
assert(P('Ela falou "sim" e "não" ao rei.') === 'Ela falou "sim" e "não" ao rei.', 'Não inventa dois-pontos antes de "sim" (aspas que não abrem fala)');
assert(P('Jesus disse "Eu sou o caminho" e partiu.').includes('disse: "Eu sou'), 'Dois-pontos ainda entram antes de fala que começa em maiúscula');
assert(P('Isso é "outra"...').endsWith('"outra"...'), 'Reticências "..." são preservadas');
assert(!/"olá e saiu sem fechar"/.test(P('Falou "olá e saiu sem fechar.')), 'Aspas desbalanceadas NÃO ganham fechamento inventado');
assert((ctx.__avisosPosProcessamento || []).some(a => a.tipo === 'aspas_desbalanceadas'), 'Aspas desbalanceadas geram aviso');

console.log('\n📋 11. CTA único');
const base = 'Primeiro parágrafo da história bem narrada.\n\nA conclusão do estudo fecha aqui com reverência.\n\nSe este estudo ajudou você, inscreva-se no canal e acompanhe os próximos vídeos.';
const comCta = E('garantirCtaNoUltimoParagrafo')(base, 'Português (Brasil)', 'YouTube Longo (18-20 minutos)');
assert(comCta === base, 'CTA escrito pelo modelo NÃO recebe um segundo CTA fixo');
const semCta = E('garantirCtaNoUltimoParagrafo')('Parágrafo um.\n\nConclusão final.', 'Português (Brasil)', 'YouTube Longo (18-20 minutos)');
assert(/inscreva-se/i.test(semCta.split('\n\n').pop()) && (semCta.match(/inscreva-se/gi) || []).length === 1, 'Sem CTA, acrescenta exatamente um');
const duplo = E('garantirCtaNoUltimoParagrafo')(base + '\n\nInscreva-se no canal para mais estudos e relatos bíblicos sagrados.', 'Português (Brasil)', 'YouTube Longo (18-20 minutos)');
assert((duplo.match(/inscreva-se/gi) || []).length === 1, 'Dois CTAs seguidos viram um só');

console.log('\n📋 12/13. Expansão entra ANTES da conclusão');
const roteiro = ['P1 gancho da história.', 'P2 contexto.', 'P3 desenvolvimento.', 'Conclusão em um parágrafo único sobre a soberania.', 'Inscreva-se no canal para mais estudos.'].join('\n\n');
let r = E('inserirAntesDoFechamento')(roteiro, 'EXPANSÃO NOVA', 'Conclusão em um parágrafo único');
let ps = r.split('\n\n');
assert(ps.indexOf('EXPANSÃO NOVA') === 3 && ps[4].startsWith('Conclusão') && /Inscreva-se/.test(ps[5]), 'Com âncora: expansão fica antes da conclusão');
const roteiro2 = ['P1.', 'P2.', 'P3.', 'Conclusão A de dois parágrafos.', 'Conclusão B de dois parágrafos.', 'Se inscreva no canal.', 'Inscreva-se no canal para mais estudos.'].join('\n\n');
r = E('inserirAntesDoFechamento')(roteiro2, 'EXPANSÃO', 'Conclusão A de dois');
ps = r.split('\n\n');
assert(ps.indexOf('EXPANSÃO') === 3, 'Conclusão em 2 parágrafos + 2 CTAs: expansão ainda antes da conclusão');
r = E('inserirAntesDoFechamento')(roteiro2, 'EXPANSÃO', 'âncora que não existe mais');
assert(r.split('\n\n').indexOf('EXPANSÃO') > 0 && r.split('\n\n').indexOf('EXPANSÃO') < r.split('\n\n').indexOf('Se inscreva no canal.'), 'Sem âncora: expansão fica antes dos CTAs finais');
assert(!/frasesComplemento/.test(html), 'Frases fixas de reserva não existem mais');
assert(E('auditarEstruturaFinal')(roteiro2 + '\n\nTexto solto depois do CTA.', 'Longo').some(a => a.tipo === 'conteudo_depois_do_cta'), 'Auditoria detecta conteúdo depois do CTA');

console.log('\n📋 14. Aparar ao teto preserva parágrafos e fechamento');
const par = (n, k) => Array.from({ length: k }, (_, i) => `Frase ${n}-${i} do parágrafo com várias palavras narrativas aqui.`).join(' ');
const longo = [par('A', 3), par('B', 12), par('C', 12), par('D', 12), 'Conclusão curta do estudo.', 'Inscreva-se no canal.'].join('\n\n');
const cortado = E('apararParaLimiteMaximo')(longo, 120);
const pc = cortado.split('\n\n');
assert((cortado.match(/\S+/g) || []).length <= 120, 'Respeita o teto de palavras');
assert(pc.length >= 5, `Mantém a estrutura de parágrafos (${pc.length} parágrafos, antes eram 6)`);
assert(pc[pc.length - 1] === 'Inscreva-se no canal.' && pc[pc.length - 2] === 'Conclusão curta do estudo.', 'Conclusão e CTA intactos');
assert(pc[0].startsWith('Frase A-0'), 'Gancho/introdução preservado');

console.log('\n📋 16. Repetição à distância');
const rep1 = 'Moisés subiu ao monte Sinai levando as tábuas da lei de Deus ao povo de Israel reunido no deserto diante das tendas.';
const textoRep = [rep1, 'Parágrafo diferente sobre Davi e Golias no vale de Elá com a funda e cinco pedras lisas do ribeiro.', 'Outro sobre Salomão construindo o templo com cedros do Líbano e ouro puro por sete anos de trabalho.', rep1].join('\n\n');
assert(E('removerParagrafosDuplicadosPorSimilaridade')(textoRep, 0.6).split('\n\n').length === 3, 'Parágrafo repetido à distância é removido');

console.log('\n📋 17. Catálogo: limites e silêncio');
assert(Catalogo.limitesTotal(12).max > 2600, 'Teto do Catálogo escala com o nº de itens (12 itens > 2.600)');
assert(/CatalogoModule\.limitesTotal\(nItens\)/.test(html), 'ajustarExtensaoRoteiro usa o teto do módulo do Catálogo');
const sil = 'Quatro, Herodes. O texto não diz como ele morreu.\n\nCinco, Ananias. A Bíblia não diz por que Safira voltou.\n\nSeis, Corá. A Bíblia não diz o que houve depois.';
assert(E('limitarDeclaracoesDeSilencioBiblico')(sil, 'Catálogo em N itens').includes('Corá'), 'Com o estilo Catálogo, o limite de silêncio é 3');
assert(/limitarDeclaracoesDeSilencioBiblico\(resultText, estiloRoteiro\)/.test(html), 'O fluxo principal passa o estilo ao limitador de silêncio');

console.log('\n📋 19/21. Marcadores obrigatórios não disparam validadores');
const texto19 = 'Na época, muitos estudiosos explicam que o costume era comum. Segundo historiadores, o gesto variava. Historiadores observam que o registro bíblico é claro.';
assert(E('verificarAlertasEvidencia')(texto19).length === 0, 'ALERTA_EVIDENCIA não é disparado pelos marcadores de contexto');
assert(E('verificarAlertasEvidencia')('Historiadores descobriram inscrições que comprovam o fato.').length > 0, 'ALERTA_EVIDENCIA continua pegando "descobriram inscrições que comprovam"');
assert(E('encontrarTermosCeticismoNoParagrafo')('Alguns consideram que o costume da época era outro.').length === 0, '"alguns consideram que o costume..." não é ceticismo');
assert(E('encontrarTermosCeticismoNoParagrafo')('Muitos ainda consideram a história de Noé uma fábula.').length > 0, '"consideram ... fábula" continua sendo ceticismo');

console.log('\n📋 Regra: marcadores variados (regenera a frase repetida)');
assert(E('marcadorDeContexto')('Historiadores observam que era assim.') === 'historiadores observam', 'Reconhece o marcador');
(async () => {
  chamadas.length = 0;
  const txt = 'Historiadores observam que o costume era comum. Ele entrou na cidade. Historiadores observam que o gesto variava.';
  const out = await E('variarMarcadoresDeContexto')(txt, 'Português (Brasil)', 'modelo');
  assert(out.regeneradas === 1 && /Segundo estudiosos/.test(out.texto) && out.texto.startsWith('Historiadores observam que o costume'), 'A 2ª ocorrência em sequência é reescrita; a 1ª fica');
  chamadas.length = 0;
  const est = await E('corrigirPalavrasEstrangeiras')('A força do rei era grande. Davi foi with the king ao monte.', 'Português (Brasil)', 'modelo');
  assert(est.regeneradas === 1 && /força do rei era grande/.test(est.texto) && !/with the king/.test(est.texto), 'Só a frase com inglês é reescrita; "força" fica intacta');
  assert(chamadas.length === 1 && /NEVER just swap one word/.test(chamadas[0]), 'O pedido à IA proíbe troca de palavra por sinônimo');

  console.log('\n📋 23. Tradução: ARC no validador bíblico');
  const arc = ValidarBiblia.validarRoteiroBiblico('Deus criou tudo. "No princípio, criou Deus os céus e a terra." (Gênesis 1:1)', 'Português (Brasil)', 'arc');
  assert(arc.textoCorrigido.includes('No princípio, criou Deus os céus e a terra.'), 'Com ARC a citação de Gênesis 1:1 mantém a redação ARC (com vírgula)');
  const textoGn3 = 'Deus falou. "E disse Deus: Haja luz. E houve luz." (Gênesis 1:3)';
  const emArc = ValidarBiblia.validarRoteiroBiblico(textoGn3, 'Português (Brasil)', 'arc').textoCorrigido;
  const emJfa = ValidarBiblia.validarRoteiroBiblico(textoGn3, 'Português (Brasil)', 'jfa').textoCorrigido;
  assert(emArc === emJfa, 'A opção JFA foi desligada: pedir "jfa" dá o mesmo resultado da ARC'); 
  const sn = ValidarBiblia.validarRoteiroBiblico('Davi disse: "O Senhor é o meu pastor, nada me faltará." (Salmos 23:1)', 'Português (Brasil)', 'arc');
  assert(!/SENHOR/.test(sn.textoCorrigido), 'O validador não força "SENHOR" em maiúsculas');
  assert(!/João Ferreira de Almeida|JFA/.test(html), 'Prompts não citam mais JFA / João Ferreira');

  console.log('\n📋 24/26. Nome fixo e absolutos');
  const bate = (t) => ctx.FORBIDDEN_TERMS.some(f => f.pattern.test(t));
  assert(bate('Jesus pregou o Sermão da Montanha.') && !bate('Jesus pregou o Sermão do Monte.'), '"Sermão da Montanha" é variante proibida; "Sermão do Monte" está livre');
  assert(bate('Qualquer judeu podia ser levado ao tribunal.') && bate('O gesto tinha significado uniforme.') && bate('Era exclusivamente um rito.'), 'Absolutos históricos são detectados');
  assert(!bate('Para sempre será a tua misericórdia.'), '"para sempre" (bíblico) não é bloqueado');
  assert(/Sermão do Monte/.test(html), 'Nome fixo consta nos prompts');

  console.log('\n📋 28/29/30. Ideias, esboço e SEO recebem a contenção factual');
  assert((html.match(/\$\{REGRA_FATOS_EN\}/g) || []).length >= 6, 'REGRA_FATOS_EN aplicada nos prompts de ideias, esboço e SEO');
  assert(/UNSUPPORTED CLAIMS PRESENTED AS FACT/.test(html), 'Revisor de fatos das ideias aceita corrigir afirmação sem base (sem exigir versículo contrário)');
  assert(/temperature: 0\.2/.test(html), 'Checagens usam temperatura baixa');

  console.log('\n📋 32/34/35. Revisão e API');
  assert(/falhou: true/.test(html) && /REVISÃO NÃO EXECUTADA/.test(html), 'Revisão que falha não mostra o selo verde');
  assert(/finish_reason === 'length'/.test(html) && /maxTentativas = 3/.test(html), 'API: nova tentativa em 429/5xx e aviso de truncamento');
  const g = E('aplicarCorrecoesGramaticais')('Ele foi até o. Tudo certo.', [{ fraseOriginal: 'Ele foi até o.', fraseCorrigida: 'Ele foi até o monte.' }]);
  assert(g.texto === 'Ele foi até o monte. Tudo certo.', 'Correção gramatical aplicada');

  console.log(`\n🎉 ${total} verificações passaram.\n`);
})().catch(e => { console.error(e); process.exit(1); });
