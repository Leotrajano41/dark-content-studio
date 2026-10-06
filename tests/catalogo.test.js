// tests/catalogo.test.js
// Testes Automatizados para o Estilo "Catálogo em N itens (14-17 min)" e Exceções de Filtros
// Executável sem chamadas externas à API (100% autônomo com stubs de auditoria).

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

// 1. Carrega e prepara o ambiente sandbox a partir do index.html
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  throw new Error('Não foi possível extrair a tag <script> de index.html');
}

// Sandbox com simulação mínima de DOM e armazenamento
let apiCallCount = 0;
let lastApiPrompt = '';

const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    children: [],
    parentNode: null,
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
    addEventListener() {},
    dispatchEvent() {},
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
    click() {}
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
  querySelectorAll() { return []; },
  body: createMockElement('body', 'body')
};

const localStorageData = {};
const mockLocalStorage = {
  getItem(k) { return localStorageData[k] || null; },
  setItem(k, v) { localStorageData[k] = String(v); },
  removeItem(k) { delete localStorageData[k]; },
  clear() { for (const k in localStorageData) delete localStorageData[k]; }
};

const mockWindow = {
  location: { href: 'http://localhost:3000', search: '' },
  confirm: () => true,
  addEventListener: () => {}
};

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  document: mockDocument,
  window: mockWindow,
  localStorage: mockLocalStorage,
  fetch: async (url, opts) => {
    // Mock local da rota /api/validar-biblia
    if (url.includes('/api/validar-biblia')) {
      const bibliaHandler = require(path.join(__dirname, '..', 'api', 'validar-biblia.js'));
      const body = JSON.parse(opts.body || '{}');
      const res = bibliaHandler.validarRoteiroBiblico(body.texto || '', body.idioma || 'pt');
      return {
        ok: true,
        json: async () => ({ sucesso: true, ...res })
      };
    }
    return { ok: true, json: async () => ({}) };
  },
  Event: class { constructor(type) { this.type = type; } },
  URLSearchParams: URLSearchParams
};
sandbox.window.document = mockDocument;
sandbox.window.localStorage = mockLocalStorage;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

const openRouterTarget = context.window.OpenRouterAPI || context.OpenRouterAPI;

// Substitui OpenRouterAPI.generateContent por STUB auditor
if (openRouterTarget) {
  openRouterTarget.generateContent = async (prompt, modelo, systemPrompt) => {
    apiCallCount++;
    lastApiPrompt = prompt;
    return 'Texto reescrito pela IA';
  };
}

console.log('\n======================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES DO ESTILO CATÁLOGO');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// TESTE 1: Fabricação de Roteiro de Catálogo com todos os elementos exigidos
// --------------------------------------------------------------------------
console.log('📋 GRUPO 1: Pós-processamento do Catálogo (Sobrevivência dos moldes)');

// Monta roteiro fabricado de 9 itens com ~1950 palavras
const abertura = 'O destino de cada rei rebelde na Bíblia explicado em poucos minutos. Um, Acabe de Samaria. O monarca que desafiou a palavra dos profetas do Altíssimo. Isso está em 1 Reis 22:34. Uma flecha disparada ao acaso penetrou na couraça do rei no meio da batalha de Ramote-Gileade. Não é lenda humana, é cumprimento rigoroso da profecia de Elias. Ele sangrou até o entardecer e a batalha cessou. A palavra do Senhor permanece viva e eficaz.';

const item2 = 'Dois, Jezabel de Tiro. A rainha que perseguiu os justos e estabeleceu altares pagãos em Israel. Isso está em 2 Reis 9:33. Jeú ordenou que ela fosse lançada da janela do palácio real em Jezreel. Não é ficção mitológica, é justiça histórica documentada com solenidade. Seu fim trágico serviu de testemunho a todas as tribos da terra. A fidelidade do Senhor prevaleceu sobre todo império rebelde.';

const ctaMeio = 'Se este estudo histórico edifica sua fé, inscreva-se no canal para que o YouTube recomende mais conteúdos como este para você. Vamos em frente.';

const item3 = 'Três, Senaqueribe da Assíria. O imperador arrogante que cercou Jerusalém com dezenas de milhares de soldados. Isso está em 2 Reis 19:35. O anjo do Senhor feriu o acampamento assírio em uma única noite sem disparo de flechas pelos hebreus. Segundo a tradição registrada por Eusébio e pelos cronistas antigos, a peste dizimou o exército estrangeiro. Ele regressou humilhado para Nínive onde foi morto por seus próprios filhos. A soberania de Deus humilhou o tirano.';

const item4 = 'Quatro, Belsazar da Babilônia. O governante que utilizou os vasos sagrados do templo em um banquete profano. Isso está em Daniel 5:25. Uma mão misteriosa escreveu palavras de julgamento na parede do palácio na presença dos nobres. Vale um registro honesto aqui: fontes históricas e registros babilônicos debatem a linhagem exata da corregência, mas a Escritura preserva a realidade do juízo repentino. Naquela mesma noite a Babilônia caiu diante dos medos e persas. O reino foi dividido e entregue aos conquistadores.';

const item5 = 'Cinco, Herodes Agripa. O rei que perseguiu os apóstolos em Jerusalém e aceitou a aclamação de divindade. Isso está em Atos 12:23. No momento em que recebia a adoração da multidão, um anjo o feriu com enfermidade mortal. A Bíblia não diz detalhes anatômicos da aflição, mas relata que ele foi comido de vermes e expirou solenemente diante de seu povo. A glória pertence unicamente ao Criador. O relato sagrado permaneceu como aviso perene.';

const item6 = 'Seis, Faraó do Êxodo. O monarca egípcio que endureceu o coração contra a ordem divina de libertação. Isso está em Êxodo 14:28. As águas do Mar Vermelho retornaram sobre as carruagens e cavaleiros que perseguiam os filhos de Israel. A Bíblia não diz o nome pessoal do soberano, mas testifica o naufrágio completo de seu exército nas profundezas. Nenhum dos opressores sobreviveu à fúria das águas. A salvação de Israel foi consumada com poder eterno.';

const item7 = 'Sete, Saul de Benjamim. O primeiro rei de Israel que consultou a médium em En-Dor em desobediência flagrante. Isso está em 1 Samuel 31:4. Ferido gravemente pelos arqueiros filisteus no monte Gilboa, ele caiu sobre sua própria espada para não ser humilhado pelos incircuncisos. Não foi acaso fortuito, foi o declínio de um líder que abandonou o mandamento sagrado. Sua dinastia findou ali. A soberania divina levantou Davi segundo o Seu coração.';

const item8 = 'Oito, Tobias e os registros do cativeiro. Um relato preservado que acompanha a fidelidade familiar na dispersão. Isso está em Tobias 1:3. O texto documenta as provações e a misericórdia concedida na terra estrangeira com fidelidade. O desfecho demonstrou a proteção sobre os fiéis. A esperança permaneceu viva entre os cativos.';

const item9 = 'Nove, Antíoco Epifânio. O tirano selêucida que profanou o altar sagrado e perseguiu o povo da aliança. Isso está em 1 Macabeus 1:54. Ele sofreu enfermidade incurável nas entranhas após a derrota de suas tropas no oriente. Seu império desmoronou em meio à revolta dos justos. O triunfo final pertenceu ao Senhor.';

// Preenche parágrafos de contextualização para totalizar exatamente ~1.950 palavras
let paragrafosExtras = [];
for (let p = 0; p < 20; p++) {
  paragrafosExtras.push(`As Escrituras Sagradas registram com riqueza inestimável e solenidade histórica os passos de cada figura bíblica através das gerações antigas. Cada governante, profeta e guerreiro enfrentou as consequências imediatas de suas ações perante o trono da justiça divina. Os relatos hebraicos e os textos canônicos preservam a solenidade de cada julgamento e de cada libertação com exatidão perene, demonstrando que nenhum poder terreno prevalece contra os decretos do Criador soberano. As profecias pronunciadas pelos mensageiros encontraram cumprimento infalível ao longo da trajetória dos povos e impérios do Oriente Próximo.`);
}

const conclusao = 'Cada um destes relatos bíblicos demonstra com clareza infalível que a soberania divina governa o destino das nações e de todos os soberanos terrenos. A história bíblica não é uma coleção de mitos, é a crônica da fidelidade de Deus através dos séculos. Qual destes fins históricos mais chamou a sua atenção? Compartilhe sua opinião nos comentários abaixo.';

const roteiroFabricado = [
  abertura,
  item2,
  ctaMeio,
  item3,
  item4,
  item5,
  item6,
  item7,
  item8,
  item9,
  ...paragrafosExtras,
  conclusao
].join('\n\n');

const estiloCatalogo = 'Catálogo em N itens (14-17 min)';
const estiloLongo = 'YouTube Longo (18-20 minutos)';

const getFn = (name) => context.window[name] || context[name];

async function executarTestes() {
  // Executa pós-processamento completo no estilo Catálogo
  apiCallCount = 0;
  let roteiroCatalogoProcessado = roteiroFabricado;

  // 1. Validação Bíblica (com Tobias e Macabeus deuterocanônicos)
  const validarBiblia = getFn('validarRoteiroComBiblia');
  if (typeof validarBiblia === 'function') {
    roteiroCatalogoProcessado = await validarBiblia(roteiroCatalogoProcessado, 'pt');
  }

  // 2. Validador de Tom Afirmativo (com stub e exceção para Eusébio)
  const validarTom = getFn('validarERegenerarTomAfirmativo');
  if (typeof validarTom === 'function') {
    const resTom = await validarTom(roteiroCatalogoProcessado, 'pt', 'modelo-test', estiloCatalogo);
    roteiroCatalogoProcessado = resTom.texto;
  }

  // 3. Limpeza de narração
  const limparNarracao = getFn('limparTextoParaNarracao');
  roteiroCatalogoProcessado = limparNarracao(roteiroCatalogoProcessado, estiloCatalogo);

  // 4. Garantir CTA
  const garantirCta = getFn('garantirCtaNoUltimoParagrafo');
  roteiroCatalogoProcessado = garantirCta(roteiroCatalogoProcessado, 'pt', estiloCatalogo);

  // 5. Limitar Frases Históricas
  const limitarFrases = getFn('limitarFrasesHistoricas');
  roteiroCatalogoProcessado = limitarFrases(roteiroCatalogoProcessado, estiloCatalogo);

  // 6. Limitar Silêncio Bíblico (permite até 3 no Catálogo)
  const limitarSilencio = getFn('limitarDeclaracoesDeSilencioBiblico');
  roteiroCatalogoProcessado = limitarSilencio(roteiroCatalogoProcessado, estiloCatalogo);

  // 7. Dedup por similaridade
  const removerDedup = getFn('removerParagrafosDuplicadosPorSimilaridade');
  roteiroCatalogoProcessado = removerDedup(roteiroCatalogoProcessado, 0.6, estiloCatalogo);

  // Validações de sobrevivência no Catálogo:
  assert(roteiroCatalogoProcessado.includes('Se este estudo histórico edifica sua fé') || /vamos em frente/i.test(roteiroCatalogoProcessado),
    'Pedido de inscrição entre Item 2 e Item 3 SOBREVIVEU intacto no Catálogo.');

  assert(/segundo a tradição/i.test(roteiroCatalogoProcessado) && /Eusébio/i.test(roteiroCatalogoProcessado),
    '"segundo a tradição" com "Eusébio" SOBREVIVEU sem reescrita de ceticismo.');

  assert(/vale um registro honesto aqui/i.test(roteiroCatalogoProcessado),
    'Nota de honestidade sobre fontes ("vale um registro honesto aqui") SOBREVIVEU intacta.');

  const contagemSilencio = (roteiroCatalogoProcessado.match(/A Bíblia não diz/gi) || []).length;
  assert(contagemSilencio === 2,
    `Duas ocorrências de "a Bíblia não diz" SOBREVIVERAM (encontradas: ${contagemSilencio}/2).`);

  assert(/Um,/i.test(roteiroCatalogoProcessado) && /Dois,/i.test(roteiroCatalogoProcessado) && /Três,/i.test(roteiroCatalogoProcessado),
    'Marcadores falados "Um,", "Dois,", "Três," SOBREVIVERAM intactos.');

  assert(roteiroCatalogoProcessado.includes('Tobias 1:3'),
    'Referência a Tobias (livro deuterocanônico) SOBREVIVEU no texto.');

  assert(apiCallCount === 0,
    `Stub de API NÃO foi acionado desnecessariamente para reescrever trechos de tradição no Catálogo (chamadas = ${apiCallCount}).`);

  // --------------------------------------------------------------------------
  // TESTE 2: O mesmo roteiro no estilo "YouTube Longo" (comportamento antigo)
  // --------------------------------------------------------------------------
  console.log('\n📋 GRUPO 2: Regressão no estilo YouTube Longo (comportamento estrito mantido)');

  let roteiroLongoProcessado = roteiroFabricado;
  roteiroLongoProcessado = limparNarracao(roteiroLongoProcessado, estiloLongo);
  roteiroLongoProcessado = garantirCta(roteiroLongoProcessado, 'pt', estiloLongo);
  roteiroLongoProcessado = limitarSilencio(roteiroLongoProcessado, estiloLongo);

  assert(!/Vamos em frente/i.test(roteiroLongoProcessado) && !/Se este estudo histórico/i.test(roteiroLongoProcessado),
    'No YouTube Longo, o CTA do miolo foi DEVIDAMENTE REMOVIDO como esperado.');

  const contagemSilencioLongo = (roteiroLongoProcessado.match(/A Bíblia não diz/gi) || []).length;
  assert(contagemSilencioLongo === 1,
    `No YouTube Longo, silêncio bíblico repetido foi reduzido para estritamente 1 ocorrência (${contagemSilencioLongo}/1).`);

  // --------------------------------------------------------------------------
  // TESTE 3: Validador de Estrutura do Catálogo (9 Regras) & Reprodução de Defeitos (a)-(f)
  // --------------------------------------------------------------------------
  console.log('\n📋 GRUPO 3: Validador de Estrutura do Catálogo (10 Regras)');

  const validarCatalogo = getFn('validarEstruturaCatalogo');

  // Teste 3.1: Roteiro perfeito deve passar 10/10
  const validacaoCompleta = validarCatalogo(roteiroCatalogoProcessado, 9);
  assert(validacaoCompleta.valido === true && validacaoCompleta.totalOk === 10,
    `Roteiro completo do Catálogo passou em 10/10 regras do validador (total: ${validacaoCompleta.totalOk}/10).`);

  // Defeito (a): Itens 1 e 2 sem título e sem número falado, colados
  const defeitoA = roteiroCatalogoProcessado
    .replace('Um, Acabe de Samaria. O monarca que desafiou', 'Acabe de Samaria desafiou')
    .replace('Dois, Jezabel de Tiro. A rainha que perseguiu', 'Jezabel de Tiro foi a rainha que perseguiu');
  const vDefeitoA = validarCatalogo(defeitoA, 9);
  assert(vDefeitoA.regras.find(r => r.id === 'r1_abertura').ok === false || vDefeitoA.regras.find(r => r.id === 'r2_qtd_itens').ok === false || vDefeitoA.regras.find(r => r.id === 'r7_sequencia_itens').ok === false,
    'Defeito (a): Validador detecta FALHA quando itens 1 e 2 estão sem número falado ou colados.');

  // Defeito (b): Um item (Uzá) duplicado no texto
  const defeitoB = roteiroCatalogoProcessado.replace('Oito, Tobias', 'Oito, Jezabel de Tiro');
  const vDefeitoB = validarCatalogo(defeitoB, 9);
  assert(vDefeitoB.regras.find(r => r.id === 'r7_sequencia_itens').ok === false || vDefeitoB.regras.find(r => r.id === 'r2_qtd_itens').ok === false,
    'Defeito (b): Validador detecta FALHA quando há repetição ou duplicação de item.');

  // Defeito (c): Vazamento de rótulos entre colchetes e contagem de palavras
  const defeitoC = '[ABERTURA – MÁXIMO 30 PALAVRAS]\n' + roteiroCatalogoProcessado + '\n**Contagem total de palavras: 1950 palavras**';
  const vDefeitoC = validarCatalogo(defeitoC, 9);
  assert(vDefeitoC.regras.find(r => r.id === 'r8_sem_rotulos').ok === false,
    'Defeito (c): Validador detecta FALHA na presença de rótulos [ ] e linhas de contagem.');

  // Defeito (d): Item extra além de N (ex: "Nove, o padrão dos julgamentos" com N = 8)
  const roteiroCom8Itens = roteiroCatalogoProcessado; // Contém 9 itens
  const vDefeitoD = validarCatalogo(roteiroCom8Itens, 8); // Avaliado com N = 8
  assert(vDefeitoD.regras.find(r => r.id === 'r7_sequencia_itens').ok === false || vDefeitoD.regras.find(r => r.id === 'r2_qtd_itens').ok === false,
    'Defeito (d): Validador detecta FALHA quando aparece item extra além de N=8.');

  // Defeito (e): Excesso de versículos literais (> 35% das palavras em citações)
  const citacaoGigante = '"' + 'palavra sagrada '.repeat(800) + '"';
  const defeitoE = roteiroCatalogoProcessado + '\n\n' + citacaoGigante;
  const vDefeitoE = validarCatalogo(defeitoE, 9);
  assert(vDefeitoE.regras.find(r => r.id === 'r9_limite_citacoes').ok === false,
    'Defeito (e): Validador detecta FALHA quando citações bíblicas ultrapassam 35% do total.');

  // Defeito (f): Sem pergunta aos comentários no fecho
  const defeitoF = roteiroCatalogoProcessado.replace(/\?.*?$/s, '. Assim encerramos esta análise bíblica.');
  const vDefeitoF = validarCatalogo(defeitoF, 9);
  assert(vDefeitoF.regras.find(r => r.id === 'r5_pergunta_comentarios').ok === false,
    'Defeito (f): Validador detecta FALHA quando a pergunta aos comentários está ausente.');

  // Teste 3.8: Falha Regra 3 (Falta CTA entre Item 2 e Item 3)
  const textoSemCtaMeio = roteiroCatalogoProcessado.replace(/Se este estudo[\s\S]*?Vamos em frente\./i, '');
  const vFalha3 = validarCatalogo(textoSemCtaMeio, 9);
  assert(vFalha3.regras.find(r => r.id === 'r3_cta_meio').ok === false,
    'Validador detecta corretamente FALHA na Regra 3 (falta CTA após Item 2).');

  // Teste 3.9: Falha Regra 4 (Extensão fora de 1.800 - 2.600 palavras)
  const textoCurto = 'Um, item 1. Dois, item 2. Três, item 3.';
  const vFalha4 = validarCatalogo(textoCurto, 3);
  assert(vFalha4.regras.find(r => r.id === 'r4_extensao').ok === false,
    'Validador detecta corretamente FALHA na Regra 4 (extensão insuficiente).');

  // Teste 3.10: Falha Regra 6 (Menos de 3 "não é ... é ...")
  const textoSemContraste = roteiroCatalogoProcessado.replace(/Não é [^,]+, é/gi, 'Isto é');
  const vFalha6 = validarCatalogo(textoSemContraste, 9);
  assert(vFalha6.regras.find(r => r.id === 'r6_contraste').ok === false,
    'Validador detecta corretamente FALHA na Regra 6 (menos de 3 contrastes "não é X, é Y").');

  // Teste 3.11: Reconhecimento de formatos mistos com Markdown ("Um, Nadabe e Abiú." e "**Dois, Corá**")
  const roteiroComMarkdown = roteiroCatalogoProcessado
    .replace('Um, Acabe de Samaria', 'Um, Nadabe e Abiú.')
    .replace('Dois, Jezabel de Tiro', '**Dois, Corá**')
    .replace('Três, Senaqueribe da Assíria', '**Três**, Uzá e a arca.');
  const vMarkdown = validarCatalogo(roteiroComMarkdown, 9);
  assert(vMarkdown.regras.find(r => r.id === 'r1_abertura').ok === true && vMarkdown.regras.find(r => r.id === 'r2_qtd_itens').ok === true,
    'Validador reconhece com precisão formatos como "Um, Nadabe e Abiú." e "**Dois, Corá**".');

  // Teste 3.12: (NOVO - Regra 10) Falha quando há atribuição de intenção não sustentada
  const defeitoIntencao = roteiroCatalogoProcessado.replace(
    'Um, Acabe de Samaria.',
    'Um, Acabe de Samaria. Ele conhecia a lei e cometeu desobediência deliberada com pleno conhecimento.'
  );
  const vDefeito10 = validarCatalogo(defeitoIntencao, 9);
  assert(vDefeito10.regras.find(r => r.id === 'r10_sem_intencao_nao_sustentada').ok === false,
    'Regra 10: Validador detecta FALHA na presença de expressões de intenção ("conhecia a lei", "deliberada", "pleno conhecimento").');

  // --------------------------------------------------------------------------
  // TESTE 3.2: Fluxo Completo de gerarRoteiroCatalogo com Stub de Auto-Regeneração
  // --------------------------------------------------------------------------
  console.log('\n📋 GRUPO 3.2: Fluxo do Catálogo com Auto-Regeneração');

  const gerarCatalogoFn = getFn('gerarRoteiroCatalogo');
  if (typeof gerarCatalogoFn === 'function') {
    let chamadasCatalogo = 0;
    let promptsRecebidos = [];

    // Configura stub do OpenRouterAPI para simular 1ª resposta com falha na regra 10 e regra 1, e 2ª corrigida
    openRouterTarget.generateContent = async (prompt) => {
      chamadasCatalogo++;
      promptsRecebidos.push(prompt);

      if (chamadasCatalogo === 1) {
        // 1ª chamada: devolve roteiro com defeitos de intenção e abertura
        return 'E saiu fogo de diante do Senhor consumindo os altares profanos. Dois, Corá e seus seguidores cometeram desobediência deliberada pois sabiam exatamente o que era permitido. Não é lenda, é fato sagrado. Se este estudo edifica sua fé, inscreva-se no canal para que o YouTube recomende mais vídeos como este para você. Vamos em frente. Três, Uzá e a arca.';
      } else {
        // 2ª chamada (auto-regeneração corretiva): devolve o roteiro corrigido sem expressões proibidas
        return roteiroCatalogoProcessado;
      }
    };

    const resultadoFinal = await gerarCatalogoFn({
      ideia: 'Cada julgamento súbito de Deus na Bíblia',
      estiloRoteiro: 'Catálogo em N itens (14-17 min)',
      tomVoz: 'Solene',
      tipoGancho: 'Citação',
      idioma: 'Português (Brasil)',
      numItens: 9,
      modelo: 'anthropic/claude-sonnet-4.5',
      onProgress: () => {}
    });

    assert(chamadasCatalogo === 2, 'Geração de Catálogo acionou auto-regeneração única (2 chamadas no total).');
    assert(promptsRecebidos[1].includes('FAILED RULES:') && promptsRecebidos[1].includes('Sem atribuição de intenção não sustentada'),
      'Prompt de auto-regeneração detalhou explicitamente a falha na Regra 10 (Sem atribuição de intenção).');

    const validacaoFinalAuto = validarCatalogo(resultadoFinal, 9);
    assert(validacaoFinalAuto.valido === true && validacaoFinalAuto.totalOk === 10,
      'Roteiro final após auto-regeneração obteve 10/10 regras cumpridas no validador.');
  }

  // --------------------------------------------------------------------------
  // TESTE 3.3: Sincronização e Limpeza Imediata de "Versão Narração Limpa"
  // --------------------------------------------------------------------------
  console.log('\n📋 GRUPO 3.3: Sincronização e Limpeza de Narração Limpa');
  const syncFn = getFn('sincronizarRoteiroGeradoEmTodasAsCaixas');
  const limparEtapasFn = getFn('limparResultadosEtapasPosteriores');

  if (typeof syncFn === 'function') {
    syncFn(roteiroCatalogoProcessado, 'Catálogo em N itens (14-17 min)');
    const outLimpo = context.document.getElementById('output-roteiro-limpo');
    const outNarracao = context.document.getElementById('textarea-narracao-limpa-audio');
    assert(outLimpo && outLimpo.value.includes('Um, Acabe de Samaria'),
      'Versão Narração Limpa foi atualizada imediatamente com o novo roteiro gerado.');
    assert(outNarracao && outNarracao.value.includes('Um, Acabe de Samaria'),
      'Caixa de Narração de Áudio da Etapa 5 foi sincronizada com o novo roteiro.');

    if (typeof limparEtapasFn === 'function') {
      limparEtapasFn();
      assert(outLimpo.value === '' && outNarracao.value === '',
        'Caixas de narração limpa são devidamente limpas antes de uma nova geração.');
    }
  }

  console.log('\n📋 GRUPO 4: Leitura e Sanitização de Parâmetros de URL (?tema= e ?titulo=)');

  // Simula URL com tags HTML maliciosas e mais de 300 caracteres
  const temaLongoComHtml = '<script>alert("hack")</script><b>Os 9 Reis Mais Cruéis da Bíblia</b> ' + 'x'.repeat(400);
  context.window.location.search = `?tema=${encodeURIComponent(temaLongoComHtml)}&titulo=${encodeURIComponent('The Tragic End of Kings')}`;

  // Chama processarParametrosURL
  const procUrl = getFn('processarParametrosURL');
  procUrl();

  const inputTemaCustomVal = mockDocument.getElementById('input-tema-custom').value;
  assert(!inputTemaCustomVal.includes('<script>') && !inputTemaCustomVal.includes('<b>'),
    'Parâmetro ?tema= foi devidamente sanitizado de tags HTML.');

  assert(inputTemaCustomVal.length <= 300,
    `Parâmetro ?tema= foi limitado a no máximo 300 caracteres (${inputTemaCustomVal.length} chars).`);

  assert(context.window._radarTitulo === 'The Tragic End of Kings',
    'Parâmetro ?titulo= foi armazenado em window._radarTitulo para uso no SEO e Títulos.');

  assert(mockDocument.getElementById('select-tema').value === 'Personalizável',
    'Select de Tema foi alterado para "Personalizável" automaticamente sem disparar IA.');

  // --------------------------------------------------------------------------
  // RESULTADO FINAL
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`🎉 RESULTADO: ${casosPassados}/${totalCasos} casos passaram com 100% de sucesso!`);
  console.log('======================================================\n');
}

executarTestes().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Erro na execução da suíte de testes:', err);
  process.exit(1);
});
