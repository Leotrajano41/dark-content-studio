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

  const CATEGORIAS_MENU_IGNORAR = [
    'acontecimentos-chave da biblia', 'acontecimentos-chave da bíblia',
    'fins tragicos biblicos', 'fins trágicos bíblicos',
    'misterios e julgamentos', 'mistérios e julgamentos',
    'profecias e apocalipse', 'profecias e apocalipse',
    'personagens e batalhas', 'milagres e sinais',
    'estudos e temas gerais', 'sem-tema', 'geral', 'padrao', 'padrão'
  ];

  function gerarSlug(tema) {
    if (!tema) return 'scriptorium';
    return tema
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'scriptorium';
  }

  /**
   * ITEM 2: Nome do .ZIP baseado exclusivamente no TEMA do vídeo ou título da ideia escolhida.
   * NUNCA usa o nome da categoria do menu.
   */
  function gerarNomeZipScriptorium(temaOuOpcoes) {
    let temaFinal = '';

    if (typeof temaOuOpcoes === 'object' && temaOuOpcoes !== null) {
      const custom = (temaOuOpcoes.temaCustom || '').trim();
      const ideia = (temaOuOpcoes.ideiaEscolhida || '').trim();
      const thumb = (temaOuOpcoes.temaThumb || '').trim();
      const seo = (temaOuOpcoes.temaSeo || '').trim();
      const personagem = (temaOuOpcoes.personagemPrincipal || '').trim();
      const cat = (temaOuOpcoes.categoria || temaOuOpcoes.tema || '').trim();

      if (custom) {
        temaFinal = custom;
      } else if (ideia) {
        temaFinal = ideia;
      } else if (thumb) {
        temaFinal = thumb;
      } else if (seo) {
        temaFinal = seo;
      } else if (personagem) {
        temaFinal = personagem;
      } else if (cat && !CATEGORIAS_MENU_IGNORAR.some(c => c === cat.toLowerCase())) {
        temaFinal = cat;
      } else {
        temaFinal = 'roteiro';
      }
    } else {
      const str = String(temaOuOpcoes || '').trim();
      const ehCategoria = CATEGORIAS_MENU_IGNORAR.some(c => c === str.toLowerCase());
      temaFinal = (!str || ehCategoria) ? 'roteiro' : str;
    }

    const slug = gerarSlug(temaFinal);
    return `${slug}-scriptorium.zip`;
  }

  /**
   * ITEM 3: Detector e Regenerador de Palavras de Bastidor na Narração
   * Proíbe termos técnicos como "gancho", "hook", "roteiro", "script", "seção do vídeo", "CTA", "narrador", "thumbnail".
   * Não confunde com usos legítimos como "cena diante do mar", "seção dos levitas" ou "ganchos de prata".
   */
  function detectarTermosBastidor(texto) {
    if (!texto || typeof texto !== 'string') return [];
    const sentencas = texto.match(/[^.!?\n]+(?:[.!?]+["'”»]?|$)/g) || [];
    const ocorrencias = [];

    const padroesBastidor = [
      { regex: /\b(?:as\s+palavras\s+do|palavras\s+do|no|do|o|este|esse|com\s+o|com\s+as\s+palavras\s+do)\s+gancho\b/i, termo: 'gancho' },
      { regex: /\bgancho\s+(?:inicial|de\s+abertura|do\s+v[ií]deo)\b/i, termo: 'gancho' },
      { regex: /\bhook\b/i, termo: 'hook' },
      { regex: /\b(?:este|esse|neste|nesse|do|o|um|nosso)\s+roteiro\b/i, termo: 'roteiro' },
      { regex: /\broteiro\s+(?:fortaleceu|trouxe|revela|apresenta|escrito)\b/i, termo: 'roteiro' },
      { regex: /\bscript\b/i, termo: 'script' },
      { regex: /\b(?:seção|secao)\s+(?:do|deste|desse|neste)\s+v[ií]deo\b/i, termo: 'seção do vídeo' },
      { regex: /\b(?:cta|call\s+to\s+action)\b/i, termo: 'cta' },
      { regex: /\b(?:o\s+narrador|voz\s+do\s+narrador|narrador\s+diz|narrador\s+explica)\b/i, termo: 'narrador' },
      { regex: /\b(?:thumbnails?|miniaturas?\s+do\s+v[ií]deo)\b/i, termo: 'thumbnail' }
    ];

    for (const sent of sentencas) {
      const s = sent.trim();
      if (!s) continue;

      // Proteção de falsos positivos legítimos na Bíblia:
      // ex: "ganchos de prata", "ganchos de ouro", "ganchos de bronze" (Tabernáculo)
      const ehGanchoBiblico = /\bganchos?\s+de\s+(?:prata|ouro|bronze|metal|ferro)\b/i.test(s);

      for (const p of padroesBastidor) {
        if (p.termo === 'gancho' && ehGanchoBiblico) continue;

        if (p.regex.test(s)) {
          ocorrencias.push({
            frase: s,
            termo: p.termo,
            trechoEncontrado: (s.match(p.regex) || [])[0] || p.termo
          });
          break;
        }
      }
    }

    return ocorrencias;
  }

  /**
   * Regenera a frase eliminando termos de bastidor via IA (sem troca automática de palavras).
   * Se a IA falhar ou não estiver disponível, a frase original é mantida 100% INTACTA
   * e a ocorrência é anotada em falhas/avisos para decisão manual do usuário.
   */
  async function regenerarFrasesComBastidor(texto, chamarIaFn) {
    if (!texto || typeof texto !== 'string') return { texto, reescritas: [], falhas: [], avisos: [] };
    const suspeitas = detectarTermosBastidor(texto);
    if (suspeitas.length === 0) return { texto, reescritas: [], falhas: [], avisos: [] };

    let textoFinal = texto;
    const reescritas = [];
    const falhas = [];

    for (const item of suspeitas) {
      let novaFrase = '';
      if (typeof chamarIaFn === 'function') {
        const promptReescrita = `Você é um revisor de roteiros bíblicos. A frase abaixo contém um termo de produção/bastidor de vídeo ("${item.termo}") que NUNCA deve ser falado pelo narrador bíblico:
Frase original: "${item.frase}"

Reescreva a frase eliminando totalmente a menção a bastidores ou produção, mantendo a sobriedade bíblica e o sentido sagrado (ex: "Se este roteiro fortaleceu sua fé" vira "Se este estudo fortaleceu sua fé" ou "Se este vídeo fortaleceu sua fé"; frases sobre "palavras do gancho" devem ser narradas diretamente como a fala ou resposta do personagem).
NUNCA faça trocas mecânicas genéricas. Mantenha o estilo e a fidelidade ao contexto bíblico.
Responda EXCLUSIVAMENTE com a frase reescrita corrigida, sem aspas e sem explicações.`;

        try {
          const resp = await chamarIaFn(promptReescrita);
          const candidata = (resp || '').trim().replace(/^["']|["']$/g, '').trim();
          if (candidata && candidata !== item.frase) {
            // Confere se a nova frase realmente não contém mais nenhum termo de bastidor
            const sobrou = detectarTermosBastidor(candidata);
            if (sobrou.length === 0) {
              novaFrase = candidata;
            }
          }
        } catch (_) {}
      }

      // Se a IA reescreveu com sucesso e sem termos de bastidor, aplica
      if (novaFrase && textoFinal.includes(item.frase)) {
        textoFinal = textoFinal.replace(item.frase, novaFrase);
        reescritas.push({ original: item.frase, corrigida: novaFrase, termo: item.termo });
      } else {
        // Se a IA falhou (ou não foi fornecida), a regra do projeto proíbe troca automática.
        // A frase original é MANTIDA INTACTA e o aviso é registrado para decisão manual.
        falhas.push({ frase: item.frase, termo: item.termo });
      }
    }

    return { texto: textoFinal, reescritas, falhas, avisos: falhas };
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
   * ITEM 6: Detecta transição de acontecimento principal, sujeito dramático ou local
   * entre as frases acumuladas na cena atual e a próxima frase.
   */
  function detectarTransicaoAcontecimento(frasesCenaAtual, proximaFrase) {
    if (!frasesCenaAtual || frasesCenaAtual.length === 0 || !proximaFrase) return false;
    const textoCena = frasesCenaAtual.join(' ').toLowerCase();
    const prox = proximaFrase.toLowerCase();

    // 1. Mudança de polo dramático (ex: Inimigos/Egito/Carros vs Israel/Moisés/Povo)
    const cenaFalaDeInimigo = /\b(?:fara[oó]|eg[ií]pcio|carros?\s+de\s+fara[oó]|cavaleiros?|ex[eé]rcito\s+de\s+fara[oó]|perseguidores?)\b/i.test(textoCena);
    const proxFalaDeIsrael = /\b(?:israel\s+acampou|israel|filhos\s+de\s+israel|povo|hebreus?|moys[eé]s|ar[aã]o|acampamento|tendas?)\b/i.test(prox);
    if (cenaFalaDeInimigo && proxFalaDeIsrael) return true;

    const cenaFalaDeIsrael = /\b(?:israel|hebreus?|filhos\s+de\s+israel|povo|congrega[cç][aã]o)\b/i.test(textoCena);
    const proxFalaDeInimigo = /\b(?:fara[oó]|eg[ií]pcios?|cavaleiros?|ex[eé]rcito\s+inimigo)\b/i.test(prox);
    if (cenaFalaDeIsrael && proxFalaDeInimigo) return true;

    // 2. Mudança explícita de local ou marco geográfico
    const marcadoresMudancaLugar = [
      /\bacampou\s+junto\s+ao\s+mar\b/i,
      /\bchegando\s+a\b/i,
      /\bpartiram\s+de\b/i,
      /\bno\s+cume\s+do\s+monte\b/i,
      /\bdiante\s+da\s+rocha\b/i,
      /\bna\s+tenda\s+da\s+congrega[cç][aã]o\b/i,
      /\bjunto\s+[aà]s\s+[aá]guas\b/i
    ];
    for (const reg of marcadoresMudancaLugar) {
      if (reg.test(prox) && !reg.test(textoCena)) return true;
    }

    return false;
  }

  /**
   * Agrupa as frases em cenas com base no tempo acumulado e nas 3 faixas de ritmo:
   * 1) 0s - 30s: 4 a 6s por cena (~10 a 15 palavras)
   * 2) 30s - 180s (3min): 12 a 18s por cena (~30 a 45 palavras)
   * 3) > 180s (3min): 18 a 28s por cena (~45 a 70 palavras)
   * Cortes somente no começo de frase.
   * ITEM 6: Quando houver transição de acontecimento e a cena atual já atingiu meta.min,
   * prefere cortar na fronteira entre os acontecimentos.
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

      // ITEM 6: Se a cena atual já atingiu meta.min e a próxima frase muda de acontecimento/sujeito/lugar,
      // prefere cortar na fronteira para a imagem não sobrar no assunto seguinte.
      const transicaoAcontecimento = detectarTransicaoAcontecimento(cenaAtualFrases, frase);
      const podeCortarPorTransicao = transicaoAcontecimento && duracaoAtualCena >= meta.min;

      const ehMuitoCurta = duracaoAtualCena < 4;
      const cabeNaMeta = (duracaoAtualCena + duracaoFrase) <= meta.max;
      const naoEstouraTeto = (duracaoAtualCena + duracaoFrase) <= 30;

      if (!podeCortarPorTransicao && (ehMuitoCurta || cabeNaMeta) && naoEstouraTeto) {
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

  const STOPWORDS_EN = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'and', 'or', 'of', 'with', 'to', 'from',
    'by', 'as', 'for', 'is', 'are', 'was', 'were', 'it', 'its', 'under', 'over',
    'into', 'upon', 'before', 'behind', 'beside', 'between', 'through', 'above',
    'below', 'around', 'near', 'scene', 'depicting', 'showing', 'image', 'illustration',
    'biblical', 'ancient', 'historical'
  ]);

  function extrairPalavrasImportantes(texto) {
    if (!texto || typeof texto !== 'string') return [];
    return (texto.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(w => !STOPWORDS_EN.has(w));
  }

  /**
   * ITEM 4: Calcula semelhança entre duas descrições visuais com base nas palavras importantes (Jaccard).
   */
  function calcularSemelhancaDescricoes(descA, descB) {
    const palavrasA = extrairPalavrasImportantes(descA);
    const palavrasB = extrairPalavrasImportantes(descB);
    if (palavrasA.length === 0 || palavrasB.length === 0) return 0;

    const setA = new Set(palavrasA);
    const setB = new Set(palavrasB);
    let comuns = 0;
    for (const w of setA) {
      if (setB.has(w)) comuns++;
    }
    const uniao = new Set([...setA, ...setB]).size;
    if (uniao === 0) return 0;
    return Number((comuns / uniao).toFixed(2));
  }

  /**
   * Constrói o prompt de comando para a IA gerar descrições visuais em lotes de até 10 cenas.
   * ITEM 4 e 5: Exige variedade de enquadramento, proíbe ação antecipada e referências a público.
   */
  function construirPromptIaLoteCenas(loteCenas, contexto = {}) {
    const numerosEsperados = loteCenas.map(c => String(c.numero)).join(', ');
    const cenasFormatadas = loteCenas.map(c => `[Cena ${c.numero}]: "${c.trecho.replace(/\s+/g, ' ').trim()}"`).join('\n\n');
    const descricoesAnteriores = contexto.descricoesAnteriores || [];

    let blocoAnteriores = '';
    if (descricoesAnteriores.length > 0) {
      const ultimas = descricoesAnteriores.slice(-8);
      blocoAnteriores = `\nPREVIOUSLY USED SCENE DESCRIPTIONS (DO NOT REPEAT THESE COMPOSITIONS, FRAMINGS OR MOTIFS):\n${ultimas.map((d, i) => `- Previous: "${d}"`).join('\n')}\n`;
    }

    const primeiroNum = loteCenas[0]?.numero || '01';
    const segundoNum = loteCenas[1]?.numero || '02';
    const exemploJson = loteCenas.length > 1
      ? `[\n  { "numero": "${primeiroNum}", "descricaoVisual": "description in English for scene ${primeiroNum}..." },\n  { "numero": "${segundoNum}", "descricaoVisual": "description in English for scene ${segundoNum}..." }\n]`
      : `[\n  { "numero": "${primeiroNum}", "descricaoVisual": "description in English for scene ${primeiroNum}..." }\n]`;

    return `You are an expert biblical art director creating visual image descriptions for dramatic historical illustrations.
For each narration excerpt below, write ONE concise, vivid visual description in English describing strictly what is seen in that specific scene.

CRITICAL RULES:
1. Describe ONLY what physically happens within the given excerpt (visible people, concrete actions, physical environment, objects).
2. MANDATORY FRAMING VARIETY (NEVER REPEAT SIMILAR FRAMINGS):
   - You MUST vary the camera angle/framing between consecutive scenes:
     * Wide panoramic landscape shot (vast desert, expansive camp, towering mountains)
     * Medium character action shot (waist-up, figures interacting)
     * Dramatic close-up on face, eyes, and solemn facial expression
     * Macro detail shot on hands, rustic wooden staff, cracked rock, parchment, feet on dusty path
     * High-angle aerial perspective looking down at the camp or terrain
   - Consecutive scenes MUST have completely different compositions and focal points.
3. STRICT CHRONOLOGICAL ISOLATION (NO PREMATURE ACTION):
   - Illustrate ONLY the specific action mentioned in this scene's excerpt.
   - NEVER illustrate actions that only happen in subsequent excerpts (e.g. if raising the staff or striking the rock is only narrated in a later scene, DO NOT depict it in earlier scenes).
4. NO AUDIENCE, CHANNEL OR PRODUCTION REFERENCES:
   - FORBIDDEN to mention 'viewers', 'audience', 'subscribe', 'channel', 'video', 'followers', or 'strengthen faith'.
   - For call-to-action or conclusion excerpts, depict a concrete historical object/setting (e.g. an ancient illuminated parchment scroll unrolled on a rustic cedar table beside a glowing bronze oil lamp, or serene twilight horizon over the desert).
5. DOMINANT EVENT RULE:
   - If an excerpt contains more than one action or subject, depict the primary event that occupies the majority of the text.
6. FORBIDDEN to include elements from other biblical events or stories (e.g., NEVER include sea, ocean waves, or shore if the text is about a desert, rock, camp, or mountain).
7. Use strictly biblical English names: Moses, Aaron, Miriam, Joshua, Eleazar, Pharaoh, David, Goliath, Saul, Samuel, Jonathan; Meribah, Kadesh, Mount Hor, Mount Nebo, Mount Sinai, Jordan River, Canaan, Valley of Elah.
8. FORBIDDEN to depict God as a human figure, face, or humanoid shadow. Depict divine presence through glorious radiant celestial light, glowing illumination, pillar of cloud or fire.
9. Do NOT include Portuguese words.
10. Do NOT use generic placeholders like "biblical tableau", "artistic depiction" or "scene representing". Describe the physical concrete action.
11. CRITICAL SCENE NUMBERING RULE: You MUST PRESERVE the exact scene numbers from INPUT SCENES: [${numerosEsperados}]. DO NOT restart numbering from "01" if scenes are ${numerosEsperados}!
12. Output EXCLUSIVELY a valid JSON array of objects with "numero" and "descricaoVisual".
${blocoAnteriores}
INPUT SCENES:
${cenasFormatadas}

OUTPUT FORMAT (JSON only - use exact scene numbers ${numerosEsperados}):
${exemploJson}`;
  }

  /**
   * Extrai o array JSON retornado pela IA, com suporte resiliente a blocos markdown,
   * objetos envelopadores ({ scenes: [...] }, { cenas: [...] }) e dicionários numéricos.
   */
  function extrairJsonLote(respostaTexto) {
    if (!respostaTexto || typeof respostaTexto !== 'string') return [];
    let parsed = null;
    try {
      parsed = JSON.parse(respostaTexto);
    } catch (_) {
      // 1. Tenta bloco markdown ```json ... ``` ou ``` ... ```
      const matchBloco = respostaTexto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (matchBloco) {
        try {
          parsed = JSON.parse(matchBloco[1]);
        } catch (_) {}
      }
      // 2. Tenta encontrar primeiro [ ... ]
      if (!parsed) {
        const matchArray = respostaTexto.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (matchArray) {
          try {
            parsed = JSON.parse(matchArray[0]);
          } catch (_) {}
        }
      }
      // 3. Tenta encontrar objeto { ... }
      if (!parsed) {
        const matchObj = respostaTexto.match(/\{[\s\S]*\}/);
        if (matchObj) {
          try {
            parsed = JSON.parse(matchObj[0]);
          } catch (_) {}
        }
      }
    }

    if (!parsed) return [];
    if (Array.isArray(parsed)) return parsed;

    if (typeof parsed === 'object') {
      const chavesArray = ['scenes', 'cenas', 'items', 'cenas_pendentes', 'data', 'results', 'lote'];
      for (const k of chavesArray) {
        if (Array.isArray(parsed[k])) return parsed[k];
      }
      const chaves = Object.keys(parsed);
      const saoNumericas = chaves.length > 0 && chaves.every(k => /^\d+$/.test(k) || /^cena/i.test(k));
      if (saoNumericas) {
        return chaves.map(k => {
          const val = parsed[k];
          const numPuro = k.replace(/\D/g, '');
          if (typeof val === 'string') {
            return { numero: numPuro, descricaoVisual: val };
          }
          return { numero: numPuro, ...(typeof val === 'object' && val !== null ? val : {}) };
        });
      }
      if (parsed.descricaoVisual || parsed.description || parsed.numero || parsed.scene) {
        return [parsed];
      }
    }
    return [];
  }

  /**
   * Localiza de forma resiliente o item retornado pela IA para a cena c.
   * Suporta número exato, número inteiro, renumeração a partir de 1 no lote e fallback posicional.
   */
  function localizarItemIaCena(itensLote, c, idx) {
    if (!Array.isArray(itensLote) || itensLote.length === 0) return null;
    const numCenaInt = parseInt(c.numero, 10);

    // 1. Busca por número exato de cena
    let item = itensLote.find(it => {
      if (!it || typeof it !== 'object') return false;
      const rawNum = String(it.numero ?? it.num ?? it.cena ?? it.scene ?? it.id ?? '').replace(/\D/g, '');
      return rawNum && (rawNum.padStart(2, '0') === c.numero || parseInt(rawNum, 10) === numCenaInt);
    });
    if (item) return item;

    // 2. Se a IA renumerou a partir de 1 neste lote (ex: [Cena 11, Cena 12] -> it.numero "01" e "02")
    const numRelativo = idx + 1;
    item = itensLote.find(it => {
      if (!it || typeof it !== 'object') return false;
      const rawNum = String(it.numero ?? it.num ?? it.cena ?? it.scene ?? it.id ?? '').replace(/\D/g, '');
      return rawNum && parseInt(rawNum, 10) === numRelativo;
    });
    if (item) return item;

    // 3. Fallback posicional pelo índice do lote
    if (itensLote[idx] && typeof itensLote[idx] === 'object') {
      return itensLote[idx];
    }

    return null;
  }

  /**
   * Extrai o texto da descrição visual com tolerância a múltiplos nomes de campos em inglês/português.
   */
  function extrairTextoDescricaoVisual(itemIa) {
    if (!itemIa) return '';
    if (typeof itemIa === 'string') return itemIa.trim();
    if (typeof itemIa !== 'object') return '';
    return (
      itemIa.descricaoVisual ||
      itemIa.descricao_visual ||
      itemIa.visualDescription ||
      itemIa.visual_description ||
      itemIa.description ||
      itemIa.descricao ||
      itemIa.prompt ||
      itemIa.image_prompt ||
      itemIa.visual ||
      ''
    ).trim();
  }

  /**
   * Valida a descrição visual devolvida pela IA para a cena.
   * Rejeita se:
   * 1. Contiver "sea" ou "waters" sem o trecho em português falar de água/mar.
   * 2. Contiver palavras em português.
   * 3. For genérico ("solemn biblical historical tableau", etc.).
   * 4. Contiver termos de audiência / bastidor ("viewers", "audience", "subscribe", "channel").
   * 5. For excessivamente semelhante a cenas anteriores (semelhança >= 60% de palavras importantes).
   */
  function validarDescricaoVisualCena(descricaoVisual, trechoPt, contexto = {}) {
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

    // 4. Detecção de termos de audiência / bastidor no prompt (ITEM 5)
    if (/\b(?:viewers?|audience|subscribers?|subscribe|channel|video|followers?|encouraging\s+viewers)\b/i.test(desc)) {
      return { valido: false, motivo: 'Contém termos de audiência ou bastidor proibidos no prompt visual ("viewers"/"audience"/"subscribe"/"channel").' };
    }

    // 5. Detecção de representação humana de Deus
    if (/\b(?:face of God|figure of God|God as an old man|God's body|human form of God)\b/i.test(desc)) {
      return { valido: false, motivo: 'Representação antropomórfica indevida da figura de Deus.' };
    }

    // 6. Detecção de semelhança excessiva com cenas anteriores (ITEM 4)
    if (contexto && Array.isArray(contexto.descricoesAnteriores) && contexto.descricoesAnteriores.length > 0) {
      for (const ant of contexto.descricoesAnteriores) {
        if (!ant) continue;
        const taxa = calcularSemelhancaDescricoes(desc, ant);
        if (taxa >= 0.60) {
          return {
            valido: false,
            motivo: `Semelhança excessiva com cena anterior (${Math.round(taxa * 100)}% de termos coincidentes). Exige variedade de enquadramento e composição.`
          };
        }
      }
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

      // Extrai as descrições das cenas já concluídas anteriormente
      const descricoesAcumuladas = cenas
        .filter(c => c.status === 'CONCLUIDA' && c.descricaoVisual)
        .map(c => c.descricaoVisual);

      const promptLote = construirPromptIaLoteCenas(payloadLote, {
        ...contexto,
        descricoesAnteriores: descricoesAcumuladas
      });
      let itensLote = [];
      let erroIaLote = null;

      if (typeof chamarIaFn === 'function') {
        try {
          const respostaIa = await chamarIaFn(promptLote);
          itensLote = extrairJsonLote(respostaIa);
          if (!itensLote || itensLote.length === 0) {
            erroIaLote = 'A IA respondeu em formato não reconhecido';
          }
        } catch (e) {
          console.warn(`[PlanoCenas] Falha na chamada da IA para lote ${l + 1}:`, e);
          erroIaLote = e.message || 'Falha de comunicação com a IA';
          itensLote = [];
        }
      }

      for (let idx = 0; idx < lote.length; idx++) {
        const c = lote[idx];
        const trechoPt = c.frases.join(' ');
        const itemIa = localizarItemIaCena(itensLote, c, idx);
        let descVisual = extrairTextoDescricaoVisual(itemIa);

        const contextoValidacao = {
          ...contexto,
          descricoesAnteriores: descricoesAcumuladas
        };
        let validacao = validarDescricaoVisualCena(descVisual, trechoPt, contextoValidacao);

        // Se a validação falhar ou estiver vazia, tenta regenerar a cena individual se houver callback de IA
        if (!validacao.valido && typeof chamarIaFn === 'function' && itemIa) {
          try {
            const promptCorrecao = `The previous visual description for Scene ${c.numero} was rejected because: ${validacao.motivo}.
Excerpt: "${trechoPt}"
Write a corrected, strictly factual visual description in English adhering to all rules (alternate camera framing, no viewers/audience/channel terms). Output JSON: [{"numero": "${c.numero}", "descricaoVisual": "..."}]`;
            const respCorrigida = await chamarIaFn(promptCorrecao);
            const itensCorrigidos = extrairJsonLote(respCorrigida);
            const itemCorrigido = localizarItemIaCena(itensCorrigidos, c, 0);
            const novaDesc = extrairTextoDescricaoVisual(itemCorrigido);
            if (novaDesc) {
              const novaVal = validarDescricaoVisualCena(novaDesc, trechoPt, contextoValidacao);
              if (novaVal.valido) {
                descVisual = novaDesc;
                validacao = novaVal;
              }
            }
          } catch (_) {}
        }

        // Se a descrição foi validada com sucesso
        if (validacao.valido) {
          c.status = 'CONCLUIDA';
          c.motivoPendente = '';
          c.descricaoVisual = descVisual;
          c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
          descricoesAcumuladas.push(descVisual);
        } else {
          // NÃO USAR FALLBACK EM SILÊNCIO: Marca como PENDENTE com motivo real
          c.status = 'PENDENTE';
          c.motivoPendente = erroIaLote ? `Erro da IA: ${erroIaLote}` : (validacao.motivo || 'Descrição não gerada ou rejeitada pelo validador');
          c.descricaoVisual = '';
          c.promptIngles = `[PENDENTE: ${c.motivoPendente}]`;
        }
      }
    }

    return cenas;
  }

  /**
   * Regenera exclusivamente as cenas com status PENDENTE chamando a IA.
   */
  async function regenerarCenasPendentes(cenas, narracaoLimpa, chamarIaFn, contexto = {}) {
    if (!cenas || !Array.isArray(cenas)) return { cenas: [], pendentesRestantes: [], erroIa: null };

    const pendentes = cenas.filter(c => c.status === 'PENDENTE');
    if (pendentes.length === 0) {
      return { cenas, pendentesRestantes: [], erroIa: null };
    }

    if (typeof chamarIaFn !== 'function') {
      return {
        cenas,
        pendentesRestantes: pendentes,
        erroIa: 'Função de chamada à IA não fornecida ou API Key não configurada.'
      };
    }

    const descricoesConcluidas = cenas
      .filter(c => c.status === 'CONCLUIDA' && c.descricaoVisual)
      .map(c => c.descricaoVisual);

    const tamanhoLote = 10;
    const lotes = [];
    for (let i = 0; i < pendentes.length; i += tamanhoLote) {
      lotes.push(pendentes.slice(i, i + tamanhoLote));
    }

    let erroGlobalIa = null;

    for (let l = 0; l < lotes.length; l++) {
      const lote = lotes[l];
      const payloadLote = lote.map(c => ({
        numero: c.numero,
        trecho: c.frases.join(' ')
      }));

      const promptLote = construirPromptIaLoteCenas(payloadLote, {
        ...contexto,
        descricoesAnteriores: descricoesConcluidas
      });
      let itensLote = [];
      let erroIaLote = null;

      try {
        const resp = await chamarIaFn(promptLote);
        itensLote = extrairJsonLote(resp);
        if (!itensLote || itensLote.length === 0) {
          erroIaLote = 'A IA respondeu em formato não reconhecido.';
        }
      } catch (e) {
        console.warn(`[PlanoCenas] Falha ao regenerar lote ${l + 1} de pendentes:`, e);
        erroIaLote = e.message || 'Falha de comunicação com a IA';
        if (!erroGlobalIa) erroGlobalIa = erroIaLote;
        itensLote = [];
      }

      for (let idx = 0; idx < lote.length; idx++) {
        const c = lote[idx];
        const trechoPt = c.frases.join(' ');
        const itemIa = localizarItemIaCena(itensLote, c, idx);
        let descVisual = extrairTextoDescricaoVisual(itemIa);

        const contextoValidacao = {
          ...contexto,
          descricoesAnteriores: descricoesConcluidas
        };
        const validacao = validarDescricaoVisualCena(descVisual, trechoPt, contextoValidacao);

        if (validacao.valido) {
          c.status = 'CONCLUIDA';
          c.motivoPendente = '';
          c.descricaoVisual = descVisual;
          c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
          descricoesConcluidas.push(descVisual);
        } else {
          c.status = 'PENDENTE';
          c.motivoPendente = erroIaLote ? `Erro da IA: ${erroIaLote}` : (validacao.motivo || 'Descrição rejeitada na regeneração');
          c.descricaoVisual = '';
          c.promptIngles = `[PENDENTE: ${c.motivoPendente}]`;
        }
      }
    }

    return {
      cenas,
      pendentesRestantes: cenas.filter(c => c.status === 'PENDENTE'),
      erroIa: erroGlobalIa
    };
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

    // Bloqueia a exportação se houver qualquer cena com status PENDENTE
    const cenasPendentes = (cenas || []).filter(c => c.status === 'PENDENTE' || (c.promptIngles && c.promptIngles.includes('[PENDENTE')));
    if (cenasPendentes.length > 0) {
      const listaNums = cenasPendentes.map(c => c.numero).join(', ');
      erros.push(`Existem ${cenasPendentes.length} cena(s) com status PENDENTE aguardando geração de prompt (Cenas: ${listaNums}). Gere de novo as cenas pendentes antes de exportar o pacote Scriptorium.`);
    }

    if (descricoesTxt && descricoesTxt.includes('[PENDENTE')) {
      erros.push('descricoes.txt contém cena(s) com status PENDENTE.');
    }
    if (promptsTxt && promptsTxt.includes('[PENDENTE')) {
      erros.push('prompts.txt contém cena(s) com status PENDENTE.');
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
   * ITEM 1: Gera um Blob ou Uint8Array de arquivo ZIP puro (Store) compatível nativamente com macOS e Windows.
   * Suporta arquivos binários reais (MP3, WAV, etc.) a partir de Blob, ArrayBuffer, Uint8Array ou Buffer do Node.
   */
  async function criarZipScriptorium(arquivos) {
    const encoder = new TextEncoder();
    const partes = [];
    const entradas = [];
    let offset = 0;

    for (const arq of arquivos) {
      const nomeBytes = encoder.encode(arq.nome);
      let dados = arq.conteudo;

      // Resolve Promise se fornecido
      if (dados && typeof dados.then === 'function') {
        dados = await dados;
      }

      // Lê Blob ou File com arrayBuffer, Response ou FileReader
      if (dados && (typeof dados.arrayBuffer === 'function' || (typeof Blob !== 'undefined' && dados instanceof Blob))) {
        try {
          if (typeof dados.arrayBuffer === 'function') {
            dados = new Uint8Array(await dados.arrayBuffer());
          } else if (typeof Response !== 'undefined') {
            dados = new Uint8Array(await new Response(dados).arrayBuffer());
          } else if (typeof FileReader !== 'undefined') {
            dados = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(new Uint8Array(reader.result));
              reader.onerror = reject;
              reader.readAsArrayBuffer(dados);
            });
          }
        } catch (eBlob) {
          console.warn(`[ZipScriptorium] Falha ao extrair bytes do Blob para ${arq.nome}:`, eBlob);
        }
      }

      // Protege contra arquivos de áudio binários passados como string corrompida '[object Blob]'
      if (typeof dados === 'string' && (/\.(mp3|wav|ogg|aac|zip)$/i.test(arq.nome) || dados.startsWith('[object'))) {
        console.warn(`[ZipScriptorium] Ignorando arquivo binário que foi passado como string corrompida: ${arq.nome} (${dados})`);
        continue;
      }

      if (typeof dados === 'string') {
        dados = encoder.encode(dados);
      } else if (dados instanceof ArrayBuffer) {
        dados = new Uint8Array(dados);
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(dados)) {
        dados = new Uint8Array(dados);
      } else if (dados instanceof Uint8Array) {
        // Mantém Uint8Array intacto
      } else {
        const strVal = String(dados || '');
        if (/\.(mp3|wav|ogg|aac|zip)$/i.test(arq.nome) || strVal.startsWith('[object')) {
          console.warn(`[ZipScriptorium] Ignorando arquivo corrompido não-binário: ${arq.nome} (${strVal})`);
          continue;
        }
        dados = encoder.encode(strVal);
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

  /**
   * Descompactador ZIP Store puro (sem compressão externa) para testes e validação de integridade.
   */
  async function lerArquivosDeZip(zipEntrada) {
    let bytes;
    if (zipEntrada && typeof zipEntrada.arrayBuffer === 'function') {
      bytes = new Uint8Array(await zipEntrada.arrayBuffer());
    } else if (zipEntrada instanceof ArrayBuffer) {
      bytes = new Uint8Array(zipEntrada);
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(zipEntrada)) {
      bytes = new Uint8Array(zipEntrada);
    } else if (zipEntrada instanceof Uint8Array) {
      bytes = zipEntrada;
    } else {
      throw new Error('Entrada de ZIP inválida para descompactação.');
    }

    const arquivosLidos = [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const decoder = new TextDecoder();
    let pos = 0;

    while (pos + 30 <= bytes.length) {
      const sig = view.getUint32(pos, true);
      if (sig !== 0x04034b50) break; // fim dos headers de arquivos locais

      const tamCrc = view.getUint32(pos + 14, true);
      const tamComp = view.getUint32(pos + 18, true);
      const tamOriginal = view.getUint32(pos + 22, true);
      const nomeTam = view.getUint16(pos + 26, true);
      const extraTam = view.getUint16(pos + 28, true);

      const nomeBytes = bytes.slice(pos + 30, pos + 30 + nomeTam);
      const nome = decoder.decode(nomeBytes);

      const dataOffset = pos + 30 + nomeTam + extraTam;
      const conteudoBytes = bytes.slice(dataOffset, dataOffset + tamComp);

      arquivosLidos.push({
        nome,
        tamanho: tamOriginal,
        bytes: conteudoBytes,
        crc: tamCrc
      });

      pos = dataOffset + tamComp;
    }

    return arquivosLidos;
  }

  return {
    NOMES_ARQUIVOS_FIXOS,
    PREFIXO_ESTILO_CANAL,
    FICHAS_PERSONAGENS,
    DICIONARIO_TOPONIMOS,
    SUFIXO_ESTILO_SEM_MOLDURA,
    CATEGORIAS_MENU_IGNORAR,
    detectarTermosBastidor,
    regenerarFrasesComBastidor,
    detectarTransicaoAcontecimento,
    calcularSemelhancaDescricoes,
    dividirEmFrases,
    agruparFrasesEmCenas,
    construirPromptIaLoteCenas,
    extrairJsonLote,
    localizarItemIaCena,
    extrairTextoDescricaoVisual,
    validarDescricaoVisualCena,
    montarPromptFinalCena,
    gerarDescricaoVisualFallback,
    gerarDescricoesVisuaisComIa,
    regenerarCenasPendentes,
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
    criarZipScriptorium,
    lerArquivosDeZip
  };
});
