// js/catalogo.js
// Módulo de Geração e Validação do Estilo "Catálogo em N itens (14-17 min)"
// e Gerador do Pacote de Publicação Automático
// Compatível com Navegador e Node.js (CommonJS / Sandbox)

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CatalogoModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // METAS FIXAS DO BRIEFING (não alterar para "fazer o teste passar")
  // ==========================================================================
  const LIMITES = Object.freeze({
    itemMin: 150,
    itemMax: 220,
    itemAlvoMin: 190,       // alvo pedido à IA (dentro da faixa fixa)
    itemAlvoMax: 215,
    totalMin8: 1700,        // roteiro de 8 itens
    totalMax8: 2200,
    fechamentoMin: 80,
    fechamentoMax: 120,
    palavrasPorMinuto: 180, // áudio real: ~180 palavras por minuto
    contextoAntes: 8,       // até 8 versículos antes (para situar cenário e motivação)
    contextoDepois: 4       // até 4 versículos depois (consequência imediata registrada)
  });

  // Personagens com nomes ou dados extrabíblicos conhecidos que devem ser rotulados
  const PERSONAGENS_EXTRABIBLICOS = [
    {
      padrao: /\b(?:o\s+rei\s+)?Herodes\s+Agripa(?:\s+Primeiro|\s+I)?\b/i,
      rotuloObrigatorio: 'o rei Herodes, conhecido fora da Bíblia como Herodes Agripa Primeiro',
      aplicar: (texto) => {
        if (/conhecido fora da b[ií]blia/i.test(texto)) return texto;
        return texto.replace(/\b(?:o\s+rei\s+)?Herodes\s+Agripa(?:\s+Primeiro|\s+I)?\b/i, 'o rei Herodes, conhecido fora da Bíblia como Herodes Agripa Primeiro');
      }
    }
  ];

  function limitesTotal(n) {
    const k = (Number(n) || 8) / 8;
    return {
      min: Math.round(LIMITES.totalMin8 * k),
      max: Math.round(LIMITES.totalMax8 * k)
    };
  }

  // Dicionário canônico de mapeamento de livros bíblicos
  const LIVROS_MAP = {
    // Pentateuco
    'gn': 'gn', 'genesis': 'gn', 'gênesis': 'gn',
    'ex': 'ex', 'exodo': 'ex', 'êxodo': 'ex',
    'lv': 'lv', 'levitico': 'lv', 'levítico': 'lv',
    'nm': 'nm', 'numeros': 'nm', 'números': 'nm',
    'dt': 'dt', 'deuteronomio': 'dt', 'deuteronômio': 'dt',
    // Históricos
    'js': 'js', 'josue': 'js', 'josué': 'js',
    'jz': 'jz', 'juizes': 'jz', 'juízes': 'jz',
    'rt': 'rt', 'rute': 'rt', 'ruth': 'rt',
    '1sm': '1sm', '1 samuel': '1sm', '1samuel': '1sm', '1º samuel': '1sm', '1ª samuel': '1sm', 'i samuel': '1sm',
    '2sm': '2sm', '2 samuel': '2sm', '2samuel': '2sm', '2º samuel': '2sm', '2ª samuel': '2sm', 'ii samuel': '2sm',
    '1rs': '1rs', '1 reis': '1rs', '1reis': '1rs', '1º reis': '1rs', '1ª reis': '1rs', 'i reis': '1rs', '1 kings': '1rs', '1kings': '1rs',
    '2rs': '2rs', '2 reis': '2rs', '2reis': '2rs', '2º reis': '2rs', '2ª reis': '2rs', 'ii reis': '2rs', '2 kings': '2rs', '2kings': '2rs',
    '1cr': '1cr', '1 cronicas': '1cr', '1 crônicas': '1cr', '1cronicas': '1cr', '1crônicas': '1cr', '1 chronicles': '1cr',
    '2cr': '2cr', '2 cronicas': '2cr', '2 crônicas': '2cr', '2cronicas': '2cr', '2crônicas': '2cr', '2 chronicles': '2cr',
    'ed': 'ed', 'esdras': 'ed', 'ezra': 'ed',
    'ne': 'ne', 'neemias': 'ne', 'nehemiah': 'ne',
    'et': 'et', 'ester': 'et', 'esther': 'et',
    // Poéticos
    'job': 'job', 'jó': 'job', 'jo': 'job',
    'sl': 'sl', 'salmo': 'sl', 'salmos': 'sl', 'psalms': 'sl', 'psalm': 'sl',
    'pv': 'pv', 'proverbio': 'pv', 'provérbio': 'pv', 'proverbios': 'pv', 'provérbios': 'pv', 'proverbs': 'pv',
    'ec': 'ec', 'eclesiastes': 'ec', 'ecclesiastes': 'ec',
    'ct': 'ct', 'cantares': 'ct', 'cantico': 'ct', 'cântico': 'ct', 'cânticos': 'ct', 'song of solomon': 'ct', 'song of songs': 'ct',
    // Profetas Maiores
    'is': 'is', 'isaias': 'is', 'isaías': 'is', 'isaiah': 'is',
    'jr': 'jr', 'jeremias': 'jr', 'jeremiah': 'jr',
    'lm': 'lm', 'lamentacoes': 'lm', 'lamentações': 'lm', 'lamentations': 'lm',
    'ez': 'ez', 'ezequiel': 'ez', 'ezekiel': 'ez',
    'dn': 'dn', 'daniel': 'dn',
    // Profetas Menores
    'os': 'os', 'oseias': 'os', 'oséias': 'os', 'hosea': 'os',
    'jl': 'jl', 'joel': 'jl',
    'am': 'am', 'amos': 'am', 'amós': 'am',
    'ob': 'ob', 'obadias': 'ob', 'obadiah': 'ob',
    'jn': 'jn', 'jonas': 'jn', 'jonah': 'jn',
    'mq': 'mq', 'miqueias': 'mq', 'miquéias': 'mq', 'micah': 'mq',
    'na': 'na', 'naum': 'na', 'nahum': 'na',
    'hc': 'hc', 'habacuque': 'hc', 'habakkuk': 'hc',
    'sf': 'sf', 'sofonias': 'sf', 'zephaniah': 'sf',
    'ag': 'ag', 'ageu': 'ag', 'haggai': 'ag',
    'zc': 'zc', 'zacarias': 'zc', 'zechariah': 'zc',
    'ml': 'ml', 'malaquias': 'ml', 'malachi': 'ml',
    // Novo Testamento - Evangelhos & Atos
    'mt': 'mt', 'mateus': 'mt', 'matthew': 'mt',
    'mc': 'mc', 'marcos': 'mc', 'mark': 'mc',
    'lc': 'lc', 'lucas': 'lc', 'luke': 'lc',
    'joao': 'jo', 'joão': 'jo', 'john': 'jo',
    'at': 'atos', 'atos': 'atos', 'acts': 'atos',
    // Epístolas Paulinas
    'rm': 'rm', 'romanos': 'rm', 'romans': 'rm',
    '1co': '1co', '1 corintios': '1co', '1 coríntios': '1co', '1corintios': '1co', '1coríntios': '1co', '1 corinthians': '1co',
    '2co': '2co', '2 corintios': '2co', '2 coríntios': '2co', '2corintios': '2co', '2coríntios': '2co', '2 corinthians': '2co',
    'gl': 'gl', 'galatas': 'gl', 'gálatas': 'gl', 'galatians': 'gl',
    'ef': 'ef', 'efesios': 'ef', 'efésios': 'ef', 'ephesians': 'ef',
    'fp': 'fp', 'fl': 'fp', 'filipenses': 'fp', 'philippians': 'fp',
    'cl': 'cl', 'colossenses': 'cl', 'colossians': 'cl',
    '1ts': '1ts', '1 tessalonicenses': '1ts', '1tessalonicenses': '1ts', '1 thessalonians': '1ts',
    '2ts': '2ts', '2 tessalonicenses': '2ts', '2tessalonicenses': '2ts', '2 thessalonians': '2ts',
    '1tm': '1tm', '1 timoteo': '1tm', '1 timóteo': '1tm', '1timoteo': '1tm', '1timóteo': '1tm', '1 timothy': '1tm',
    '2tm': '2tm', '2 timoteo': '2tm', '2 timóteo': '2tm', '2timoteo': '2tm', '2timóteo': '2tm', '2 timothy': '2tm',
    'tt': 'tt', 'tito': 'tt', 'titus': 'tt',
    'fm': 'fm', 'filemom': 'fm', 'filemon': 'fm', 'philemon': 'fm',
    // Epístolas Gerais & Apocalipse
    'hb': 'hb', 'hebreus': 'hb', 'hebrews': 'hb',
    'tg': 'tg', 'tiago': 'tg', 'james': 'tg',
    '1pe': '1pe', '1 pedro': '1pe', '1pedro': '1pe', '1 peter': '1pe',
    '2pe': '2pe', '2 pedro': '2pe', '2pedro': '2pe', '2 peter': '2pe',
    '1jo': '1jo', '1 joao': '1jo', '1 joão': '1jo', '1joao': '1jo', '1joão': '1jo', '1 john': '1jo',
    '2jo': '2jo', '2 joao': '2jo', '2 joão': '2jo', '2joao': '2jo', '2joão': '2jo', '2 john': '2jo',
    '3jo': '3jo', '3 joao': '3jo', '3 joão': '3jo', '3joao': '3jo', '3joão': '3jo', '3 john': '3jo',
    'jd': 'jd', 'judas': 'jd', 'jude': 'jd',
    'ap': 'ap', 'apocalipse': 'ap', 'revelation': 'ap', 'revelations': 'ap'
  };

  // Nomes dos livros em inglês (para o pacote de publicação em inglês)
  const LIVROS_EN = {
    gn: 'Genesis', ex: 'Exodus', lv: 'Leviticus', nm: 'Numbers', dt: 'Deuteronomy',
    js: 'Joshua', jz: 'Judges', rt: 'Ruth', '1sm': '1 Samuel', '2sm': '2 Samuel',
    '1rs': '1 Kings', '2rs': '2 Kings', '1cr': '1 Chronicles', '2cr': '2 Chronicles',
    ed: 'Ezra', ne: 'Nehemiah', et: 'Esther', job: 'Job', sl: 'Psalms', pv: 'Proverbs',
    ec: 'Ecclesiastes', ct: 'Song of Solomon', is: 'Isaiah', jr: 'Jeremiah', lm: 'Lamentations',
    ez: 'Ezekiel', dn: 'Daniel', os: 'Hosea', jl: 'Joel', am: 'Amos', ob: 'Obadiah',
    jn: 'Jonah', mq: 'Micah', na: 'Nahum', hc: 'Habakkuk', sf: 'Zephaniah', ag: 'Haggai',
    zc: 'Zechariah', ml: 'Malachi', mt: 'Matthew', mc: 'Mark', lc: 'Luke', jo: 'John',
    atos: 'Acts', rm: 'Romans', '1co': '1 Corinthians', '2co': '2 Corinthians', gl: 'Galatians',
    ef: 'Ephesians', fp: 'Philippians', cl: 'Colossians', '1ts': '1 Thessalonians',
    '2ts': '2 Thessalonians', '1tm': '1 Timothy', '2tm': '2 Timothy', tt: 'Titus', fm: 'Philemon',
    hb: 'Hebrews', tg: 'James', '1pe': '1 Peter', '2pe': '2 Peter', '1jo': '1 John',
    '2jo': '2 John', '3jo': '3 John', jd: 'Jude', ap: 'Revelation'
  };

  // Dicionário de nomes pt -> en (chave: nome normalizado, sem acento e minúsculo)
  const NOMES_PT_EN = {
    'nadabe e abiu': 'Nadab and Abihu',
    'cora': 'Korah',
    'uza': 'Uzzah',
    'bete semes': 'Beth-shemesh',
    'senaqueribe': 'Sennacherib',
    'sodoma e gomorra': 'Sodom and Gomorrah',
    'ananias e safira': 'Ananias and Sapphira',
    'herodes agripa': 'Herod Agrippa',
    'herodes': 'Herod',
    'moises': 'Moses',
    'arao': 'Aaron',
    'davi': 'David',
    'golias': 'Goliath',
    'saul': 'Saul',
    'jeroboao': 'Jeroboam',
    'jeroboao i': 'Jeroboam I',
    'jeroboao ii': 'Jeroboam II',
    'nadabe': 'Nadab',
    'baasa': 'Baasha',
    'ela': 'Elah',
    'zinri': 'Zimri',
    'onri': 'Omri',
    'acabe': 'Ahab',
    'acazias': 'Ahaziah',
    'jorao': 'Joram',
    'jeorao': 'Jehoram',
    'jeu': 'Jehu',
    'jehu': 'Jehu',
    'joacaz': 'Jehoahaz',
    'jeoas': 'Jehoash',
    'zacarias': 'Zechariah',
    'salum': 'Shallum',
    'menaem': 'Menahem',
    'pecaias': 'Pekahiah',
    'peca': 'Pekah',
    'peka': 'Pekah',
    'oseias': 'Hoshea',
    'acas': 'Achan',
    'ogue': 'Og',
    'jezabel': 'Jezebel',
    'acabe': 'Ahab',
    'absalao': 'Absalom',
    'nabucodonosor': 'Nebuchadnezzar',
    'belsazar': 'Belshazzar',
    'farao': 'Pharaoh',
    'faraos': 'Pharaoh',
    'elias': 'Elijah',
    'eliseu': 'Elisha',
    'sansao': 'Samson',
    'dalila': 'Delilah',
    'jonas': 'Jonah',
    'lo': 'Lot',
    'ezequias': 'Hezekiah',
    'noe': 'Noah',
    'o dilúvio': 'The Flood',
    'o diluvio': 'The Flood',
    'torre de babel': 'The Tower of Babel',
    'queda de jerico': 'The Fall of Jericho'
  };

  const NUMEROS_EXTENSO = [
    'Zero',
    'Um',
    'Dois',
    'Três',
    'Quatro',
    'Cinco',
    'Seis',
    'Sete',
    'Oito',
    'Nove',
    'Dez',
    'Onze',
    'Doze'
  ];

  // Dicionário Fonético para Síntese TTS (OpenAI Neural TTS)
  // Aplicado exclusivamente ao payload de áudio, preservando o texto exibido na tela.
  const DICIONARIO_PRONUNCIA_TTS = [
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Bete-Semes(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Bét-Sêmesh' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Quiriate-Jearim(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Kiriát-Yearím' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Obede-Edom(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Obéd-Edóm' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Senaqueribe(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Senaqueríbe' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Rabsaqu[eé](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Rabsakê' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Nisroque(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Nisroc' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Sidom(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Sidóm' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Ai[oô](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Ai-ô' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Nadabe(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Nadáb' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Abi[uú](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Abi-ú' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Cor[aá](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Corá' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Uz[aá](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Uzá' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Perez-Uz[aá](?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Peréz-Uzá' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Hazael(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Hazaél' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Tiglate-Pileser(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Tiglát-Piléser' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Safira(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Safíra' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Ananias(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Ananías' },
    { termo: /(?:^|(?<=[^a-zA-Z0-9À-ÖØ-öø-ÿ]))Herodes\s+Agripa(?=[^a-zA-Z0-9À-ÖØ-öø-ÿ]|$)/gi, pronuncia: 'Herodes Agrípa' }
  ];

  // Cache em memória dos textos bíblicos carregados
  const _bibleCache = {};

  // ==========================================================================
  // UTILITÁRIOS DE TEXTO
  // ==========================================================================

  function contarPalavras(texto) {
    return (texto || '').trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Remove acentos e caracteres especiais para comparação fonética/textual
   */
  function normalizarTexto(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Aplica uma função apenas ao texto que está FORA de aspas (aspas preservadas intactas). */
  function aplicarForaDeAspas(texto, fn) {
    if (!texto) return '';
    return texto
      .split(/("[^"]*")/)
      .map((parte, i) => (i % 2 === 1 ? parte : fn(parte)))
      .join('');
  }

  /** Remove trechos entre aspas (substitui por espaço) para checagens "fora de aspas". */
  function removerAspas(texto) {
    return (texto || '').replace(/"[^"]*"/g, ' ');
  }

  function protegerAspas(texto) {
    const q = [];
    const t = (texto || '').replace(/"[^"]*"/g, m => {
      q.push(m);
      return '\u27E6' + (q.length - 1) + '\u27E7';
    });
    return { t, q };
  }

  function restaurarAspas(t, q) {
    return t.replace(/\u27E6(\d+)\u27E7/g, (_, i) => q[Number(i)]);
  }

  function dividirSentencas(t) {
    return (t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(s => s.trim()).filter(Boolean);
  }

  /**
   * Corrige a capitalização de termos sagrados (Deus, Bíblia, Senhor, Escrituras)
   * SOMENTE fora de aspas (citações literais não são alteradas).
   */
  function corrigirCapitalizacaoSacra(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return aplicarForaDeAspas(texto, parte => parte
      .replace(/(?<!\bum\s)(?<!\boutro\s)(?<!\balgum\s)(?<!\bfalso\s)\bdeus\b/g, 'Deus')
      .replace(/\bb[ií]blia\b/gi, 'Bíblia')
      .replace(/\bsenhor\b/g, 'Senhor')
      .replace(/\bescrituras\b/gi, 'Escrituras')
      .replace(/\besp[ií]rito\s+santo\b/gi, 'Espírito Santo'));
  }

  /**
   * Capitaliza a primeira letra de cada frase (depois de ". ", "! ", "? " e no início
   * de cada parágrafo/item), sem tocar em texto dentro de aspas e sem alterar
   * nomes próprios nem siglas já em maiúscula.
   */
  function capitalizarInicioFrases(texto) {
    if (!texto || typeof texto !== 'string') return '';
    const { t, q } = protegerAspas(texto);
    let processado = t.replace(/(^|[.!?]\s+|\n+\s*)([\p{Ll}])/gu, (m, pont, char) => {
      return pont + char.toUpperCase();
    });

    processado = processado.replace(/\u27E6(\d+)\u27E7\s+([\p{Ll}])/gu, (m, idx, char) => {
      const conteudoAspas = q[Number(idx)] || '';
      if (/[.!?][\"'”’]?$/.test(conteudoAspas.trim())) {
        return '\u27E6' + idx + '\u27E7 ' + char.toUpperCase();
      }
      return m;
    });

    return restaurarAspas(processado, q);
  }

  /**
   * Formata referências com link direto para o BibleGateway
   */
  function gerarLinkBibleGateway(referencia, idioma = 'pt') {
    const versao = idioma === 'en' ? 'KJV' : idioma === 'es' ? 'RVR1960' : 'ARC';
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(referencia)}&version=${versao}`;
  }

  // ==========================================================================
  // LISTAS DE PALAVRAS / EXPRESSÕES PROIBIDAS (checagem em CÓDIGO)
  // ==========================================================================
  function reProibida(src) {
    return new RegExp('(?<![\\p{L}\\p{N}])(?:' + src + ')(?![\\p{L}\\p{N}])', 'iu');
  }

  const PALAVRAS_PROIBIDAS = [
    { rotulo: 'fatal', re: reProibida('fatal|fatais') },
    { rotulo: 'devastadora', re: reProibida('devastador(?:a|as|es)?') },
    { rotulo: 'absoluto', re: reProibida('absolut[oa]s?') },
    { rotulo: 'pânico', re: reProibida('p[âa]nic[oa]s?') },
    { rotulo: 'gritos de desespero', re: reProibida('gritos?\\s+de\\s+desespero') },
    { rotulo: 'soberbo', re: reProibida('soberb[oa]s?') },
    { rotulo: 'vaidoso', re: reProibida('vaidos[oa]s?') },
    { rotulo: 'aduladora', re: reProibida('adulador(?:a|as|es)?') },
    { rotulo: 'fascinada', re: reProibida('fascinad[oa]s?') },
    { rotulo: 'farsa', re: reProibida('farsas?') },
    { rotulo: 'premeditado', re: reProibida('premeditad[oa]s?|engano\\s+premeditado') },
    { rotulo: 'agonia espantosa', re: reProibida('agonia\\s+espantosa') },
    { rotulo: 'poderoso rei', re: reProibida('poderoso\\s+rei') },
    { rotulo: 'falso Deus', re: reProibida('falso\\s+deus') },
    { rotulo: 'ímpios', re: reProibida('ímpios|impios') },
    { rotulo: 'profanação', re: reProibida('profana[çc][ãa]o') },
    { rotulo: 'tragédia', re: reProibida('trag[ée]dias?') },
    { rotulo: 'trágico', re: reProibida('tr[áa]gic[oa]s?') }
  ];

  // Jargões de "relatório" também vetados (fora de aspas)
  const JARGOES_PROIBIDOS = [
    { rotulo: 'o texto sagrado', re: reProibida('o\\s+texto\\s+sagrado') },
    { rotulo: 'o relato bíblico afirma/descreve/expõe', re: reProibida('o\\s+relato\\s+b[ií]blico\\s+(?:afirma|descreve|exp[oõ]e|informa|declara)') },
    { rotulo: 'a narrativa bíblica limita-se', re: reProibida('a\\s+narrativa\\s+b[ií]blica\\s+limita-se') },
    { rotulo: 'análise documental', re: reProibida('an[aá]lise\\s+documental') },
    { rotulo: 'sem presumir', re: reProibida('sem\\s+presumir') },
    { rotulo: 'reflexão sóbria', re: reProibida('reflex[ãa]o\\s+s[óo]bria') }
  ];

  /** Lista de termos proibidos presentes FORA de aspas. */
  function detectarProibidas(texto, versiculosTexto = '') {
    const fora = removerAspas(texto);
    const achados = [];
    for (const p of [...PALAVRAS_PROIBIDAS, ...JARGOES_PROIBIDOS]) {
      const m = fora.match(p.re);
      if (!m) continue;
      // "profanação" só é permitida se estiver nos versículos
      if (p.rotulo === 'profanação' && normalizarTexto(versiculosTexto).includes('profana')) continue;
      achados.push({ rotulo: p.rotulo, trecho: m[0] });
    }
    return achados;
  }

  const PADROES_MORAL_FECHO = [
    /\bju[íi]zo\s+(?:direto|do\s+Senhor|de\s+Deus|divino)\b/i,
    /\bimpunemente\b/i,
    /\bnão\s+(?:foi|é|era|eram|são)\b[^.!?]*?,\s*(?:foi|é|era|eram|são|mas)\b/i,
    /\bnenhum\s+(?:homem|orgulho|poder|rei)\b/i,
    /\ba\s+queda\s+d[eoa]\b/i,
    /\bsenten[çc]a\s+(?:direta|do\s+Senhor)\b/i,
    /\b(?:li[çc][ãa]o|moral)\b/i,
    /\bmostra\s+que\b/i,
    /\bensina\b/i
  ];

  /** Retorna a última sentença se ela contiver moral/comentário; senão null. */
  function fechoComMoral(texto) {
    const { t, q } = protegerAspas(texto);
    const sentencas = dividirSentencas(t).filter(s => !/manuscritos divergem/i.test(s));
    if (sentencas.length === 0) return null;
    const ultima = sentencas[sentencas.length - 1];
    return PADROES_MORAL_FECHO.some(re => re.test(ultima)) ? restaurarAspas(ultima, q) : null;
  }

  /** Detecta contraste "não é X, é Y" (ou equivalente) apoiado em texto. */
  const PADROES_CONTRASTE = [
    /\bnão\s+(?:é|foi|era|eram|são)\s+[^.!?]{1,70}?,\s*(?:mas\s+)?(?:é|foi|era|eram|são|sim)\b/i,
    /\bnão\s+[^.!?"]{1,60}?[,;]\s*(?:mas|antes|e\s+sim)\b/i,
    /,\s*e\s+não\s+(?:de|é|foi)\b/i,
    /\bnão\s+mentiste\b[^.!?]{0,40},\s*mas\b/i,
    /\bnão\s*[;,]\s*antes\b/i
  ];
  function temContraste(texto) {
    return PADROES_CONTRASTE.some(re => re.test(texto || ''));
  }

  /** Texto termina no meio de frase / aspas abertas? */
  function terminaIncompleto(texto) {
    const t = (texto || '').trim();
    if (!t) return true;
    if (((t.match(/"/g) || []).length) % 2 !== 0) return true;
    return !/[.!?…"”)]$/.test(t);
  }

  /** Instrução do item pede para omitir número de mortos? */
  function exigeOmitirMortos(instrucao) {
    return /(omitir|omita|sem|n[ãa]o\s+cit\w+)[^.;]{0,40}(n[úu]mero|quantidade|total)[^.;]{0,25}(mortos|mortes|v[ií]timas)/i.test(instrucao || '');
  }

  const REGEX_NUMERAL_MORTOS = /(?:\b\d[\d.,]*\b|\b(?:cinq[uü]enta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos?|trezentos?|quatrocentos?|quinhentos?|mil)\b)/i;
  const REGEX_CONTEXTO_MORTOS = /\b(?:homens|mortos|povo|feridos|pessoas|morreram|feriu|ferido|mortes)\b/i;

  /**
   * 1. PARSE: Extrai da "Ideia de Vídeo Escolhida" a lista de N itens com passagens bíblicas e instruções [colchetes]
   * Instrução por item: "4. Bete-Semes (1 Samuel 6:19) [omitir o número de mortos]"
   * Contexto extra por item: "[contexto: Gênesis 18:20-33; Gênesis 19:1-23]"
   */
  function parseIdeia(ideiaTexto, permitirParcial = false) {
    if (!ideiaTexto || typeof ideiaTexto !== 'string' || !ideiaTexto.trim()) {
      throw new Error('Por favor, informe a "Ideia de Vídeo Escolhida" com os itens e suas passagens bíblicas.');
    }

    const linhas = ideiaTexto
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    let tema = '';
    const itens = [];

    const itemRegex = /^(?:item\s*)?(\d{1,2})[\.\)\s\:\-\–\—]+(.+)$/i;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const match = linha.match(itemRegex);

      if (match) {
        const num = parseInt(match[1], 10);
        let corpo = match[2].trim();

        // 1. Instrução específica entre colchetes [ ]
        let instrucaoItem = '';
        const colchetesMatch = corpo.match(/\[([^\]]+)\]/);
        if (colchetesMatch) {
          instrucaoItem = colchetesMatch[1].trim();
          corpo = corpo.replace(/\[[^\]]+\]/g, '').trim();
        }

        // 1b. Contexto extra: "contexto: Livro cap:ver; Livro cap:ver"
        let contextoExtra = '';
        let instrucaoNarrativa = instrucaoItem;
        const mCtx = instrucaoItem.match(/(?:^|[;,.]\s*)contexto\s*:\s*(.+)$/i);
        if (mCtx) {
          contextoExtra = mCtx[1].trim();
          instrucaoNarrativa = instrucaoItem.slice(0, mCtx.index).replace(/[;,.\s]+$/, '').trim();
        }

        let nome = corpo;
        let referenciaStr = '';
        let observacaoParenteses = '';

        // 2. Blocos entre parênteses: referência ou nota adicional
        const parentesesMatches = [...corpo.matchAll(/\(([^)]+)\)/g)];
        if (parentesesMatches.length > 0) {
          for (const pMatch of parentesesMatches) {
            const conteudo = pMatch[1].trim();
            if (temReferenciaBiblica(conteudo) && !referenciaStr) {
              referenciaStr = conteudo;
            } else if (!observacaoParenteses) {
              observacaoParenteses = conteudo;
            }
          }
          nome = corpo.replace(/\([^)]+\)/g, '').trim();
        }

        // 3. Referência por hífen/dois-pontos/travessão
        if (!referenciaStr) {
          const sepMatch = corpo.match(/[-–—:]\s*([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ\s]+(?:\d+[:\.]\d+(?:[-–—\d,\s]+)*|\d+))\s*(?:\((.*)\))?$/i);
          if (sepMatch) {
            referenciaStr = sepMatch[1].trim();
            nome = corpo.slice(0, sepMatch.index).trim();
            if (sepMatch[2] && !observacaoParenteses) observacaoParenteses = sepMatch[2].trim();
          }
        }

        // 4. Qualquer padrão bíblico no corpo
        if (!referenciaStr) {
          const refAvulsaMatch = corpo.match(/\b([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)?\s+\d+(?:[:\.]\d+(?:[-–—]\d+)?))\b/i);
          if (refAvulsaMatch && temReferenciaBiblica(refAvulsaMatch[1])) {
            referenciaStr = refAvulsaMatch[1].trim();
            nome = corpo.replace(refAvulsaMatch[0], '').trim();
          }
        }

        nome = nome.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '').trim();
        const observacao = instrucaoNarrativa || observacaoParenteses;

        itens.push({
          numero: num,
          numeroFalado: NUMEROS_EXTENSO[num] || String(num),
          nome,
          referenciaStr,
          instrucaoItem: instrucaoItem || observacaoParenteses,
          instrucaoNarrativa: observacao,
          contextoExtra,
          observacao,
          linhaOriginal: linha
        });
      } else {
        if (!tema && itens.length === 0) {
          tema = linha;
        }
      }
    }

    if (itens.length === 0) {
      throw new Error(
        'Não foi possível extrair a lista de itens da ideia escolhida. ' +
        'Certifique-se de listar de 6 a 12 itens numerados com suas respectivas passagens bíblicas ' +
        '(Ex: 1. Nadabe e Abiú - Levítico 10:1-2).'
      );
    }

    if (!permitirParcial && (itens.length < 6 || itens.length > 12)) {
      throw new Error(
        `O estilo Catálogo exige entre 6 e 12 itens (foram identificados ${itens.length} itens). ` +
        'Por favor, ajuste a lista de itens.'
      );
    }

    for (const item of itens) {
      if (!item.referenciaStr || !temReferenciaBiblica(item.referenciaStr)) {
        throw new Error(
          `O Item ${item.numero} ("${item.nome || 'sem nome'}") não possui uma passagem bíblica válida. ` +
          'No estilo Catálogo, cada item precisa indicar o livro, capítulo e versículos correspondentes.'
        );
      }
    }

    return {
      tema: tema ? corrigirCapitalizacaoSacra(tema) : 'Catálogo de Fatos Bíblicos',
      totalItens: itens.length,
      itens
    };
  }

  /**
   * Checa se uma string contém indícios de referência bíblica (Livro e Capítulo/Versículo)
   */
  function temReferenciaBiblica(str) {
    if (!str || typeof str !== 'string') return false;
    const s = normalizarTexto(str);
    for (const prefix of Object.keys(LIVROS_MAP)) {
      if (s.startsWith(prefix) || s.includes(' ' + prefix)) {
        if (/\d+/.test(s)) return true;
      }
    }
    return /\b[1-3]?\s*[a-zà-öø-ÿ]+\s+\d+(?:[:\.]\d+)?\b/i.test(str);
  }

  /**
   * 2. VERSÍCULOS: Carrega a Bíblia JSON do disco (Node) ou via fetch (Navegador)
   */
  async function obterBibliaJson(idioma = 'pt', versao = 'arc') {
    const vNorm = (versao || '').toLowerCase().trim();
    let nomeArquivo;
    if (idioma === 'en') {
      nomeArquivo = 'en_kjv.json';
    } else if (idioma === 'es') {
      nomeArquivo = 'es_rvr.json';
    } else {
      // Português: 'arc' é o padrão (Almeida Revista e Corrigida); 'aa' ou 'jfa' é Almeida Atualizada
      nomeArquivo = (vNorm === 'aa' || vNorm === 'ara' || vNorm === 'jfa') ? 'pt_jfa.json' : 'pt_arc.json';
    }

    if (_bibleCache[nomeArquivo]) {
      return _bibleCache[nomeArquivo];
    }

    let rawData = null;

    try {
      if (typeof require === 'function') {
        const fs = require('fs');
        const path = require('path');
        const possiveisCaminhos = [
          path.join(process.cwd(), 'data', 'bible', nomeArquivo),
          path.join(__dirname, '..', 'data', 'bible', nomeArquivo),
          path.join(__dirname, 'data', 'bible', nomeArquivo),
          path.resolve('data/bible', nomeArquivo)
        ];

        for (const p of possiveisCaminhos) {
          if (fs.existsSync && fs.existsSync(p)) {
            rawData = fs.readFileSync(p, 'utf8');
            break;
          }
        }
      }
    } catch (e) {
      // Continua para fetch se require não estiver disponível
    }

    if (!rawData && typeof fetch === 'function') {
      try {
        const res = await fetch(`/data/bible/${nomeArquivo}`);
        if (res.ok && typeof res.text === 'function') {
          rawData = await res.text();
        }
      } catch (e) {
        console.warn(`[CatalogoModule] Falha ao carregar /data/bible/${nomeArquivo}:`, e);
      }
    }

    if (!rawData) {
      throw new Error(`Não foi possível carregar a base de dados bíblica (${nomeArquivo}).`);
    }

    if (rawData.charCodeAt(0) === 0xFEFF) {
      rawData = rawData.slice(1);
    }

    const parsed = JSON.parse(rawData);
    _bibleCache[nomeArquivo] = parsed;
    return parsed;
  }

  /**
   * Converte nome do livro em chave canônica
   */
  function resolverLivroCanonica(nomeLivro) {
    const norm = normalizarTexto(nomeLivro);
    if (LIVROS_MAP[norm]) return LIVROS_MAP[norm];

    for (const [k, v] of Object.entries(LIVROS_MAP)) {
      if (norm.startsWith(k) || norm === k) {
        return v;
      }
    }
    return null;
  }

  /** Interpreta "Livro cap:v1-v2; Livro cap:v" em blocos com os versículos do JSON. */
  function extrairBlocos(biblia, referenciaStr, capituloInteiroMax = 15) {
    const subReferencias = (referenciaStr || '')
      .split(/[\;\+]\s*(?=[1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ])|,\s*(?=[1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ]{3,}\s+\d)/)
      .map(s => s.trim())
      .filter(Boolean);
    const blocos = [];

    for (const ref of subReferencias) {
      // 1. Intervalo multi-capítulo (ex: "2 Reis 18:13 a 19:7" ou "2 Reis 18:13-19:7")
      const matchMulti = ref.match(/^([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ\.\s]+?)\s+(\d+)[:\.](\d+)\s*(?:a|até|-|–|—)\s*(\d+)[:\.](\d+)$/i);
      if (matchMulti) {
        const rawLivro = matchMulti[1].trim();
        const cap1 = parseInt(matchMulti[2], 10);
        const v1 = parseInt(matchMulti[3], 10);
        const cap2 = parseInt(matchMulti[4], 10);
        const v2 = parseInt(matchMulti[5], 10);

        const abbrevLivro = resolverLivroCanonica(rawLivro);
        if (!abbrevLivro) continue;
        const livroIdx = biblia.findIndex(b => b.abbrev.toLowerCase() === abbrevLivro);
        if (livroIdx < 0) continue;
        const livroObj = biblia[livroIdx];
        const nomeOficial = livroObj.name;

        for (let c = cap1; c <= cap2; c++) {
          const cIdx = c - 1;
          if (cIdx < 0 || cIdx >= livroObj.chapters.length) continue;
          const capVers = livroObj.chapters[cIdx];
          const vStart = (c === cap1) ? Math.max(1, v1) : 1;
          const vEnd = (c === cap2) ? Math.min(capVers.length, v2) : capVers.length;

          blocos.push({
            livro: nomeOficial,
            abbrev: abbrevLivro,
            livroIdx,
            capitulo: c,
            vStart,
            vEnd,
            inteiro: false,
            capVersiculos: capVers,
            formatada: `${nomeOficial} ${c}:${vStart}-${vEnd}`
          });
        }
        continue;
      }

      // 2. Intervalo dentro do mesmo capítulo
      const match = ref.match(/^([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ\.\s]+?)\s+(\d+)(?:[:\.](\d+)(?:[-–—](\d+))?)?/i);
      if (!match) continue;

      const rawLivro = match[1].trim();
      const capNum = parseInt(match[2], 10);
      const verInicio = match[3] ? parseInt(match[3], 10) : null;
      const verFim = match[4] ? parseInt(match[4], 10) : (verInicio !== null ? verInicio : null);

      const abbrevLivro = resolverLivroCanonica(rawLivro);
      if (!abbrevLivro) continue;

      const livroIdx = biblia.findIndex(b => b.abbrev.toLowerCase() === abbrevLivro);
      if (livroIdx < 0) continue;
      const livroObj = biblia[livroIdx];

      const capIndex = capNum - 1;
      if (capIndex < 0 || capIndex >= livroObj.chapters.length) continue;

      const capVersiculos = livroObj.chapters[capIndex];
      const nomeOficial = livroObj.name;

      let vStart;
      let vEnd;
      let inteiro = false;
      let formatada;
      if (verInicio === null) {
        inteiro = true;
        vStart = 1;
        vEnd = Math.min(capituloInteiroMax, capVersiculos.length);
        formatada = `${nomeOficial} ${capNum}:1-${vEnd} (primeiros ${capituloInteiroMax} versículos)`;
      } else {
        vStart = Math.max(1, verInicio);
        vEnd = Math.min(capVersiculos.length, verFim || vStart);
        formatada = vStart === vEnd
          ? `${nomeOficial} ${capNum}:${vStart}`
          : `${nomeOficial} ${capNum}:${vStart}-${vEnd}`;
      }

      blocos.push({
        livro: nomeOficial,
        abbrev: abbrevLivro,
        livroIdx,
        capitulo: capNum,
        vStart,
        vEnd,
        inteiro,
        capVersiculos,
        formatada
      });
    }
    return blocos;
  }

  /**
   * Extrai os versículos citados + CONTEXTO PERMITIDO do mesmo capítulo
   * (até 8 versículos antes e 8 depois) + contexto extra opcional (outros capítulos).
   */
  async function carregarVersiculos(referenciaStr, idioma = 'pt', opcoes = {}) {
    const antes = opcoes.contextoAntes !== undefined ? opcoes.contextoAntes : (LIMITES.contextoAntes || 8);
    const depois = opcoes.contextoDepois !== undefined ? opcoes.contextoDepois : (LIMITES.contextoDepois || 4);
    const traducao = opcoes.traducao || (idioma === 'pt' ? 'arc' : '');
    const biblia = await obterBibliaJson(idioma, traducao);

    const blocos = extrairBlocos(biblia, referenciaStr);
    const versiculosExtraidos = [];
    const mapaCentral = new Set();
    const referenciasFormatadas = [];

    for (const b of blocos) {
      referenciasFormatadas.push(b.formatada);
      for (let v = b.vStart; v <= b.vEnd; v++) {
        versiculosExtraidos.push({
          livro: b.livro, abbrev: b.abbrev, capitulo: b.capitulo, versiculo: v, texto: b.capVersiculos[v - 1]
        });
        mapaCentral.add(`${b.abbrev}|${b.capitulo}|${v}`);
      }
    }

    // Contexto: vizinhos do mesmo capítulo
    const mapaContexto = new Map();
    const registrar = (b, v, central) => {
      const key = `${b.abbrev}|${b.capitulo}|${v}`;
      if (mapaContexto.has(key)) return;
      mapaContexto.set(key, {
        livro: b.livro, abbrev: b.abbrev, livroIdx: b.livroIdx, capitulo: b.capitulo, versiculo: v,
        texto: b.capVersiculos[v - 1], central: central || mapaCentral.has(key)
      });
    };

    for (const b of blocos) {
      if (b.inteiro) {
        for (let v = b.vStart; v <= b.vEnd; v++) registrar(b, v, true);
        continue;
      }
      const ctxStart = Math.max(1, b.vStart - antes);
      const ctxEnd = Math.min(b.capVersiculos.length, b.vEnd + depois);
      for (let v = ctxStart; v <= ctxEnd; v++) registrar(b, v, v >= b.vStart && v <= b.vEnd);
    }

    // Contexto extra (instrução "contexto: ...")
    const extraBlocos = opcoes.contextoExtra ? extrairBlocos(biblia, opcoes.contextoExtra, 40) : [];
    for (const b of extraBlocos) {
      for (let v = b.vStart; v <= b.vEnd; v++) registrar(b, v, false);
    }

    const ordenados = [...mapaContexto.values()].sort((a, b) =>
      a.livroIdx - b.livroIdx || a.capitulo - b.capitulo || a.versiculo - b.versiculo
    );

    const textoCompleto = versiculosExtraidos
      .map(v => `[${v.livro} ${v.capitulo}:${v.versiculo}] "${v.texto}"`)
      .join('\n');

    const textoContextoCompleto = ordenados.length > 0
      ? ordenados
        .map(v => `[${v.livro} ${v.capitulo}:${v.versiculo}] "${v.texto}"${v.central ? '  <- PASSAGEM CENTRAL' : ''}`)
        .join('\n')
      : textoCompleto;

    return {
      referenciaOriginal: referenciaStr,
      referenciasFormatadas,
      versiculos: versiculosExtraidos,
      versiculosContexto: ordenados,
      blocosCentrais: blocos.map(b => ({
        abbrev: b.abbrev, livro: b.livro, capitulo: b.capitulo, vStart: b.vStart, vEnd: b.vEnd
      })),
      textoCompleto,
      textoContextoCompleto,
      contextoExtraFormatado: extraBlocos.map(b => b.formatada),
      bibleGatewayUrl: gerarLinkBibleGateway(referenciasFormatadas[0] || referenciaStr, idioma)
    };
  }

  /** "Levítico 10:1-2" -> "Levítico 10" ; "2 Reis 18:13; 2 Reis 19:35" -> "2 Reis 18 e 19" */
  function referenciaCapituloFalada(referenciaFormatada, contextoExtraStr = '') {
    const capsPorLivro = {};

    function processar(str) {
      if (!str) return;
      const partes = str.split(/;\s*/);
      for (const p of partes) {
        const m = p.match(/^([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ\.\s]+?)\s+(\d+)(?::\d+(?:-\d+)?)?/);
        if (m) {
          const livro = m[1].trim();
          const cap = Number(m[2]);
          if (!capsPorLivro[livro]) capsPorLivro[livro] = new Set();
          capsPorLivro[livro].add(cap);
        }
      }
    }

    processar(contextoExtraStr);
    processar(referenciaFormatada);

    const livros = Object.keys(capsPorLivro);
    if (livros.length === 0) return referenciaFormatada || '';

    const frases = livros.map(livro => {
      const caps = Array.from(capsPorLivro[livro]).sort((a, b) => a - b);
      if (caps.length === 1) {
        return `${livro} ${caps[0]}`;
      } else if (caps.length === 2) {
        return `${livro} ${caps[0]} e ${caps[1]}`;
      } else {
        return `${livro} ${caps.slice(0, -1).join(', ')} e ${caps[caps.length - 1]}`;
      }
    });

    return frases.join(' e ');
  }

  /** Mantida para compatibilidade com testes */
  function referenciaFalada(referenciaFormatada) {
    return (referenciaFormatada || '')
      .split(/;\s*/)
      .map(r => {
        const m = r.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
        if (!m) return r.trim();
        const [, livro, cap, a, b] = m;
        if (!b || b === a) return `${livro} ${cap}, versículo ${a}`;
        return Number(b) === Number(a) + 1
          ? `${livro} ${cap}, versículos ${a} e ${b}`
          : `${livro} ${cap}, versículos ${a} a ${b}`;
      })
      .join(' e ');
  }

  // ==========================================================================
  // PROMPTS
  // ==========================================================================
  const LISTA_PROIBIDAS_PROMPT = 'fatal, devastadora, absoluto, pânico, gritos de desespero, soberbo, vaidoso, aduladora, fascinada, farsa, premeditado/premeditada, engano premeditado, agonia espantosa, poderoso rei, falso Deus, ímpios (fora de aspas), profanação (se não estiver nos versículos), tragédia, trágico';

  const EXEMPLOS_REFERENCIA_PROMPT = `EXEMPLOS DE TOM E ESTRUTURA (aprenda a cadência e a estrutura narrativa; NÃO copie frases nem fatos):

--- EXEMPLO 1 (Item Corá) ---
Dois, Corá e seus seguidores. Isso está em Números 16. Corá, Datã e Abirão, junto com duzentos e cinquenta líderes de Israel, se levantaram contra Moisés e Arão. Disseram que toda a congregação era santa e perguntaram por que os dois se punham acima do povo. Moisés caiu com o rosto em terra. Propôs uma prova para o dia seguinte: cada um traria o seu incensário diante do Senhor. No dia marcado, Moisés mandou o povo se afastar das tendas de Corá, Datã e Abirão. Datã e Abirão ficaram de pé à porta das tendas, com as mulheres e os filhos. Moisés disse que, se aqueles homens morressem como todos os homens, o Senhor não o havia enviado. Mas, se a terra abrisse a boca e os tragasse vivos, todos saberiam que eles tinham desprezado o Senhor. Quando ele acabou de falar, o chão debaixo deles se fendeu. A terra os tragou com as suas casas, e eles desceram vivos à sepultura. Todo o Israel ao redor fugiu ao ouvir o clamor deles. E saiu fogo do Senhor e consumiu os duzentos e cinquenta homens que ofereciam incenso.

--- EXEMPLO 2 (Item Ananias e Safira) ---
Sete, Ananias e Safira. Isso está em Atos 5. Na igreja de Jerusalém, muitos vendiam as suas terras e entregavam o valor aos apóstolos, para ajudar os necessitados. Ananias e a esposa, Safira, também venderam uma propriedade. Ele reteve parte do preço, com o conhecimento da esposa, e levou o resto aos pés dos apóstolos. Pedro lhe disse que Satanás havia enchido o seu coração, para que mentisse ao Espírito Santo e retivesse parte do preço da herdade. Lembrou que a propriedade era dele antes de vender, e que o dinheiro continuava em seu poder depois da venda. E acrescentou: "Não mentiste aos homens, mas a Deus." Ouvindo isso, Ananias caiu e expirou. Grande temor veio sobre todos os que souberam. Os jovens o envolveram e o sepultaram. Cerca de três horas depois, Safira entrou sem saber o que havia acontecido. Pedro lhe perguntou se haviam vendido a terra por aquele preço. Ela disse que sim. Pedro respondeu que os pés dos que sepultaram o marido estavam à porta. Safira caiu aos pés dele e expirou. Os jovens a sepultaram ao lado do marido. Grande temor veio sobre toda a igreja.

ATENÇÃO: Os exemplos acima servem EXCLUSIVAMENTE para você aprender o TOM de narração, o ritmo de frases curtas e diretas, e o fluxo onde o contexto situa o fato antes dele acontecer, terminando no desfecho imediato. Escreva a partir dos versículos fornecidos abaixo para o item solicitado, sem reaproveitar frases dos exemplos.`;

  function blocoRegrasNarracao(referenciaFormatada, contextoExtra = '', traducao = 'arc') {
    const refCap = referenciaCapituloFalada(referenciaFormatada, contextoExtra);
    const nomeTraducao = (traducao === 'aa' || traducao === 'jfa') ? 'Almeida Atualizada (ARA)' : 'Almeida Revista e Corrigida (ARC)';
    return `REGRAS DA NARRAÇÃO:
1. ABERTURA E FONTE:
   - A passagem é dita UMA ÚNICA VEZ por item, logo depois do marcador e nome do item: "Isso está em ${refCap}."
   - PROIBIDO repetir "Em [Livro] [capítulo], versículo N" ou ficar anunciando versículos a cada frase. Narre a história diretamente! Se usar um fato essencial de OUTRO livro ou capítulo, cite esse livro/capítulo UMA ÚNICA VEZ no ponto em que ele entra (exemplo: "Em 1 Crônicas 15, o próprio Davi diz que..."), nunca versículo por versículo.
2. FOCO E PROPORÇÃO OBRIGATÓRIA (Situação 20% | Fato Central 60% | Consequência 20%):
   - (a) SITUAÇÃO INICIAL (~20%, 1 a 3 frases): Situe QUEM é o personagem e POR QUE está na cena (o contexto imediato que motivou a cena).
     * Exemplo Herodes: Herodes mandou matar Tiago, prendeu Pedro, Pedro foi libertado milagrosamente, e Herodes foi a Cesareia, irritado com Tiro e Sidom.
     * Exemplo Senaqueribe: O rei da Assíria invadiu as cidades fortificadas de Judá, cercou Jerusalém, zombou de Deus através de Rabsaqué e Ezequias orou no templo.
     * PROIBIDO episódios laterais desconectados que não expliquem o fato central (ex.: NUNCA gaste frases com a criada Rode abrindo portão a Pedro).
     * Resuma listas extensas em uma expressão simples (ex.: "com instrumentos", "com dádivas de ouro").
   - (b) FATO CENTRAL (~60%): Conte detalhadamente o evento central e o clímax a partir dos versículos citados, com frases curtas, ativas e diretas.
   - (c) CONSEQUÊNCIA IMEDIATA REGISTRADA (~20%): Feche o item estritamente com a consequência imediata registrada nas Escrituras.
     * Exemplo Uzá: Davi teve medo do Senhor e a arca ficou três meses na casa de Obede-Edom, o geteu, e o Senhor abençoou a sua casa.
     * Exemplo Senaqueribe: Os 185 mil mortos na noite, a retirada para Nínive e a morte pelas mãos dos filhos no templo de Nisroque.
     * Exemplo Herodes: A morte no tribunal comido de bichos e o crescimento da palavra de Deus.
     * Se o item for sobre um rei ou personagem: gaste no máximo 2 frases com o antecessor ou com outros personagens. O fato central é estritamente o FIM do personagem (como morreu ou foi deposto), nunca o de outro personagem. Se o texto bíblico não disser como ele morreu, diga 'o texto não diz como [nome] morreu' e conte o que aconteceu com ele (prisão, deposição, exílio).
     * NUNCA termine com regras, leis posteriores ou comentários morais.
3. TOM E TRADUÇÃO (${nomeTraducao}):
   - Frases curtas, diretas, voz ativa. Discurso direto quando o texto traz fala ("Quem poderia estar em pé perante o Senhor, este Deus santo?"). Fala longa vira fala indireta ("Moisés disse a Arão que...").
   - Citação entre aspas: no máximo 1 por item, curta, e COPIADA literalmente dos versículos carregados.
   - Nomes e grafia seguem a tradução ${nomeTraducao} dos versículos carregados (ex. ARC: Geteu, Ararate, "tribunal", "Voz de Deus, e não de homem!", "comido de bichos", "os bois a deixavam pender").
4. ROTULAR DADOS DE FORA DA BÍBLIA:
   - Nomes históricos não presentes nos versículos DEVEM vir expressamente rotulados na narração (exemplo: "o rei Herodes, conhecido fora da Bíblia como Herodes Agripa Primeiro").
   - Fontes históricas externas DEVEM vir rotuladas (exemplo: "Josefo, fora da Bíblia, conta que...").
   - Máximo de 1 nota ("Vale um registro honesto aqui: ...") por item, e no máximo 4 em todo o vídeo.
5. SEM ADJETIVOS DE JULGAMENTO NEM INTENÇÃO ATRIBUÍDA:
   - PROIBIDO usar (fora de aspas): ${LISTA_PROIBIDAS_PROMPT}. Proibido também jargões de relatório ("o texto sagrado", "o relato bíblico afirma/descreve/expõe", "a narrativa bíblica limita-se", "análise documental", "sem presumir", "reflexão sóbria").
   - SEM moral no fim do item (o fecho do item deve ser um FATO curto do texto).
6. CONTRASTE: use "não foi X, foi Y" (ou "não era X, mas Y" / "X, e não Y") SOMENTE quando X e Y estiverem nos versículos, em pelo menos 2 itens do roteiro (no meio do texto, nunca como fecho de moral).
7. CAPITALIZAÇÃO: Deus, Bíblia, Senhor, Escrituras sempre com inicial maiúscula.`;
  }

  /**
   * 3. ESCRITA POR ITEM
   */
  function gerarPromptItem({
    numero,
    numeroFalado,
    nomeItem,
    referenciaFormatada,
    contextoExtra,
    versiculosTexto,
    contextoCapituloTexto,
    instrucaoItem,
    instrucaoNarrativa,
    observacao,
    idioma = 'pt',
    traducao = 'arc',
    resumosAnteriores = []
  }) {
    const instrucaoEfetiva = instrucaoNarrativa || observacao || instrucaoItem || '';
    let instrucaoEspecialTxt = '';
    if (exigeOmitirMortos(instrucaoEfetiva)) {
      instrucaoEspecialTxt = `
REGRA ESPECÍFICA DESTE ITEM:
- O NÚMERO DE MORTOS NÃO PODE APARECER NO TEXTO (nenhum numeral ligado ao número de vítimas, em dígitos ou por extenso).
- Diga apenas o fato dos versículos (quem feriu e por que), sem número.
- Inclua obrigatoriamente a nota: "Vale um registro honesto aqui: os manuscritos divergem quanto ao número de mortos, por isso o número não será citado neste vídeo."`;
    } else if (instrucaoEfetiva) {
      instrucaoEspecialTxt = `
INSTRUÇÃO ESPECÍFICA DESTE ITEM (obrigatória):
- ${instrucaoEfetiva}`;
    }

    let antiRepeticaoTxt = '';
    if (resumosAnteriores && resumosAnteriores.length > 0) {
      antiRepeticaoTxt = `
FATOS JÁ NARRADOS EM ITENS ANTERIORES (PROIBIDO REPETIR):
${resumosAnteriores.map((r, idx) => `- Item ${idx + 1}: ${r}`).join('\n')}
NÃO repita nenhum destes acontecimentos! Concentre-se estritamente na história e no desfecho exclusivo deste personagem (${nomeItem}).
`;
    }

    return `Você é o roteirista sênior de documentários bíblicos falados no YouTube.
Você vai escrever o texto narrativo do Item ${numero} (${nomeItem}) para ser lido em voz alta.

${EXEMPLOS_REFERENCIA_PROMPT}

DADOS DO ITEM A ESCREVER:
- Marcador Inicial: "${numeroFalado}, ${nomeItem}."
- Passagem Central: ${referenciaFormatada}
- FOCO NO PERSONAGEM: O item é sobre ${nomeItem}. Gaste no máximo 2 frases com o antecessor ou com outros personagens. O fato central é o fim de ${nomeItem}. Se o texto bíblico não disser como ele morreu, diga 'o texto não diz como ${nomeItem} morreu' e conte o que aconteceu com ele (prisão, deposição, exílio).
${instrucaoEspecialTxt}
${antiRepeticaoTxt}
VERSÍCULOS CITADOS (ÚNICA FONTE PARA ASPAS):
"""
${versiculosTexto}
"""

CONTEXTO PERMITIDO (mesmo capítulo e capítulos indicados; use para SITUAR o fato ANTES dele ocorrer):
"""
${contextoCapituloTexto || versiculosTexto}
"""

${blocoRegrasNarracao(referenciaFormatada, contextoExtra, traducao)}

EXTENSÃO: escreva de ${LIMITES.itemAlvoMin} a ${LIMITES.itemAlvoMax} palavras (limite absoluto: ${LIMITES.itemMin} a ${LIMITES.itemMax}). Para preencher a extensão, narre os fatos bíblicos que prepararam o evento e a sua consequência imediata registrada, com frases curtas e diretas. NUNCA use adjetivos ou moral. Conte as palavras antes de entregar e termine em frase completa.

FORMATO: apenas o texto narrativo em português, em UM único parágrafo contínuo, começando com "${numeroFalado}, ${nomeItem}."`;
  }

  /**
   * 4. CONFERÊNCIA POR ITEM: Auditor (Temperature 0). Notas do auditor vão SÓ para o painel.
   */
  function gerarPromptConferenciaItem({ versiculosTexto, contextoCapituloTexto, textoItem, nomeItem, referenciaFormatada }) {
    return `Você é um auditor bíblico checador de fatos para documentários.
Sua missão é verificar se o texto do item está fiel aos acontecimentos descritos nas Escrituras fornecidas.

PASSAGEM CENTRAL DO ITEM: ${referenciaFormatada || ''}

VERSÍCULOS CITADOS:
"""
${versiculosTexto}
"""

CONTEXTO PERMITIDO:
"""
${contextoCapituloTexto || versiculosTexto}
"""

TEXTO DO ITEM GERADO:
"""
${textoItem}
"""

REGRAS DE AUDITORIA:
1. O nome do personagem do item (ex: Senaqueribe, Herodes, Arão) e os fatos do CONTEXTO PERMITIDO fazem parte da fonte: NÃO os sinalize como contexto externo.
2. Sinalize APENAS: (a) invenção de psicologia/intenção/motivo sem respaldo nos versículos; (b) fato que contradiz os versículos; (c) citação entre aspas que não seja literal.
3. Liste em "referencias_fora_da_passagem" os versículos do CONTEXTO PERMITIDO, FORA da passagem central, dos quais o texto usou algum fato. Use o formato "Livro cap:versículo" ou intervalo "Livro cap:v1-v2" (ex.: "Atos 12:20", "Gênesis 18:20-33"). Se nenhum, devolva lista vazia.

FORMATO DE RESPOSTA (JSON PURO):
{
  "aprovado": true ou false,
  "frases_nao_sustentadas": [
    { "frase": "frase exata do texto", "tipo": "motivo_inventado | citacao_incorreta | fato_contraditorio", "motivo": "explicação curta" }
  ],
  "referencias_fora_da_passagem": ["Livro cap:v"]
}`;
  }

  /**
   * Prompt para regeneração corretiva de um item (máx. 2 ciclos por defeito)
   */
  function gerarPromptRegeneracaoItem({
    numero,
    numeroFalado,
    nomeItem,
    referenciaFormatada,
    contextoExtra,
    versiculosTexto,
    contextoCapituloTexto,
    textoAnterior,
    problemas,
    instrucaoNarrativa,
    traducao = 'arc',
    resumosAnteriores = []
  }) {
    const listaProblemas = problemas
      .map(p => `- [${p.tipo}] ${p.frase ? `Trecho: "${p.frase}" — ` : ''}${p.motivo}`)
      .join('\n');
    const omitir = exigeOmitirMortos(instrucaoNarrativa)
      ? '\n- NÃO cite o número de mortos; mantenha a nota "Vale um registro honesto aqui: os manuscritos divergem quanto ao número de mortos, por isso o número não será citado neste vídeo."'
      : '';

    let antiRepeticaoTxt = '';
    if (resumosAnteriores && resumosAnteriores.length > 0) {
      antiRepeticaoTxt = `\nFATOS JÁ NARRADOS EM ITENS ANTERIORES (PROIBIDO REPETIR):\n${resumosAnteriores.map((r, idx) => `- Item ${idx + 1}: ${r}`).join('\n')}\nNÃO repita estes acontecimentos no texto deste item!`;
    }

    return `Reescreva o Item ${numero} (${numeroFalado}, ${nomeItem}) corrigindo estritamente os defeitos apontados, mantendo o tom sóbrio e os fatos bíblicos.

${EXEMPLOS_REFERENCIA_PROMPT}

VERSÍCULOS CITADOS:
"""
${versiculosTexto}
"""

CONTEXTO PERMITIDO:
"""
${contextoCapituloTexto || versiculosTexto}
"""

TEXTO ANTERIOR:
"""
${textoAnterior}
"""

DEFEITOS A CORRIGIR:
${listaProblemas}
- FOCO NO PERSONAGEM: O item é sobre ${nomeItem}. Gaste no máximo 2 frases com o antecessor ou com outros personagens. O fato central é o fim de ${nomeItem}. Se o texto bíblico não disser como ele morreu, diga 'o texto não diz como ${nomeItem} morreu' e conte o que aconteceu com ele (prisão, deposição, exílio).
${antiRepeticaoTxt}

${blocoRegrasNarracao(referenciaFormatada, contextoExtra, traducao)}${omitir}

EXTENSÃO: de ${LIMITES.itemAlvoMin} a ${LIMITES.itemAlvoMax} palavras (limite absoluto: ${LIMITES.itemMin} a ${LIMITES.itemMax}). Narre os fatos preparatórios e o desfecho imediato registrado. Termine em frase completa.

Responda APENAS com o texto narrativo corrigido em português, em um único parágrafo, começando por "${numeroFalado}, ${nomeItem}."`;
  }

  /**
   * Validação em CÓDIGO de citações entre aspas
   */
  function verificarCitacoesEmCodigo(textoItem, versiculosTexto) {
    const citacoes = [];
    const regexAspas = /"([^"]+)"|“([^”]+)”/g;
    let match;

    while ((match = regexAspas.exec(textoItem)) !== null) {
      const trecho = (match[1] || match[2] || '').trim();
      if (trecho.length > 3) {
        citacoes.push(trecho);
      }
    }

    const versiculosNorm = normalizarTexto(versiculosTexto);
    const citacoesInvalidas = [];

    for (const c of citacoes) {
      const cNorm = normalizarTexto(c);
      if (!versiculosNorm.includes(cNorm)) {
        citacoesInvalidas.push({
          citacao: c,
          motivo: 'A citação entre aspas não aparece literalmente no texto dos versículos fornecidos.'
        });
      }
    }

    return {
      totalCitacoes: citacoes.length,
      citacoes,
      citacoesInvalidas,
      todasValidas: citacoesInvalidas.length === 0
    };
  }

  // ==========================================================================
  // HIGIENIZAÇÃO E REMEDIAÇÃO EM CÓDIGO
  // ==========================================================================

  /** Extrai o texto limpo de uma resposta de modelo que possa vir em JSON ou markdown */
  function extrairTextoDeRespostaJson(respostaRaw) {
    if (!respostaRaw || typeof respostaRaw !== 'string') return '';
    let raw = respostaRaw.trim();

    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.texto === 'string' && parsed.texto.trim()) {
          return parsed.texto.trim();
        }
      } catch (e) {}
    }

    return raw.trim();
  }

  /** Remove sentenças (fora das aspas) que satisfaçam o predicado; nunca remove a 1ª sentença. */
  function filtrarSentencas(texto, pred) {
    const { t, q } = protegerAspas(texto);
    const sentencas = dividirSentencas(t);
    const manter = [];
    const removidas = [];
    sentencas.forEach((s, i) => {
      if (i > 0 && pred(s, i, sentencas.length)) removidas.push(restaurarAspas(s, q));
      else manter.push(s);
    });
    return { texto: restaurarAspas(manter.join(' '), q), removidas };
  }

  /** Conta quantas vezes o padrão "Em [Livro] [cap], versículo" aparece fora de aspas */
  function contarCitacoesVersiculo(texto) {
    if (!texto) return 0;
    const fora = removerAspas(texto);
    const regex = /\bEm\s+(?:[1-3]\s+)?[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?\s+\d+[\s,]+vers[ií]culos?\b/gi;
    const matches = fora.match(regex);
    return matches ? matches.length : 0;
  }

  /** Remove muletas do tipo "Em Levítico 10, versículo 3, " no meio do texto, mantendo a narrativa fluida */
  function limparMuletasVersiculo(texto) {
    if (!texto) return '';
    const { t, q } = protegerAspas(texto);
    // Remove ocorrências de "Em [Livro] [Cap], versículo(s) [N], " que ocorram após a abertura
    const sents = dividirSentencas(t);
    const processadas = sents.map((s, idx) => {
      if (idx === 0) return s; // não mexe na primeira frase
      return s.replace(/^Em\s+(?:[1-3]\s+)?[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?\s+\d+[\s,]+vers[ií]culos?\s+\d+(?:\s*(?:a|e)\s*\d+)?[\s,]+/i, (m) => {
        return '';
      });
    });
    return restaurarAspas(processadas.join(' '), q);
  }

  /** Extrai conjunto de trigramas de palavras normalizadas */
  function extrairTrigramas(texto) {
    const palavras = (texto || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const trigramas = new Set();
    for (let i = 0; i < palavras.length - 2; i++) {
      trigramas.add(`${palavras[i]} ${palavras[i + 1]} ${palavras[i + 2]}`);
    }
    return trigramas;
  }

  /**
   * Calcula a fração de trigramas compartilhados em relação ao menor item (0 a 1)
   */
  function calcularSobreposicaoTrigramas(textoA, textoB) {
    const triA = extrairTrigramas(textoA);
    const triB = extrairTrigramas(textoB);
    if (triA.size === 0 || triB.size === 0) return 0;
    let inter = 0;
    for (const t of triA) {
      if (triB.has(t)) inter++;
    }
    const menor = Math.min(triA.size, triB.size);
    return menor > 0 ? inter / menor : 0;
  }


  /**
   * Higieniza o item em código: parágrafo único, sem colchetes, numerais proibidos removidos,
   * nota honesta garantida (quando exigida) e capitalização sacra fora de aspas.
   */
  function higienizarItemEmCodigo(textoItem, nomeItem, instrucaoItem = '') {
    if (!textoItem || typeof textoItem !== 'string') return '';
    let t = textoItem.trim();

    // Parágrafo único (um item = um bloco falado)
    t = t.replace(/\s*\n+\s*/g, ' ').replace(/[^\S\r\n]{2,}/g, ' ');
    // Remove colchetes
    t = t.replace(/\[[^\]]*\]/g, '').replace(/[^\S\r\n]{2,}/g, ' ');

    if (exigeOmitirMortos(instrucaoItem)) {
      // Remove qualquer sentença com numeral ligado a mortos/feridos
      t = filtrarSentencas(t, s => REGEX_NUMERAL_MORTOS.test(s) && REGEX_CONTEXTO_MORTOS.test(s)).texto;
      if (!/manuscritos divergem/i.test(t)) {
        const nota = 'Vale um registro honesto aqui: os manuscritos divergem quanto ao número de mortos, por isso o número não será citado neste vídeo.';
        const { t: tp, q } = protegerAspas(t);
        const sents = dividirSentencas(tp);
        let idx = sents.findIndex(s => /\bfer(?:iu|ido|idos)\b/i.test(s));
        if (idx < 0) idx = sents.length - 1;
        sents.splice(idx + 1, 0, nota);
        t = restaurarAspas(sents.join(' '), q);
      }
    }

    t = limparMuletasVersiculo(t);

    // Rotular personagens extrabíblicos conhecidos
    for (const p of PERSONAGENS_EXTRABIBLICOS) {
      if (p.padrao.test(t)) {
        t = p.aplicar(t);
      }
    }

    t = corrigirCapitalizacaoSacra(t);
    t = capitalizarInicioFrases(t);
    return padronizarAspasEPontuacao(t);
  }

  /**
   * Remediação final (após esgotar os ciclos de correção): remove frases problemáticas
   * e devolve a lista de ações para o painel.
   */
  function remediarItem(texto, problemas, versiculosTexto) {
    let t = texto;
    const acoes = [];

    if (problemas.some(p => p.tipo === 'truncado')) {
      const ult = Math.max(t.lastIndexOf('. '), t.lastIndexOf('.'), t.lastIndexOf('!'), t.lastIndexOf('?'));
      if (ult > 0 && ult < t.length - 1) {
        acoes.push({ frase: t.slice(ult + 1).trim(), tipo: 'truncado', motivo: 'Trecho final incompleto removido.', acao: 'removida' });
        t = t.slice(0, ult + 1).trim();
      }
      if (((t.match(/"/g) || []).length) % 2 !== 0) {
        const lastQuote = t.lastIndexOf('"');
        const corte = t.lastIndexOf('. ', lastQuote);
        if (corte > 0) t = t.slice(0, corte + 1).trim();
      }
    }

    if (problemas.some(p => p.tipo === 'proibida')) {
      const todas = [...PALAVRAS_PROIBIDAS, ...JARGOES_PROIBIDOS];
      const r = filtrarSentencas(t, s => todas.some(p => {
        if (p.rotulo === 'profanação' && normalizarTexto(versiculosTexto).includes('profana')) return false;
        return p.re.test(s);
      }));
      r.removidas.forEach(f => acoes.push({ frase: f, tipo: 'proibida', motivo: 'Palavra proibida persistiu após 2 ciclos; frase removida.', acao: 'removida' }));
      t = r.texto;
    }

    if (problemas.some(p => p.tipo === 'fecho_moral')) {
      const { t: tp, q } = protegerAspas(t);
      const sents = dividirSentencas(tp);
      if (sents.length > 3) {
        const ult = sents.pop();
        acoes.push({ frase: restaurarAspas(ult, q), tipo: 'fecho_moral', motivo: 'Fecho com moral persistiu após 2 ciclos; frase removida.', acao: 'removida' });
        t = restaurarAspas(sents.join(' '), q);
      }
    }

    const invalidas = problemas.filter(p => p.tipo === 'citacao_incorreta' && p.frase);
    if (invalidas.length) {
      const r = filtrarSentencas(t, s => invalidas.some(p => restaurarAspas(s, [p.frase]).includes('"')) || false);
      // fallback por conteúdo: remove sentenças cuja aspas contenham a citação inválida
      const r2 = filtrarSentencas(t, s => invalidas.some(p => s.includes(p.frase)));
      if (r2.removidas.length) {
        r2.removidas.forEach(f => acoes.push({ frase: f, tipo: 'citacao_incorreta', motivo: 'Citação não literal persistiu; frase removida.', acao: 'removida' }));
        t = r2.texto;
      } else if (r.removidas.length === 0) {
        // citação protegida por placeholder: remove a sentença que contém a citação
        const { t: tp, q } = protegerAspas(t);
        const sents = dividirSentencas(tp);
        const manter = [];
        sents.forEach((s, i) => {
          const rest = restaurarAspas(s, q);
          if (i > 0 && invalidas.some(p => rest.includes(p.frase))) {
            acoes.push({ frase: rest, tipo: 'citacao_incorreta', motivo: 'Citação não literal persistiu; frase removida.', acao: 'removida' });
          } else manter.push(s);
        });
        t = restaurarAspas(manter.join(' '), q);
      }
    }

    return { texto: padronizarAspasEPontuacao(t), acoes };
  }

  /**
   * Padroniza aspas e pontuação: espaço antes da abertura e depois do fechamento,
   * nenhum espaço dentro das aspas.
   */
  function padronizarAspasEPontuacao(texto) {
    if (!texto || typeof texto !== 'string') return '';
    let t = texto.replace(/[“”]/g, '"');
    t = t.replace(/"([^"]*)"/g, (m, inner, offset, str) => {
      const antes = offset > 0 ? str[offset - 1] : '';
      const depois = str[offset + m.length] || '';
      const pre = antes && !/[\s(\[¿—\-\n]/.test(antes) ? ' ' : '';
      const pos = depois && /[\p{L}\p{N}]/u.test(depois) ? ' ' : '';
      return pre + '"' + inner.trim() + '"' + pos;
    });
    t = t.replace(/[^\S\r\n]{2,}/g, ' ');
    t = t.replace(/[^\S\r\n]+([,.;:!?])/g, '$1');
    return t.trim();
  }

  /**
   * Limita a ocorrência de frases de silêncio ("o texto não explica...") a no máximo maxVezes no roteiro todo
   */
  function limitarFrasesDeSilencio(roteiro, maxVezes = 2) {
    if (!roteiro) return '';
    const regexSilencio = /(?:o texto (?:sagrado )?n[aã]o explica (?:o que motivou|as intenções|os motivos|o motivo)[^\.\n]*[\.\n])/gi;
    let contador = 0;
    return roteiro.replace(regexSilencio, (match) => {
      contador++;
      return contador <= maxVezes ? match : '';
    });
  }

  // ==========================================================================
  // ESTRUTURA DO ROTEIRO (montagem e segmentação)
  // ==========================================================================
  const CTA_INSCRICAO = 'Se este estudo está ajudando você, inscreva-se no canal. A sua inscrição ajuda o YouTube a recomendar vídeos como este para mais pessoas. Vamos em frente.';
  const FECHO_FIXO = 'Qual destes relatos mais chamou a sua atenção? Deixe sua resposta nos comentários. E, se este estudo ajudou você, inscreva-se no canal.';

  function regexMarcadorInicio(i) {
    const num = NUMEROS_EXTENSO[i] || String(i);
    const numRe = num === 'Três' ? 'Tr[eê]s' : num;
    return new RegExp(`^(?:\\*{1,3}|_{1,3})?${numRe}(?:\\*{1,3}|_{1,3})?\\s*[,:\\.]`, 'i');
  }

  /** Separa o roteiro montado em abertura, itens, CTA e fechamento (por parágrafos). */
  function segmentarRoteiro(roteiro, n) {
    const paras = (roteiro || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const idxs = [];
    let ultimo = -1;
    for (let i = 1; i <= n; i++) {
      const re = regexMarcadorInicio(i);
      const idx = paras.findIndex((p, k) => k > ultimo && re.test(p));
      idxs.push(idx);
      if (idx >= 0) ultimo = idx;
    }
    const primeiro = idxs[0] >= 0 ? idxs[0] : 0;
    const itens = idxs.map(idx => (idx >= 0 ? paras[idx] : ''));
    const fim = idxs[n - 1] >= 0 ? idxs[n - 1] + 1 : paras.length;
    const ctaIdx = paras.findIndex((p, k) => /inscreva-se/i.test(p) && /vamos em frente/i.test(p) && k > (idxs[1] >= 0 ? idxs[1] : -1) && (idxs[2] < 0 || k < idxs[2]));
    return {
      abertura: paras.slice(0, primeiro).join(' '),
      itens,
      cta: ctaIdx >= 0 ? paras[ctaIdx] : '',
      fechamento: paras.slice(fim).join(' ')
    };
  }

  /**
   * 5. MONTAGEM EM CÓDIGO (Abertura, CTA fixo, Itens, Fechamento)
   */
  function montarRoteiroCompleto({
    tema,
    itens,
    itensTextos,
    fechamentoTexto
  }) {
    let temaFormatado = (tema || '').replace(/^tema\s*:\s*/i, '').trim();
    temaFormatado = corrigirCapitalizacaoSacra(temaFormatado);
    temaFormatado = temaFormatado.charAt(0).toUpperCase() + temaFormatado.slice(1);

    const abertura = `${temaFormatado} explicado em poucos minutos.`;

    const blocos = [abertura];

    for (let i = 0; i < itensTextos.length; i++) {
      let textoItem = itensTextos[i].trim().replace(/\s*\n+\s*/g, ' ');
      const numExtenso = NUMEROS_EXTENSO[i + 1] || String(i + 1);
      const itemObj = itens && itens[i] ? itens[i] : { nome: `Item ${i + 1}` };

      if (!regexMarcadorInicio(i + 1).test(textoItem)) {
        textoItem = `${numExtenso}, ${itemObj.nome}. ${textoItem.replace(/^Item\s*\d+[\.:\-]?\s*/i, '').trim()}`;
      }
      textoItem = textoItem.replace(/\[[^\]]*\]/g, '').trim();

      blocos.push(textoItem);
      if (i === 1) blocos.push(CTA_INSCRICAO);
    }

    if (fechamentoTexto) {
      blocos.push(fechamentoTexto.trim().replace(/\s*\n+\s*/g, ' '));
    }

    let roteiroMontado = blocos.join('\n\n');
    roteiroMontado = limitarFrasesDeSilencio(roteiroMontado, 2);
    roteiroMontado = corrigirCapitalizacaoSacra(roteiroMontado);
    roteiroMontado = capitalizarInicioFrases(roteiroMontado);
    roteiroMontado = padronizarAspasEPontuacao(roteiroMontado);
    return roteiroMontado;
  }

  /**
   * 6. VALIDADOR ESTRUTURAL EM CÓDIGO (metas fixas do briefing)
   */
  function validarEstrutura(roteiro, totalItensEsperados = 8) {
    const n = Math.max(6, Math.min(12, Number(totalItensEsperados) || 8));
    const texto = (roteiro || '').trim();
    const palavras = texto.split(/\s+/).filter(Boolean);
    const totalPalavras = palavras.length;
    const seg = segmentarRoteiro(texto, n);

    const regras = [];

    // Regra 1: abertura
    const primeiras40 = palavras.slice(0, 40).join(' ');
    const temUmInicio = /\bUm\b/i.test(primeiras40);
    regras.push({
      id: 'regra_abertura',
      nome: 'Abertura Direta',
      ok: temUmInicio,
      detalhe: temUmInicio
        ? 'Marcador falado "Um," aparece nas primeiras 40 palavras sem enrolação.'
        : 'Marcador falado "Um," NÃO foi encontrado nas primeiras 40 palavras.'
    });

    // Regra 2: presença e ordem dos N itens
    let itensOrdemOk = true;
    let ultimoIndice = -1;
    const faltantes = [];
    for (let i = 1; i <= n; i++) {
      const numFalado = NUMEROS_EXTENSO[i];
      const regexMarcadorItem = new RegExp(`(?:^|\\n\\n?|\\.\\s+)(?:\\*{1,3}|_{1,3})?${numFalado}(?:\\*{1,3}|_{1,3})?\\s*[,:\\.]`, 'i');
      const match = texto.match(regexMarcadorItem);
      if (!match) {
        itensOrdemOk = false;
        faltantes.push(`Item ${i} (${numFalado})`);
      } else {
        if (match.index < ultimoIndice) itensOrdemOk = false;
        ultimoIndice = match.index;
      }
    }
    const proximoNum = NUMEROS_EXTENSO[n + 1];
    const regexExcedente = proximoNum ? new RegExp(`(?:^|\\n\\n?|\\.\\s+)(?:\\*{1,3}|_{1,3})?${proximoNum}(?:\\*{1,3}|_{1,3})?\\s*[,:\\.]`, 'i') : null;
    const temExcedente = regexExcedente ? regexExcedente.test(texto) : false;
    regras.push({
      id: 'regra_itens',
      nome: `Presença dos ${n} Itens em Ordem`,
      ok: itensOrdemOk && !temExcedente,
      detalhe: (itensOrdemOk && !temExcedente)
        ? `Todos os ${n} itens falados estão presentes na sequência correta sem itens extras.`
        : faltantes.length > 0
          ? `Itens ausentes: ${faltantes.join(', ')}.`
          : temExcedente
            ? `Detectado item excedente (${proximoNum}). O roteiro deve ter exatamente ${n} itens.`
            : 'A ordem dos itens falados está inconsistente.'
    });

    // Regra 3: pedido de inscrição entre o Item 2 e o Item 3
    const regexCta = /(?:inscreva-se|inscrever|canal|notificações)[\s\S]{0,160}vamos em frente/i;
    const temCta = regexCta.test(texto);
    const posCta = texto.search(regexCta);
    const posDois = texto.search(/(?:^|\n\n?|\.\s+)(?:\*{1,3}|_{1,3})?Dois(?:\*{1,3}|_{1,3})?\s*[,:\.]/i);
    const posTres = texto.search(/(?:^|\n\n?|\.\s+)(?:\*{1,3}|_{1,3})?Tr[eê]s(?:\*{1,3}|_{1,3})?\s*[,:\.]/i);
    const ctaPosicaoCorreta = temCta && (posDois === -1 || posCta > posDois) && (posTres === -1 || posCta < posTres);
    regras.push({
      id: 'regra_cta',
      nome: 'Chamada de Inscrição após Item 2',
      ok: ctaPosicaoCorreta,
      detalhe: ctaPosicaoCorreta
        ? 'Pedido de inscrição de 2 frases localizado estritamente entre o Item 2 e o Item 3.'
        : 'Pedido de inscrição ausente ou fora da posição entre o Item 2 e o Item 3.'
    });

    // Regra 4: extensão total (META FIXA: 1.700 a 2.200 para 8 itens)
    const lim = limitesTotal(n);
    const minPalavras = lim.min;
    const maxPalavras = lim.max;
    const extensaoOk = totalPalavras >= minPalavras && totalPalavras <= maxPalavras;
    regras.push({
      id: 'regra_extensao',
      nome: `Extensão do Roteiro (${minPalavras} - ${maxPalavras} palavras)`,
      ok: extensaoOk,
      detalhe: `Total de palavras: ${totalPalavras}. Meta fixa: ${minPalavras} a ${maxPalavras} palavras.`
    });

    // Regra 4b: cada item entre 150 e 220 palavras
    const palavrasItens = seg.itens.map(it => contarPalavras(it));
    const itensForaMeta = palavrasItens
      .map((w, i) => ({ item: i + 1, w }))
      .filter(x => x.w < LIMITES.itemMin || x.w > LIMITES.itemMax);
    regras.push({
      id: 'regra_extensao_itens',
      nome: `Cada item entre ${LIMITES.itemMin} e ${LIMITES.itemMax} palavras`,
      ok: itensForaMeta.length === 0 && palavrasItens.length === n,
      detalhe: itensForaMeta.length === 0
        ? `Todos os itens dentro da meta (${palavrasItens.join(', ')}).`
        : `Itens fora da meta: ${itensForaMeta.map(x => `Item ${x.item} = ${x.w}`).join('; ')}.`
    });

    // Regra 4c: fechamento entre 80 e 120 palavras
    const palavrasFechamento = contarPalavras(seg.fechamento);
    const fechamentoOk = palavrasFechamento >= LIMITES.fechamentoMin && palavrasFechamento <= LIMITES.fechamentoMax;
    regras.push({
      id: 'regra_fechamento',
      nome: `Fechamento entre ${LIMITES.fechamentoMin} e ${LIMITES.fechamentoMax} palavras`,
      ok: fechamentoOk,
      detalhe: `Fechamento com ${palavrasFechamento} palavras.`
    });

    // Regra 5: pergunta final + pedido de inscrição ao final
    const cauda = texto.slice(-320);
    const temPerguntaFinal = /\?/.test(cauda) && /inscreva-se|inscrever/i.test(cauda);
    regras.push({
      id: 'regra_pergunta',
      nome: 'Pergunta Final e Inscrição',
      ok: temPerguntaFinal,
      detalhe: temPerguntaFinal
        ? 'O fechamento termina com pergunta aos comentários e pedido de inscrição.'
        : 'Falta pergunta aos comentários ou pedido final de inscrição no fechamento.'
    });

    // Regra 6: artefatos
    const temColchetes = /\[[^\]]*\]/.test(texto);
    const temContagem = /\b(?:contagem|palavras)\s*:\s*\d+/i.test(texto);
    const semArtefatos = !temColchetes && !temContagem;
    regras.push({
      id: 'regra_artefatos',
      nome: 'Ausência de Rótulos e Colchetes',
      ok: semArtefatos,
      detalhe: semArtefatos
        ? 'Texto 100% contínuo sem colchetes [ ], marcadores de cena ou contagens.'
        : 'Encontrados colchetes ou linhas de contagem no corpo do roteiro.'
    });

    // Regra 7: número de mortos de Bete-Semes
    const temBeteSemes = /Bete-Semes/i.test(texto);
    const temNumeroMortosBeteSemes = temBeteSemes && /(?:50[\.,]?070|50070|cinq[uü]enta\s+mil\s+(?:e\s+)?setenta)/i.test(texto);
    regras.push({
      id: 'regra_bete_semes',
      nome: 'Omissão de Número de Mortos em Bete-Semes',
      ok: !temNumeroMortosBeteSemes,
      detalhe: !temNumeroMortosBeteSemes
        ? 'Nenhum numeral proibido de mortos em Bete-Semes foi incluído na narração.'
        : 'ERRO: Foi detectado o número de mortos de Bete-Semes no texto narrativo.'
    });

    // Regra 8: palavras proibidas fora de aspas
    const proibidas = detectarProibidas(texto);
    regras.push({
      id: 'regra_proibidas',
      nome: 'Sem adjetivos/jargões proibidos (fora de aspas)',
      ok: proibidas.length === 0,
      detalhe: proibidas.length === 0
        ? 'Nenhuma palavra da lista proibida aparece fora de aspas.'
        : `Encontradas: ${proibidas.map(p => `"${p.trecho}"`).join(', ')}.`
    });

    // Regra 9: fechos de item sem moral
    const fechosMorais = seg.itens
      .map((it, i) => ({ item: i + 1, frase: fechoComMoral(it) }))
      .filter(x => x.frase);
    regras.push({
      id: 'regra_fecho_moral',
      nome: 'Fecho de item sem moral (apenas fato)',
      ok: fechosMorais.length === 0,
      detalhe: fechosMorais.length === 0
        ? 'Nenhum item termina com moral/comentário.'
        : `Fechos com moral: ${fechosMorais.map(x => `Item ${x.item}: "${x.frase}"`).join(' | ')}`
    });

    // Regra 10: pelo menos 2 itens com contraste "não é X, é Y"
    const itensComContraste = seg.itens.filter(it => temContraste(it)).length;
    regras.push({
      id: 'regra_contrastes',
      nome: 'Pelo menos 2 itens com contraste "não é X, é Y"',
      ok: itensComContraste >= 2,
      detalhe: `${itensComContraste} item(ns) com contraste detectado.`
    });

    // Regra 11: no máximo 1 ocorrência de "Em [Livro] [cap], versículo" por item
    const itensComMuitasCitacoes = seg.itens
      .map((it, i) => ({ item: i + 1, qtd: contarCitacoesVersiculo(it) }))
      .filter(x => x.qtd > 1);
    regras.push({
      id: 'regra_citacao_versiculos',
      nome: 'Passagem citada uma vez no início (sem versículos repetidos)',
      ok: itensComMuitasCitacoes.length === 0,
      detalhe: itensComMuitasCitacoes.length === 0
        ? 'Nenhum item repetiu citações de versículos como muleta.'
        : `Itens com repetição de versículos: ${itensComMuitasCitacoes.map(x => `Item ${x.item} (${x.qtd}x)`).join(', ')}`
    });

    const totalOk = regras.filter(r => r.ok).length;
    const totalRegras = regras.length;

    return {
      valido: totalOk === totalRegras,
      totalOk,
      totalRegras,
      totalPalavras,
      minPalavras,
      maxPalavras,
      palavrasItens,
      palavrasFechamento,
      regras
    };
  }

  /**
   * 7. PAINEL "CONFERÊNCIA COM A BÍBLIA" (Renderização HTML)
   */
  function renderizarPainelConferencia(dadosConferencia, containerEl) {
    if (!containerEl) return;

    if (!dadosConferencia || !dadosConferencia.itens || dadosConferencia.itens.length === 0) {
      containerEl.innerHTML = '';
      containerEl.classList.add('hidden');
      return;
    }

    containerEl.classList.remove('hidden');
    const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let html = `
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 16px 20px; margin-top: 18px; color: #f8fafc;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #38bdf8; font-size: 1.05rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Conferência de Fidelidade com a Bíblia</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600;">
              Tradução: ${esc(dadosConferencia.traducaoUsada || 'Almeida Revista e Corrigida (ARC)')}
            </span>
            <span style="font-size: 0.82rem; color: #94a3b8;">${dadosConferencia.itens.length} itens conferidos versículo a versículo</span>
          </div>
        </div>

        <p style="font-size: 0.86rem; color: #cbd5e1; margin-bottom: 14px;">
          Todos os fatos narrados foram confrontados diretamente com os versículos bíblicos canônicos. Você pode verificar cada passagem e citação nos links oficiais do BibleGateway abaixo. Notas do auditor aparecem aqui, nunca na narração.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    dadosConferencia.itens.forEach(item => {
      const temAlertas = item.frasesSinalizadas && item.frasesSinalizadas.length > 0;
      const statusBadge = temAlertas
        ? `<span style="background: #eab308; color: #713f12; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;">Ajustado na Auditoria</span>`
        : `<span style="background: #059669; color: #ecfdf5; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;">Fiel aos Versículos</span>`;

      html += `
        <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid ${temAlertas ? '#ca8a04' : 'rgba(255,255,255,0.08)'}; border-radius: 6px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #f1f5f9; font-size: 0.92rem;">Item ${esc(item.numero)}: ${esc(item.nome)}${item.palavras ? ` (${esc(item.palavras)} palavras)` : ''}</strong>
            ${statusBadge}
          </div>

          <div style="font-size: 0.84rem; color: #93c5fd; margin-bottom: 6px;">
            <strong>Passagem:</strong> ${esc(item.referenciaFormatada)}
            <a href="${esc(item.bibleGatewayUrl)}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; margin-left: 8px; font-weight: 600;">
              [Conferir no BibleGateway ↗]
            </a>
          </div>

          <div style="font-size: 0.82rem; color: #94a3b8; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin-bottom: 6px;">
${esc(item.versiculosTextoResumo)}
          </div>
      `;

      if (item.referenciasUsadas && item.referenciasUsadas.length > 0) {
        html += `
          <div style="font-size: 0.8rem; color: #bae6fd; margin-bottom: 4px;">
            <strong>Referências fora da passagem central usadas na narração:</strong> ${esc(item.referenciasUsadas.join('; '))}
          </div>
        `;
      }

      if (temAlertas) {
        html += `
          <div style="margin-top: 6px; font-size: 0.82rem; color: #fef08a; background: rgba(234, 179, 8, 0.1); border-left: 3px solid #eab308; padding: 6px 10px; border-radius: 0 4px 4px 0;">
            <strong>Notas da conferência (não vão para a narração):</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
        `;
        item.frasesSinalizadas.forEach(f => {
          html += `<li><em>"${esc(f.frase)}"</em>: ${esc(f.motivo)}${f.acao ? ` [${esc(f.acao)}]` : ''}</li>`;
        });
        html += `</ul></div>`;
      }

      if (item.citacoes && item.citacoes.length > 0) {
        html += `
          <div style="margin-top: 6px; font-size: 0.8rem; color: #a7f3d0;">
            <strong>Citação Literal Validada:</strong> "${esc(item.citacoes.join('", "'))}"
          </div>
        `;
      }

      html += `</div>`;
    });

    html += `
        </div>
      </div>
    `;

    containerEl.innerHTML = html;
  }

  /**
   * 8. PRONÚNCIA: Aplica o dicionário fonético ao texto que será enviado ao TTS
   */
  function aplicarPronunciaParaTTS(texto) {
    if (!texto || typeof texto !== 'string') return '';
    let t = texto;

    for (const regra of DICIONARIO_PRONUNCIA_TTS) {
      t = t.replace(regra.termo, regra.pronuncia);
    }

    return t;
  }

  /**
   * Utilitário SRT: Mescla blocos e linhas que contenham apenas um número com a seguinte
   */
  function mesclarNumerosSoltosSRT(srtContent) {
    if (!srtContent || typeof srtContent !== 'string') return '';

    const blocosBrutos = srtContent.trim().split(/\n\s*\n/);
    const blocosParsed = [];

    for (const b of blocosBrutos) {
      const linhas = b.split('\n').map(l => l.trim()).filter(Boolean);
      if (linhas.length < 3) continue;

      const timeMatch = linhas[1].match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      const startTime = timeMatch ? timeMatch[1] : linhas[1].split('-->')[0].trim();
      const endTime = timeMatch ? timeMatch[2] : (linhas[1].split('-->')[1] || '').trim();
      const textoLinhas = linhas.slice(2);

      blocosParsed.push({
        startTime,
        endTime,
        texto: textoLinhas.join(' ').trim()
      });
    }

    const blocosMesclados = [];
    for (let i = 0; i < blocosParsed.length; i++) {
      const atual = blocosParsed[i];
      const ehNumeroSolto = /^(?:item\s*)?\d{1,2}\.?$/i.test(atual.texto);

      if (ehNumeroSolto && i + 1 < blocosParsed.length) {
        const proximo = blocosParsed[i + 1];
        blocosMesclados.push({
          startTime: atual.startTime,
          endTime: proximo.endTime,
          texto: `${atual.texto} ${proximo.texto}`.trim()
        });
        i++;
      } else {
        blocosMesclados.push(atual);
      }
    }

    const resultado = blocosMesclados.map((b, idx) => {
      return `${idx + 1}\n${b.startTime} --> ${b.endTime}\n${b.texto}`;
    });

    return resultado.join('\n\n');
  }

  // ==========================================================================
  // PACOTE DE PUBLICAÇÃO (em inglês, com dicionário de nomes pt -> en)
  // ==========================================================================

  function nomeEmIngles(nome) {
    return NOMES_PT_EN[normalizarTexto(nome)] || null;
  }

  function referenciaEmIngles(ref) {
    return (ref || '')
      .split(/;\s*/)
      .map(r => {
        const m = r.match(/^([1-3]?\s*[A-Za-zÀ-ÖØ-öø-ÿ\.\s]+?)\s+(\d.*)$/);
        if (!m) return r.trim();
        const abbrev = resolverLivroCanonica(m[1].trim());
        return abbrev && LIVROS_EN[abbrev] ? `${LIVROS_EN[abbrev]} ${m[2].trim()}` : r.trim();
      })
      .join('; ');
  }

  function formatarTempo(segundos) {
    const s = Math.max(0, Math.round(segundos));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  }

  function srtParaSegundos(hhmmss) {
    const m = hhmmss.match(/(\d{2}):(\d{2}):(\d{2})/);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
  }

  /**
   * 9. PACOTE DE PUBLICAÇÃO AUTOMÁTICO
   */
  function gerarPacotePublicacao({
    tema,
    roteiro,
    itens,
    srtConteudo = '',
    duracaoAudioSegundos = null
  }) {
    const textoRoteiro = (roteiro || '').trim();
    const totalPalavras = contarPalavras(textoRoteiro);
    const n = itens ? itens.length : 8;
    const lista = itens || [];

    // Duração: real (áudio) ou estimada (palavras / 150 por minuto)
    const duracaoEstimada = !(duracaoAudioSegundos && duracaoAudioSegundos > 0);
    const duracaoSeg = duracaoEstimada
      ? (totalPalavras / LIMITES.palavrasPorMinuto) * 60
      : duracaoAudioSegundos;
    const minutosCalc = Math.max(1, Math.round(duracaoSeg / 60));
    const duracaoNota = duracaoEstimada ? `${minutosCalc} minutes (estimated)` : `${minutosCalc} minutes`;

    // Nomes em inglês (pt -> en)
    const nomesSemTraducao = [];
    const nomesEn = lista.map(it => {
      const en = nomeEmIngles(it.nome);
      if (!en) nomesSemTraducao.push(it.nome);
      return en || it.nome;
    });
    const refsEn = lista.map(it => referenciaEmIngles(it.referenciaFormatada || it.referenciaStr));
    const pick = (idxs) => idxs.filter(i => i < nomesEn.length).map(i => nomesEn[i]).slice(0, 3);
    const tresNomes = (idxs) => {
      const nomes = pick(idxs);
      return nomes.length === 3 ? `${nomes[0]}, ${nomes[1]}, ${nomes[2]}` : nomes.join(', ');
    };

    // Títulos (moldes aprovados; sem "Every Transgressor/Sinner/Soul", "Everyone" ou "After Death")
    const ehJulgamento = /julgament|ju[ií]zo/.test(normalizarTexto(tema));
    const titulos = ehJulgamento
      ? [
        `Every Sudden Judgment of God in the Bible Explained in ${minutosCalc} Minutes`,
        `What Happened to ${tresNomes([0, 1, 2])} and Others in the Bible`,
        `What Happened to ${tresNomes([3, 4, 7])} and Others in the Bible`
      ]
      : [
        `${n} Bible Accounts Explained in ${minutosCalc} Minutes`,
        `What Happened to ${tresNomes([0, 1, 2])} and Others in the Bible`,
        `What Happened to ${tresNomes([3, 4, 5])} and Others in the Bible`
      ];

    // Capítulos
    const seg = segmentarRoteiro(textoRoteiro, n);
    const palavrasAbertura = contarPalavras(seg.abertura);
    const palavrasCta = contarPalavras(seg.cta);
    const palavrasItens = seg.itens.map(it => contarPalavras(it));
    const palavrasFechamento = contarPalavras(seg.fechamento);

    const capitulos = ['0:00 Introduction'];
    let capitulosEstimados = true;
    let usouSrt = false;

    if (srtConteudo && srtConteudo.trim()) {
      const blocos = srtConteudo.trim().split(/\n\s*\n/).map(b => {
        const linhas = b.split('\n').map(l => l.trim()).filter(Boolean);
        const tm = (linhas[1] || '').match(/(\d{2}:\d{2}:\d{2})[,\.]\d{3}\s*-->\s*(\d{2}:\d{2}:\d{2})/);
        return { inicio: tm ? srtParaSegundos(tm[1]) : null, fim: tm ? srtParaSegundos(tm[2]) : null, texto: linhas.slice(2).join(' ') };
      }).filter(b => b.inicio !== null);

      const achados = [];
      let cursor = 0;
      for (let i = 1; i <= n; i++) {
        const re = regexMarcadorInicio(i);
        const idx = blocos.findIndex((b, k) => k >= cursor && re.test(b.texto));
        if (idx < 0) break;
        achados.push(blocos[idx].inicio);
        cursor = idx + 1;
      }
      if (achados.length === n) {
        usouSrt = true;
        capitulosEstimados = false;
        achados.forEach((seg0, i) => {
          capitulos.push(`${formatarTempo(seg0)} ${i + 1}. ${nomesEn[i] || `Item ${i + 1}`}`);
        });
        const fimSrt = blocos[blocos.length - 1].fim || duracaoSeg;
        const inicioFech = fimSrt * ((totalPalavras - palavrasFechamento) / Math.max(1, totalPalavras));
        capitulos.push(`${formatarTempo(Math.max(inicioFech, achados[n - 1] + 1))} Conclusion`);
      }
    }

    if (!usouSrt) {
      // Sem legenda: proporção de palavras de cada item sobre o total, aplicada à duração
      let acumuladas = palavrasAbertura;
      for (let i = 0; i < n; i++) {
        if (i === 2) acumuladas += palavrasCta;
        const inicio = (acumuladas / Math.max(1, totalPalavras)) * duracaoSeg;
        capitulos.push(`${formatarTempo(inicio)} ${i + 1}. ${nomesEn[i] || `Item ${i + 1}`}`);
        acumuladas += palavrasItens[i];
      }
      const inicioFech = (acumuladas / Math.max(1, totalPalavras)) * duracaoSeg;
      capitulos.push(`${formatarTempo(inicioFech)} Conclusion`);
    }

    // Descrição (nomes e livros em inglês)
    const listaNumeradaItens = lista
      .map((it, i) => `${it.numero || i + 1}. ${nomesEn[i]} - ${refsEn[i]}`)
      .join('\n');

    const descricao = `In this video, we go through ${n} accounts of sudden judgment recorded in the Bible, in approximately ${duracaoNota}. Each account is told from the verses themselves, with the passage shown so you can check it.

TIMESTAMPS${capitulosEstimados ? ' (estimated)' : ''}:
${capitulos.join('\n')}

ACCOUNTS COVERED IN THIS VIDEO:
${listaNumeradaItens}

SOURCES & BIBLICAL REFERENCES:
All scriptural references and direct quotes come from the biblical text (Almeida / KJV / RVR). Facts taken from verses outside the main passage are cited by chapter and verse in the narration.

Which of these accounts stayed with you the most? Tell us in the comments below.

Subscribe to the channel for more Bible accounts explained from the text.`;

    // Tags e hashtags (em inglês)
    const tagsArray = [
      ehJulgamento ? 'Sudden Judgment of God in the Bible' : 'Bible Accounts',
      'Biblical History',
      'Bible Study',
      'Scripture Explained',
      ...nomesEn
    ];
    const hashtags = ['#BibleStories', '#BiblicalHistory', '#BibleStudy'];

    // Miniatura: prompts em inglês; legendas em português (miniatura em português)
    const colunas = Math.ceil(n / 2);
    const gridPrompt16x9 = `A 16:9 YouTube thumbnail illustration split into a clean grid of 2 rows and ${colunas} equal panels with subtle beige borders, vintage biblical art style, muted earth tones, warm beige parchment background, minimalist oil painting aesthetic, dramatic chiaroscuro lighting, depicting the following ${n} historical biblical events in sequence without any modern elements. High contrast, clean composition, NO text, NO letters, NO words in the image.`;

    const legendasGrid = lista.map(it => it.nome.toUpperCase());

    const promptsQuadrados1x1 = lista.map((it, idx) => {
      return `Panel ${idx + 1} (${nomesEn[idx]}): A square 1:1 minimalist biblical painting depicting the account of ${nomesEn[idx]} based on ${refsEn[idx]}, dignified historical composition, warm earth tones, chiaroscuro lighting, soft beige background, respectful and solemn atmosphere, NO graphic violence, NO text, masterpiece digital painting.`;
    });

    return {
      titulos,
      descricao,
      capitulos,
      capitulosEstimados,
      duracaoMinutos: minutosCalc,
      duracaoEstimada,
      nomesSemTraducao,
      tags: tagsArray.join(', '),
      hashtags: hashtags.join(' '),
      thumbnail: {
        gridPrompt16x9,
        legendasGrid,
        promptsQuadrados1x1
      }
    };
  }

  // ==========================================================================
  // FLUXO PRINCIPAL
  // ==========================================================================

  const SISTEMA_ESCRITA = 'Você é um roteirista sênior de documentários bíblicos. Escreva narração falada, direta, em voz ativa, só com fatos dos versículos.';

  /** Interpreta uma referência "Livro cap:v1-v2" devolvida pelo auditor. */
  function interpretarReferenciaCurta(ref) {
    const m = (ref || '').match(/^(.+?)\s+(\d+)[:.](\d+)(?:\s*[-–—]\s*(\d+))?/);
    if (!m) return null;
    const abbrev = resolverLivroCanonica(m[1].trim());
    if (!abbrev) return null;
    return { texto: ref.trim(), abbrev, livro: m[1].trim(), capitulo: Number(m[2]), vStart: Number(m[3]), vEnd: m[4] ? Number(m[4]) : Number(m[3]) };
  }

  function refDentroDaPassagem(refObj, blocosCentrais) {
    return (blocosCentrais || []).some(b =>
      b.abbrev === refObj.abbrev && b.capitulo === refObj.capitulo && refObj.vStart >= b.vStart && refObj.vEnd <= b.vEnd
    );
  }

  function narracaoCitaReferencia(texto, refObj) {
    const reCap = new RegExp(`(?<!\\d)${refObj.capitulo}(?!\\d)`);
    const reVer = new RegExp(`vers[ií]culos?\\s+(?:\\d+\\s*(?:,|e|a|ao|ou|-|–)\\s*)*${refObj.vStart}(?!\\d)`, 'i');
    return reCap.test(texto) && reVer.test(texto);
  }

  async function executarFluxoCatalogo({
    ideia,
    modelo = 'anthropic/claude-sonnet-4.5',
    idioma = 'pt',
    traducao = 'arc',
    itensSelecionados = null,
    onProgress,
    apiClient
  }) {
    const updateProgress = (texto, percentual) => {
      if (typeof onProgress === 'function') {
        onProgress(texto, percentual);
      }
    };

    // 1. PARSE DA IDEIA
    updateProgress('Analisando a lista de itens e passagens bíblicas...', 10);
    const parsed = parseIdeia(ideia, Boolean(itensSelecionados && itensSelecionados.length > 0));
    const { tema, itens } = parsed;
    const itensBase = (Array.isArray(itensSelecionados) && itensSelecionados.length > 0)
      ? itens.filter(it => itensSelecionados.includes(it.numero))
      : itens;
    const n = itensBase.length;

    updateProgress(`Identificados ${n} itens com passagens bíblicas. Carregando versículos (${traducao.toUpperCase()})...`, 20);

    // 2. VERSÍCULOS + CONTEXTO PERMITIDO (8 antes / 4 depois + contexto extra)
    const itensComVersiculos = [];
    for (let i = 0; i < n; i++) {
      const it = itensBase[i];
      const dados = await carregarVersiculos(it.referenciaStr, idioma, { contextoExtra: it.contextoExtra, traducao });
      itensComVersiculos.push({
        ...it,
        referenciaFormatada: dados.referenciasFormatadas.join('; ') || it.referenciaStr,
        versiculosTexto: dados.textoCompleto,
        contextoCapituloTexto: dados.textoContextoCompleto,
        blocosCentrais: dados.blocosCentrais,
        versiculosTextoResumo: dados.textoCompleto.slice(0, 300) + (dados.textoCompleto.length > 300 ? '...' : ''),
        bibleGatewayUrl: dados.bibleGatewayUrl
      });
    }

    const callAi = async (prompt, systemPrompt = null, opts = {}) => {
      if (apiClient && typeof apiClient.generateContent === 'function') {
        return await apiClient.generateContent(prompt, modelo, systemPrompt, opts);
      }
      if (typeof OpenRouterAPI !== 'undefined' && OpenRouterAPI.generateContent) {
        return await OpenRouterAPI.generateContent(prompt, modelo, systemPrompt, opts);
      }
      throw new Error('Cliente de API de IA não disponível.');
    };

    // Análise de um item: checagens em código + auditor (temperature 0)
    async function analisarItem(it, texto) {
      const problemas = [];
      const notasAuditor = [];
      const palavras = contarPalavras(texto);
      const truncado = terminaIncompleto(texto);

      if (truncado) {
        problemas.push({
          tipo: 'truncado',
          frase: texto.split(/\s+/).slice(-8).join(' '),
          motivo: 'O texto termina no meio de uma frase ou com aspas abertas. Entregue o item COMPLETO, terminando em frase completa.'
        });
      }
      if (palavras < LIMITES.itemMin) {
        problemas.push({
          tipo: 'curto',
          motivo: `O item tem ${palavras} palavras (mínimo ${LIMITES.itemMin}). Expanda para ${LIMITES.itemAlvoMin}-${LIMITES.itemAlvoMax} palavras com FATOS do CONTEXTO PERMITIDO (cada fato com a passagem real citada), nunca com adjetivos, moral ou invenção.`
        });
      } else if (palavras > LIMITES.itemMax) {
        problemas.push({
          tipo: 'longo',
          motivo: `O item tem ${palavras} palavras (máximo ${LIMITES.itemMax}). Condense para ${LIMITES.itemAlvoMin}-${LIMITES.itemAlvoMax} palavras mantendo os fatos principais.`
        });
      }
      detectarProibidas(texto, it.versiculosTexto).forEach(p => {
        problemas.push({
          tipo: 'proibida',
          frase: p.trecho,
          motivo: `Palavra/expressão proibida ("${p.trecho}"). Reescreva a frase só com o fato, sem ela.`
        });
      });
      const moral = fechoComMoral(texto);
      if (moral) {
        problemas.push({
          tipo: 'fecho_moral',
          frase: moral,
          motivo: 'O fecho do item tem moral/comentário. Troque por UM fato curto do texto (o que aconteceu em seguida ou a consequência registrada).'
        });
      }
      const cit = verificarCitacoesEmCodigo(texto, it.versiculosTexto);
      cit.citacoesInvalidas.forEach(c => {
        problemas.push({ tipo: 'citacao_incorreta', frase: c.citacao, motivo: c.motivo + ' Use só texto literal do versículo citado ou remova as aspas.' });
      });
      const qtdCitacoesVersiculo = contarCitacoesVersiculo(texto);
      if (qtdCitacoesVersiculo > 1) {
        problemas.push({
          tipo: 'repeticao_versiculo',
          frase: `Citou versículos repetidamente (${qtdCitacoesVersiculo} ocorrências)`,
          motivo: `A passagem deve ser anunciada apenas uma vez no início ("Isso está em [Livro] [cap]."). É PROIBIDO ficar citando "Em [Livro] [cap], versículo N" repetidamente ao longo do item. Narre os acontecimentos diretamente como uma história fluida.`
        });
      }
      if (exigeOmitirMortos(it.instrucaoNarrativa || it.observacao)) {
        const { t, q } = protegerAspas(texto);
        const ruins = dividirSentencas(t).filter(s => REGEX_NUMERAL_MORTOS.test(s) && REGEX_CONTEXTO_MORTOS.test(s));
        if (ruins.length) {
          problemas.push({ tipo: 'mortos', frase: restaurarAspas(ruins[0], q), motivo: 'O número de mortos NÃO pode aparecer no texto.' });
        }
      }

      // Checagem em código: foco no personagem central (aparecer em pelo menos 30% das frases do item)
      const sentsItem = dividirSentencas(texto);
      const nomeBasePersonagem = (it.nome || '')
        .replace(/^(?:o\s+rei\s+|rei\s+|o\s+|a\s+)/i, '')
        .split(/[\s,;–—\(\]]+/)[0]
        .trim();
      if (nomeBasePersonagem && nomeBasePersonagem.length >= 3 && sentsItem.length >= 3) {
        const regexNomePersonagem = new RegExp('\\b' + normalizarTexto(nomeBasePersonagem) + '\\b', 'i');
        const frasesComNome = sentsItem.filter(s => regexNomePersonagem.test(normalizarTexto(s))).length;
        const proporcaoNome = frasesComNome / sentsItem.length;
        if (proporcaoNome < 0.30) {
          problemas.push({
            tipo: 'foco_personagem',
            motivo: `O personagem ${it.nome} aparece em apenas ${frasesComNome} de ${sentsItem.length} frases (${Math.round(proporcaoNome * 100)}%, abaixo do mínimo de 30%). O item é sobre ${it.nome}. Gaste no máximo 2 frases com o antecessor ou com outros personagens. O fato central é o fim de ${it.nome}. Se o texto bíblico não disser como ele morreu, diga 'o texto não diz como ${it.nome} morreu' e conte o que aconteceu com ele (prisão, deposição, exílio).`
          });
        }
      }

      let referenciasUsadas = [];
      if (!truncado) {
        let rawConferencia = '';
        try {
          rawConferencia = await callAi(
            gerarPromptConferenciaItem({
              versiculosTexto: it.versiculosTexto,
              contextoCapituloTexto: it.contextoCapituloTexto,
              textoItem: texto,
              nomeItem: it.nome,
              referenciaFormatada: it.referenciaFormatada
            }),
            'Você é um auditor bíblico checador de fatos. Responda apenas com JSON.',
            { temperature: 0, max_tokens: 2048 }
          );
        } catch (e) {
          rawConferencia = '';
        }
        let audit = { frases_nao_sustentadas: [], referencias_fora_da_passagem: [] };
        try {
          const jm = (rawConferencia || '').match(/\{[\s\S]*\}/);
          if (jm) audit = JSON.parse(jm[0]);
        } catch (e) {}

        (audit.frases_nao_sustentadas || []).forEach(f => {
          notasAuditor.push({ frase: f.frase, tipo: f.tipo, motivo: f.motivo });
          problemas.push({ tipo: 'auditor', frase: f.frase, motivo: `${f.tipo || 'não sustentada'}: ${f.motivo || ''}` });
        });

        (audit.referencias_fora_da_passagem || []).forEach(r => {
          const ro = interpretarReferenciaCurta(String(r));
          if (!ro || refDentroDaPassagem(ro, it.blocosCentrais)) return;
          const mesmoCapitulo = (it.blocosCentrais || []).some(b => b.abbrev === ro.abbrev && b.capitulo === ro.capitulo);
          if (mesmoCapitulo) return;
          referenciasUsadas.push(ro.texto);
          if (!narracaoCitaReferencia(texto, ro)) {
            problemas.push({
              tipo: 'referencia',
              frase: ro.texto,
              motivo: `O item usa fato de ${ro.texto}, que está FORA da passagem central (${it.referenciaFormatada}). A narração deve citar a passagem real, no formato "Em ${ro.livro} ${ro.capitulo}, versículo ${ro.vStart}, ...".`
            });
          }
        });
      }

      return { problemas, notasAuditor, palavras, referenciasUsadas, citacoes: cit.citacoes };
    }

    function extrairResumoItem(texto) {
      if (!texto) return '';
      const sents = dividirSentencas(removerAspas(texto));
      if (sents.length === 0) return '';
      if (sents.length <= 2) return sents.join(' ');
      return `${sents[0]} ${sents[sents.length - 1]}`;
    }

    async function escreverItem(it, pct, resumosAnteriores = []) {
      updateProgress(`Escrevendo e auditando Item ${it.numero}/${n} (${it.nome})...`, pct);
      const raw = await callAi(
        gerarPromptItem({
          numero: it.numero,
          numeroFalado: it.numeroFalado,
          nomeItem: it.nome,
          referenciaFormatada: it.referenciaFormatada,
          contextoExtra: it.contextoExtra,
          versiculosTexto: it.versiculosTexto,
          contextoCapituloTexto: it.contextoCapituloTexto,
          instrucaoItem: it.instrucaoItem,
          instrucaoNarrativa: it.instrucaoNarrativa,
          observacao: it.observacao,
          idioma,
          traducao,
          resumosAnteriores
        }),
        SISTEMA_ESCRITA,
        { max_tokens: 8192 }
      );
      return higienizarItemEmCodigo(extrairTextoDeRespostaJson(raw), it.nome, it.instrucaoNarrativa || it.observacao);
    }

    async function regenerarItem(it, texto, problemas, resumosAnteriores = []) {
      const raw = await callAi(
        gerarPromptRegeneracaoItem({
          numero: it.numero,
          numeroFalado: it.numeroFalado,
          nomeItem: it.nome,
          referenciaFormatada: it.referenciaFormatada,
          contextoExtra: it.contextoExtra,
          versiculosTexto: it.versiculosTexto,
          contextoCapituloTexto: it.contextoCapituloTexto,
          textoAnterior: texto,
          problemas,
          instrucaoNarrativa: it.instrucaoNarrativa || it.observacao,
          traducao,
          resumosAnteriores
        }),
        SISTEMA_ESCRITA,
        { max_tokens: 8192 }
      );
      const novo = higienizarItemEmCodigo(extrairTextoDeRespostaJson(raw), it.nome, it.instrucaoNarrativa || it.observacao);
      return novo && novo.length > 30 ? novo : texto;
    }

    // 3 & 4. ESCRITA, CHECAGEM E CORREÇÃO POR ITEM (máx. 2 ciclos de correção)
    const resultadosItens = [];
    const resumosAnteriores = [];

    for (let i = 0; i < n; i++) {
      const it = itensComVersiculos[i];
      const pct = Math.round(25 + ((i / n) * 50));

      let texto = await escreverItem(it, pct, resumosAnteriores);
      let analise = await analisarItem(it, texto);
      let ciclos = 0;
      const sinalizacoes = [];
      analise.notasAuditor.forEach(nota => sinalizacoes.push({ ...nota, acao: 'corrigida por regeneração' }));

      while (analise.problemas.length > 0 && ciclos < 2) {
        ciclos++;
        updateProgress(`Corrigindo Item ${it.numero} (ciclo ${ciclos}/2): ${analise.problemas.map(p => p.tipo).join(', ')}...`, pct + 2);
        texto = await regenerarItem(it, texto, analise.problemas, resumosAnteriores);
        analise = await analisarItem(it, texto);
        analise.notasAuditor.forEach(nota => sinalizacoes.push({ ...nota, acao: 'corrigida por regeneração' }));
      }

      let acoes = [];
      if (analise.problemas.length > 0) {
        const rem = remediarItem(texto, analise.problemas, it.versiculosTexto);
        texto = rem.texto;
        acoes = rem.acoes;
        analise = { ...(await analisarItemSomenteCodigo(it, texto)), notasAuditor: analise.notasAuditor, referenciasUsadas: analise.referenciasUsadas };
      }

      resultadosItens.push({ it, texto, analise, ciclos, sinalizacoes: [...sinalizacoes, ...acoes] });
      const rFim = extrairResumoItem(texto);
      if (rFim) resumosAnteriores.push(`${it.nome}: ${rFim}`);
    }

    // 4b. CHECAGEM EM CÓDIGO DE ITENS DUPLICADOS (TRIGRAMAS > 25%)
    updateProgress('Verificando sobreposição de fatos entre itens (trigramas)...', 75);
    const sobreposicoesDetectadas = [];
    for (let i = 0; i < resultadosItens.length; i++) {
      for (let j = i + 1; j < resultadosItens.length; j++) {
        const itemA = resultadosItens[i];
        const itemB = resultadosItens[j];
        const overlap = calcularSobreposicaoTrigramas(itemA.texto, itemB.texto);
        if (overlap > 0.25) {
          sobreposicoesDetectadas.push({
            itemA: itemA.it.numero,
            nomeA: itemA.it.nome,
            itemB: itemB.it.numero,
            nomeB: itemB.it.nome,
            overlapPct: Math.round(overlap * 100)
          });
          const idxAlvo = contarPalavras(itemA.texto) <= contarPalavras(itemB.texto) ? i : j;
          const idxOutro = idxAlvo === i ? j : i;
          const alvo = resultadosItens[idxAlvo];
          const outro = resultadosItens[idxOutro];

          updateProgress(`Regenerando Item ${alvo.it.numero} (${alvo.it.nome}) por sobreposição de fatos com Item ${outro.it.numero}...`, 76);
          const probDuplicidade = [{
            tipo: 'duplicidade',
            motivo: `O item compartilha mais de 25% de palavras/fatos com o Item ${outro.it.numero} (${outro.it.nome}). Reescreva focando exclusivamente no seu próprio personagem (${alvo.it.nome}) e no seu desfecho individual, e NÃO repita os acontecimentos do Item ${outro.it.numero}.`
          }];
          const textoNovo = await regenerarItem(alvo.it, alvo.texto, probDuplicidade, resumosAnteriores);
          const anNovo = await analisarItem(alvo.it, textoNovo);
          if (anNovo.problemas.filter(p => ['truncado', 'proibida', 'fecho_moral', 'citacao_incorreta', 'mortos'].includes(p.tipo)).length === 0) {
            alvo.texto = textoNovo;
            alvo.analise = anNovo;
            alvo.sinalizacoes.push({
              frase: '',
              tipo: 'duplicidade',
              motivo: `Regenerado para eliminar sobreposição com Item ${outro.it.numero}.`,
              acao: 'regenerado_anti_duplicidade'
            });
          }
        }
      }
    }

    // Se estiver no modo parcial de itens selecionados, devolve diretamente os itens e análises
    if (Array.isArray(itensSelecionados) && itensSelecionados.length > 0) {
      updateProgress('Itens selecionados concluídos com sucesso!', 100);
      const traducaoUsada = (traducao === 'aa' || traducao === 'jfa') ? 'Almeida Atualizada (ARA/AA)' : 'Almeida Revista e Corrigida (ARC)';
      return {
        modoParcial: true,
        roteiro: resultadosItens.map(r => r.texto).join('\n\n'),
        itensSelecionadosTextos: resultadosItens.map(r => ({
          numero: r.it.numero,
          nome: r.it.nome,
          texto: r.texto,
          palavras: contarPalavras(r.texto),
          analise: r.analise,
          sinalizacoes: r.sinalizacoes
        })),
        sobreposicoesTrigramas: sobreposicoesDetectadas,
        traducaoUsada,
        dadosConferencia: {
          tema,
          traducaoUsada,
          totalItens: n,
          sobreposicoesTrigramas: sobreposicoesDetectadas,
          itens: resultadosItens.map(r => ({
            numero: r.it.numero,
            nome: r.it.nome,
            texto: r.texto,
            versiculos: r.it.versiculos,
            referenciaFormatada: r.it.referenciaFormatada,
            versiculosTextoResumo: r.it.versiculosTextoResumo,
            bibleGatewayUrl: r.it.bibleGatewayUrl,
            frasesSinalizadas: r.sinalizacoes,
            citacoes: r.analise.citacoes || [],
            palavras: contarPalavras(r.texto),
            ciclosCorrecao: r.ciclos,
            referenciasUsadas: r.analise.referenciasUsadas || [],
            problemasRestantes: (r.analise.problemas || []).map(p => `${p.tipo}${p.frase ? `: ${p.frase}` : ''}`)
          }))
        },
        itens: itensComVersiculos
      };
    }

    // Reanálise apenas por código (sem chamada de IA) após remediação
    async function analisarItemSomenteCodigo(it, texto) {
      const problemas = [];
      const palavras = contarPalavras(texto);
      if (terminaIncompleto(texto)) problemas.push({ tipo: 'truncado', motivo: 'Texto incompleto.' });
      if (palavras < LIMITES.itemMin) problemas.push({ tipo: 'curto', motivo: `${palavras} palavras.` });
      if (palavras > LIMITES.itemMax) problemas.push({ tipo: 'longo', motivo: `${palavras} palavras.` });
      detectarProibidas(texto, it.versiculosTexto).forEach(p => problemas.push({ tipo: 'proibida', frase: p.trecho, motivo: 'persistiu' }));
      if (fechoComMoral(texto)) problemas.push({ tipo: 'fecho_moral', motivo: 'persistiu' });
      const cit = verificarCitacoesEmCodigo(texto, it.versiculosTexto);
      return { problemas, palavras, citacoes: cit.citacoes };
    }

    // AJUSTE DO TOTAL (meta fixa 1.700-2.200 para 8 itens): 1 passe de expansão/condensação
    const limTotal = limitesTotal(n);
    const palavrasFixas = () => contarPalavras(`${(tema || '')} explicado em poucos minutos.`) + contarPalavras(CTA_INSCRICAO);
    const totalEstimado = () => palavrasFixas() + resultadosItens.reduce((s, r) => s + contarPalavras(r.texto), 0) + 100;

    if (totalEstimado() < limTotal.min) {
      const ordem = [...resultadosItens].sort((a, b) => contarPalavras(a.texto) - contarPalavras(b.texto));
      for (const r of ordem) {
        const deficit = limTotal.min + 15 - totalEstimado();
        if (deficit <= 0) break;
        const atual = contarPalavras(r.texto);
        if (atual >= LIMITES.itemMax - 3) continue;
        const alvo = Math.min(LIMITES.itemMax - 2, atual + Math.max(20, deficit));
        updateProgress(`Ajustando extensão do Item ${r.it.numero} (${atual} -> ~${alvo} palavras)...`, 78);
        const problemasExp = [{
          tipo: 'expansao_total',
          motivo: `O roteiro precisa de mais fatos para atingir a meta total. Reescreva o item com ${alvo - 5} a ${alvo} palavras (limite absoluto ${LIMITES.itemMax}), acrescentando SOMENTE fatos bíblicos do contexto com frases diretas; sem adjetivos, moral ou comentário.`
        }];
        const novo = await regenerarItem(r.it, r.texto, problemasExp, resumosAnteriores);
        const an = await analisarItem(r.it, novo);
        const graves = an.problemas.filter(p => ['truncado', 'proibida', 'fecho_moral', 'citacao_incorreta', 'mortos', 'referencia', 'longo', 'curto'].includes(p.tipo));
        if (graves.length === 0 && contarPalavras(novo) > atual) {
          r.texto = novo;
          r.analise = an;
          r.sinalizacoes.push({ frase: '', tipo: 'expansao_total', motivo: `Expandido de ${atual} para ${contarPalavras(novo)} palavras para cumprir a meta total.`, acao: 'expandido' });
        }
      }
    }

    // 5. FECHAMENTO: resume em UMA frase curta cada relato + pergunta + pedido de inscrição (texto fixo)
    updateProgress('Gerando fechamento (resumo factual dos relatos)...', 85);
    const itensFinais = resultadosItens.map(r => r.texto);
    const palavrasFixo = contarPalavras(FECHO_FIXO);
    const resumoMin = LIMITES.fechamentoMin - palavrasFixo;
    const resumoMax = LIMITES.fechamentoMax - palavrasFixo;
    const alvoMin = resumoMin + 8;
    const alvoMax = resumoMax - 8;

    const montarPromptFechamento = (feedback) => `Escreva o parágrafo de FECHAMENTO em voz alta do vídeo, resumindo os ${n} relatos bíblicos abaixo no mesmo tom do exemplo.

RELATOS:
"""
${itensFinais.map((t, i) => `[Item ${i + 1}] ${t}`).join('\n\n')}
"""

EXEMPLO DE FECHAMENTO A SEGUIR:
"Estes oito relatos registram mortes e destruições atribuídas ao Senhor. Nadabe e Abiú ofereceram um fogo que não foi ordenado. A terra tragou as tendas de Corá, Datã e Abirão. Uzá estendeu a mão à arca. Os homens de Bete-Semes olharam para dentro dela. Numa só noite, cento e oitenta e cinco mil assírios foram feridos. Fogo e enxofre caíram sobre Sodoma e Gomorra. Ananias e Safira mentiram sobre o preço da terra. Herodes não deu glória a Deus."

REGRAS OBRIGATÓRIAS DO FECHAMENTO:
1. Comece com UMA frase introdutória curta situando os relatos ("Estes ${n} relatos registram...").
2. Em seguida, escreva EXATAMENTE ${n} frases curtas, UMA para cada um dos ${n} relatos, na ordem exata de 1 a ${n}, dizendo apenas o fato registrado (quem agiu, o que aconteceu). Cada frase deve ter de 7 a 10 palavras.
3. Total do seu texto: entre ${alvoMin} e ${alvoMax} palavras (cerca de 65 a 85 palavras).
4. SÓ fatos concretos dos relatos. PROIBIDO: ${LISTA_PROIBIDAS_PROMPT}; PROIBIDO abstrações, moral e lições.
5. NÃO escreva a pergunta aos comentários nem o pedido de inscrição (eles já são acrescentados em código ao final).
${feedback ? `\nCORREÇÃO NECESSÁRIA: ${feedback}\n` : ''}
Responda APENAS com o texto em um único parágrafo contínuo, sem tópicos e sem numeração.`;

    let resumo = '';
    let feedbackFech = '';
    let fechamentoTexto = '';
    let fechamentoProblemas = [];
    for (let tent = 0; tent < 3; tent++) {
      const raw = await callAi(montarPromptFechamento(feedbackFech), 'Você é um roteirista bíblico conciso e objetivo.', { max_tokens: 8192 });
      let bruto = extrairTextoDeRespostaJson(raw).replace(/\s*\n+\s*/g, ' ').trim();
      bruto = dividirSentencas(bruto).filter(s => !/\?|inscreva|inscrev|coment[aá]rios/i.test(s)).join(' ');
      resumo = corrigirCapitalizacaoSacra(bruto);
      fechamentoTexto = `${resumo} ${FECHO_FIXO}`.trim();
      fechamentoProblemas = [];
      const pf = contarPalavras(fechamentoTexto);
      if (pf < LIMITES.fechamentoMin) fechamentoProblemas.push(`o resumo ficou curto (fechamento total ${pf} palavras; precisa de ${LIMITES.fechamentoMin}-${LIMITES.fechamentoMax}). Escreva frases mais completas somando entre ${alvoMin} e ${alvoMax} palavras.`);
      if (pf > LIMITES.fechamentoMax) fechamentoProblemas.push(`o resumo ficou longo (fechamento total ${pf} palavras; máximo ${LIMITES.fechamentoMax}). Reduza para ${alvoMin}-${alvoMax} palavras.`);
      detectarProibidas(resumo).forEach(p => fechamentoProblemas.push(`remova "${p.trecho}".`));
      if (fechamentoProblemas.length === 0) break;
      feedbackFech = fechamentoProblemas.join(' ');
    }

    // MONTAGEM EM CÓDIGO
    updateProgress('Montando estrutura completa do roteiro...', 92);
    const roteiroCompleto = montarRoteiroCompleto({
      tema,
      itens: itensComVersiculos,
      itensTextos: itensFinais,
      fechamentoTexto
    });

    // 6. VALIDAÇÃO ESTRUTURAL
    updateProgress('Validando regras estruturais...', 96);
    const validacao = validarEstrutura(roteiroCompleto, n);

    const traducaoUsada = (traducao === 'aa' || traducao === 'jfa') ? 'Almeida Atualizada (ARA/AA)' : 'Almeida Revista e Corrigida (ARC)';

    // DADOS DE CONFERÊNCIA (notas do auditor ficam SÓ aqui)
    const dadosConferencia = {
      tema,
      traducaoUsada,
      totalItens: n,
      sobreposicoesTrigramas: sobreposicoesDetectadas,
      itens: resultadosItens.map(r => ({
        numero: r.it.numero,
        nome: r.it.nome,
        texto: r.texto,
        versiculos: r.it.versiculos,
        referenciaFormatada: r.it.referenciaFormatada,
        versiculosTextoResumo: r.it.versiculosTextoResumo,
        bibleGatewayUrl: r.it.bibleGatewayUrl,
        frasesSinalizadas: r.sinalizacoes,
        citacoes: r.analise.citacoes || [],
        palavras: contarPalavras(r.texto),
        ciclosCorrecao: r.ciclos,
        referenciasUsadas: r.analise.referenciasUsadas || [],
        problemasRestantes: (r.analise.problemas || []).map(p => `${p.tipo}${p.frase ? `: ${p.frase}` : ''}`)
      })),
      fechamentoProblemas
    };

    updateProgress('Roteiro do Catálogo concluído com sucesso!', 100);

    return {
      roteiro: roteiroCompleto,
      validacao,
      dadosConferencia,
      sobreposicoesTrigramas: sobreposicoesDetectadas,
      traducaoUsada,
      itens: itensComVersiculos
    };
  }

  return {
    LIMITES,
    LIVROS_MAP,
    LIVROS_EN,
    NOMES_PT_EN,
    NUMEROS_EXTENSO,
    DICIONARIO_PRONUNCIA_TTS,
    PALAVRAS_PROIBIDAS,
    normalizarTexto,
    contarPalavras,
    corrigirCapitalizacaoSacra,
    capitalizarInicioFrases,
    dividirSentencas,
    parseIdeia,
    obterBibliaJson,
    carregarVersiculos,
    referenciaFalada,
    gerarPromptItem,
    gerarPromptConferenciaItem,
    gerarPromptRegeneracaoItem,
    verificarCitacoesEmCodigo,
    detectarProibidas,
    fechoComMoral,
    temContraste,
    terminaIncompleto,
    higienizarItemEmCodigo,
    remediarItem,
    padronizarAspasEPontuacao,
    segmentarRoteiro,
    montarRoteiroCompleto,
    validarEstrutura,
    renderizarPainelConferencia,
    aplicarPronunciaParaTTS,
    mesclarNumerosSoltosSRT,
    nomeEmIngles,
    referenciaEmIngles,
    gerarPacotePublicacao,
    executarFluxoCatalogo
  };
});
