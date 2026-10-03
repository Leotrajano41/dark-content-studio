// tests/checklist-roteiro.js
// Checklist Automático Permanente de Geração de Roteiro (Dark Studio Pro)
// Gera 1 Shorts e 1 Longo em português pelo fluxo completo da aplicação e valida 100% dos requisitos.
// Suporta execução local ou contra o ambiente de produção (--prod).

const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const isProd = process.argv.includes('--prod');
const customUrlArg = process.argv.find(a => a.startsWith('--url='));
const targetBaseUrl = customUrlArg ? customUrlArg.split('=')[1] : 'https://dark-content-studio.vercel.app';

// 1. Carrega variáveis de ambiente de .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const mOpenRouter = envContent.match(/OPENROUTER_API_KEY=["']?([^"'\r\n]+)/);
  const mOpenAI = envContent.match(/OPENAI_API_KEY=["']?([^"'\r\n]+)/);
  if (mOpenRouter && mOpenRouter[1]) {
    apiKey = mOpenRouter[1].replace(/\\n/g, '').trim();
  } else if (!apiKey && mOpenAI && mOpenAI[1]) {
    apiKey = mOpenAI[1].replace(/\\n/g, '').trim();
  }
}

if (!apiKey) {
  console.error('ERRO: Nenhuma chave de API encontrada em .env.local ou variáveis de ambiente.');
  process.exit(1);
}

// Helpers de rede para obter HTML ou chamar APIs em produção
function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHttp(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postJsonHttp(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ textoCorrigido: payload.texto, alteracoes: [] });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      resolve({ textoCorrigido: payload.texto, alteracoes: [] });
    });
    req.write(data);
    req.end();
  });
}

// Adaptador de chamadas de IA para execução estável (OpenRouter ou OpenAI)
const isOpenRouterKey = apiKey.startsWith('sk-or-');

async function callChatCompletion(messages, model = 'gpt-4o-mini') {
  return new Promise((resolve, reject) => {
    const payload = {
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    };

    let host = 'api.openai.com';
    let reqPath = '/v1/chat/completions';

    if (isOpenRouterKey) {
      host = 'openrouter.ai';
      reqPath = '/api/v1/chat/completions';
      payload.model = model.includes('/') ? model : 'openai/gpt-4o-mini';
    } else {
      payload.model = 'gpt-4o-mini';
    }

    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(data)
    };

    if (isOpenRouterKey) {
      headers['HTTP-Referer'] = targetBaseUrl;
      headers['X-Title'] = 'Dark Studio Pro Tests';
    }

    const req = https.request({
      hostname: host,
      path: reqPath,
      method: 'POST',
      headers: headers,
      timeout: 90000
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          if (!parsed.choices || !parsed.choices[0] || !parsed.choices[0].message) {
            return reject(new Error('Resposta inválida da API: ' + body.slice(0, 200)));
          }
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de requisição com a API de IA'));
    });
    req.write(data);
    req.end();
  });
}

// Funções de checagem do checklist
function contarPalavras(str) {
  if (!str) return 0;
  return (str.trim().match(/\S+/g) || []).length;
}

function contarFrasesDescarte(texto) {
  if (!texto) return 0;
  const regexDescarte = /\b(?:(?:isso|este|esse|o)\s*(?:evento|acontecimento|relato|fato|dil[uú]vio)?\s+)?n[aã]o\s+(?:foi|era|é|se\s+trata\s+de)\s+(?:(?:um[a]?|mer[ao]|apenas|somente)\s+)*(?:hist[oó]ria|evento(?:\s+simb[oó]lico)?|par[aá]bola|conto(?:s)?(?:\s+de\s+fadas)?|s[ií]mbolo|simb[oó]lico|mito|lenda|f[aá]bula|folclore|alegoria|fic[cç][aã]o)/gi;
  const matches = texto.match(regexDescarte);
  return matches ? matches.length : 0;
}

function checarReferenciasParenteses(texto) {
  if (!texto) return [];
  const regexParenRef = /\(\s*(?:[1-3]\s+|[1-3]ª\s+|[1-3]º\s+)?[A-Za-zÀ-ÖØ-öø-ÿ.]+\s+\d+(?:[:\.]\d+(?:[,\s\-–—]+\d+)*)?\s*\)/g;
  return texto.match(regexParenRef) || [];
}

function checarPalavrasIngles(texto) {
  if (!texto) return [];
  const enTokens = [
    'the', 'and', 'of', 'in', 'with', 'for', 'this', 'that', 'from', 'they', 'were',
    'which', 'their', 'when', 'into', 'there', 'about', 'after', 'before', 'between',
    'hook', 'section', 'scene', 'narrator', 'voiceover', 'script', 'conclusion'
  ];
  const regex = new RegExp(`\\b(${enTokens.join('|')})\\b`, 'gi');
  const matches = texto.match(regex) || [];
  return Array.from(new Set(matches.map(m => m.toLowerCase())));
}

function checarPontuacaoAspas(texto) {
  const erros = [];
  if (/\."/.test(texto)) {
    erros.push('Contém sequência de ponto antes de aspas: `."`');
  }
  if (/(["”'])\1+/.test(texto)) {
    erros.push('Contém aspas duplicadas consecutivas');
  }
  return erros;
}

function checarCtaFixo(texto, tipo) {
  const ctaShorts = 'Inscreva-se no canal para mais estudos e relatos bíblicos sagrados.';
  const ctaLongo = 'Para continuar desvendando a profundidade histórica e a verdade das Escrituras Sagradas, inscreva-se no canal e acompanhe nossos próximos estudos.';
  const alvo = tipo === 'Shorts' ? ctaShorts : ctaLongo;
  return texto.includes(alvo);
}

async function main() {
  console.log('===============================================================');
  console.log(`   RODADA FINAL — CHECKLIST AUTOMÁTICO PERMANENTE DO ROTEIRO   `);
  console.log(`   Ambiente: ${isProd ? `PRODUÇÃO (${targetBaseUrl})` : 'LOCAL (index.html)'}`);
  console.log('===============================================================\n');

  // 2. Obtém o HTML (local ou de produção)
  let htmlContent = '';
  if (isProd) {
    console.log(`Buscando HTML de produção em ${targetBaseUrl}...`);
    htmlContent = await fetchHttp(targetBaseUrl);
  } else {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  }

  const scriptMatch = htmlContent.match(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    throw new Error('Script principal não encontrado no HTML');
  }

  // Configura sandbox completo com mocks de navegador para o script do index.html
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Buffer,
    URL,
    process,
    require,
    localStorage: {
      getItem: (k) => {
        if (k === 'dark_studio_openrouter_api_key') return apiKey;
        return null;
      },
      setItem: () => {},
      removeItem: () => {}
    },
    document: {
      addEventListener: (event, handler) => {
        if (event === 'DOMContentLoaded' && typeof handler === 'function') {
          try {
            handler();
          } catch (e) {
            console.warn('[Mock Document] Aviso ao inicializar DOMContentLoaded:', e.message);
          }
        }
      },
      getElementById: (id) => {
        return {
          id,
          value: '',
          dataset: {},
          classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
          },
          innerHTML: '',
          textContent: '',
          addEventListener: () => {},
          options: []
        };
      },
      querySelectorAll: () => []
    }
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;

  const context = vm.createContext(sandbox);
  try {
    vm.runInContext(scriptMatch[1], context);
  } catch (eLoad) {
    console.error('ERRO AO CARREGAR SCRIPT DO HTML:', eLoad);
  }

  console.log('Status dos módulos carregados:');
  console.log('- PromptEngine:', typeof context.PromptEngine);
  console.log('- limparTextoParaNarracao:', typeof context.limparTextoParaNarracao);
  console.log('- limitarFrasesHistoricas:', typeof context.limitarFrasesHistoricas);
  console.log('- ajustarExtensaoRoteiro:', typeof context.ajustarExtensaoRoteiro);
  console.log('- garantirExtensaoShorts:', typeof context.garantirExtensaoShorts);
  console.log('- gerarRoteiroEmSeteSecoes:', typeof context.gerarRoteiroEmSeteSecoes);

  const PromptEngine = context.PromptEngine;
  const OpenRouterAPI = context.OpenRouterAPI;
  const limparTextoParaNarracao = context.limparTextoParaNarracao;
  const limitarFrasesHistoricas = context.limitarFrasesHistoricas;
  const garantirCtaNoUltimoParagrafo = context.garantirCtaNoUltimoParagrafo;
  const ajustarExtensaoRoteiro = context.ajustarExtensaoRoteiro;
  const garantirExtensaoShorts = context.garantirExtensaoShorts;
  const validarECorrigirAspas = context.validarECorrigirAspas;
  const limparPontuacaoDuplicada = context.limparPontuacaoDuplicada;
  const gerarRoteiroEmSeteSecoes = context.gerarRoteiroEmSeteSecoes;
  const SCRIPT_SYSTEM_PROMPT = context.SCRIPT_SYSTEM_PROMPT;

  // 3. Conecta a função de validação bíblica (local ou API de produção)
  let fnValidarBiblia;
  let fnValidarBibliaObj;
  if (isProd) {
    fnValidarBibliaObj = async function(texto, idioma = 'pt') {
      return await postJsonHttp(`${targetBaseUrl}/api/validar-biblia`, { texto, idioma });
    };
    fnValidarBiblia = async function(texto, idioma = 'pt') {
      const res = await fnValidarBibliaObj(texto, idioma);
      return res.textoCorrigido || texto;
    };
  } else {
    const { validarRoteiroBiblico } = require('../api/validar-biblia.js');
    fnValidarBibliaObj = async function(texto, idioma = 'pt') {
      return validarRoteiroBiblico(texto, idioma);
    };
    fnValidarBiblia = async function(texto, idioma = 'pt') {
      const res = validarRoteiroBiblico(texto, idioma);
      return res.textoCorrigido || texto;
    };
  }
  context.validarRoteiroComBiblia = fnValidarBiblia;
  global.validarRoteiroComBiblia = fnValidarBiblia;

  const fnGenerateContent = async function(promptText, specificModel, customSystemPrompt) {
    return await callChatCompletion([
      { role: 'system', content: customSystemPrompt || SCRIPT_SYSTEM_PROMPT },
      { role: 'user', content: promptText }
    ], specificModel);
  };
  OpenRouterAPI.generateContent = fnGenerateContent;
  context.OpenRouterAPI.generateContent = fnGenerateContent;

  // --------------------------------------------------------------------------
  // FLUXO COMPLETO 1: GERAÇÃO DE SHORTS EM PORTUGUÊS
  // --------------------------------------------------------------------------
  console.log('\n▶ [1/3] Gerando Shorts em português pelo fluxo completo...');
  const shortsIdeia = 'O Anjo Fechou a Boca dos Leões na Babilônia';
  const shortsEstilo = 'Shorts/Reels — YouTube, Instagram, Facebook (50-60 segundos)';
  const shortsTom = 'Solene e Profético';
  const shortsGancho = 'Citação Bíblica Direta e Impacto Teológico';
  const shortsIdioma = 'Português (Brasil)';

  const shortsPrompt = PromptEngine.generateScriptPrompt({
    ideia: shortsIdeia,
    estiloRoteiro: shortsEstilo,
    tomVoz: shortsTom,
    tipoGancho: shortsGancho,
    idioma: shortsIdioma
  });

  let shortsTexto = await OpenRouterAPI.generateContent(
    shortsPrompt,
    'openai/gpt-4o-mini',
    SCRIPT_SYSTEM_PROMPT
  );

  // Pipeline idêntico ao index.html
  shortsTexto = limitarFrasesHistoricas(shortsTexto, shortsEstilo);
  shortsTexto = garantirCtaNoUltimoParagrafo(shortsTexto, shortsIdioma, shortsEstilo);
  shortsTexto = ajustarExtensaoRoteiro(shortsTexto, shortsEstilo);
  shortsTexto = await fnValidarBiblia(shortsTexto, shortsIdioma);
  shortsTexto = ajustarExtensaoRoteiro(shortsTexto, shortsEstilo);
  shortsTexto = validarECorrigirAspas(shortsTexto);
  shortsTexto = limparPontuacaoDuplicada(shortsTexto);
  if (typeof context.removerAnglicismosAcidentais === 'function') {
    shortsTexto = context.removerAnglicismosAcidentais(shortsTexto, shortsIdioma);
  }
  if (typeof context.garantirExtensaoShorts === 'function') {
    shortsTexto = context.garantirExtensaoShorts(shortsTexto, shortsIdioma);
  }

  const shortsNarracaoLimpa = limparTextoParaNarracao(shortsTexto, shortsEstilo);
  const shortsPalavras = contarPalavras(shortsNarracaoLimpa);
  const shortsDescartes = contarFrasesDescarte(shortsTexto);
  const shortsParenRefs = checarReferenciasParenteses(shortsNarracaoLimpa);
  const shortsEnWords = checarPalavrasIngles(shortsTexto);
  const shortsPontErros = checarPontuacaoAspas(shortsTexto);
  const shortsTemCta = checarCtaFixo(shortsTexto, 'Shorts');

  console.log(`  ✓ Shorts gerado: ${shortsPalavras} palavras | ${shortsDescartes} frases de descarte | CTA: ${shortsTemCta ? 'OK' : 'FALTOU'}`);

  // --------------------------------------------------------------------------
  // FLUXO COMPLETO 2: GERAÇÃO DE LONGO EM PORTUGUÊS (7 SEÇÕES)
  // --------------------------------------------------------------------------
  console.log('\n▶ [2/3] Gerando Longo em português pelo fluxo completo (7 seções)...');
  const longoIdeia = 'A Queda de Lúcifer e a Soberania Divina nas Escrituras (Isaías 14:12-15, Ezequiel 28:13-17)';
  const longoEstilo = 'YouTube Longo (18-20 minutos)';
  const longoTom = 'Solene e Profético';
  const longoGancho = 'Citação Bíblica Direta e Impacto Teológico';
  const longoIdioma = 'Português (Brasil)';

  let longoTexto = await gerarRoteiroEmSeteSecoes({
    ideia: longoIdeia,
    estiloRoteiro: longoEstilo,
    tomVoz: longoTom,
    tipoGancho: longoGancho,
    idioma: longoIdioma,
    modelo: 'openai/gpt-4o-mini',
    onProgress: (p, t, msg) => {
      process.stdout.write(`  [Passo ${p}/${t}] ${msg}\r`);
    }
  });
  console.log('');

  if (typeof context.removerAnglicismosAcidentais === 'function') {
    longoTexto = context.removerAnglicismosAcidentais(longoTexto, longoIdioma);
  }

  const longoNarracaoLimpa = limparTextoParaNarracao(longoTexto, longoEstilo);
  const longoPalavras = contarPalavras(longoNarracaoLimpa);
  const longoDescartes = contarFrasesDescarte(longoTexto);
  const longoParenRefs = checarReferenciasParenteses(longoNarracaoLimpa);
  const longoEnWords = checarPalavrasIngles(longoTexto);
  const longoPontErros = checarPontuacaoAspas(longoTexto);
  const longoTemCta = checarCtaFixo(longoTexto, 'Longo');

  const longoParagrafos = longoTexto.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const penultimoParagrafo = longoParagrafos.length > 1 ? longoParagrafos[longoParagrafos.length - 2] : '';
  const palavrasConclusao = contarPalavras(penultimoParagrafo);

  console.log(`  ✓ Longo gerado: ${longoPalavras} palavras | Conclusão: ${palavrasConclusao} palavras | Descartes: ${longoDescartes}`);

  // --------------------------------------------------------------------------
  // FLUXO 3: REGRESSÃO BÍBLICA
  // --------------------------------------------------------------------------
  console.log('\n▶ [3/3] Testando regressão bíblica (Isaías 14:12, Êxodo 14:26, Jonas 2:2)...');

  // Isaías 14:12 inalterado
  const tIsaias = 'O profeta proclamou: "Como caíste do céu, ó estrela da manhã, filha da alva!" (Isaías 14:12).';
  const rIsaias = await fnValidarBibliaObj(tIsaias, 'pt');
  const isaiasInalterado = (tIsaias === rIsaias.textoCorrigido);

  // Êxodo 14:26 corrigido sem "e disse:" ou "Nisso o SENHOR disse a Moisés:"
  const tExodo = 'O SENHOR ordenou: "Estende a tua mão sobre o mar, para que as águas se voltem sobre os egípcios" (Êxodo 14:26).';
  const rExodo = await fnValidarBibliaObj(tExodo, 'pt');
  const exodoSemInjecao = !rExodo.textoCorrigido.includes('Nisso o SENHOR disse a Moisés') &&
                          !rExodo.textoCorrigido.includes('disse a Moisés') &&
                          !rExodo.textoCorrigido.includes('e disse:') &&
                          rExodo.textoCorrigido.includes('Estende a mão sobre o mar');

  // Jonas 2:2 corrigido sem "e disse:"
  const tJonas = 'O profeta orou: "Na minha aflição clamei ao Senhor, e ele me atendeu" (Jonas 2:2).';
  const rJonas = await fnValidarBibliaObj(tJonas, 'pt');
  const jonasSemInjecao = !rJonas.textoCorrigido.includes('e disse:') &&
                          rJonas.textoCorrigido.includes('Na minha angústia clamei');

  const regressaoBiblicaPassou = isaiasInalterado && exodoSemInjecao && jonasSemInjecao;

  // --------------------------------------------------------------------------
  // AVALIAÇÃO DOS 8 ITENS DO CHECKLIST
  // --------------------------------------------------------------------------
  const item1 = (shortsPalavras >= 130 && shortsPalavras <= 160) && (longoPalavras >= 2700 && longoPalavras <= 3000);
  const item2 = (shortsDescartes <= 1) && (longoDescartes <= 2);
  const item3 = (shortsParenRefs.length === 0) && (longoParenRefs.length === 0);
  const item4 = (shortsEnWords.length === 0) && (longoEnWords.length === 0);
  const item5 = (shortsPontErros.length === 0) && (longoPontErros.length === 0);
  const item6 = shortsTemCta && longoTemCta;
  const item7 = palavrasConclusao <= 120;
  const item8 = regressaoBiblicaPassou;

  const todosPassaram = item1 && item2 && item3 && item4 && item5 && item6 && item7 && item8;

  const primeiroParagrafoLongo = longoParagrafos[0] || '';
  const ultimoParagrafoLongo = longoParagrafos[longoParagrafos.length - 1] || '';

  const res = {
    todosPassaram,
    itens: [
      { nome: 'palavras dentro da meta (Shorts 130-160, Longo 2.700-3.000)', status: item1, detalhes: `Shorts: ${shortsPalavras} | Longo: ${longoPalavras}` },
      { nome: 'frases de descarte ≤ 1 (Shorts) / ≤ 2 (Longo)', status: item2, detalhes: `Shorts: ${shortsDescartes} | Longo: ${longoDescartes}` },
      { nome: 'narração limpa sem nenhum "(Livro X:Y)"', status: item3, detalhes: `Matches no Shorts: ${shortsParenRefs.length} | no Longo: ${longoParenRefs.length}` },
      { nome: 'nenhuma palavra em inglês no roteiro', status: item4, detalhes: `Shorts: [${shortsEnWords.join(', ')}] | Longo: [${longoEnWords.join(', ')}]` },
      { nome: 'sem `."` colado, sem aspas duplicadas', status: item5, detalhes: `Erros Shorts: ${shortsPontErros.length} | Longo: ${longoPontErros.length}` },
      { nome: 'CTA fixo presente no final', status: item6, detalhes: `Shorts: ${shortsTemCta ? 'SIM' : 'NÃO'} | Longo: ${longoTemCta ? 'SIM' : 'NÃO'}` },
      { nome: 'conclusão do Longo ≤ 120 palavras', status: item7, detalhes: `${palavrasConclusao} palavras` },
      { nome: 'regressão bíblica: Isaías 14:12 inalterado; Êxodo 14:26 e Jonas 2:2 corrigidos sem "e disse:"', status: item8, detalhes: `Isaías: ${isaiasInalterado ? 'OK' : 'FALHA'} | Êxodo: ${exodoSemInjecao ? 'OK' : 'FALHA'} | Jonas: ${jonasSemInjecao ? 'OK' : 'FALHA'}` }
    ],
    primeiroParagrafoLongo,
    ultimoParagrafoLongo
  };

  console.log('\n===============================================================');
  console.log('                     RELATÓRIO DO CHECKLIST                    ');
  console.log('===============================================================');
  console.log('| Item | Requisito | Status | Detalhes |');
  console.log('| :--- | :--- | :---: | :--- |');
  res.itens.forEach((it, idx) => {
    console.log(`| ${idx + 1} | ${it.nome} | ${it.status ? '✅' : '❌'} | ${it.detalhes} |`);
  });

  console.log('\n---------------------------------------------------------------');
  console.log('PRIMEIRO PARÁGRAFO DO LONGO:');
  console.log('---------------------------------------------------------------');
  console.log(res.primeiroParagrafoLongo);

  console.log('\n---------------------------------------------------------------');
  console.log('ÚLTIMO PARÁGRAFO DO LONGO:');
  console.log('---------------------------------------------------------------');
  console.log(res.ultimoParagrafoLongo);
  console.log('---------------------------------------------------------------\n');

  if (!res.todosPassaram) {
    console.error('❌ CHECKLIST COM FALHA EM UM OU MAIS ITENS.');
    process.exit(1);
  } else {
    console.log('🎉 100% VERDE! TODOS OS ITENS FORAM APROVADOS COM SUCESSO.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Erro fatal ao rodar checklist:', err);
  process.exit(1);
});
