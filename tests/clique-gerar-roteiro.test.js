/**
 * tests/clique-gerar-roteiro.test.js
 * Simula o clique real no botão "Gerar Roteiro Completo com IA" (com resposta da IA simulada)
 * para detectar ReferenceErrors e garantir que nos 3 temas (Elias, Daniel na cova dos leões e Davi e Golias)
 * a narração limpa (output-roteiro-limpo) NUNCA fica vazia.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function checar(condicao, mensagem) {
  assert.ok(condicao, mensagem);
  console.log(`  ✓ ${mensagem}`);
}

async function rodarTestes() {
  console.log('=== TESTE DE CLIQUE REAL NO BOTÃO GERAR ROTEIRO ===\n');

  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extrai o bloco de script principal do index.html
  const scriptMatches = html.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/gi);
  if (!scriptMatches || scriptMatches.length === 0) {
    throw new Error('Script não encontrado no index.html');
  }
  const scriptPrincipal = scriptMatches[scriptMatches.length - 1]
    .replace(/^<script[^>]*>/i, '')
    .replace(/<\/script>$/i, '');

  // Mock do DOM
  const domElements = {};
  function createMockElement(id, tag = 'div') {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      children: [],
      parentNode: null,
      dataset: {},
      _listeners: {},
      options: [],
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c, v) { if (v !== undefined ? v : !this._classes.has(c)) this._classes.add(c); else this._classes.delete(c); }
      },
      style: {},
      setAttribute() {},
      getAttribute() { return null; },
      addEventListener(evt, fn) {
        if (!this._listeners[evt]) this._listeners[evt] = [];
        this._listeners[evt].push(fn);
      },
      removeEventListener(evt, fn) {
        if (!this._listeners[evt]) return;
        this._listeners[evt] = this._listeners[evt].filter(f => f !== fn);
      },
      dispatchEvent(e) {
        const type = e.type || e;
        if (this._listeners[type]) {
          this._listeners[type].forEach(fn => fn(e));
        }
      },
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
          this.children.splice(idx, 1);
          child.parentNode = null;
        }
        return child;
      },
      remove() {
        if (this.parentNode && this.parentNode.removeChild) {
          this.parentNode.removeChild(this);
        }
      },
      focus() {},
      scrollIntoView() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      click() {
        if (this._listeners['click']) {
          return Promise.all(this._listeners['click'].map(fn => fn({ preventDefault: () => {} })));
        }
        return Promise.resolve();
      }
    };
    return el;
  }

  const docListeners = {};
  const mockDocument = {
    getElementById(id) {
      if (!domElements[id]) {
        domElements[id] = createMockElement(id);
      }
      return domElements[id];
    },
    createElement(tag) {
      return createMockElement('elem_' + Math.random(), tag);
    },
    addEventListener(evt, fn) {
      if (!docListeners[evt]) docListeners[evt] = [];
      docListeners[evt].push(fn);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    body: createMockElement('body', 'body')
  };

  const localStorageData = {
    'dark_studio_openrouter_api_key': 'sk-or-v1-mock-test-key-1234567890'
  };
  const mockLocalStorage = {
    getItem(k) { return localStorageData[k] || null; },
    setItem(k, v) { localStorageData[k] = String(v); },
    removeItem(k) { delete localStorageData[k]; },
    clear() { for (const k in localStorageData) delete localStorageData[k]; }
  };

  const mockWindow = {
    location: { href: 'http://localhost:3000', search: '' },
    confirm: () => true,
    addEventListener: () => {},
    localStorage: mockLocalStorage
  };

  // Carrega módulos auxiliares para o sandbox
  const sandbox = {
    console,
    require,
    process,
    __dirname,
    fetch: () => Promise.reject(new Error('offline')),
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    document: mockDocument,
    window: mockWindow,
    localStorage: mockLocalStorage,
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    PlanoCenasModule: require('../js/plano-cenas.js'),
    PontuacaoModule: require('../js/pontuacao.js'),
    NarracaoModule: require('../js/narracao.js'),
    CitacaoModule: require('../js/citacao.js'),
    CronologiaModule: require('../js/cronologia.js'),
    RegrasModule: require('../js/regras-conteudo.js')
  };
  sandbox.globalThis = sandbox;
  sandbox.window.PlanoCenas = sandbox.PlanoCenasModule;
  sandbox.window.PlanoCenasModule = sandbox.PlanoCenasModule;

  vm.createContext(sandbox);

  // Executa o script do index.html no contexto
  vm.runInContext(scriptPrincipal, sandbox);

  // Dispara o evento DOMContentLoaded para registrar os listeners reais de todos os botões
  if (docListeners['DOMContentLoaded']) {
    docListeners['DOMContentLoaded'].forEach(fn => fn());
  }

  // Prepara elementos essenciais no DOM
  const btnGerar = mockDocument.getElementById('btn-gerar-prompt-roteiro');
  const inputIdeia = mockDocument.getElementById('input-ideia-escolhida');
  const selectEstilo = mockDocument.getElementById('select-estilo-roteiro');
  const selectTom = mockDocument.getElementById('select-tom');
  const selectGancho = mockDocument.getElementById('select-gancho');
  const selectIdioma = mockDocument.getElementById('select-idioma');
  const outRoteiro = mockDocument.getElementById('output-prompt-roteiro');
  const outLimpo = mockDocument.getElementById('output-roteiro-limpo');
  const textareaAudio = mockDocument.getElementById('textarea-narracao-limpa-audio');
  const textareaRoteiroGerado = mockDocument.getElementById('textarea-roteiro-gerado');

  selectEstilo.value = 'Shorts/Reels (50-60 segundos)';
  selectTom.value = 'Épico e Dramático';
  selectGancho.value = 'Pergunta Provocativa';
  selectIdioma.value = 'pt-BR';

  // Os 3 temas solicitados pelo usuário
  const temasParaTestar = [
    {
      nome: 'Elias e os profetas de Baal',
      ideia: 'Elias e os profetas de Baal: o que 1 Reis 18 realmente registra sobre o teste do fogo no monte Carmelo',
      roteiroSimulado: `O fogo caiu do céu e consumiu o holocausto.
Antes disso, o profeta Elias convocou os quatrocentos e cinquenta profetas de Baal ao cume do monte Carmelo.
Eles clamaram desde o romper da manhã até o declinar da tarde, mas ninguém respondeu.
Elias restaurou o altar com doze pedras e mandou derramar água abundante sobre o sacrifício.
Ao entardecer, Elias aproximou-se e orou solenemente: "Ó Senhor Deus de Abraão, responde-me" (1 Reis 18:36).
Imediatamente o fogo do Senhor desceu dos céus e consumiu o sacrifício e a água da valeta.
Ao presenciarem o poder divino, todo o povo caiu com os rostos em terra e proclamou que o Senhor é Deus.
Se este estudo fortaleceu sua fé, inscreva-se no canal e ative as notificações.`
    },
    {
      nome: 'Daniel na cova dos leões',
      ideia: 'Daniel na cova dos leões: o que Daniel 6 realmente registra sobre a fidelidade e o decreto de Dario',
      roteiroSimulado: `A cova dos leões estava selada com a pedra e o anel real.
Antes disso, os príncipes do império conspiraram contra Daniel por causa de sua fidelidade inabalável a Deus.
Mesmo sabendo do decreto irrevogável que proibia súplicas a qualquer outro deus, Daniel orava três vezes ao dia com as janelas abertas em direção a Jerusalém.
Lançado na cova com animais ferozes, o profeta permaneceu sob a guarda do Altíssimo.
Pela manhã o rei foi à cova e clamou: "Daniel, servo do Deus vivo, pôde o teu Deus livrar-te dos leões?" (Daniel 6:20).
Daniel respondeu em triunfo: "O meu Deus enviou o seu anjo e fechou a boca dos leões" (Daniel 6:22).
O profeta foi retirado ileso, e a soberania do Deus vivo foi proclamada por todo o império.
Se esta mensagem fortaleceu sua confiança no poder do Altíssimo, inscreva-se no canal e compartilhe este vídeo.`
    },
    {
      nome: 'Davi e Golias',
      ideia: 'Davi e Golias: a verdadeira batalha no vale de Elá e a soberania do Senhor dos Exércitos',
      roteiroSimulado: `A pedra afundou na testa do gigante e Golias caiu com o rosto em terra.
Antes disso, durante quarenta dias o campeão filisteu desafiava os esquadrões de Israel no vale de Elá.
O jovem pastor Davi desceu ao ribeiro, escolheu cinco pedras lisas e avançou com seu cajado e sua funda de couro.
Golias escarneceu com soberba, mas Davi proclamou com fé inabalável: "Tu vens a mim com espada, e com lança, e com escudo; porém eu venho a ti em nome do Senhor dos Exércitos" (1 Samuel 17:45).
Girando a funda com destreza, Davi arremessou a pedra que atingiu a testa do gigante, derrubando o colosso filisteu sem vida no chão.
Se esta reflexão bíblica edificou o seu coração, inscreva-se no canal para acompanhar mais estudos históricos das Escrituras.`
    }
  ];

  for (const t of temasParaTestar) {
    console.log(`--- Testando clique com o tema: "${t.nome}" ---`);

    inputIdeia.value = t.ideia;
    outRoteiro.value = '';
    outLimpo.value = '';
    textareaAudio.value = '';
    if (textareaRoteiroGerado) textareaRoteiroGerado.value = '';

    // Mock do retorno da IA para este teste
    sandbox.window.OpenRouterAPI.generateContent = async () => {
      return t.roteiroSimulado;
    };

    // Dispara o clique real no botão
    await btnGerar.click();

    checar(outRoteiro.value.length > 50, `Roteiro completo gerado para "${t.nome}" (${outRoteiro.value.length} caracteres)`);
    checar(outLimpo.value.length > 50, `Narração Limpa (output-roteiro-limpo) NÃO FICOU VAZIA para "${t.nome}" (${outLimpo.value.length} caracteres)`);
    checar(textareaAudio.value.length > 50, `Textarea de áudio preenchida para "${t.nome}" (${textareaAudio.value.length} caracteres)`);
    checar(!outLimpo.value.includes('ReferenceError'), `Sem ReferenceError na execução para "${t.nome}"`);
  }

  // Teste 4: Se a validação falhar nas 2 tentativas, NUNCA deixar a narração limpa vazia (mostrar a última versão gerada + aviso amarelo)
  console.log('\n--- Testando resiliência quando a validação falha nas 2 tentativas ---');
  inputIdeia.value = 'Roteiro com aspas ímpar teimosas';
  outRoteiro.value = '';
  outLimpo.value = '';

  sandbox.window.OpenRouterAPI.generateContent = async () => {
    return `O relato bíblico traz uma grande verdade sagrada.
Elias orou ao Senhor com firmeza: "Ó Senhor Deus, ouve a minha oração (sem fechar aspas.
O fogo do Senhor desceu e consumiu o holocausto e o povo se prostrou.
Se este estudo fortaleceu sua fé, inscreva-se no canal para acompanhar os próximos estudos bíblicos.`;
  };

  await btnGerar.click();

  checar(outRoteiro.value.length > 30, 'Roteiro completo preenchido mesmo com falha estrutural de aspas');
  checar(outLimpo.value.length > 30, 'Narração Limpa (output-roteiro-limpo) NUNCA FICA VAZIA mesmo quando a validação falha');
  const bannerStatus = mockDocument.getElementById('banner-progresso-roteiro-status');
  checar(bannerStatus.innerHTML.includes('Aviso') || bannerStatus.style.borderColor === '#f59e0b', 'Exibiu aviso amarelo destacando o que falhou');

  console.log('\n🎉 TODOS OS TESTES DE CLIQUE REAL NO BOTÃO PASSARAM COM SUCESSO!');
}

rodarTestes().catch(err => {
  console.error('\n❌ Falha no teste de clique:', err);
  process.exit(1);
});
