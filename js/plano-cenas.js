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

  const PREFIXO_ESTILO_CANAL = 'Illuminated manuscript and vintage watercolor on aged textured parchment, sepia ink line art, carmine and gold leaf accents. Dramatic atmospheric lighting, solemn reverence.';

  const SUFIXO_ESTILO_SEM_MOLDURA = 'Full bleed image, no border, no frame, no decorative corners. No text.';

  const FICHAS_PERSONAGENS = {
    'Moses': "Moses: elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff",
    'Moisés': "Moses: elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff",
    'Moises': "Moses: elderly man, long white beard, shoulder-length white hair, beige linen tunic, crimson mantle, wooden shepherd's staff",
    'Aaron': "Aaron: elderly high priest, grey beard, sacred white linen priestly robe, blue ephod with gold trim, solemn gaze",
    'Arão': "Aaron: elderly high priest, grey beard, sacred white linen priestly robe, blue ephod with gold trim, solemn gaze",
    'Arao': "Aaron: elderly high priest, grey beard, sacred white linen priestly robe, blue ephod with gold trim, solemn gaze",
    'Joshua': "Joshua: young energetic commander, short dark beard, bronze scale armor, dark mantle, spear",
    'Josué': "Joshua: young energetic commander, short dark beard, bronze scale armor, dark mantle, spear",
    'Josue': "Joshua: young energetic commander, short dark beard, bronze scale armor, dark mantle, spear",
    'Miriam': "Miriam: elderly Hebrew prophetess, weathered dignified face, dark woven veil, linen robes",
    'Miriã': "Miriam: elderly Hebrew prophetess, weathered dignified face, dark woven veil, linen robes",
    'Eleazar': "Eleazar: dignified young high priest, sacred linen garments, ceremonial priestly vestments",
    'Pharaoh': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Faraó': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Farao': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression"
  };

  const DICIONARIO_TOPONIMOS = [
    { pt: /\bcume\s+do\s+monte\s+nebo\b/i, en: 'summit of Mount Nebo' },
    { pt: /\bmonte\s+nebo\b/i, en: 'Mount Nebo' },
    { pt: /\bmar\s+vermelho\b/i, en: 'Red Sea shore' },
    { pt: /\b[aá]guas\s+de\s+merib[aá]\b/i, en: 'waters of Meribah' },
    { pt: /\bmerib[aá]\b/i, en: 'Meribah' },
    { pt: /\bcades-barneia\b/i, en: 'Kadesh-Barnea' },
    { pt: /\bcades\b/i, en: 'Kadesh' },
    { pt: /\bmonte\s+hor\b/i, en: 'Mount Hor' },
    { pt: /\bmonte\s+sinai\b/i, en: 'Mount Sinai' },
    { pt: /\brio\s+jord[aã]o\b/i, en: 'Jordan River' },
    { pt: /\bvale\s+do\s+jord[aã]o\b/i, en: 'Jordan Valley' },
    { pt: /\bplan[ií]cies\s+de\s+moabe\b/i, en: 'plains of Moab' },
    { pt: /\bdeserto\s+de\s+zim\b/i, en: 'Wilderness of Zin' },
    { pt: /\bdeserto\s+de\s+sim\b/i, en: 'Wilderness of Zin' },
    { pt: /\btenda\s+da\s+congrega[cç][aã]o\b/i, en: 'Tent of Meeting tabernacle entrance' },
    { pt: /\btabern[aá]culo\b/i, en: 'sacred tabernacle entrance' }
  ];

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
   * Cortes somente no começo de frase.
   */
  function agruparFrasesEmCenas(frases, textoCompleto) {
    const cenas = [];
    const avisos = [];
    let tempoAcumuladoTotal = 0;
    let cenaAtualFrases = [];
    let palavrasCenaAtual = 0;

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
        cenaAtualFrases.push(frase);
        palavrasCenaAtual = qtdPalavras;

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

      const ehMuitoCurta = duracaoAtualCena < 4;
      const cabeNaMeta = (duracaoAtualCena + duracaoFrase) <= meta.max;
      const naoEstouraTeto = (duracaoAtualCena + duracaoFrase) <= 30;

      if ((ehMuitoCurta || cabeNaMeta) && naoEstouraTeto) {
        cenaAtualFrases.push(frase);
        palavrasCenaAtual += qtdPalavras;
      } else {
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

  // ---------------------------------------------------------------------------
  // GERAÇÃO DE DESCRIÇÕES VISUAIS COM IA (EM LOTES DE 10 CENAS)
  // ---------------------------------------------------------------------------

  /**
   * Constrói o prompt de comando para a IA gerar descrições visuais em lotes de até 10 cenas.
   */
  function construirPromptIaLoteCenas(loteCenas) {
    const cenasFormatadas = loteCenas.map(c => `[Cena ${c.numero}]: "${c.trecho.replace(/\s+/g, ' ').trim()}"`).join('\n\n');

    return `You are an expert biblical art director creating visual image descriptions for dramatic historical illustrations.
For each narration excerpt below, write ONE concise, vivid visual description in English describing strictly what is seen in that specific scene.

CRITICAL RULES:
1. Describe ONLY what happens in the given excerpt (visible people, concrete actions, physical environment, objects).
2. FORBIDDEN to include elements from other biblical events or stories (e.g., NEVER include sea, ocean waves, or shore if the text is about a desert, rock, camp, or mountain).
3. Use strictly biblical English names: Moses, Aaron, Miriam, Joshua, Eleazar, Pharaoh; Meribah, Kadesh, Mount Hor, Mount Nebo, Mount Sinai, Jordan River, Canaan.
4. FORBIDDEN to depict God as a human figure, face, or humanoid shadow. Depict divine presence through glorious radiant celestial light, glowing illumination, pillar of cloud or fire.
5. Do NOT include Portuguese words.
6. Do NOT use generic placeholders like "biblical tableau", "artistic depiction" or "scene representing". Describe the physical concrete action.
7. Output EXCLUSIVELY a valid JSON array of objects with "numero" and "descricaoVisual".

INPUT SCENES:
${cenasFormatadas}

OUTPUT FORMAT (JSON only):
[
  { "numero": "01", "descricaoVisual": "description in English..." }
]`;
  }

  /**
   * Extrai o array JSON retornado pela IA.
   */
  function extrairJsonLote(respostaTexto) {
    if (!respostaTexto || typeof respostaTexto !== 'string') return [];
    try {
      // 1. Tenta parse direto
      return JSON.parse(respostaTexto);
    } catch (_) {
      // 2. Tenta extrair de blocos ```json ... ```
      const matchBloco = respostaTexto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (matchBloco) {
        try {
          return JSON.parse(matchBloco[1]);
        } catch (_) {}
      }
      // 3. Tenta encontrar o primeiro [ ... ]
      const matchArray = respostaTexto.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (matchArray) {
        try {
          return JSON.parse(matchArray[0]);
        } catch (_) {}
      }
    }
    return [];
  }

  /**
   * Valida a descrição visual devolvida pela IA para a cena.
   * Rejeita se:
   * 1. Contiver "sea" ou "waters" sem o trecho em português falar de água/mar.
   * 2. Contiver palavras em português.
   * 3. For genérico ("solemn biblical historical tableau", etc.).
   */
  function validarDescricaoVisualCena(descricaoVisual, trechoPt) {
    if (!descricaoVisual || typeof descricaoVisual !== 'string') {
      return { valido: false, motivo: 'Descrição visual vazia.' };
    }

    const desc = descricaoVisual.trim();

    // 1. Detecção de falso mar / águas indevidas
    const temMarNaDescricao = /\b(?:sea|ocean|waves?)\b/i.test(desc);
    if (temMarNaDescricao) {
      const temMarNoTrecho = /(?<![\p{L}])(?:mar|oceano|ondas?)(?![\p{L}])/iu.test(trechoPt);
      if (!temMarNoTrecho) {
        return { valido: false, motivo: 'Contém termos de mar ("sea"/"ocean") sem menção a mar no trecho narrativo.' };
      }
    }

    const temAguaNaDescricao = /\bwaters?\b/i.test(desc);
    if (temAguaNaDescricao) {
      const temAguaNoTrecho = /(?<![\p{L}])(?:mar|oceano|[aá]guas?|beber|sede|fonte|rio|ribeiro|po[cç]o|jorr(?:ar|ou)|brot(?:ar|aram)|manancial)(?![\p{L}])/iu.test(trechoPt);
      if (!temAguaNoTrecho) {
        return { valido: false, motivo: 'Contém termos aquáticos ("water"/"waters") sem menção a água no trecho narrativo.' };
      }
    }

    // 2. Detecção de palavras em português
    const regexPalavrasPt = /(?<![\p{L}])(?:da|do|de|das|dos|em|na|no|nas|nos|com|por|para|uma|um|ele|eles|ela|elas|que|se|não|foi|era|disse|diante|povo|homem|terra|vida)(?![\p{L}])/iu;
    if (regexPalavrasPt.test(desc)) {
      return { valido: false, motivo: 'Contém palavras em português na descrição em inglês.' };
    }

    // 3. Detecção de genéricos vazios
    if (/\b(?:solemn biblical historical tableau|generic tableau|abstract depiction|tableau depicting)\b/i.test(desc)) {
      return { valido: false, motivo: 'Contém termos genéricos proibidos ("tableau depicting").' };
    }

    // 4. Detecção de representação humana de Deus
    if (/\b(?:face of God|figure of God|God as an old man|God's body|human form of God)\b/i.test(desc)) {
      return { valido: false, motivo: 'Representação antropomórfica indevida da figura de Deus.' };
    }

    if (contarPalavras(desc) < 4) {
      return { valido: false, motivo: 'Descrição curta demais (menos de 4 palavras).' };
    }

    return { valido: true, motivo: '' };
  }

  /**
   * Injeta os elementos fixos de consistência após a descrição visual:
   * 1. Prefixo do estilo do canal no início.
   * 2. Ficha canônica do personagem quando ele aparece.
   * 3. Sufixo "Full bleed image, no border, no frame, no decorative corners. No text." no final.
   */
  function montarPromptFinalCena(descricaoVisual, trechoPt, contexto = {}) {
    let desc = (descricaoVisual || '').trim();

    // Remove eventuais prefixos ou sufixos duplicados
    desc = desc.replace(/^Illuminated manuscript[^.]*\.\s*/i, '');
    desc = desc.replace(/Full bleed image[^.]*\.?\s*$/i, '');
    desc = desc.replace(/^Depicting\s+/i, '');

    // Identifica personagens presentes
    const personagensEncontrados = [];
    const nomesNormalizados = {
      'moises': 'Moses', 'móises': 'Moses', 'moses': 'Moses',
      'arao': 'Aaron', 'arão': 'Aaron', 'aaron': 'Aaron',
      'josue': 'Joshua', 'josué': 'Joshua', 'joshua': 'Joshua',
      'miriam': 'Miriam', 'miriã': 'Miriam',
      'eleazar': 'Eleazar',
      'farao': 'Pharaoh', 'faraó': 'Pharaoh', 'pharaoh': 'Pharaoh'
    };

    const textoCombinado = `${trechoPt} ${desc}`.toLowerCase();
    for (const [chave, fichaCanon] of Object.entries(FICHAS_PERSONAGENS)) {
      const nomeEn = nomesNormalizados[chave.toLowerCase()];
      if (nomeEn && !personagensEncontrados.some(p => p.nome === nomeEn)) {
        const reg = new RegExp(`\\b${chave}\\b`, 'i');
        if (reg.test(textoCombinado)) {
          personagensEncontrados.push({ nome: nomeEn, ficha: fichaCanon });
        }
      }
    }

    let blocoFichas = '';
    if (personagensEncontrados.length > 0) {
      blocoFichas = personagensEncontrados.map(p => p.ficha).join(', ') + '. ';
    }

    // Limpa pontuação final da descrição
    desc = desc.replace(/[.,;:\s]+$/, '');

    return `${PREFIXO_ESTILO_CANAL} Depicting ${blocoFichas}${desc}. ${SUFIXO_ESTILO_SEM_MOLDURA}`;
  }

  /**
   * Fallback contextual determinístico e fiel para modo offline ou testes (sem API).
   */
  function gerarDescricaoVisualFallback(trechoPt, numeroCena, contexto = {}) {
    const t = (trechoPt || '').toLowerCase();
    const tema = contexto.tema || 'Moisés';

    if (/\b(?:vara|feriu|bateu)\b/i.test(t) && /\brocha\b/i.test(t)) {
      return 'Moses raising a rustic wooden staff striking the dry desert boulder in Kadesh, tense Hebrew multitude watching in silence under parched sunlight';
    }
    if (/\b(?:[aá]gua|jorrou|brotar|brotaram|beber|sede|gado)\b/i.test(t) && /\brocha\b/i.test(t)) {
      return 'crystal water gushing forth from the cracked desert boulder, thirsty Hebrew families and livestock kneeling to drink from the fresh desert spring';
    }
    if (/\b(?:prostrar|prostraram|rostos?\s+em\s+terra|tenda\s+da\s+congrega[cç][aã]o|tabern[aá]culo)\b/i.test(t)) {
      return 'Moses and Aaron prostrate with faces upon the desert sand before the sacred entrance of the Tabernacle tent, radiant celestial glory glowing above';
    }
    if (/\b(?:gl[oó]ria\s+do\s+senhor|gl[oó]ria|apareceu|luz)\b/i.test(t)) {
      return 'radiant supernatural beam of golden divine glory illuminating the desert wilderness and the sacred Tabernacle entrance in majestic reverence';
    }
    if (/\b(?:senten[cç]a|decreto|irrevog[aá]vel|n[aã]o\s+entrariam|ju[ií]zo)\b/i.test(t)) {
      return 'Moses and Aaron standing solemnly before the Hebrew assembly in Kadesh, solemn expressions of profound reverence and godly sorrow under vast open sky';
    }
    if (/\b(?:monte\s+hor|vestes|eleazar|morte\s+de\s+ar[aã]o)\b/i.test(t)) {
      return 'Moses, Aaron, and young priest Eleazar ascending the rugged rocky heights of Mount Hor at sunset, distant panoramic desert expanses below';
    }
    if (/\b(?:monte\s+nebo|cume|vis[aã]o|terra\s+prometida|cana[aã])\b/i.test(t)) {
      return 'Moses standing on the summit of Mount Nebo looking outward across the distant green Jordan Valley and promised land of Canaan at golden hour';
    }
    if (/\b(?:sepultura|morreu|ningu[eé]m\s+sabe|moabe)\b/i.test(t)) {
      return 'serene secluded ravine in the plains of Moab enveloped in ethereal twilight mist, absolute sacred tranquility under starry desert heavens';
    }
    if (/\b(?:mar\s+vermelho|carruagens|egito|fara[oó])\b/i.test(t)) {
      return 'towering walls of parted sea water standing as vertical glassy ramparts, dry seabed corridor illuminated by distant supernatural pillar of fire';
    }
    if (/\b(?:inscreva-se|canal|notifica[cç][oõ]es|estudo)\b/i.test(t)) {
      return 'ancient illuminated manuscript scroll resting on rustic cedar desk beside an antique brass oil lamp glowing warm in evening twilight';
    }
    if (/\b(?:rebel|contenda|queix|clamar|reuni)\b/i.test(t)) {
      return 'hebrew assembly gathered in parched desert camp of Kadesh, elders gesturing with anxiety under harsh desert heat';
    }

    return `historical biblical scene in the arid Wilderness of Zin, authentic ancient Hebrew camp with earthen tents, dramatic desert topography under atmospheric sky`;
  }

  /**
   * Gera as descrições visuais de todas as cenas usando IA em lotes de 10 cenas por chamada.
   */
  async function gerarDescricoesVisuaisComIa(cenas, narracaoLimpa, chamarIaFn, contexto = {}) {
    if (!cenas || !Array.isArray(cenas) || cenas.length === 0) return cenas;

    // Divide as cenas em lotes de até 10
    const tamanhoLote = 10;
    const lotes = [];
    for (let i = 0; i < cenas.length; i += tamanhoLote) {
      lotes.push(cenas.slice(i, i + tamanhoLote));
    }

    for (let l = 0; l < lotes.length; l++) {
      const lote = lotes[l];
      const payloadLote = lote.map(c => ({
        numero: c.numero,
        trecho: c.frases.join(' ')
      }));

      const promptLote = construirPromptIaLoteCenas(payloadLote);
      let itensLote = [];

      if (typeof chamarIaFn === 'function') {
        try {
          const respostaIa = await chamarIaFn(promptLote);
          itensLote = extrairJsonLote(respostaIa);
        } catch (e) {
          console.warn(`[PlanoCenas] Falha na chamada da IA para lote ${l + 1}:`, e);
          itensLote = [];
        }
      }

      for (const c of lote) {
        const trechoPt = c.frases.join(' ');
        const itemIa = Array.isArray(itensLote)
          ? itensLote.find(it => String(it.numero).padStart(2, '0') === c.numero)
          : null;

        let descVisual = itemIa ? (itemIa.descricaoVisual || itemIa.descricao || '') : '';
        let validacao = validarDescricaoVisualCena(descVisual, trechoPt);

        // Se a validação falhar ou estiver vazia, tenta regenerar a cena se houver callback de IA
        if (!validacao.valido && typeof chamarIaFn === 'function' && itemIa) {
          try {
            const promptCorrecao = `The previous visual description for Scene ${c.numero} was rejected because: ${validacao.motivo}.
Excerpt: "${trechoPt}"
Write a corrected, strictly factual visual description in English adhering to all rules. Output JSON: [{"numero": "${c.numero}", "descricaoVisual": "..."}]`;
            const respCorrigida = await chamarIaFn(promptCorrecao);
            const itensCorrigidos = extrairJsonLote(respCorrigida);
            if (itensCorrigidos && itensCorrigidos[0]?.descricaoVisual) {
              const novaDesc = itensCorrigidos[0].descricaoVisual;
              const novaVal = validarDescricaoVisualCena(novaDesc, trechoPt);
              if (novaVal.valido) {
                descVisual = novaDesc;
                validacao = novaVal;
              }
            }
          } catch (_) {}
        }

        // Se ainda não for válida, aplica o fallback contextual
        if (!validacao.valido) {
          descVisual = gerarDescricaoVisualFallback(trechoPt, c.numero, contexto);
        }

        c.descricaoVisual = descVisual;
        c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
      }
    }

    return cenas;
  }

  /**
   * Gera as descrições visuais no modo offline (sem IA) com fallback contextual fiel.
   */
  function gerarDescricoesVisuaisOffline(cenas, narracaoLimpa, contexto = {}) {
    if (!cenas || !Array.isArray(cenas)) return cenas;

    for (const c of cenas) {
      const trechoPt = c.frases.join(' ');
      const descVisual = gerarDescricaoVisualFallback(trechoPt, c.numero, contexto);
      c.descricaoVisual = descVisual;
      c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
    }
    return cenas;
  }

  /**
   * Gera o Plano de Cenas completo a partir da Narração Limpa.
   * Por padrão, gera as cenas de forma síncrona/offline;
   * se chamarIaFn for fornecido em contexto.chamarIaFn, executa a versão com IA em lotes.
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

    gerarDescricoesVisuaisOffline(cenas, narracaoLimpa, contexto);

    return {
      cenas,
      avisos,
      totalCenas: cenas.length,
      hashTexto: gerarHashTexto(narracaoLimpa)
    };
  }

  // ---------------------------------------------------------------------------
  // ARQUIVOS DO SCRIPTORIUM (cenas.txt, descricoes.txt, prompts.txt)
  // ---------------------------------------------------------------------------

  /**
   * Expande a frase inicial caso tenha menos de 5 palavras:
   * Pega a frase completa MAIS o começo da frase seguinte até dar pelo menos 5 palavras.
   * NUNCA introduz quebras de linha no trecho da linha.
   */
  function expandirTrechoParaMinimoPalavras(fraseInicio, textoBase, minPalavras = 5) {
    let trecho = (fraseInicio || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    let palavras = trecho.match(/\S+/g) || [];
    if (palavras.length >= minPalavras) {
      return trecho;
    }

    const baseNorm = (textoBase || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
    const idx = baseNorm.indexOf(trecho);
    if (idx !== -1) {
      const restante = baseNorm.slice(idx);
      const palavrasRestantes = restante.match(/\S+/g) || [];
      const qtdDesejada = Math.min(palavrasRestantes.length, Math.max(minPalavras, palavras.length + 3));
      return palavrasRestantes.slice(0, qtdDesejada).join(' ');
    }

    return trecho;
  }

  /**
   * Gera o conteúdo do arquivo cenas.txt:
   * Formato estrito: NN | Frase exata (>= 5 palavras).
   * Sem quebras de linha internas dentro de cada linha.
   */
  function gerarCenasTxt(cenas, narracaoLimpa) {
    if (!cenas || !Array.isArray(cenas)) return '';
    const textoBase = narracaoLimpa || '';

    const linhas = cenas.map(c => {
      const trechoFinal = expandirTrechoParaMinimoPalavras(c.fraseInicio, textoBase, 5);
      return `${c.numero} | ${trechoFinal}`;
    });

    return linhas.join('\n');
  }

  /**
   * Gera o conteúdo do arquivo descricoes.txt:
   * Formato estrito: NN | Prompt em inglês completo.
   */
  function gerarDescricoesTxt(cenas) {
    if (!cenas || !Array.isArray(cenas)) return '';
    return cenas.map(c => `${c.numero} | ${(c.promptIngles || '').replace(/[\r\n]+/g, ' ').trim()}`).join('\n');
  }

  /**
   * Gera o conteúdo do arquivo prompts.txt:
   * Formato: NN. Prompt detalhado...
   */
  function gerarPromptsTxt(cenas) {
    if (!cenas || !Array.isArray(cenas)) return '';
    return cenas.map(c => `${c.numero}. ${(c.promptIngles || '').trim()}`).join('\n\n');
  }

  /**
   * Validador estrito do Pacote Scriptorium antes de exportar:
   * 1. Mesma quantidade exata de cenas em cenas.txt, descricoes.txt e prompts.txt.
   * 2. Cada trecho de cenas.txt tem pelo menos 5 palavras e existe na Narração Limpa.
   * 3. Nenhuma cena ultrapassa 30s sem aviso prévio.
   */
  function validarPacoteScriptorium(dados) {
    const { cenasTxt, descricoesTxt, promptsTxt, narracaoLimpa, cenas } = dados || {};
    const erros = [];

    // Filtra exclusivamente linhas válidas no formato NN | Texto
    const linhasCenas = (cenasTxt || '').split('\n').map(l => l.trim()).filter(l => /^\d+\s*\|\s*.+/.test(l));
    const linhasDesc = (descricoesTxt || '').split('\n').map(l => l.trim()).filter(l => /^\d+\s*\|\s*.+/.test(l));
    const blocosPrompts = (promptsTxt || '').split(/\n\s*\n/).map(b => b.trim()).filter(b => /^\d+[\.:]\s*.+/s.test(b));

    if (linhasCenas.length === 0) {
      erros.push('cenas.txt está vazio ou sem linhas no formato correto (NN | trecho).');
    }
    if (linhasDesc.length !== linhasCenas.length) {
      erros.push(`Quantidade de linhas divergente: cenas.txt tem ${linhasCenas.length} e descricoes.txt tem ${linhasDesc.length}.`);
    }
    if (blocosPrompts.length !== linhasCenas.length) {
      erros.push(`Quantidade divergente: cenas.txt tem ${linhasCenas.length} e prompts.txt tem ${blocosPrompts.length}.`);
    }

    const narracaoNorm = (narracaoLimpa || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
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

      if (narracaoNorm && !narracaoNorm.includes(trecho)) {
        erros.push(`Trecho do cenas.txt não encontrado na Narração Limpa: "${trecho}"`);
      } else if (narracaoNorm) {
        const posAtual = narracaoNorm.indexOf(trecho);
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
      view.setUint16(8, 0, true);
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
    PREFIXO_ESTILO_CANAL,
    FICHAS_PERSONAGENS,
    DICIONARIO_TOPONIMOS,
    SUFIXO_ESTILO_SEM_MOLDURA,
    dividirEmFrases,
    agruparFrasesEmCenas,
    construirPromptIaLoteCenas,
    extrairJsonLote,
    validarDescricaoVisualCena,
    montarPromptFinalCena,
    gerarDescricaoVisualFallback,
    gerarDescricoesVisuaisComIa,
    gerarDescricoesVisuaisOffline,
    gerarPlanoDeCenas,
    expandirTrechoParaMinimoPalavras,
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
