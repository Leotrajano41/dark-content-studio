// js/plano-cenas.js — Módulo do Plano de Cenas e Exportação para o Scriptorium
// Compatível com navegador (PlanoCenasModule) e Node.js (CommonJS).

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlanoCenasModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const NOMES_ARQUIVOS_FIXOS = {
    narracao: 'narracao.mp3',
    legenda: 'legenda.srt',
    cenas: 'cenas.txt',
    descricoes: 'descricoes.txt',
    prompts: 'prompts.txt'
  };

  const FICHAS_PERSONAGENS = {
    'Moisés': "elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff",
    'Moises': "elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff",
    'Arão': "elderly priest, grey beard, white linen priestly robe, blue ephod with gold trim, solemn gaze",
    'Arao': "elderly priest, grey beard, white linen priestly robe, blue ephod with gold trim, solemn gaze",
    'Josué': "young energetic commander, short dark beard, bronze scale armor, dark mantle, spear",
    'Josue': "young energetic commander, short dark beard, bronze scale armor, dark mantle, spear",
    'Faraó': "royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Farao': "royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression"
  };

  const DICIONARIO_TOPONIMOS = [
    { pt: /\bcume\s+do\s+monte\s+nebo\b/i, en: 'summit of Mount Nebo' },
    { pt: /\bmonte\s+nebo\b/i, en: 'Mount Nebo' },
    { pt: /\bmar\s+vermelho\b/i, en: 'Red Sea shore with towering walls of parted water' },
    { pt: /\b[aá]guas\s+de\s+merib[aá]\b/i, en: 'waters of Meribah' },
    { pt: /\bmerib[aá]\b/i, en: 'Meribah' },
    { pt: /\bcades-barneia\b/i, en: 'Kadesh-Barnea' },
    { pt: /\bcades\b/i, en: 'Kadesh' },
    { pt: /\bmonte\s+hor\b/i, en: 'Mount Hor' },
    { pt: /\bplan[ií]cies\s+de\s+moabe\b/i, en: 'plains of Moab' },
    { pt: /\bdeserto\s+de\s+sim\b/i, en: 'Wilderness of Zin' }
  ];

  const SUFIXO_ESTILO_SEM_MOLDURA = 'Full bleed image, no border, no frame, no decorative corners. No text.';

  function normalizarEspacos(str) {
    return (str || '').replace(/[^\S\r\n]+/g, ' ').trim();
  }

  function contarPalavras(str) {
    return (str.trim().match(/\S+/g) || []).length;
  }

  function gerarHashTexto(texto) {
    if (!texto) return '0';
    let hash = 0;
    const str = texto.replace(/\s+/g, ' ').trim();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  function verificarDesatualizacao(hashPlano, textoNarracaoAtual) {
    if (!hashPlano || !textoNarracaoAtual) return false;
    return String(hashPlano) !== gerarHashTexto(textoNarracaoAtual);
  }

  function gerarSlug(tema) {
    if (!tema) return 'scriptorium';
    return tema
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'scriptorium';
  }

  function gerarNomeZipScriptorium(tema) {
    const slug = gerarSlug(tema);
    return `${slug}-scriptorium.zip`;
  }

  /**
   * Divide a Narração Limpa em frases completas respeitando pontuações e citações.
   */
  function dividirEmFrases(texto) {
    if (!texto || typeof texto !== 'string') return [];
    const t = texto.replace(/\r\n/g, '\n').trim();

    // Regex para quebrar frases em . ! ? considerando aspas finais e mantendo o ponto na frase anterior
    const regexFrases = /[^.!?\n]+(?:[.!?]+["'”»]?|$)/g;
    const matches = t.match(regexFrases) || [];

    const frases = [];
    for (const m of matches) {
      const f = m.trim();
      if (f.length > 0) {
        frases.push(f);
      }
    }
    return frases;
  }

  /**
   * Agrupa as frases em cenas com base no tempo acumulado e nas 3 faixas de ritmo:
   * 1) 0s - 30s: 4 a 6s por cena (~10 a 15 palavras)
   * 2) 30s - 180s (3min): 12 a 18s por cena (~30 a 45 palavras)
   * 3) > 180s (3min): 18 a 28s por cena (~45 a 70 palavras)
   * Regras:
   * - Cortes sempre no começo de frase.
   * - Frases curtas (<4s / <10 palavras) são juntadas com a próxima.
   * - Limite rígido de 30s: se uma frase for > 30s, não corta no meio; mantém inteira e emite aviso.
   */
  function agruparFrasesEmCenas(frases, textoCompleto) {
    const cenas = [];
    const avisos = [];
    let tempoAcumuladoTotal = 0;
    let cenaAtualFrases = [];
    let palavrasCenaAtual = 0;
    let indiceFraseInicialCena = 0;

    const obterMetaSegundos = (tempoAtual) => {
      if (tempoAtual < 30) {
        return { min: 4, ideal: 5, max: 6 };
      } else if (tempoAtual < 180) {
        return { min: 12, ideal: 15, max: 18 };
      } else {
        return { min: 18, ideal: 23, max: 28 };
      }
    };

    for (let i = 0; i < frases.length; i++) {
      const frase = frases[i];
      const qtdPalavras = contarPalavras(frase);
      const duracaoFrase = qtdPalavras / 2.5;

      if (cenaAtualFrases.length === 0) {
        indiceFraseInicialCena = i;
        cenaAtualFrases.push(frase);
        palavrasCenaAtual = qtdPalavras;

        // Se uma única frase tiver mais de 30 segundos, não divide no meio; mantém e emite aviso
        if (duracaoFrase > 30) {
          const numCena = String(cenas.length + 1).padStart(2, '0');
          avisos.push(`Cena ${numCena} contém uma única frase longa com duração estimada de ${duracaoFrase.toFixed(1)}s (máximo recomendado: 30s).`);
          cenas.push({
            numero: numCena,
            frases: [...cenaAtualFrases],
            fraseInicio: cenaAtualFrases[0],
            qtdPalavras: palavrasCenaAtual,
            duracaoEstimadaSegundos: Number(duracaoFrase.toFixed(1)),
            tempoInicioTotal: Number(tempoAcumuladoTotal.toFixed(1))
          });
          tempoAcumuladoTotal += duracaoFrase;
          cenaAtualFrases = [];
          palavrasCenaAtual = 0;
        }
        continue;
      }

      const duracaoAtualCena = palavrasCenaAtual / 2.5;
      const meta = obterMetaSegundos(tempoAcumuladoTotal);

      // Frase muito curta (< 4s) sempre se junta à cena atual se não estourar 30s
      const ehMuitoCurta = duracaoAtualCena < 4;
      const cabeNaMeta = (duracaoAtualCena + duracaoFrase) <= meta.max;
      const naoEstouraTeto = (duracaoAtualCena + duracaoFrase) <= 30;

      if ((ehMuitoCurta || cabeNaMeta) && naoEstouraTeto) {
        cenaAtualFrases.push(frase);
        palavrasCenaAtual += qtdPalavras;
      } else {
        // Fecha a cena atual e abre nova
        const duracaoFinal = palavrasCenaAtual / 2.5;
        const numCena = String(cenas.length + 1).padStart(2, '0');
        cenas.push({
          numero: numCena,
          frases: [...cenaAtualFrases],
          fraseInicio: cenaAtualFrases[0],
          qtdPalavras: palavrasCenaAtual,
          duracaoEstimadaSegundos: Number(duracaoFinal.toFixed(1)),
          tempoInicioTotal: Number(tempoAcumuladoTotal.toFixed(1))
        });
        tempoAcumuladoTotal += duracaoFinal;

        cenaAtualFrases = [frase];
        palavrasCenaAtual = qtdPalavras;
        indiceFraseInicialCena = i;

        if (duracaoFrase > 30) {
          const numProxima = String(cenas.length + 1).padStart(2, '0');
          avisos.push(`Cena ${numProxima} contém uma única frase longa com duração estimada de ${duracaoFrase.toFixed(1)}s (máximo recomendado: 30s).`);
          cenas.push({
            numero: numProxima,
            frases: [...cenaAtualFrases],
            fraseInicio: cenaAtualFrases[0],
            qtdPalavras: palavrasCenaAtual,
            duracaoEstimadaSegundos: Number(duracaoFrase.toFixed(1)),
            tempoInicioTotal: Number(tempoAcumuladoTotal.toFixed(1))
          });
          tempoAcumuladoTotal += duracaoFrase;
          cenaAtualFrases = [];
          palavrasCenaAtual = 0;
        }
      }
    }

    if (cenaAtualFrases.length > 0) {
      const duracaoFinal = palavrasCenaAtual / 2.5;
      const numCena = String(cenas.length + 1).padStart(2, '0');
      cenas.push({
        numero: numCena,
        frases: [...cenaAtualFrases],
        fraseInicio: cenaAtualFrases[0],
        qtdPalavras: palavrasCenaAtual,
        duracaoEstimadaSegundos: Number(duracaoFinal.toFixed(1)),
        tempoInicioTotal: Number(tempoAcumuladoTotal.toFixed(1))
      });
    }

    return { cenas, avisos };
  }

  /**
   * Constrói o prompt em inglês para cada cena com estilo Manuscrito Iluminado sem moldura.
   */
  function construirPromptCena(cena, contexto) {
    const textoCenaPt = cena.frases.join(' ');
    const tema = contexto.tema || 'Biblical Scene';
    const personagemPrincipal = contexto.personagemPrincipal || 'Moisés';

    // Detecta personagens presentes no trecho da cena
    const personagensEncontrados = [];
    for (const [nomeP, ficha] of Object.entries(FICHAS_PERSONAGENS)) {
      const reg = new RegExp(`\\b${nomeP}\\b`, 'i');
      if (reg.test(textoCenaPt) && !personagensEncontrados.some(p => p.nome === 'Moisés' && (nomeP === 'Moisés' || nomeP === 'Moises'))) {
        personagensEncontrados.push({ nome: nomeP, ficha });
      }
    }

    // Se nenhum detectado explicitamente mas a história é do personagem principal e cena inicial
    if (personagensEncontrados.length === 0 && (cena.numero === '01' || cena.numero === '02') && FICHAS_PERSONAGENS[personagemPrincipal]) {
      personagensEncontrados.push({ nome: personagemPrincipal, ficha: FICHAS_PERSONAGENS[personagemPrincipal] });
    }

    cena.personagens = personagensEncontrados.map(p => p.nome);

    // Detecta topônimos no trecho
    let toponimoIngles = '';
    for (const top of DICIONARIO_TOPONIMOS) {
      if (top.pt.test(textoCenaPt)) {
        toponimoIngles = top.en;
        break;
      }
    }

    // Tradução resumida do momento de ação da cena para inglês
    let descricaoAcaoIngles = '';
    if (/abriu|muralhas\s+de\s+[aá]gua/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'parted waters of the sea standing as colossal vertical walls on both sides, dry seabed corridor illuminated by divine pillar of fire';
    } else if (/vara|estendeu\s+a\s+(?:sua\s+)?m[aã]o/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'stretching forth rustic wooden staff over the roaring waters, dramatic sea breeze fluttering linen robes';
    } else if (/marchou|povo\s+marchou|liberdade/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'ancient Hebrew multitude carrying bundle sacks and clay jars, walking reverently between colossal water walls';
    } else if (/cavaleiros|eg[ií]pcios|carros\s+de\s+guerra/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'bronze chariots and charging war horses rushing into the churning seabed basin, turmoil and churning sands';
    } else if (/desabaram|sepultando|ex[eé]rcito/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'massive collapsing walls of foaming water crashing over bronze armor and overturned war chariots';
    } else if (/cume\s+do\s+monte\s+nebo|monte\s+nebo/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'standing solemnly on the rocky windswept summit of Mount Nebo, gazing across the distant green Jordan Valley';
    } else if (/bateu|feriu\s+a\s+rocha|rocha/i.test(textoCenaPt)) {
      descricaoAcaoIngles = 'striking the desert boulder twice with wooden staff, crystal water gushing forward over parched desert stones';
    } else {
      descricaoAcaoIngles = `solemn biblical historical tableau depicting ${tema.toLowerCase()}, authentic ancient near-eastern atmosphere, raw dramatic tension`;
    }

    let blocoPersonagens = '';
    if (personagensEncontrados.length > 0) {
      blocoPersonagens = personagensEncontrados.map(p => `${p.nome} (${p.ficha})`).join(', ') + ', ';
    }

    const localizacao = toponimoIngles ? `at ${toponimoIngles}, ` : '';

    return `Illuminated manuscript and vintage watercolor on aged textured parchment, sepia ink line art, carmine and gold leaf accents. Depicting ${blocoPersonagens}${localizacao}${descricaoAcaoIngles}. Dramatic volumetric lighting, solemn reverence, authentic ancient biblical setting. ${SUFIXO_ESTILO_SEM_MOLDURA}`;
  }

  /**
   * Gera o Plano de Cenas completo a partir da Narração Limpa.
   */
  function gerarPlanoDeCenas(narracaoLimpa, contexto = {}) {
    if (!narracaoLimpa || typeof narracaoLimpa !== 'string') {
      return { cenas: [], avisos: ['Narração Limpa ausente.'] };
    }

    const frases = dividirEmFrases(narracaoLimpa);
    if (frases.length === 0) {
      return { cenas: [], avisos: ['Nenhuma frase identificada na Narração Limpa.'] };
    }

    const { cenas, avisos } = agruparFrasesEmCenas(frases, narracaoLimpa);

    for (const c of cenas) {
      c.promptIngles = construirPromptCena(c, contexto);
    }

    return {
      cenas,
      avisos,
      totalCenas: cenas.length,
      hashTexto: gerarHashTexto(narracaoLimpa)
    };
  }

  /**
   * Gera o conteúdo do arquivo cenas.txt:
   * Linha formato: 01 | Frase exata (>= 5 palavras).
   * Se a frase de início tiver menos de 5 palavras, expande com a frase seguinte na Narração Limpa.
   */
  function gerarCenasTxt(cenas, narracaoLimpa) {
    if (!cenas || !Array.isArray(cenas)) return '';
    const textoBase = narracaoLimpa || '';

    const linhas = cenas.map(c => {
      let trecho = c.fraseInicio.trim();
      let palavras = trecho.match(/\S+/g) || [];

      // Se tiver menos de 5 palavras, expande buscando onde o trecho está na narração
      if (palavras.length < 5 && textoBase.includes(trecho)) {
        const idx = textoBase.indexOf(trecho);
        const restante = textoBase.slice(idx);
        const palavrasRestantes = restante.match(/\S+/g) || [];
        const qtdDesejada = Math.min(palavrasRestantes.length, Math.max(5, palavras.length + 3));
        const pedacoExpandido = palavrasRestantes.slice(0, qtdDesejada).join(' ');

        // Localiza a substring exata correspondente no texto original para preservar pontuação
        if (textoBase.includes(pedacoExpandido)) {
          trecho = pedacoExpandido;
        } else {
          // Busca por regex tolerante a espaços
          const regExpansao = new RegExp(pedacoExpandido.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
          const matchExato = textoBase.match(regExpansao);
          if (matchExato) trecho = matchExato[0];
        }
      }

      // Se ainda tiver menos de 5 palavras e houver frases adicionais dentro da mesma cena
      if ((trecho.match(/\S+/g) || []).length < 5 && c.frases && c.frases.length > 1) {
        const combinado = c.frases.slice(0, 2).join(' ');
        if (textoBase.includes(combinado)) {
          trecho = combinado;
        }
      }

      return `${c.numero} | ${trecho}`;
    });

    return linhas.join('\n');
  }

  function gerarDescricoesTxt(cenas) {
    if (!cenas || !Array.isArray(cenas)) return '';
    return cenas.map(c => `${c.numero} | ${c.promptIngles}`).join('\n');
  }

  function gerarPromptsTxt(cenas) {
    if (!cenas || !Array.isArray(cenas)) return '';
    return cenas.map(c => `${c.numero}. ${c.promptIngles}`).join('\n\n');
  }

  /**
   * Validador estrito do Pacote Scriptorium antes de exportar:
   * 1. Mesma quantidade de linhas em cenas.txt, descricoes.txt e prompts.txt.
   * 2. Cada trecho de cenas.txt existe na Narração Limpa com pelo menos 5 palavras.
   * 3. Nenhuma cena ultrapassa 30s sem aviso prévio.
   */
  function validarPacoteScriptorium(dados) {
    const { cenasTxt, descricoesTxt, promptsTxt, narracaoLimpa, cenas } = dados || {};
    const erros = [];

    const linhasCenas = (cenasTxt || '').trim().split('\n').filter(Boolean);
    const linhasDesc = (descricoesTxt || '').trim().split('\n').filter(Boolean);
    const blocosPrompts = (promptsTxt || '').trim().split(/\n\s*\n/).filter(Boolean);

    if (linhasCenas.length === 0) {
      erros.push('cenas.txt está vazio.');
    }
    if (linhasDesc.length !== linhasCenas.length) {
      erros.push(`Quantidade de linhas divergente: cenas.txt tem ${linhasCenas.length} e descricoes.txt tem ${linhasDesc.length}.`);
    }
    if (blocosPrompts.length !== linhasCenas.length) {
      erros.push(`Quantidade divergente: cenas.txt tem ${linhasCenas.length} e prompts.txt tem ${blocosPrompts.length}.`);
    }

    let indiceUltimaOcorrencia = -1;
    for (const linha of linhasCenas) {
      const partes = linha.split('|');
      if (partes.length < 2) {
        erros.push(`Linha com formato inválido em cenas.txt: "${linha}"`);
        continue;
      }
      const trecho = partes.slice(1).join('|').trim();
      const palavras = trecho.match(/\S+/g) || [];
      if (palavras.length < 5) {
        erros.push(`Trecho em cenas.txt com menos de 5 palavras: "${trecho}" (${palavras.length} palavras).`);
      }
      if (narracaoLimpa && !narracaoLimpa.includes(trecho)) {
        erros.push(`Trecho do cenas.txt não encontrado na Narração Limpa: "${trecho}"`);
      } else if (narracaoLimpa) {
        const posAtual = narracaoLimpa.indexOf(trecho);
        if (posAtual < indiceUltimaOcorrencia) {
          erros.push(`Cenas fora de ordem cronológica na Narração Limpa: "${trecho}"`);
        }
        indiceUltimaOcorrencia = posAtual;
      }
    }

    if (cenas && Array.isArray(cenas)) {
      for (const c of cenas) {
        if (c.duracaoEstimadaSegundos > 30.5 && (!c.frases || c.frases.length > 1)) {
          erros.push(`Cena ${c.numero} excede 30 segundos (${c.duracaoEstimadaSegundos}s) e não é frase única.`);
        }
      }
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  function calcularCrc32(bytes) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[n] = c;
    }
    let c = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
      c = (c >>> 8) ^ table[(c ^ bytes[i]) & 0xFF];
    }
    return (c ^ (-1)) >>> 0;
  }

  /**
   * Gera um Blob ou Uint8Array de arquivo ZIP puro (Store) compatível nativamente com macOS e Windows.
   */
  function criarZipScriptorium(arquivos) {
    const encoder = new TextEncoder();
    const partes = [];
    const entradas = [];
    let offset = 0;

    for (const arq of arquivos) {
      const nomeBytes = encoder.encode(arq.nome);
      let dados = arq.conteudo;
      if (typeof dados === 'string') {
        dados = encoder.encode(dados);
      } else if (dados instanceof ArrayBuffer) {
        dados = new Uint8Array(dados);
      } else if (!(dados instanceof Uint8Array)) {
        dados = encoder.encode(String(dados || ''));
      }
      const tam = dados.length;
      const crc = calcularCrc32(dados);

      // Header local
      const local = new Uint8Array(30 + nomeBytes.length);
      const view = new DataView(local.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true); // Store (sem compressão)
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, tam, true);
      view.setUint32(22, tam, true);
      view.setUint16(26, nomeBytes.length, true);
      view.setUint16(28, 0, true);
      local.set(nomeBytes, 30);

      entradas.push({ nomeBytes, tam, crc, offset });
      partes.push(local, dados);
      offset += local.length + tam;
    }

    const centralOffset = offset;
    let centralTam = 0;

    for (const ent of entradas) {
      const cd = new Uint8Array(46 + ent.nomeBytes.length);
      const view = new DataView(cd.buffer);
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint16(14, 0, true);
      view.setUint32(16, ent.crc, true);
      view.setUint32(20, ent.tam, true);
      view.setUint32(24, ent.tam, true);
      view.setUint16(28, ent.nomeBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint32(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, ent.offset, true);
      cd.set(ent.nomeBytes, 46);

      partes.push(cd);
      centralTam += cd.length;
    }

    const eocd = new Uint8Array(22);
    const viewEocd = new DataView(eocd.buffer);
    viewEocd.setUint32(0, 0x06054b50, true);
    viewEocd.setUint16(4, 0, true);
    viewEocd.setUint16(6, 0, true);
    viewEocd.setUint16(8, entradas.length, true);
    viewEocd.setUint16(10, entradas.length, true);
    viewEocd.setUint32(12, centralTam, true);
    viewEocd.setUint32(16, centralOffset, true);
    viewEocd.setUint16(20, 0, true);

    partes.push(eocd);

    const totalTam = partes.reduce((acc, p) => acc + p.length, 0);
    const zipFinal = new Uint8Array(totalTam);
    let cur = 0;
    for (const p of partes) {
      zipFinal.set(p, cur);
      cur += p.length;
    }

    return (typeof Blob !== 'undefined')
      ? new Blob([zipFinal], { type: 'application/zip' })
      : zipFinal;
  }

  return {
    NOMES_ARQUIVOS_FIXOS,
    FICHAS_PERSONAGENS,
    DICIONARIO_TOPONIMOS,
    SUFIXO_ESTILO_SEM_MOLDURA,
    dividirEmFrases,
    agruparFrasesEmCenas,
    construirPromptCena,
    gerarPlanoDeCenas,
    gerarCenasTxt,
    gerarDescricoesTxt,
    gerarPromptsTxt,
    gerarHashTexto,
    verificarDesatualizacao,
    gerarSlug,
    gerarNomeZipScriptorium,
    validarPacoteScriptorium,
    criarZipScriptorium
  };
});
