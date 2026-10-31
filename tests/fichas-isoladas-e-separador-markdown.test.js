// tests/fichas-isoladas-e-separador-markdown.test.js
// Validação estrita dos 2 bugs relatados:
// 1) Fichas de personagem vazando de um projeto para o outro (Elias -> Daniel) e ficha de Dario (Darius)
// 2) "---" na narração limpa e no cenas.txt

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const PlanoCenasModule = require('../js/plano-cenas.js');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, mensagem) {
  totalChecks++;
  assert.strictEqual(Boolean(condicao), true, mensagem);
  passedChecks++;
  console.log(`  ✓ ${mensagem}`);
}

console.log('=== TESTES: FICHAS ISOLADAS POR PROJETO & SEPARADORES MARKDOWN ===\n');

// Extrai a função limparTextoParaNarracao do index.html para testar de forma fiel
const indexHtmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const matchLimpar = indexHtmlContent.match(/function limparTextoParaNarracao\([\s\S]*?\n\}/);
if (!matchLimpar) {
  throw new Error('Não foi possível localizar limparTextoParaNarracao em index.html');
}
const limparTextoParaNarracao = new Function(`
  ${matchLimpar[0]}
  return limparTextoParaNarracao;
`)();

// ===========================================================================
// BUG 1: FICHAS DE PERSONAGEM ISOLADAS POR PROJETO + FICHA DE DARIO (DARIUS)
// ===========================================================================
console.log('--- TESTE 1: Isolamento de fichas entre projetos (Elias -> Daniel) ---');

// Configura ambiente global de window para simular a mesma sessão do navegador
if (typeof global.window === 'undefined') {
  global.window = {};
}

// 1. Gera o plano de cenas de Elias na sessão
const narracaoElias = `Os profetas de Baal dançavam ao redor do altar desde o romper da manhã.
Nenhuma voz respondeu aos clamores.
Então Elias restaurou o altar do Senhor com doze pedras.
O fogo do céu desceu consumindo o sacrifício diante de todo o povo.`;

const planoElias = PlanoCenasModule.gerarPlanoDeCenas(narracaoElias, {
  tema: 'Elias e os profetas de Baal',
  personagemPrincipal: 'Elias'
});

checar(Boolean(global.window._fichasPersonagensAtual), 'Fichas do Elias salvas em window._fichasPersonagensAtual');
checar('Elijah' in global.window._fichasPersonagensAtual || 'elias' in global.window._fichasPersonagensAtual, 'Fichas do Elias contêm Elijah');

// 2. Na MESMA SESSÃO (sem recarregar a página, sem limpar manualmente), gera o plano do Daniel
const narracaoDaniel = `Os sátrapas persas conspiraram contra Daniel por causa de sua integridade.
O rei Dario assinou o decreto real que proibia orar a qualquer deus por trinta dias.
Qual foi a reação do rei diante dessa pergunta? O texto bíblico declara que Dario jejuou a noite toda.
Pela manhã, o rei Dario correu depressa à cova dos leões chamando por Daniel.
Daniel respondeu em paz: O meu Deus enviou o seu anjo e fechou a boca dos leões.
Dario ordenou com júbilo que tirassem Daniel da cova sem nenhum dano.`;

const planoDaniel = PlanoCenasModule.gerarPlanoDeCenas(narracaoDaniel, {
  tema: 'Daniel na cova dos leões',
  personagemPrincipal: 'Daniel'
});

const fichasDaniel = global.window._fichasPersonagensAtual;

// Confere que NENHUM personagem do projeto anterior (Elias, Acabe, etc.) vazou para o Daniel
checar(!('Elijah' in fichasDaniel), 'Fichas de Daniel NÃO contêm Elijah do projeto anterior');
checar(!('elias' in fichasDaniel), 'Fichas de Daniel NÃO contêm elias do projeto anterior');
checar(!('Ahab' in fichasDaniel), 'Fichas de Daniel NÃO contêm Ahab do projeto anterior');
checar(!('acabe' in fichasDaniel), 'Fichas de Daniel NÃO contêm acabe do projeto anterior');
checar(!('Abraham' in fichasDaniel), 'Fichas de Daniel NÃO contêm Abraham');
checar(!('Isaac' in fichasDaniel), 'Fichas de Daniel NÃO contêm Isaac');

// Confere que Daniel e Darius estão nas fichas do projeto
checar('Daniel' in fichasDaniel || 'daniel' in fichasDaniel, 'Fichas de Daniel contêm Daniel');
checar('Darius' in fichasDaniel || 'dario' in fichasDaniel, 'Fichas de Daniel contêm Darius (rei Dario)');

// Confere que cenas onde o rei Dario aparece receberam a ficha de Darius no prompt
const cenasComDario = planoDaniel.cenas.filter(c => {
  const trecho = c.frases.join(' ').toLowerCase();
  return trecho.includes('dario') || trecho.includes('darius');
});

checar(cenasComDario.length >= 2, `Cenas com Dario identificadas (${cenasComDario.length} cenas)`);
for (const c of cenasComDario) {
  checar(c.promptIngles.includes('Darius:'), `Cena ${c.numero} com Dario inclui a ficha "Darius:" no prompt`);
  checar(!c.promptIngles.includes('Elijah:'), `Cena ${c.numero} NÃO contém ficha de Elijah`);
}

// ===========================================================================
// BUG 2: "---" NA NARRAÇÃO LIMPA E NO CENAS.TXT
// ===========================================================================
console.log('\n--- TESTE 2: Remoção de "---" e separadores Markdown ---');

// Teste exigido: "pergunta? --- O texto bíblico declara" → "pergunta? O texto bíblico declara"
const textoExemploUsuario = 'Qual foi a reação do rei diante dessa pergunta? --- O texto bíblico declara que Dario, ao ouvir isso, ficou muito penalizado.';
const limpoExemplo = limparTextoParaNarracao(textoExemploUsuario);

checar(
  limpoExemplo.includes('pergunta? O texto bíblico declara'),
  `"pergunta? --- O texto bíblico declara" transformado em "pergunta? O texto bíblico declara" (resultado: "${limpoExemplo}")`
);
checar(!limpoExemplo.includes('---'), 'Narração limpa não contém "---"');

// Teste no início de parágrafo / linha
const textoInicioLinha = '--- O texto bíblico declara que Dario ficou penalizado.';
const limpoInicio = limparTextoParaNarracao(textoInicioLinha);
checar(!limpoInicio.startsWith('-'), `Narração limpa não começa com "-" (resultado: "${limpoInicio}")`);
checar(limpoInicio.startsWith('O texto bíblico declara'), 'Narração limpa começa direto no texto após remoção de "---"');

// Teste de cenas.txt gerado
const narracaoComSeparadores = `Qual foi a reação do rei diante dessa pergunta? --- O texto bíblico declara que Dario jejuou a noite toda.
--- Pela manhã o rei correu depressa até a cova dos leões.
Daniel respondeu que Deus enviara o seu anjo para fechar a boca dos leões.`;

const narracaoLimpaSep = limparTextoParaNarracao(narracaoComSeparadores);
const planoSeparadores = PlanoCenasModule.gerarPlanoDeCenas(narracaoLimpaSep, { tema: 'Daniel na cova dos leões' });
const cenasTxtSep = PlanoCenasModule.gerarCenasTxt(planoSeparadores.cenas, narracaoLimpaSep);
const linhasCenasSep = cenasTxtSep.split('\n');

checar(linhasCenasSep.length >= 2, `cenas.txt gerado com ${linhasCenasSep.length} linhas`);
for (let i = 0; i < linhasCenasSep.length; i++) {
  const linha = linhasCenasSep[i];
  const trecho = linha.split('|')[1]?.trim() || '';
  checar(!trecho.startsWith('-'), `Linha ${i + 1} de cenas.txt NÃO começa com "-" ("${linha}")`);
  checar(!linha.includes('---'), `Linha ${i + 1} de cenas.txt NÃO contém "---" ("${linha}")`);
}

// Confere que validarPacoteScriptorium valida com sucesso
const pacoteValido = PlanoCenasModule.validarPacoteScriptorium({
  cenasTxt: cenasTxtSep,
  descricoesTxt: PlanoCenasModule.gerarDescricoesTxt(planoSeparadores.cenas),
  promptsTxt: PlanoCenasModule.gerarPromptsTxt(planoSeparadores.cenas),
  narracaoLimpa: narracaoLimpaSep,
  cenas: planoSeparadores.cenas
});

checar(pacoteValido.valido === true, 'validarPacoteScriptorium aprovou o pacote sanitizado');

console.log(`\n🎉 Todos os ${passedChecks}/${totalChecks} testes passaram com sucesso!`);
