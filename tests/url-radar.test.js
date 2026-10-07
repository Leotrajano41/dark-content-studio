// tests/url-radar.test.js
// Testes Automatizados para a leitura de ?tema=, ?titulo=, ?estilo= e ?itens= da URL (Radar de Conteúdo)
// Executável sem chamadas externas à API (100% autônomo com simulação de DOM e AutoSave).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let totalCasos = 0;
let casosPassados = 0;

function assert(condicao, descricao) {
  totalCasos++;
  if (condicao) {
    casosPassados++;
    console.log(`  ✅ [PASSOU] ${descricao}`);
  } else {
    console.error(`  ❌ [FALHOU] ${descricao}`);
    throw new Error(`Falha no teste: ${descricao}`);
  }
}

// 1. Carrega o script do index.html
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  throw new Error('Não foi possível extrair a tag <script> de index.html');
}

function criarAmbienteTeste({ urlSearch = '', estadoLocalStorage = {}, mockConfirm = () => true }) {
  const domElements = {};

  function createMockElement(id, tag = 'div') {
    const defaultHidden = ['banner-radar-tema', 'container-titulo-radar', 'container-tema-custom', 'container-num-itens-catalogo'];
    const initialClasses = defaultHidden.includes(id) ? ['hidden'] : [];
    const listeners = {};
    return {
      id,
      tagName: tag.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      children: [],
      parentNode: null,
      dataset: {},
      classList: {
        _classes: new Set(initialClasses),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c, f) {
          if (f === undefined) {
            if (this._classes.has(c)) this._classes.delete(c);
            else this._classes.add(c);
          } else if (f) {
            this._classes.add(c);
          } else {
            this._classes.delete(c);
          }
        }
      },
      addEventListener(evt, fn) {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(fn);
      },
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        if (listeners[type]) {
          listeners[type].forEach(fn => fn(evt));
        }
        return true;
      },
      click() {
        this.dispatchEvent({ type: 'click' });
      },
      focus() {},
      scrollIntoView() {},
      options: [
        { value: 'YouTube Longo (18-20 minutos)', text: 'YouTube Longo (18-20 minutos)' },
        { value: 'Catálogo em N itens (14-17 min)', text: 'Catálogo em N itens (14-17 min)' },
        { value: 'YouTube Médio (5-8 minutos)', text: 'YouTube Médio (5-8 minutos)' },
        { value: 'Personalizável', text: '-- Personalizável --' }
      ]
    };
  }

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
    addEventListener() {},
    querySelectorAll(sel) { return []; },
    body: createMockElement('body', 'body')
  };

  const storage = { ...estadoLocalStorage };
  const mockLocalStorage = {
    getItem(k) { return storage[k] !== undefined ? String(storage[k]) : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { for (const k in storage) delete storage[k]; }
  };

  let confirmChamado = false;
  let ultimaMsgConfirm = '';
  const mockWindow = {
    location: {
      href: 'https://dark-content-studio.vercel.app/' + urlSearch,
      search: urlSearch
    },
    confirm: (msg) => {
      confirmChamado = true;
      ultimaMsgConfirm = msg;
      return mockConfirm(msg);
    },
    addEventListener: () => {},
    _radarTitulo: null,
    _veioDoRadar: false
  };

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    document: mockDocument,
    window: mockWindow,
    localStorage: mockLocalStorage,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    Event: class { constructor(type) { this.type = type; } },
    URLSearchParams: URLSearchParams
  };
  sandbox.window.document = mockDocument;
  sandbox.window.localStorage = mockLocalStorage;

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptMatch[1], context);

  return {
    context,
    domElements,
    getEl: (id) => mockDocument.getElementById(id),
    mockWindow,
    getConfirmChamado: () => confirmChamado,
    getUltimaMsgConfirm: () => ultimaMsgConfirm,
    runProcessarURL: () => {
      const fn = context.window.processarParametrosURL || context.processarParametrosURL;
      if (typeof fn === 'function') fn();
    },
    runAutoSaveRestore: () => {
      const autoSave = context.window.AutoSave || context.AutoSave;
      if (autoSave && autoSave.restore) return autoSave.restore();
      return false;
    }
  };
}

console.log('\n======================================================');
console.log('🧪 INICIANDO TESTES DO RADAR DE URL (tests/url-radar.test.js)');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// TESTE (a): O tema da URL vence o valor restaurado pelo AutoSave
// --------------------------------------------------------------------------
console.log('📋 CASO A: Precedência da URL sobre AutoSave');
{
  const estadoSalvoOgue = {
    dark_studio_session_v1: JSON.stringify({
        'select-tema': 'Personalizável',
        'input-tema-custom': 'Ogue, rei de Basã: o último dos gigantes (Números 21:33-35)'
      })
  };

  const env = criarAmbienteTeste({
    urlSearch: '?tema=Cada%20julgamento%20s%C3%BAbito%20de%20Deus%20na%20B%C3%ADblia&titulo=Every%20Sudden%20Judgment%20of%20God',
    estadoLocalStorage: estadoSalvoOgue
  });

  // Simula fluxo real: AutoSave.restore() roda primeiro, depois processarParametrosURL()
  env.runAutoSaveRestore();
  assert(env.getEl('input-tema-custom').value.includes('Ogue'), 'AutoSave restaurou inicialmente o tema antigo Ogue.');

  env.runProcessarURL();
  assert(
    env.getEl('input-tema-custom').value === 'Cada julgamento súbito de Deus na Bíblia',
    'Tema da URL sobrepôs com sucesso o tema restaurado do AutoSave.'
  );
  assert(
    env.getEl('select-tema').value === 'Personalizável',
    'Select de tema configurado para "Personalizável".'
  );
  assert(
    !env.getEl('banner-radar-tema').classList.contains('hidden'),
    'Banner fixo da Etapa 1 está visível.'
  );
  assert(
    env.getEl('texto-banner-radar').textContent === 'Cada julgamento súbito de Deus na Bíblia',
    'Texto do banner fixo reflete o tema recebido do Radar.'
  );
}

// --------------------------------------------------------------------------
// TESTE (b): Parâmetros ?estilo=catalogo e ?itens=8 são aplicados corretamente
// --------------------------------------------------------------------------
console.log('\n📋 CASO B: Aplicação de ?estilo=catalogo e ?itens=8');
{
  const env = criarAmbienteTeste({
    urlSearch: '?tema=Reis%20Rebeldes&estilo=catalogo&itens=8'
  });

  env.runProcessarURL();

  assert(
    env.getEl('select-estilo-roteiro').value === 'Catálogo em N itens (14-17 min)',
    'Estilo selecionado como "Catálogo em N itens (14-17 min)".'
  );
  assert(
    !env.getEl('container-num-itens-catalogo').classList.contains('hidden'),
    'Container de nº de itens do catálogo está visível.'
  );
  assert(
    parseInt(env.getEl('input-num-itens-catalogo').value, 10) === 8,
    'Nº de itens preenchido com 8 com sucesso.'
  );
}

// --------------------------------------------------------------------------
// TESTE (c): Sem parâmetros na URL, nada é alterado
// --------------------------------------------------------------------------
console.log('\n📋 CASO C: Comportamento neutro sem parâmetros na URL');
{
  const estadoSalvoOgue = {
    dark_studio_session_v1: JSON.stringify({
        'select-tema': 'Personalizável',
        'input-tema-custom': 'Ogue, rei de Basã: o último dos gigantes',
        'select-estilo-roteiro': 'YouTube Longo (18-20 minutos)'
      })
  };

  const env = criarAmbienteTeste({
    urlSearch: '',
    estadoLocalStorage: estadoSalvoOgue
  });

  env.runAutoSaveRestore();
  env.runProcessarURL();

  assert(
    env.getEl('input-tema-custom').value === 'Ogue, rei de Basã: o último dos gigantes',
    'Sem parâmetros de busca, o tema restaurado do AutoSave permanece intacto.'
  );
  assert(
    env.getEl('banner-radar-tema').classList.contains('hidden'),
    'Banner do Radar permanece oculto quando não há parâmetros.'
  );
}

// --------------------------------------------------------------------------
// TESTE (d): Com roteiro gerado e confirm() negado, nada muda
// --------------------------------------------------------------------------
console.log('\n📋 CASO D: Confirmação inteligente com trabalho existente negada');
{
  const env = criarAmbienteTeste({
    urlSearch: '?tema=Novo%20Tema%20Invasor',
    mockConfirm: () => false // Usuário clica em "Cancelar"
  });

  // Simula roteiro já gerado na tela
  env.getEl('input-tema-custom').value = 'Tema Antigo Importante';
  env.getEl('output-prompt-roteiro').value = 'HOOK (0-15s): Texto longo de roteiro gerado com mais de 100 caracteres para simular trabalho ativo na tela...';

  env.runProcessarURL();

  assert(env.getConfirmChamado() === true, 'window.confirm() foi disparado devido a trabalho gerado na tela.');
  assert(
    env.getEl('input-tema-custom').value === 'Tema Antigo Importante',
    'Após recusa do confirm(), o tema antigo foi rigorosamente preservado.'
  );
}

// --------------------------------------------------------------------------
// TESTE (e): ?titulo= não preenche "Ideia Escolhida" quando já tem texto
// --------------------------------------------------------------------------
console.log('\n📋 CASO E: Preservação de "Ideia de Vídeo Escolhida" existente');
{
  const env = criarAmbienteTeste({
    urlSearch: '?tema=Julgamentos%20Divinos&titulo=Every%20Sudden%20Judgment%20of%20God'
  });

  // Usuário já havia digitado uma ideia escolhida
  env.getEl('input-ideia-escolhida').value = 'Minha Ideia Escolhida Personalizada';

  env.runProcessarURL();

  assert(
    env.getEl('input-ideia-escolhida').value === 'Minha Ideia Escolhida Personalizada',
    'Ideia de Vídeo Escolhida preexistente NÃO foi sobrescrita pelo título da URL.'
  );
  assert(
    env.mockWindow._radarTitulo === 'Every Sudden Judgment of God',
    'Título foi armazenado em window._radarTitulo como referência para SEO.'
  );
  assert(
    env.getEl('texto-titulo-radar').textContent === 'Every Sudden Judgment of God',
    'Caixa de Título de Referência do Radar na Etapa 1 foi preenchida.'
  );
}

// --------------------------------------------------------------------------
// TESTE (f): Tags HTML nos parâmetros são devidamente sanitizadas
// --------------------------------------------------------------------------
console.log('\n📋 CASO F: Sanitização estrita contra injeção de HTML e limites');
{
  const env = criarAmbienteTeste({
    urlSearch: '?tema=%3Cscript%3Ealert(1)%3C/script%3E%3Cb%3EJulgamentos%20B%C3%ADblicos%3C/b%3E&titulo=%3Cimg%20src=x%20onerror=alert(2)%3ETitulo%20Seguro'
  });

  env.runProcessarURL();

  assert(
    !env.getEl('input-tema-custom').value.includes('<') && !env.getEl('input-tema-custom').value.includes('>'),
    'Tags HTML (<script>, <b>) foram completamente eliminadas do tema.'
  );
  assert(
    env.getEl('input-tema-custom').value.includes('Julgamentos Bíblicos'),
    'Texto legítimo "Julgamentos Bíblicos" foi preservado após sanitização.'
  );
  assert(
    !env.mockWindow._radarTitulo.includes('<') && env.mockWindow._radarTitulo.includes('Titulo Seguro'),
    'Tags HTML (<img onerror>) foram eliminadas do título de referência.'
  );
}

console.log('\n======================================================');
console.log(`🎉 RESULTADO: ${casosPassados}/${totalCasos} casos passaram com 100% de sucesso!`);
console.log('======================================================\n');
