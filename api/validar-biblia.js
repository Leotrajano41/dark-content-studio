// api/validar-biblia.js
// Serverless Function — Módulo de Validação e Correção Bíblica (PT / EN / ES)
//
// POST /api/validar-biblia
// Body (application/json): { texto: string, idioma?: string }
// Response: { sucesso: true, textoCorrigido: string, alteracoes: Array, totalReferencias: number }

const fs = require('fs');
const path = require('path');

function readJsonClean(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return JSON.parse(content);
}

// Cache em memória para Serverless singleton
let bibles = { pt: null, en: null, es: null };

function loadBibles() {
  const possibleDirs = [
    path.join(__dirname, '..', 'data', 'bible'),
    path.join(process.cwd(), 'data', 'bible'),
    path.resolve('./data/bible')
  ];

  let actualDir = null;
  for (const d of possibleDirs) {
    if (fs.existsSync(d)) {
      actualDir = d;
      break;
    }
  }

  if (!actualDir) {
    console.warn('[validar-biblia] Diretório de dados bíblicos não encontrado.');
    return bibles;
  }

  if (!bibles.pt) {
    const ptPath = path.join(actualDir, 'pt_jfa.json');
    if (fs.existsSync(ptPath)) bibles.pt = readJsonClean(ptPath);
  }
  if (!bibles.en) {
    const enPath = path.join(actualDir, 'en_kjv.json');
    if (fs.existsSync(enPath)) bibles.en = readJsonClean(enPath);
  }
  if (!bibles.es) {
    const esPath = path.join(actualDir, 'es_rvr.json');
    if (fs.existsSync(esPath)) bibles.es = readJsonClean(esPath);
  }

  return bibles;
}

// Mapa dos 66 livros bíblicos canônicos
const BOOK_CANONICAL = [
  { id: 'gn', pt: 'Gênesis', en: 'Genesis', es: 'Génesis', aliases: ['genesis', 'genese', 'gn', 'gen', 'ge'] },
  { id: 'ex', pt: 'Êxodo', en: 'Exodus', es: 'Éxodo', aliases: ['exodo', 'exodus', 'ex', 'exo'] },
  { id: 'lv', pt: 'Levítico', en: 'Leviticus', es: 'Levítico', aliases: ['levitico', 'leviticus', 'lv', 'lev'] },
  { id: 'nm', pt: 'Números', en: 'Numbers', es: 'Números', aliases: ['numeros', 'numbers', 'nm', 'num', 'nu'] },
  { id: 'dt', pt: 'Deuteronômio', en: 'Deuteronomy', es: 'Deuteronomio', aliases: ['deuteronomio', 'deuteronomy', 'dt', 'deu'] },
  { id: 'js', pt: 'Josué', en: 'Joshua', es: 'Josué', aliases: ['josue', 'joshua', 'js', 'jos', 'josh'] },
  { id: 'jz', pt: 'Juízes', en: 'Judges', es: 'Jueces', aliases: ['juizes', 'judges', 'jueces', 'jz', 'jdg', 'jue'] },
  { id: 'rt', pt: 'Rute', en: 'Ruth', es: 'Rut', aliases: ['rute', 'ruth', 'rut', 'rt', 'rth'] },
  { id: '1sm', pt: '1 Samuel', en: '1 Samuel', es: '1 Samuel', aliases: ['1 samuel', '1samuel', '1 sm', '1sm', '1 sam', '1sam', 'i samuel'] },
  { id: '2sm', pt: '2 Samuel', en: '2 Samuel', es: '2 Samuel', aliases: ['2 samuel', '2samuel', '2 sm', '2sm', '2 sam', '2sam', 'ii samuel'] },
  { id: '1rs', pt: '1 Reis', en: '1 Kings', es: '1 Reyes', aliases: ['1 reis', '1reis', '1 kings', '1kings', '1 reyes', '1 rs', '1rs', '1 kgs', '1reyes', 'i reis'] },
  { id: '2rs', pt: '2 Reis', en: '2 Kings', es: '2 Reyes', aliases: ['2 reis', '2reis', '2 kings', '2kings', '2 reyes', '2 rs', '2rs', '2 kgs', '2reyes', 'ii reis'] },
  { id: '1cr', pt: '1 Crônicas', en: '1 Chronicles', es: '1 Crónicas', aliases: ['1 cronicas', '1cronicas', '1 chronicles', '1 cr', '1cr', '1 chr', 'i cronicas'] },
  { id: '2cr', pt: '2 Crônicas', en: '2 Chronicles', es: '2 Crónicas', aliases: ['2 cronicas', '2cronicas', '2 chronicles', '2 cr', '2cr', '2 chr', 'ii cronicas'] },
  { id: 'ed', pt: 'Esdras', en: 'Ezra', es: 'Esdras', aliases: ['esdras', 'ezra', 'ed', 'ezr'] },
  { id: 'ne', pt: 'Neemias', en: 'Nehemiah', es: 'Nehemías', aliases: ['neemias', 'nehemiah', 'nehemias', 'ne', 'neh'] },
  { id: 'et', pt: 'Ester', en: 'Esther', es: 'Ester', aliases: ['ester', 'esther', 'et', 'est'] },
  { id: 'job', pt: 'Jó', en: 'Job', es: 'Job', aliases: ['jó', 'job', 'jb'] },
  { id: 'sl', pt: 'Salmos', en: 'Psalms', es: 'Salmos', aliases: ['salmos', 'salmo', 'psalms', 'psalm', 'sl', 'ps', 'psa'] },
  { id: 'pv', pt: 'Provérbios', en: 'Proverbs', es: 'Proverbios', aliases: ['proverbios', 'proverbio', 'proverbs', 'pv', 'prv', 'pro'] },
  { id: 'ec', pt: 'Eclesiastes', en: 'Ecclesiastes', es: 'Eclesiastés', aliases: ['eclesiastes', 'ecclesiastes', 'ec', 'ecc', 'ecl'] },
  { id: 'ct', pt: 'Cânticos', en: 'Song of Solomon', es: 'Cantares', aliases: ['canticos', 'cantares', 'song of solomon', 'song of songs', 'ct', 'cant', 'sos'] },
  { id: 'is', pt: 'Isaías', en: 'Isaiah', es: 'Isaías', aliases: ['isaias', 'isaiah', 'is', 'isa'] },
  { id: 'jr', pt: 'Jeremias', en: 'Jeremiah', es: 'Jeremías', aliases: ['jeremias', 'jeremiah', 'jr', 'jer'] },
  { id: 'lm', pt: 'Lamentações', en: 'Lamentations', es: 'Lamentaciones', aliases: ['lamentacoes', 'lamentations', 'lamentaciones', 'lm', 'lam'] },
  { id: 'ez', pt: 'Ezequiel', en: 'Ezekiel', es: 'Ezequiel', aliases: ['ezequiel', 'ezekiel', 'ez', 'ezk'] },
  { id: 'dn', pt: 'Daniel', en: 'Daniel', es: 'Daniel', aliases: ['daniel', 'dn', 'dan'] },
  { id: 'os', pt: 'Oseias', en: 'Hosea', es: 'Oseas', aliases: ['oseias', 'hosea', 'oseas', 'os', 'hos'] },
  { id: 'jl', pt: 'Joel', en: 'Joel', es: 'Joel', aliases: ['joel', 'jl', 'jol'] },
  { id: 'am', pt: 'Amós', en: 'Amos', es: 'Amós', aliases: ['amos', 'am'] },
  { id: 'ob', pt: 'Obadias', en: 'Obadiah', es: 'Abdías', aliases: ['obadias', 'obadiah', 'abdias', 'ob', 'oba'] },
  { id: 'jn', pt: 'Jonas', en: 'Jonah', es: 'Jonás', aliases: ['jonas', 'jonah', 'jn', 'jon'] },
  { id: 'mq', pt: 'Miqueias', en: 'Micah', es: 'Miqueas', aliases: ['miqueias', 'micah', 'miqueas', 'mq', 'mic'] },
  { id: 'na', pt: 'Naum', en: 'Nahum', es: 'Nahúm', aliases: ['naum', 'nahum', 'na', 'nah'] },
  { id: 'hc', pt: 'Habacuque', en: 'Habakkuk', es: 'Habacuc', aliases: ['habacuque', 'habakkuk', 'habacuc', 'hc', 'hab'] },
  { id: 'sf', pt: 'Sofonias', en: 'Zephaniah', es: 'Sofonías', aliases: ['sofonias', 'zephaniah', 'sf', 'zep'] },
  { id: 'ag', pt: 'Ageu', en: 'Haggai', es: 'Hageo', aliases: ['ageu', 'haggai', 'hageo', 'ag', 'hag'] },
  { id: 'zc', pt: 'Zacarias', en: 'Zechariah', es: 'Zacarías', aliases: ['zacarias', 'zechariah', 'zc', 'zec'] },
  { id: 'ml', pt: 'Malaquias', en: 'Malachi', es: 'Malaquías', aliases: ['malaquias', 'malachi', 'ml', 'mal'] },
  { id: 'mt', pt: 'Mateus', en: 'Matthew', es: 'Mateo', aliases: ['mateus', 'matthew', 'mateo', 'mt', 'mat'] },
  { id: 'mc', pt: 'Marcos', en: 'Mark', es: 'Marcos', aliases: ['marcos', 'mark', 'mc', 'mrk'] },
  { id: 'lc', pt: 'Lucas', en: 'Luke', es: 'Lucas', aliases: ['lucas', 'luke', 'lc', 'luk'] },
  { id: 'jo', pt: 'João', en: 'John', es: 'Juan', aliases: ['joao', 'john', 'juan', 'jo', 'jhn'] },
  { id: 'at', pt: 'Atos', en: 'Acts', es: 'Hechos', aliases: ['atos', 'acts', 'hechos', 'at', 'act'] },
  { id: 'rm', pt: 'Romanos', en: 'Romans', es: 'Romanos', aliases: ['romanos', 'romans', 'rm', 'rom'] },
  { id: '1co', pt: '1 Coríntios', en: '1 Corinthians', es: '1 Corintios', aliases: ['1 corintios', '1corintios', '1 corinthians', '1 co', '1co', '1 cor', 'i corintios'] },
  { id: '2co', pt: '2 Coríntios', en: '2 Corinthians', es: '2 Corintios', aliases: ['2 corintios', '2corintios', '2 corinthians', '2 co', '2co', '2 cor', 'ii corintios'] },
  { id: 'gl', pt: 'Gálatas', en: 'Galatians', es: 'Gálatas', aliases: ['galatas', 'galatians', 'gl', 'gal'] },
  { id: 'ef', pt: 'Efésios', en: 'Ephesians', es: 'Efesios', aliases: ['efesios', 'ephesians', 'ef', 'eph'] },
  { id: 'fp', pt: 'Filipenses', en: 'Philippians', es: 'Filipenses', aliases: ['filipenses', 'philippians', 'fp', 'flp', 'php', 'phil'] },
  { id: 'cl', pt: 'Colossenses', en: 'Colossians', es: 'Colosenses', aliases: ['colossenses', 'colossians', 'colosenses', 'cl', 'col'] },
  { id: '1ts', pt: '1 Tessalonicenses', en: '1 Thessalonians', es: '1 Tesalonicenses', aliases: ['1 tessalonicenses', '1 thessalonians', '1 tesalonicenses', '1 ts', '1ts', '1 thess', 'i tessalonicenses'] },
  { id: '2ts', pt: '2 Tessalonicenses', en: '2 Thessalonians', es: '2 Tesalonicenses', aliases: ['2 tessalonicenses', '2 thessalonians', '2 tesalonicenses', '2 ts', '2ts', '2 thess', 'ii tessalonicenses'] },
  { id: '1tm', pt: '1 Timóteo', en: '1 Timothy', es: '1 Timoteo', aliases: ['1 timoteo', '1 timothy', '1 tm', '1tm', '1 tim', 'i timoteo'] },
  { id: '2tm', pt: '2 Timóteo', en: '2 Timothy', es: '2 Timoteo', aliases: ['2 timoteo', '2 timothy', '2 tm', '2tm', '2 tim', 'ii timoteo'] },
  { id: 'tt', pt: 'Tito', en: 'Titus', es: 'Tito', aliases: ['tito', 'titus', 'tt', 'tit'] },
  { id: 'fm', pt: 'Filemom', en: 'Philemon', es: 'Filemón', aliases: ['filemom', 'philemon', 'filemon', 'fm', 'phm'] },
  { id: 'hb', pt: 'Hebreus', en: 'Hebrews', es: 'Hebreos', aliases: ['hebreus', 'hebrews', 'hebreos', 'hb', 'heb'] },
  { id: 'tg', pt: 'Tiago', en: 'James', es: 'Santiago', aliases: ['tiago', 'james', 'santiago', 'tg', 'jas'] },
  { id: '1pe', pt: '1 Pedro', en: '1 Peter', es: '1 Pedro', aliases: ['1 pedro', '1pedro', '1 peter', '1 pe', '1pe', '1 pet', 'i pedro'] },
  { id: '2pe', pt: '2 Pedro', en: '2 Peter', es: '2 Pedro', aliases: ['2 pedro', '2pedro', '2 peter', '2 pe', '2pe', '2 pet', 'ii pedro'] },
  { id: '1jo', pt: '1 João', en: '1 John', es: '1 Juan', aliases: ['1 joao', '1joao', '1 john', '1 juan', '1 jo', '1jo', '1 jhn', 'i joao'] },
  { id: '2jo', pt: '2 João', en: '2 John', es: '2 Juan', aliases: ['2 joao', '2joao', '2 john', '2 juan', '2 jo', '2jo', '2 jhn', 'ii joao'] },
  { id: '3jo', pt: '3 João', en: '3 John', es: '3 Juan', aliases: ['3 joao', '3joao', '3 john', '3 juan', '3 jo', '3jo', '3 jhn', 'iii joao'] },
  { id: 'jd', pt: 'Judas', en: 'Jude', es: 'Judas', aliases: ['judas', 'jude', 'jd', 'jud'] },
  { id: 'ap', pt: 'Apocalipse', en: 'Revelation', es: 'Apocalipsis', aliases: ['apocalipse', 'revelation', 'apocalipsis', 'ap', 'rev'] }
];

function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function findBook(bookName) {
  const norm = normalizeStr(bookName);
  // Prioridade 1: correspondência exata de nome sem acento
  for (const b of BOOK_CANONICAL) {
    if (normalizeStr(b.pt) === norm || normalizeStr(b.en) === norm || normalizeStr(b.es) === norm) {
      return b;
    }
  }
  // Prioridade 2: correspondência exata de id ou aliases
  for (const b of BOOK_CANONICAL) {
    if (b.id === norm || b.aliases.some(a => normalizeStr(a) === norm)) {
      return b;
    }
  }
  return null;
}

function getVerseText(bibleData, bookCanonical, chapterNum, verseStart, verseEnd) {
  if (!bibleData || !Array.isArray(bibleData)) return null;

  // Busca livro com prioridade para nome completo, depois abbrev
  let bookEntry = bibleData.find(b => {
    const nameNorm = normalizeStr(b.name || '');
    return nameNorm === normalizeStr(bookCanonical.pt) ||
           nameNorm === normalizeStr(bookCanonical.en) ||
           nameNorm === normalizeStr(bookCanonical.es);
  });

  if (!bookEntry) {
    bookEntry = bibleData.find(b => {
      const abbrevNorm = normalizeStr(b.abbrev || '');
      return abbrevNorm === bookCanonical.id || bookCanonical.aliases.includes(abbrevNorm);
    });
  }

  if (!bookEntry || !bookEntry.chapters) return null;

  const chapIdx = chapterNum - 1;
  if (chapIdx < 0 || chapIdx >= bookEntry.chapters.length) return null;

  const chapterVerses = bookEntry.chapters[chapIdx];
  if (!Array.isArray(chapterVerses)) return null;

  const startIdx = verseStart - 1;
  if (startIdx < 0 || startIdx >= chapterVerses.length) return null;

  const endIdx = verseEnd ? verseEnd - 1 : startIdx;
  const validEnd = Math.min(Math.max(startIdx, endIdx), chapterVerses.length - 1);

  return chapterVerses.slice(startIdx, validEnd + 1).join(' ');
}

/**
 * Valida referências bíblicas e corrige citações e referências inexistentes
 *
 * @param {string} texto
 * @param {string} idioma
 * @returns {{ textoCorrigido: string, alteracoes: Array, totalReferencias: number }}
 */
function validarRoteiroBiblico(texto, idioma = 'pt') {
  if (!texto || typeof texto !== 'string') {
    return { textoCorrigido: texto || '', alteracoes: [], totalReferencias: 0 };
  }

  const biblesLoaded = loadBibles();
  const langKey = (idioma.toLowerCase().includes('en') || idioma.toLowerCase().includes('ing')) ? 'en'
                : (idioma.toLowerCase().includes('es') || idioma.toLowerCase().includes('esp')) ? 'es'
                : 'pt';
  const currentBible = biblesLoaded[langKey] || biblesLoaded.pt;

  // Se a Bíblia não pôde ser carregada no ambiente, retorna texto intacto com aviso
  if (!currentBible) {
    return {
      textoCorrigido: texto,
      alteracoes: [],
      totalReferencias: 0,
      aviso: 'Dados bíblicos não disponíveis no momento.'
    };
  }

  // Regex para capturar referências bíblicas (ex: Filipenses 4:13, 1 Coríntios 13:4-7, Atos 2:42-47)
  const refRegex = /\b([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)\s+(\d+)[:\.](\d+)(?:-(\d+))?\b/g;

  let textoCorrigido = texto;
  const alteracoes = [];
  const matches = [];
  let m;

  while ((m = refRegex.exec(texto)) !== null) {
    const rawRef = m[0].trim();
    const rawBook = m[1].trim();
    const chap = parseInt(m[2], 10);
    const vStart = parseInt(m[3], 10);
    const vEnd = m[4] ? parseInt(m[4], 10) : null;

    const bookCan = findBook(rawBook);
    if (bookCan) {
      matches.push({
        index: m.index,
        length: m[0].length,
        rawRef,
        bookCan,
        chap,
        vStart,
        vEnd
      });
    }
  }

  // Processa do final para o início para não desalinhar os índices de substituição
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const realText = getVerseText(currentBible, match.bookCan, match.chap, match.vStart, match.vEnd);

    if (!realText) {
      // Caso 1: A referência NÃO EXISTE na Bíblia (capítulo ou versículo fora do limite canônico)
      // Substitui a citação específica mantendo a fluidez do sentido
      const bookName = match.bookCan[langKey] || match.bookCan.pt;
      const refPattern = new RegExp(`(?:em|conforme|segundo|de acordo com|como diz em|no livro de)?\\s*${match.rawRef.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")}`, 'gi');
      
      const generalReplacement = langKey === 'en' ? 'in the Holy Scriptures'
                                : langKey === 'es' ? 'en las Sagradas Escrituras'
                                : 'nas Sagradas Escrituras';

      textoCorrigido = textoCorrigido.replace(refPattern, generalReplacement);
      alteracoes.push({
        tipo: 'REFERENCIA_INEXISTENTE_REMOVIDA',
        referencia: match.rawRef,
        motivo: `Capítulo ou versículo não existe em ${bookName}`,
        substituicao: generalReplacement
      });
    } else {
      // Caso 2: A referência EXISTE. Busca citação correspondente nas proximidades
      const postRefIdx = match.index + match.length;
      const postSnippet = textoCorrigido.slice(postRefIdx, postRefIdx + 300);

      // Procura citação entre aspas logo após a referência
      const quoteMatch = postSnippet.match(/^[\s,;]*(?:diz|afirma|declara|mostra|onde lemos|que diz)?[:\s]*["“]([^"”]+)["”]/i);

      if (quoteMatch) {
        const textoCitado = quoteMatch[1].trim();
        if (normalizeStr(textoCitado) !== normalizeStr(realText)) {
          const quoteFull = quoteMatch[0];
          const newQuote = quoteFull.replace(quoteMatch[1], realText);
          const replaceIdx = postRefIdx;
          textoCorrigido = textoCorrigido.slice(0, replaceIdx) + textoCorrigido.slice(replaceIdx).replace(quoteFull, newQuote);

          alteracoes.push({
            tipo: 'CITACAO_CORRIGIDA',
            referencia: match.rawRef,
            textoAnterior: textoCitado,
            textoCorreto: realText
          });
        }
      }
    }
  }

  return {
    textoCorrigido,
    alteracoes,
    totalReferencias: matches.length
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { texto, idioma = 'pt' } = req.body || {};

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: 'Parâmetro obrigatório ausente: "texto".' });
    }

    const resultado = validarRoteiroBiblico(texto, idioma);
    return res.status(200).json({
      sucesso: true,
      ...resultado
    });
  } catch (err) {
    console.error('[validar-biblia] Erro inesperado:', err);
    return res.status(500).json({ error: `Erro na validação bíblica: ${err.message}` });
  }
};

module.exports.validarRoteiroBiblico = validarRoteiroBiblico;
module.exports.loadBibles = loadBibles;
module.exports.findBook = findBook;
