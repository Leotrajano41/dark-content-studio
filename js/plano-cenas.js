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
    'David': "David: young Hebrew youth in late teens, determined handsome youthful face, bright piercing eyes, short wavy reddish-brown hair, wearing a simple rustic tan sheep wool tunic, leather belt with small shepherd pouch and leather sling, no armor",
    'Davi': "David: young Hebrew youth in late teens, determined handsome youthful face, bright piercing eyes, short wavy reddish-brown hair, wearing a simple rustic tan sheep wool tunic, leather belt with small shepherd pouch and leather sling, no armor",
    'Goliath': "Goliath: colossal towering Philistine giant warrior over nine feet tall, ferocious scarred weathered middle-aged face, thick dark coarse beard, cropped dark hair under heavy bronze crested helmet, massive bronze scale armor coat gleaming, bronze greaves on legs, large bronze spear with massive iron head and heavy round bronze shield",
    'Golias': "Goliath: colossal towering Philistine giant warrior over nine feet tall, ferocious scarred weathered middle-aged face, thick dark coarse beard, cropped dark hair under heavy bronze crested helmet, massive bronze scale armor coat gleaming, bronze greaves on legs, large bronze spear with massive iron head and heavy round bronze shield",
    'Saul': "Saul: tall imposing Hebrew king in late forties, weathered brooding countenance, greying dark beard, ornate royal bronze crown, royal purple mantle over chainmail, holding tall royal spear",
    'Samuel': "Samuel: venerable elderly prophet, long flowing silver white beard, piercing visionary eyes, simple coarse linen mantle, rough woolen robe",
    'Jonathan': "Jonathan: athletic noble young prince in early twenties, trim dark beard, royal blue tunic with gold embroidery, bronze chestplate, leather quiver and composite bow",
    'Jônatas': "Jonathan: athletic noble young prince in early twenties, trim dark beard, royal blue tunic with gold embroidery, bronze chestplate, leather quiver and composite bow",
    'Jonatas': "Jonathan: athletic noble young prince in early twenties, trim dark beard, royal blue tunic with gold embroidery, bronze chestplate, leather quiver and composite bow",
    'Solomon': "Solomon: young wise king in late twenties, dignified serene face, neatly groomed dark beard, ornate golden royal crown, opulent crimson and gold embroidered robes",
    'Salomão': "Solomon: young wise king in late twenties, dignified serene face, neatly groomed dark beard, ornate golden royal crown, opulent crimson and gold embroidered robes",
    'Salomao': "Solomon: young wise king in late twenties, dignified serene face, neatly groomed dark beard, ornate golden royal crown, opulent crimson and gold embroidered robes",
    'Miriam': "Miriam: elderly Hebrew prophetess, weathered dignified face, dark woven veil, linen robes",
    'Miriã': "Miriam: elderly Hebrew prophetess, weathered dignified face, dark woven veil, linen robes",
    'Eleazar': "Eleazar: dignified young high priest, sacred linen garments, ceremonial priestly vestments",
    'Pharaoh': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Faraó': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Farao': "Pharaoh: royal Egyptian monarch, nemes headdress with golden uraeus cobra, ornate royal linen kilt, gold collar necklace, commanding defiant expression",
    'Abraham': "Abraham: venerable elderly patriarch in his seventies, long flowing white beard, deep contemplative eyes, nomadic wool mantle, simple leather sandals",
    'Abraão': "Abraham: venerable elderly patriarch in his seventies, long flowing white beard, deep contemplative eyes, nomadic wool mantle, simple leather sandals",
    'Abraao': "Abraham: venerable elderly patriarch in his seventies, long flowing white beard, deep contemplative eyes, nomadic wool mantle, simple leather sandals",
    'Isaac': "Isaac: gentle devout patriarch in his late forties, neatly trimmed dark beard with grey streaks, soft reflective gaze, humble woven wool tunic",
    'Isaque': "Isaac: gentle devout patriarch in his late forties, neatly trimmed dark beard with grey streaks, soft reflective gaze, humble woven wool tunic",
    'Jacob': "Jacob: resolute patriarch in his late forties, weathered sun-tanned face, dark thick beard, shepherd's rustic wool tunic, traveler's wooden staff",
    'Jacó': "Jacob: resolute patriarch in his late forties, weathered sun-tanned face, dark thick beard, shepherd's rustic wool tunic, traveler's wooden staff",
    'Jaco': "Jacob: resolute patriarch in his late forties, weathered sun-tanned face, dark thick beard, shepherd's rustic wool tunic, traveler's wooden staff",
    'Joseph': "Joseph: dignified Hebrew governor in Egypt in his thirties, smooth-shaven youthful countenance, fine Egyptian pleated linen robe with gold pectoral collar",
    'José': "Joseph: dignified Hebrew governor in Egypt in his thirties, smooth-shaven youthful countenance, fine Egyptian pleated linen robe with gold pectoral collar",
    'Jose': "Joseph: dignified Hebrew governor in Egypt in his thirties, smooth-shaven youthful countenance, fine Egyptian pleated linen robe with gold pectoral collar"
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
   * NUNCA usa o nome da categoria do menu e NUNCA usa valor fantasma de sessão anterior.
   */
  function gerarNomeZipScriptorium(temaOuOpcoes, opcoesExtras = {}) {
    let temaFinal = '';

    if (typeof temaOuOpcoes === 'object' && temaOuOpcoes !== null) {
      const ideia = (temaOuOpcoes.ideiaEscolhida || '').trim();
      const custom = (temaOuOpcoes.temaCustom || '').trim();
      const cat = (temaOuOpcoes.categoria || temaOuOpcoes.tema || '').trim();
      const thumb = (temaOuOpcoes.temaThumb || '').trim();
      const seo = (temaOuOpcoes.temaSeo || '').trim();
      const personagem = (temaOuOpcoes.personagemPrincipal || '').trim();

      // PRIORIDADE: Título/tema ATUAL do projeto
      // 1. Ideia escolhida do projeto atual (limpando eventuais prefixos de lista "1.", "Ideia 2:", etc.)
      // 2. Tema customizado (se preenchido e a categoria do menu for "Personalizável" ou não houver ideia)
      // 3. Tema de thumbnail ou tema de SEO
      // 4. Personagem principal
      // 5. Categoria específica do menu (se não estiver na lista de categorias genéricas a ignorar)
      if (ideia) {
        temaFinal = ideia
          .replace(/^#?\s*(?:ideia\s+)?\d+[\.:\)\-]\s*/i, '')
          .replace(/^[\*\_\#\s]+/, '')
          .split(/\r?\n/)[0]
          .trim();
      } else if (cat === 'Personalizável' && custom) {
        temaFinal = custom;
      } else if (thumb) {
        temaFinal = thumb;
      } else if (seo) {
        temaFinal = seo;
      } else if (custom) {
        temaFinal = custom;
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

    // PONTO 3: Nome do ZIP curto
    // Usar só o título, a parte antes do primeiro ":" (ou as primeiras 6 palavras), com no máximo 60 caracteres
    if (temaFinal.includes(':')) {
      temaFinal = temaFinal.split(':')[0].trim();
    }
    const palavrasTema = temaFinal.split(/\s+/).filter(Boolean);
    if (palavrasTema.length > 6) {
      temaFinal = palavrasTema.slice(0, 6).join(' ');
    }
    if (temaFinal.length > 60) {
      temaFinal = temaFinal.slice(0, 60).trim();
    }

    const slug = gerarSlug(temaFinal);

    // Suporta flag sufixoScriptorium: false para gerar apenas "${slug}.zip"
    const semSufixo = (opcoesExtras.sufixoScriptorium === false || opcoesExtras.semSufixo === true ||
      (typeof temaOuOpcoes === 'object' && temaOuOpcoes !== null && (temaOuOpcoes.sufixoScriptorium === false || temaOuOpcoes.semSufixo === true)));

    return semSufixo ? `${slug}.zip` : `${slug}-scriptorium.zip`;
  }

  function gerarNomeZipCurto(temaOuOpcoes) {
    return gerarNomeZipScriptorium(temaOuOpcoes, { sufixoScriptorium: false });
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
   * Sanitização estrita: NUNCA permitir colchetes [ ] nem rótulos de seção na narração limpa.
   */
  function dividirEmFrases(texto) {
    if (!texto || typeof texto !== 'string') return [];
    const t = texto
      .replace(/\*{0,2}\[[^\]\r\n]*\]\*{0,2}\s*:?/g, '')
      .replace(/[\[\]]/g, '')
      .replace(/^[^\S\r\n]*(?:#+\s*)?(?:\*{1,2})?[A-ZÀ-Ú0-9\s,.'’\-–—/:]{3,80}(?:\*{1,2})?\s*:?\s*$/gm, (match) => {
        const semMd = match.replace(/[*#:_]/g, '').trim();
        const letters = semMd.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
        if (/[.!?]\s*$/.test(semMd)) return match;
        if (letters.length >= 3 && letters === letters.toUpperCase()) return '';
        return match;
      })
      .replace(/[^\S\r\n]{2,}/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();
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
   * ITEM 3: No gancho (primeiros ~15s), quebra frases longas em frases curtas
   * dividindo SOMENTE em pontuações que o Scriptorium reconhece como início de frase (; : . ! ? … e ...).
   * NUNCA divide em vírgula (,) nem travessão (—).
   * Se a frase não tiver nenhum desses sinais, NÃO divide (deixa a frase inteira numa cena só).
   */
  function quebrarFrasesParaGancho(frases, limiteSegundosGancho = 18) {
    if (!Array.isArray(frases)) return [];
    const resultado = [];
    let tempoEstimado = 0;

    for (const frase of frases) {
      const qtdPalavras = contarPalavras(frase);
      const duracao = qtdPalavras / 2.5;

      // Sinais reconhecidos pelo Scriptorium como fronteira de frase: ; : . ! ? … (e reticências ...)
      // NUNCA divide em vírgula (,) nem travessão (—)
      const temSinalValido = /[;:!?…\.]/.test(frase);

      if (tempoEstimado < limiteSegundosGancho && qtdPalavras > 15 && temSinalValido) {
        // Divide SOMENTE após ; : . ! ? … (preservando o sinal no final do trecho anterior)
        const pedacos = frase.match(/[^;:!?…\.\n]+(?:(?:\.\.\.|[;:!?…\.])+["'”»]?|$)/g) || [frase];
        const filtrados = pedacos.map(p => p.trim()).filter(Boolean);

        // Se houver mais de um pedaço separado pelos sinais permitidos (; : . ! ? …)
        if (filtrados.length > 1) {
          let acumulado = '';
          for (const pedaco of filtrados) {
            const candidato = acumulado ? `${acumulado} ${pedaco}` : pedaco;
            const qtdCandidato = contarPalavras(candidato);

            if (acumulado && qtdCandidato > 15 && contarPalavras(acumulado) >= 5) {
              resultado.push(acumulado.trim());
              tempoEstimado += contarPalavras(acumulado) / 2.5;
              acumulado = pedaco;
            } else {
              acumulado = candidato;
            }
          }
          if (acumulado.trim()) {
            resultado.push(acumulado.trim());
            tempoEstimado += contarPalavras(acumulado) / 2.5;
          }
        } else {
          // Não possui os sinais permitidos para divisão interna -> mantém como frase única
          resultado.push(frase);
          tempoEstimado += duracao;
        }
      } else {
        resultado.push(frase);
        tempoEstimado += duracao;
      }
    }

    return resultado;
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
    const frasesProcessadas = quebrarFrasesParaGancho(frases, 18);
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

    for (let i = 0; i < frasesProcessadas.length; i++) {
      const frase = frasesProcessadas[i];
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

  const NOMES_PERSONAGENS_NORMALIZADOS = {
    'moises': 'Moses', 'móises': 'Moses', 'moses': 'Moses',
    'arao': 'Aaron', 'arão': 'Aaron', 'aaron': 'Aaron',
    'josue': 'Joshua', 'josué': 'Joshua', 'joshua': 'Joshua',
    'miriam': 'Miriam', 'miriã': 'Miriam',
    'eleazar': 'Eleazar',
    'farao': 'Pharaoh', 'faraó': 'Pharaoh', 'pharaoh': 'Pharaoh',
    'davi': 'David', 'david': 'David',
    'golias': 'Goliath', 'goliath': 'Goliath',
    'saul': 'Saul',
    'samuel': 'Samuel',
    'jonatas': 'Jonathan', 'jônatas': 'Jonathan', 'jonathan': 'Jonathan',
    'salomao': 'Solomon', 'salomão': 'Solomon', 'solomon': 'Solomon',
    'abraao': 'Abraham', 'abraão': 'Abraham', 'abraham': 'Abraham',
    'isaque': 'Isaac', 'isaac': 'Isaac',
    'jaco': 'Jacob', 'jacó': 'Jacob', 'jacob': 'Jacob',
    'jose': 'Joseph', 'josé': 'Joseph', 'joseph': 'Joseph',
    'elias': 'Elijah', 'elijah': 'Elijah',
    'acabe': 'Ahab', 'ahab': 'Ahab',
    'jezabel': 'Jezebel', 'jezebel': 'Jezebel',
    'eliseu': 'Elisha', 'elisha': 'Elisha',
    'pedro': 'Peter', 'peter': 'Peter',
    'paulo': 'Paul', 'paul': 'Paul',
    'joao': 'John', 'joão': 'John', 'john': 'John',
    'daniel': 'Daniel'
  };

  const NOMES_PERSONAGENS_EXTRA_CANONICOS = [
    { pt: 'Elias', en: 'Elijah' },
    { pt: 'Acabe', en: 'Ahab' },
    { pt: 'Jezabel', en: 'Jezebel' },
    { pt: 'Eliseu', en: 'Elisha' },
    { pt: 'Abraão', en: 'Abraham', altPt: 'Abraao' },
    { pt: 'Isaque', en: 'Isaac' },
    { pt: 'Jacó', en: 'Jacob', altPt: 'Jaco' },
    { pt: 'José', en: 'Joseph', altPt: 'Jose' },
    { pt: 'Gideão', en: 'Gideon', altPt: 'Gideao' },
    { pt: 'Sansão', en: 'Samson', altPt: 'Sansao' },
    { pt: 'Daniel', en: 'Daniel' },
    { pt: 'Nabucodonosor', en: 'Nebuchadnezzar' },
    { pt: 'Pedro', en: 'Peter' },
    { pt: 'Paulo', en: 'Paul' },
    { pt: 'João', en: 'John', altPt: 'Joao' }
  ];

  function gerarFichaDeterministica(nomeEn, nomePt, textoRoteiro = '') {
    const n = (nomeEn || '').toLowerCase();
    if (n === 'elijah' || n === 'elias') {
      return 'Elijah: robust elderly Hebrew prophet in his late sixties, intense piercing visionary eyes, weathered sun-browned face, wild unkempt grey beard and shoulder-length grey hair, coarse dark camel-hair mantle, thick leather girdle belt';
    }
    if (n === 'ahab' || n === 'acabe') {
      return 'Ahab: arrogant middle-aged Hebrew monarch in his late forties, conflicted brooding face, neatly trimmed black beard, royal bronze circlet crown, royal purple linen tunic with gold embroidery, ornate ceremonial dagger at belt';
    }
    if (n === 'jezebel' || n === 'jezabel') {
      return 'Jezebel: proud Phoenician queen in her early forties, haughty pale sharp face, dark lined eyes, braided raven-black hair with ornate golden headdress, lavish crimson and violet silk robes with heavy gold jewelry';
    }
    if (n === 'elisha' || n === 'eliseu') {
      return 'Elisha: determined Hebrew prophet in his forties, bald crown, earnest intense gaze, rustic brown woolen mantle, holding a simple wooden traveler staff';
    }
    if (n === 'daniel') {
      return 'Daniel: dignified venerable statesman and prophet in his seventies, wise serene face, neat silver-white beard, noble Babylonian linen garments with gold trim';
    }
    if (n === 'peter' || n === 'pedro') {
      return 'Peter: weathered rugged Galilean fisherman in his late forties, sturdy muscular frame, salt-and-pepper curly hair and thick beard, coarse indigo wool tunic, leather work belt';
    }
    if (n === 'paul' || n === 'paulo') {
      return 'Paul: earnest intense apostle in his fifties, receding dark hair with grey streaks, trimmed dark beard, piercing scholarly eyes, humble rustic brown traveler mantle, leather parchment pouch';
    }
    return `${nomeEn}: dignified biblical figure in late forties, weathered resolute countenance, dark beard with grey streaks, rustic linen tunic, woven woolen mantle in earth tones`;
  }

  /**
   * PONTO 1: Remove referências teológicas, orações e expressões genealógicas
   * ("Deus de Abraão", "filhos de Jacó", "casa de teu pai", "God of Abraham", etc.)
   * para que nomes citados apenas em oração ou genealogia NÃO recebam fichas.
   */
  function limparExpressoesGenealogicas(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto
      // Captura sequência completa: "Deus de Abraão, de Isaque e de Israel" ou "God of Abraham, Isaac and Jacob"
      .replace(/\b(?:ó\s+)?(?:senhor\s+)?deus\s+de\s+(?:abra[aã]o|isaque|jac[oó]|israel)(?:\s*,\s*(?:de\s+)?(?:abra[aã]o|isaque|jac[oó]|israel))*(?:\s+(?:e|ou)\s+(?:de\s+)?(?:abra[aã]o|isaque|jac[oó]|israel))?\b/gi, '')
      .replace(/\b(?:o\s+)?(?:lord\s+)?god\s+of\s+(?:abraham|isaac|jacob|israel)(?:\s*,\s*(?:of\s+)?(?:abraham|isaac|jacob|israel))*(?:\s+and\s+(?:of\s+)?(?:abraham|isaac|jacob|israel))?\b/gi, '')
      .replace(/\b(?:filhos?|tribos?)\s+de\s+(?:israel|jac[oó]|jud[aá]|levi)\b/gi, '')
      .replace(/\b(?:sons?|children|tribes?)\s+of\s+(?:israel|jacob|judah|levi)\b/gi, '')
      .replace(/\b(?:casa|descend[eê]ncia|descendentes)\s+de\s+[\p{L}]+\b/giu, '')
      .replace(/\b(?:house|descendants?)\s+of\s+[a-z]+\b/gi, '')
      .replace(/\b(?:deus|senhor)\s+(?:dos?\s+)?(?:teus|seus|nossos?|vossos?)\s+pais\b/gi, '')
      .replace(/\b(?:god|lord)\s+of\s+(?:your|our|their)\s+fathers\b/gi, '');
  }

  async function extrairOuGerarFichasDoRoteiro(narracaoLimpa, chamarIaFn, contexto = {}) {
    const fichas = { ...(contexto.fichasPersonagens || {}) };
    if (typeof window !== 'undefined' && window._fichasPersonagensAtual) {
      Object.assign(fichas, window._fichasPersonagensAtual);
    }

    // PONTO 1: Filtra expressões genealógicas e teológicas para não criar fichas de quem é apenas citado em oração
    const texto = limparExpressoesGenealogicas((narracaoLimpa || '').toLowerCase());

    // 1. Identifica quais personagens do catálogo canônico (reserva fixa) estão presentes
    for (const [chave, fichaCanon] of Object.entries(FICHAS_PERSONAGENS)) {
      const reg = new RegExp(`\\b${chave}\\b`, 'i');
      if (reg.test(texto)) {
        const nomeNorm = NOMES_PERSONAGENS_NORMALIZADOS[chave.toLowerCase()] || chave;
        if (!fichas[nomeNorm]) {
          fichas[nomeNorm] = fichaCanon;
          fichas[chave] = fichaCanon;
        }
      }
    }

    // 2. Identifica personagens mencionados no roteiro que NÃO estão no catálogo canônico
    const personagensNovos = [];
    for (const item of NOMES_PERSONAGENS_EXTRA_CANONICOS) {
      const regPt = new RegExp(`\\b${item.pt}\\b`, 'i');
      const regEn = new RegExp(`\\b${item.en}\\b`, 'i');
      const regAlt = item.altPt ? new RegExp(`\\b${item.altPt}\\b`, 'i') : null;
      if ((regPt.test(texto) || regEn.test(texto) || (regAlt && regAlt.test(texto))) && !fichas[item.en] && !fichas[item.pt]) {
        personagensNovos.push(item);
      }
    }

    // 3. Se houver callback da IA e personagens novos para descrever
    if (typeof chamarIaFn === 'function' && personagensNovos.length > 0) {
      try {
        const nomesParaPedir = personagensNovos.map(p => `${p.en} (${p.pt})`).join(', ');
        const promptFichas = `You are an expert biblical art director. In this script excerpt:
"${(narracaoLimpa || '').slice(0, 1500)}"
For each character listed (${nomesParaPedir}), create a concise 1-line visual identity card in English (exact format: "Name: age, face, hair, beard, clothes, colors").
Return EXCLUSIVELY a JSON object where keys are the character names and values are the 1-line descriptions. Example:
{
  "Elijah": "Elijah: robust elderly Hebrew prophet in his late sixties, intense piercing visionary eyes, weathered sun-browned face, wild unkempt grey beard and shoulder-length grey hair, coarse dark camel-hair mantle, thick leather girdle belt",
  "Ahab": "Ahab: arrogant middle-aged Hebrew monarch in his late forties, conflicted brooding face, neatly trimmed black beard, royal bronze circlet crown, royal purple linen tunic with gold embroidery, ornate ceremonial dagger at belt"
}`;
        const respFichas = await chamarIaFn(promptFichas);
        const objFichas = extrairJsonLote(respFichas);
        let parsedMap = {};
        if (typeof objFichas === 'object' && objFichas !== null && !Array.isArray(objFichas)) {
          parsedMap = objFichas;
        } else if (Array.isArray(objFichas)) {
          for (const item of objFichas) {
            if (item && (item.name || item.personagem || item.character)) {
              const k = item.name || item.personagem || item.character;
              parsedMap[k] = item.card || item.ficha || item.description || item.descricaoVisual;
            }
          }
        }
        for (const [k, v] of Object.entries(parsedMap)) {
          if (typeof v === 'string' && v.trim().length > 15) {
            const linhaFicha = v.trim();
            fichas[k] = linhaFicha;
            for (const item of NOMES_PERSONAGENS_EXTRA_CANONICOS) {
              if (item.en.toLowerCase() === k.toLowerCase() || item.pt.toLowerCase() === k.toLowerCase()) {
                fichas[item.en] = linhaFicha;
                fichas[item.pt] = linhaFicha;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[PlanoCenas] Falha ao solicitar fichas à IA, usando gerador determinístico:', e);
      }
    }

    // 4. Garante ficha determinística para qualquer personagem novo que ainda não tenha recebido
    for (const item of personagensNovos) {
      if (!fichas[item.en] && !fichas[item.pt]) {
        const fichaFallback = gerarFichaDeterministica(item.en, item.pt, texto);
        fichas[item.en] = fichaFallback;
        fichas[item.pt] = fichaFallback;
      }
    }

    // 5. Atualiza contexto e variável global do projeto
    contexto.fichasPersonagens = fichas;
    if (typeof window !== 'undefined') {
      window._fichasPersonagensAtual = fichas;
      if (window.AutoSave && typeof window.AutoSave.save === 'function') {
        window.AutoSave.save();
      }
    }

    return fichas;
  }

  /**
   * BUG 2: Fallback semântico rico baseado no conteúdo REAL da cena (personagens + ação física + lugar).
   * NUNCA retorna texto genérico fixo igual para cenas diferentes.
   * Garante variedade de enquadramento e unicidade absoluta entre todas as cenas.
   */
  function gerarDescricaoVisualSemantica(trechoPt, numeroCena, enqSugerido = 'medio', contexto = {}, descricoesAnteriores = []) {
    const t = (trechoPt || '').toLowerCase();
    const pers = detectarPersonagensNaDescricao(t);
    let primeiroNome = pers.length > 0 ? (NOMES_PERSONAGENS_NORMALIZADOS[pers[0]] || pers[0]) : '';
    if (!primeiroNome && contexto.personagemPrincipal) {
      primeiroNome = NOMES_PERSONAGENS_NORMALIZADOS[contexto.personagemPrincipal.toLowerCase()] || contexto.personagemPrincipal;
    }

    // 1. Detecta lugar/topônimo no trecho ou no tema do contexto
    let lugar = '';
    for (const top of DICIONARIO_TOPONIMOS) {
      if (top.pt.test(t)) {
        lugar = top.en;
        break;
      }
    }
    if (!lugar) {
      const temaLower = (contexto.tema || '').toLowerCase();
      if (/\b(?:carmelo|elias|baal|acabe)\b/i.test(temaLower) || /\b(?:carmelo|baal)\b/i.test(t)) {
        lugar = 'Mount Carmel';
      } else if (/\b(?:el[aá]|golias|davi)\b/i.test(temaLower) || /\b(?:el[aá]|golias|davi)\b/i.test(t)) {
        lugar = 'the Valley of Elah';
      } else if (/\b(?:merib[aá]|cades|rocha)\b/i.test(temaLower) || /\b(?:merib[aá]|cades)\b/i.test(t)) {
        lugar = 'the desert wilderness of Kadesh at Meribah';
      } else if (/\b(?:mar\s+vermelho)\b/i.test(temaLower) || /\b(?:mar\s+vermelho)\b/i.test(t)) {
        lugar = 'the parted seabed of the Red Sea';
      } else {
        lugar = 'the ancient biblical landscape';
      }
    }

    // 2. Detecta ação física concreta
    let acao = '';

    // Ciclo de Elias e Baal
    if (/\b(?:fogo\s+do\s+senhor|fogo\s+do\s+c[eé]u|fogo\s+caiu|fogo\s+desceu|fogo\s+consumiu|fogo|chamas?)\b/i.test(t)) {
      acao = `Elijah standing in awe as a miraculous pillar of blazing divine fire roars down from the heavens, consuming the stone altar, sacrifice, wood, and water atop ${lugar} in blinding divine glory`;
    } else if (/\b(?:elias\s+orou|orou|orando|clamou|responde-me|reponde-me|deus\s+de\s+abra[aã]o|s[uú]plica)\b/i.test(t)) {
      acao = `Elijah kneeling with arms outstretched toward the heavens in earnest fervent prayer beside the stone altar atop ${lugar}`;
    } else if (/\b(?:sil[eê]ncio|nada\s+aconteceu|sem\s+resposta|ningu[eé]m\s+respondeu|nenhuma\s+voz)\b/i.test(t)) {
      acao = `weary pagan prophets and Hebrew onlookers standing in stunned, dead silence across ${lugar} under heavy atmospheric overcast skies`;
    } else if (/\b(?:nuvem|m[aã]o\s+de\s+um\s+homem|chuva|torrencial|vento|escureceu)\b/i.test(t)) {
      acao = `a small dark cloud rising from the distant sea horizon, gathering heavy wind and torrential rain over the mountain peaks of ${lugar}`;
    } else if (/\b(?:quisom|ribeiro|executa|desceu\s+ao\s+ribeiro)\b/i.test(t)) {
      acao = `the solemn rocky banks of the brook Kishon under brooding storm clouds in historical biblical reverence`;
    } else if (/\b(?:profetas\s+de\s+baal|baal)\b/i.test(t) && /\b(?:dan[cç]avam|gritavam|cortavam|mancavam|clamavam|romper|manh[aã]|unlit)\b/i.test(t)) {
      acao = `frantic pagan prophets of Baal leaping wildly around their unlit pagan stone altar with ceremonial blades in desperate clamor under bright midday sun`;
    } else if (/\b(?:reparou|restaurou|doze\s+pedras|altar|rego|valeta|[aá]gua|c[aâ]ntaros)\b/i.test(t)) {
      acao = `Elijah carefully restoring the ancient broken stone altar of twelve rough stones, pouring jars of fresh water into the deep surrounding trench`;
    } else if (/\b(?:profetas\s+de\s+baal|baal)\b/i.test(t)) {
      acao = `frantic pagan prophets of Baal leaping wildly around their unlit pagan stone altar with ceremonial blades in desperate clamor under bright midday sun`;
    }

    // Ciclo Davi e Golias
    else if (/\b(?:funda|cajado|ribeiro|desceu\s+ao\s+vale|correu|pastor)\b/i.test(t) && /\b(?:davi|david)\b/i.test(t)) {
      acao = `young David stepping steadily forward across the dry stony stream bed holding a rustic shepherd's staff and leather sling, eyes locked on the giant`;
    } else if (/\b(?:golias|goliath|gigante|armadura|escarneceu|desafiou|lan[cç]a)\b/i.test(t)) {
      acao = `towering colossal Philistine warrior Goliath in gleaming bronze scale armor and crested helmet sneering while brandishing a massive iron-headed spear`;
    } else if (/\b(?:cinco\s+pedras|pedras\s+lisas|alforge|bolsa)\b/i.test(t)) {
      acao = `young David bending down at the riverbed to select five smooth rounded river stones, placing them carefully into his small leather pouch`;
    } else if (/\b(?:atirou|lan[cç]ou|acertou|testa|caiu|rosto\s+em\s+terra)\b/i.test(t)) {
      acao = `the decisive moment of the stone striking the giant's forehead, Goliath staggering backward on the dusty slope under bright sunlight`;
    }

    // Ciclo Moisés
    else if (/\b(?:vara|feriu|bateu)\b/i.test(t) && /\brocha\b/i.test(t)) {
      acao = `Moses raising the wooden shepherd's staff striking the massive cracked desert boulder in ${lugar} before the assembled Hebrew elders`;
    } else if (/\b(?:[aá]gua|jorrou|brotou|brotaram|beber|sede|gado)\b/i.test(t) && /\brocha\b/i.test(t)) {
      acao = `crystal fresh spring water gushing forth in torrents from the cleft desert rock, joyful Hebrew families and livestock gathering to drink`;
    } else if (/\b(?:prostrar|prostraram|rostos?\s+em\s+terra|tenda|tabern[aá]culo)\b/i.test(t)) {
      acao = `Moses and Aaron prostrated with faces upon the desert ground before the sacred entrance of the Tabernacle tent`;
    } else if (/\b(?:gl[oó]ria\s+do\s+senhor|gl[oó]ria|apareceu|luz)\b/i.test(t)) {
      acao = `radiant celestial beam of divine golden glory descending upon the desert sanctuary in awesome supernatural reverence`;
    }

    // Conclusão / CTA / Canal
    else if (/\b(?:inscreva-se|canal|notifica[cç][oõ]es|estudo|v[íi]deo|compartilhe)\b/i.test(t)) {
      acao = `an ancient illuminated parchment scroll unrolled on a rustic cedar table beside a glowing brass oil lamp in solemn evening twilight`;
    }

    // Ação geral contextual derivada do trecho
    else {
      const sujeito = primeiroNome || 'authentic biblical figures';
      acao = `${sujeito} participating in solemn historical events at ${lugar} under dramatic atmospheric lighting`;
    }

    // 3. PONTO 2: Seleção e alternância de enquadramento evitando repetição no vídeo inteiro
    let enq = enqSugerido;
    const opcoesEnq = ['aberto', 'close', 'detalhe', 'medio'];
    const numInt = parseInt(numeroCena, 10) || 1;

    if (!enq || enq === 'outro' || enq === 'padrao') {
      enq = (numInt % 2 === 0) ? 'close' : 'aberto';
    }

    // Se qualquer cena anterior tiver o mesmo enquadramento e os mesmos personagens, alterna enquadramento
    if (Array.isArray(descricoesAnteriores) && descricoesAnteriores.length > 0) {
      for (const ant of descricoesAnteriores) {
        if (!ant) continue;
        const enqAnt = detectarTipoEnquadramento(ant);
        const persAnt = detectarPersonagensNaDescricao(ant);
        const persAtual = primeiroNome ? [primeiroNome.toLowerCase()] : [];

        const colidePers = persAtual.length > 0 && persAnt.length > 0 &&
          persAtual.every(p => persAnt.includes(p));

        if (enqAnt === enq && colidePers) {
          // Alterna para outro enquadramento não colidente
          const alternativos = opcoesEnq.filter(e => e !== enq && e !== enqAnt);
          enq = alternativos[(numInt - 1) % alternativos.length] || 'detalhe';
          break;
        }
      }
    }

    let descFinal = '';
    const montarDesc = (tipoEnq, acaoTexto) => {
      if (tipoEnq === 'close') {
        if (primeiroNome) {
          return `Dramatic intense close-up on ${primeiroNome} with focused facial expression and determined gaze as ${acaoTexto}`;
        }
        return `Dramatic close-up on authentic Hebrew faces with solemn expressions observing ${acaoTexto}`;
      }
      if (tipoEnq === 'detalhe') {
        return `Macro detail shot capturing the physical textures and intensity of ${acaoTexto}`;
      }
      if (tipoEnq === 'aberto') {
        return `Wide panoramic landscape shot of ${lugar} depicting ${acaoTexto}`;
      }
      return `Dynamic medium shot showing ${acaoTexto}`;
    };

    descFinal = montarDesc(enq, acao);

    // 4. GARANTIA DE UNICIDADE ABSOLUTA NO VÍDEO INTEIRO (PONTO 2):
    // Duas cenas do mesmo plano NUNCA podem ter mesma combinação de plano + personagens + ação!
    if (Array.isArray(descricoesAnteriores) && descricoesAnteriores.length > 0) {
      let repetida = false;
      let colidePlanoPersAcao = false;

      for (let idxAnt = 0; idxAnt < descricoesAnteriores.length; idxAnt++) {
        const ant = descricoesAnteriores[idxAnt];
        if (!ant) continue;

        const enqAnt = detectarTipoEnquadramento(ant);
        const persAnt = detectarPersonagensNaDescricao(ant);
        const persAtual = detectarPersonagensNaDescricao(descFinal);

        const mesmosPers = (persAtual.length > 0 || persAnt.length > 0) &&
          persAtual.length === persAnt.length &&
          persAtual.every(p => persAnt.includes(p));

        const taxa = calcularSemelhancaDescricoes(descFinal, ant);

        if (ant.trim().toLowerCase() === descFinal.trim().toLowerCase() || taxa >= 0.55) {
          repetida = true;
        }

        if (enqAnt === enq && mesmosPers && taxa >= 0.35) {
          colidePlanoPersAcao = true;
          break;
        }
      }

      if (repetida || colidePlanoPersAcao) {
        // Alterna enquadramento e perspectiva para garantir distinção total
        const enqNovo = (enq === 'aberto') ? 'detalhe' : (enq === 'close' ? 'medio' : 'aberto');
        const perspectivas = [
          `from a high-angle aerial perspective looking down over ${lugar}`,
          `from a low dramatic ground-level angle emphasizing the stony terrain`,
          `captured in cinematic side-profile lighting at twilight`,
          `viewed through atmospheric morning mist across the landscape`,
          `focusing on the stunned awe of gathered onlookers and Hebrew multitude`
        ];
        const persEscolhida = perspectivas[numInt % perspectivas.length];
        descFinal = `${montarDesc(enqNovo, acao)}, ${persEscolhida}`;
      }
    }

    return descFinal.trim();
  }

  function gerarFallbackEnquadramentoAlternativo(trechoPt, numeroCena, enqAnterior, contexto = {}) {
    const descricoesAcumuladas = contexto.descricoesAnteriores || [];
    let enqSugerido = 'medio';
    if (enqAnterior === 'aberto') {
      enqSugerido = 'close';
    } else if (enqAnterior === 'close' || enqAnterior === 'detalhe') {
      enqSugerido = 'aberto';
    } else {
      enqSugerido = 'close';
    }
    return gerarDescricaoVisualSemantica(trechoPt, numeroCena, enqSugerido, contexto, descricoesAcumuladas);
  }

  function detectarTipoEnquadramento(desc) {
    if (!desc || typeof desc !== 'string') return 'outro';
    const d = desc.toLowerCase();
    if (/\b(?:wide|panoramic|landscape|vast|establishing|aerial|high-angle|birds-eye|distant|broad\s+valley|expansive)\b/i.test(d)) {
      return 'aberto';
    }
    if (/\b(?:extreme\s+close-up|close-up|portrait|face|eyes|expression|profile|gaze)\b/i.test(d)) {
      return 'close';
    }
    if (/\b(?:macro|detail\s+shot|hands|fingers|grip|sling|leather\s+sling|stone|smooth\s+stone|sandals|feet|spear\s+tip|spearhead|blade|armor\s+greaves)\b/i.test(d)) {
      return 'detalhe';
    }
    if (/\b(?:medium\s+shot|waist-up|two\s+figures|side\s+by\s+side|standing\s+opposite|facing\s+each\s+other|confrontation)\b/i.test(d)) {
      return 'medio';
    }
    return 'padrao';
  }

  function detectarPersonagensNaDescricao(desc) {
    if (!desc || typeof desc !== 'string') return [];
    const d = desc.toLowerCase();
    const pers = [];
    if (/\b(?:david|davi|young\s+shepherd)\b/i.test(d)) pers.push('david');
    if (/\b(?:goliath|golias|giant|colossus)\b/i.test(d)) pers.push('goliath');
    if (/\b(?:saul|rei\s+saul)\b/i.test(d)) pers.push('saul');
    if (/\b(?:samuel)\b/i.test(d)) pers.push('samuel');
    if (/\b(?:jonathan|j[oô]natas)\b/i.test(d)) pers.push('jonathan');
    if (/\b(?:solomon|salom[aã]o)\b/i.test(d)) pers.push('solomon');
    if (/\b(?:moses|mois[eé]s)\b/i.test(d)) pers.push('moses');
    if (/\b(?:aaron|ar[aã]o)\b/i.test(d)) pers.push('aaron');
    if (/\b(?:joshua|josu[eé])\b/i.test(d)) pers.push('joshua');
    if (/\b(?:miriam|miri[aã])\b/i.test(d)) pers.push('miriam');
    if (/\b(?:pharaoh|fara[oó])\b/i.test(d)) pers.push('pharaoh');
    if (/\b(?:elijah|elias)\b/i.test(d)) pers.push('elijah');
    if (/\b(?:ahab|acabe)\b/i.test(d)) pers.push('ahab');
    if (/\b(?:jezebel|jezabel)\b/i.test(d)) pers.push('jezebel');
    if (/\b(?:elisha|eliseu)\b/i.test(d)) pers.push('elisha');
    if (/\b(?:peter|pedro)\b/i.test(d)) pers.push('peter');
    if (/\b(?:paul|paulo)\b/i.test(d)) pers.push('paul');
    if (/\b(?:john|jo[aã]o)\b/i.test(d)) pers.push('john');
    if (/\b(?:daniel)\b/i.test(d)) pers.push('daniel');
    return pers.sort();
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

    // Identifica fichas de personagens presentes para injetar no prompt da IA (ITEM 2)
    const textoLote = loteCenas.map(c => `${c.trecho}`).join(' ').toLowerCase();
    const fichasPresentes = [];
    for (const [chave, fichaCanon] of Object.entries(FICHAS_PERSONAGENS)) {
      const nomeEn = NOMES_PERSONAGENS_NORMALIZADOS[chave.toLowerCase()];
      if (nomeEn && !fichasPresentes.some(f => f.nome === nomeEn)) {
        const reg = new RegExp(`\\b${chave}\\b`, 'i');
        if (reg.test(textoLote)) {
          fichasPresentes.push({ nome: nomeEn, ficha: fichaCanon });
        }
      }
    }
    let blocoFichasIa = '';
    if (fichasPresentes.length > 0) {
      blocoFichasIa = `\nCHARACTER CANONICAL IDENTITY (MANDATORY TO PRESERVE EXACT SAME AGE, HAIR, FACE, CLOTHES, COLORS IN EVERY SCENE):\n${fichasPresentes.map(f => `- ${f.ficha}`).join('\n')}\n`;
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
2. MANDATORY FRAMING VARIETY & CONSECUTIVE SCENE RULE (SCENE 1 & 2 VARIETY):
   - TWO CONSECUTIVE SCENES MUST NEVER REPEAT THE SAME FRAMING TYPE + SAME CHARACTERS!
   - If the first scene is an establishing wide shot (e.g. landscape of the Valley of Elah with both figures or armies), the second scene MUST NOT be another shot of both David and Goliath standing in the valley. The next scene MUST vary drastically: e.g. dramatic extreme close-up on Goliath's sneering face/eyes, or macro detail shot on David's hand selecting smooth river stones and holding the leather sling.
   - Alternate camera perspectives:
     * Wide panoramic landscape shot (vast valley, army camps on rolling hills)
     * Dramatic close-up on face, eyes, and solemn fearless expression
     * Macro detail shot on hands, rustic sling, smooth river stones, spearhead, armor greaves
     * Dynamic medium action shot (waist-up, winding sling, raising staff)
     * High-angle aerial perspective looking down at terrain or battle lines
3. STRICT CHRONOLOGICAL ISOLATION (NO PREMATURE ACTION):
   - Illustrate ONLY the specific action mentioned in this scene's excerpt.
   - NEVER illustrate actions that only happen in subsequent excerpts (e.g. if the sling release or stone strike is only narrated in a later scene, DO NOT depict it in earlier scenes).
4. NO AUDIENCE, CHANNEL OR PRODUCTION REFERENCES:
   - FORBIDDEN to mention 'viewers', 'audience', 'subscribe', 'channel', 'video', 'followers', or 'strengthen faith'.
   - For call-to-action or conclusion excerpts, depict a concrete historical object/setting (e.g. an ancient illuminated parchment scroll unrolled on a rustic cedar table beside a glowing bronze oil lamp, or serene twilight horizon over the desert).
5. DOMINANT EVENT RULE:
   - If an excerpt contains more than one action or subject, depict the primary event that occupies the majority of the text.
6. FORBIDDEN to include elements from other biblical events or stories (e.g., NEVER include sea, ocean waves, or shore if the text is about a valley, desert, rock, camp, or mountain).
7. Use strictly biblical English names and respect CANONICAL CHARACTER IDENTITY: David, Goliath, Saul, Samuel, Jonathan, Solomon, Moses, Aaron, Miriam, Joshua, Eleazar, Pharaoh.
8. FORBIDDEN to depict God as a human figure, face, or humanoid shadow. Depict divine presence through glorious radiant celestial light, glowing illumination, pillar of cloud or fire.
9. Do NOT include Portuguese words.
10. Do NOT use generic placeholders like "biblical tableau", "artistic depiction" or "scene representing". Describe the physical concrete action.
11. CRITICAL SCENE NUMBERING RULE: You MUST PRESERVE the exact scene numbers from INPUT SCENES: [${numerosEsperados}]. DO NOT restart numbering from "01" if scenes are ${numerosEsperados}!
12. Output EXCLUSIVELY a valid JSON array of objects with "numero" and "descricaoVisual".
${blocoFichasIa}${blocoAnteriores}
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

    // 6. PONTO 2: Proibição de repetição de enquadramento + mesmos personagens + mesma ação NO VÍDEO INTEIRO
    if (contexto && Array.isArray(contexto.descricoesAnteriores) && contexto.descricoesAnteriores.length > 0) {
      const enqAtual = detectarTipoEnquadramento(desc);
      const persAtual = detectarPersonagensNaDescricao(desc);

      for (let idxAnt = 0; idxAnt < contexto.descricoesAnteriores.length; idxAnt++) {
        const descAnterior = contexto.descricoesAnteriores[idxAnt];
        if (!descAnterior) continue;

        const enqAnt = detectarTipoEnquadramento(descAnterior);
        const persAnt = detectarPersonagensNaDescricao(descAnterior);

        const mesmosPersonagens = (persAtual.length > 0 || persAnt.length > 0) &&
          persAtual.length === persAnt.length &&
          persAtual.every(p => persAnt.includes(p));

        const ehVizinha = (idxAnt === contexto.descricoesAnteriores.length - 1);
        const taxaSemelhanca = calcularSemelhancaDescricoes(desc, descAnterior);

        // Se for cena vizinha: não pode repetir mesmo plano + mesmos personagens (mesmo com ação um pouco diferente)
        if (ehVizinha && enqAtual !== 'outro' && enqAtual !== 'padrao' && enqAtual === enqAnt && mesmosPersonagens) {
          return {
            valido: false,
            motivo: `Cenas consecutivas não podem repetir o mesmo tipo de plano (${enqAtual}) e os mesmos personagens (${persAtual.join(', ')}). Exige variar (ex.: plano aberto do vale → close no rosto ou detalhe).`
          };
        }

        // No vídeo inteiro (não só na vizinha): duas cenas nunca podem repetir o mesmo tipo de plano + os mesmos personagens + a mesma ação
        if (enqAtual !== 'outro' && enqAtual !== 'padrao' && enqAtual === enqAnt && mesmosPersonagens && taxaSemelhanca >= 0.35) {
          const numCenaAnt = String(idxAnt + 1).padStart(2, '0');
          return {
            valido: false,
            motivo: `Cena repete a combinação de plano (${enqAtual}), personagens (${persAtual.join(', ')}) e ação já usada na Cena ${numCenaAnt}. Exige variar ângulo, enquadramento ou foco dramático (multidão, detalhe, objeto, lugar).`
          };
        }
      }
    }

    // 7. Detecção de semelhança excessiva com cenas anteriores (ITEM 4)
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
   * 2. Ficha canônica do personagem quando ele aparece (ITEM 2 e PONTO 1).
   * 3. Sufixo "Full bleed image, no border, no frame, no decorative corners. No text." no final.
   */
  function montarPromptFinalCena(descricaoVisual, trechoPt, contexto = {}) {
    let desc = (descricaoVisual || '').trim();

    // Remove eventuais prefixos ou sufixos duplicados
    desc = desc.replace(/^Illuminated manuscript[^.]*\.\s*/i, '');
    desc = desc.replace(/Full bleed image[^.]*\.?\s*$/i, '');
    desc = desc.replace(/^Depicting\s+/i, '');

    // Se desc estiver vazia ou for curta demais (< 5 palavras) ou apenas o nome do personagem,
    // gera a ação concreta da cena a partir de trechoPt para garantir que a ação NUNCA suma
    if (contarPalavras(desc) < 5 || /^(?:elijah|david|moses|aaron|goliath|saul|samuel|jonathan|solomon|prophet|king|giant)[\s.:,]*$/i.test(desc)) {
      desc = gerarDescricaoVisualSemantica(trechoPt, '01', 'medio', contexto);
      desc = desc.replace(/[.,;:\s]+$/, '');
    }

    // Combina fichas canônicas prontas (reserva) com fichas geradas do roteiro atual (PONTO B)
    const fichasDisponiveis = {
      ...FICHAS_PERSONAGENS,
      ...(contexto.fichasPersonagens || (typeof window !== 'undefined' ? window._fichasPersonagensAtual : null) || {})
    };

    const personagensEncontrados = [];
    const nomesNormalizados = {
      ...NOMES_PERSONAGENS_NORMALIZADOS,
      ...(contexto.nomesNormalizados || {})
    };

    // PONTO 1: Injetar a ficha SÓ dos personagens que estão na descricaoVisual da cena (quem aparece na imagem),
    // NUNCA de quem é apenas mencionado no trecho falado (oração, fala ou genealogia).
    const descLowerLimpa = limparExpressoesGenealogicas(desc.toLowerCase());

    for (const [chave, fichaCanon] of Object.entries(fichasDisponiveis)) {
      const nomeEn = nomesNormalizados[chave.toLowerCase()] || chave;
      if (nomeEn && !personagensEncontrados.some(p => p.nome.toLowerCase() === nomeEn.toLowerCase())) {
        const reg = new RegExp(`\\b${chave}\\b`, 'i');
        // Busca EXCLUSIVAMENTE na descrição visual da cena (descLowerLimpa)
        if (reg.test(descLowerLimpa)) {
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
    const tema = (contexto.tema || '').toLowerCase();
    const descricoesAcumuladas = contexto.descricoesAnteriores || [];
    const numInt = parseInt(numeroCena, 10) || 1;
    const enqSugerido = (numInt % 2 === 0) ? 'close' : 'aberto';

    // Ciclo de Elias e os profetas de Baal (Mount Carmel)
    if (/\b(?:elias|baal|carmelo|acabe|jezabel)\b/i.test(t) || /\b(?:elias|baal|carmelo|acabe)\b/i.test(tema)) {
      return gerarDescricaoVisualSemantica(trechoPt, numeroCena, enqSugerido, contexto, descricoesAcumuladas);
    }

    // Fallback contextual para Davi e Golias (ITEM 4: Cenas 01 e 02 e consecutivas variadas)
    if (/\b(?:golias|davi|goliath|david|filisteu|pastor|funda|gigante|el[aá])\b/i.test(t)) {
      const numInt = parseInt(numeroCena, 10);
      if (numInt === 1) {
        return 'Wide panoramic shot of the sunlit Valley of Elah with Philistine and Hebrew armies camped on opposing rocky slopes, deep tension in the morning haze';
      }
      if (numInt === 2) {
        return 'Dramatic close-up on young David with fearless focused eyes, rustic sheep wool tunic, natural leather sling held firmly in hand';
      }
      if (numInt === 3) {
        return 'Colossal towering Philistine giant Goliath sneering in heavy gleaming bronze scale armor coat and helmet, grasping a massive iron-tipped spear';
      }
      if (numInt === 4) {
        return 'Macro detail shot on young David selecting five smooth rounded river stones from the brook, placing them inside a small leather pouch';
      }
      if (numInt === 5) {
        return 'Dynamic medium action shot of young David swinging the rustic leather sling overhead, running forward across the dry dusty stream bed';
      }
      if (numInt % 2 === 0) {
        return 'Dramatic close-up on intense facial expressions and dusty battlefield atmosphere with ancient weapons in solemn historical reverence';
      }
      return 'Wide landscape view of the Valley of Elah under dramatic sunlit sky with rolling stony ridges and ancient military encampment';
    }

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

    // BUG 2: Fallback semântico rico usando personagens + ação + lugar citados (NUNCA frase genérica fixa)
    return gerarDescricaoVisualSemantica(trechoPt, numeroCena, enqSugerido, contexto, descricoesAcumuladas);
  }

  /**
   * Gera as descrições visuais de todas as cenas usando IA em lotes de 10 cenas por chamada.
   */
  async function gerarDescricoesVisuaisComIa(cenas, narracaoLimpa, chamarIaFn, contexto = {}) {
    if (!cenas || !Array.isArray(cenas) || cenas.length === 0) return cenas;

    // PONTO B: Antes de gerar o 1º lote de cenas, obtém ou gera fichas canônicas para todos os personagens do roteiro
    await extrairOuGerarFichasDoRoteiro(narracaoLimpa, chamarIaFn, contexto);

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

        // Se a IA do lote falhou ou omitiu a cena, registra pendência para permitir regeneração manual ou botão de pendentes
        if (erroIaLote || !itemIa) {
          c.status = 'PENDENTE';
          c.motivoPendente = erroIaLote ? `Erro da IA: ${erroIaLote}` : 'Descrição ausente na resposta da IA.';
          c.descricaoVisual = '';
          c.promptIngles = `[PENDENTE: ${c.motivoPendente}]`;
          continue;
        }

        const contextoValidacao = {
          ...contexto,
          descricoesAnteriores: descricoesAcumuladas
        };
        let validacao = validarDescricaoVisualCena(descVisual, trechoPt, contextoValidacao);

        // Se a descrição da IA foi rejeitada pelo validador:
        if (!validacao.valido) {
          let corrigido = false;
          if (typeof chamarIaFn === 'function') {
            const descAnterior = descricoesAcumuladas[descricoesAcumuladas.length - 1] || '';
            const enqAnt = detectarTipoEnquadramento(descAnterior);
            const enqSugerido = (enqAnt === 'aberto') ? 'close' : 'aberto';
            const persCena = detectarPersonagensNaDescricao(trechoPt);

            for (let tent = 1; tent <= 2; tent++) {
              try {
                const motivoRej = validacao.motivo || 'Visual description rejected';
                const promptTentativa = `You are an expert biblical art director creating ONE visual description for Scene ${c.numero}.
The previous attempt was rejected: "${motivoRej}".
Narration excerpt: "${trechoPt}".
Characters present: ${persCena.join(', ') || 'biblical figures'}.
Camera framing: MUST be ${enqSugerido} (different from previous: "${enqAnt}").
CRITICAL RULES:
- Describe the physical concrete action happening in this scene (e.g. praying, fire falling from heaven onto the stone altar, frantic pagan leaping, stunned silence).
- Characters must be actively engaged in their specific physical action and location, NEVER a static portrait.
- Output strictly JSON: [{"numero": "${c.numero}", "descricaoVisual": "..."}]`;

                const respTentativa = await chamarIaFn(promptTentativa);
                const itensTentativa = extrairJsonLote(respTentativa);
                const itemTentativa = localizarItemIaCena(itensTentativa, c, 0);
                const candDesc = extrairTextoDescricaoVisual(itemTentativa);
                if (candDesc) {
                  const valTentativa = validarDescricaoVisualCena(candDesc, trechoPt, contextoValidacao);
                  if (valTentativa.valido) {
                    descVisual = candDesc;
                    validacao = valTentativa;
                    corrigido = true;
                    break;
                  }
                }
              } catch (_) {}
            }
          }

          // AJUSTE C / BUG 2: Se falhou por repetição de enquadramento ou semelhança excessiva com a anterior,
          // aciona fallback semântico rico trocando o plano (personagens + ação + lugar citados)
          const ehRepeticao = validacao.motivo && (
            validacao.motivo.includes('Cenas consecutivas não podem repetir') ||
            validacao.motivo.includes('Semelhança excessiva com cena anterior')
          );

          if (!corrigido && ehRepeticao) {
            const descAnterior = descricoesAcumuladas[descricoesAcumuladas.length - 1] || '';
            const enqAnt = detectarTipoEnquadramento(descAnterior);
            descVisual = gerarFallbackEnquadramentoAlternativo(trechoPt, c.numero, enqAnt, {
              ...contexto,
              descricoesAnteriores: descricoesAcumuladas
            });
            validacao = { valido: true, motivo: '' };
          }
        }

        // Se a descrição foi validada com sucesso (ou resolvida via fallback de enquadramento)
        if (validacao.valido) {
          c.status = 'CONCLUIDA';
          c.motivoPendente = '';
          c.descricaoVisual = descVisual;
          c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
          descricoesAcumuladas.push(descVisual);
        } else {
          // Marca como PENDENTE com motivo real
          c.status = 'PENDENTE';
          c.motivoPendente = validacao.motivo || 'Descrição rejeitada pelo validador';
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

    // PONTO B: Garante fichas dos personagens presentes
    await extrairOuGerarFichasDoRoteiro(narracaoLimpa, chamarIaFn, contexto);

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

        if (erroIaLote) {
          c.status = 'PENDENTE';
          c.motivoPendente = `Erro da IA: ${erroIaLote}`;
          c.descricaoVisual = '';
          c.promptIngles = `[PENDENTE: ${c.motivoPendente}]`;
          continue;
        }

        const itemIa = localizarItemIaCena(itensLote, c, idx);
        let descVisual = extrairTextoDescricaoVisual(itemIa);

        const contextoValidacao = {
          ...contexto,
          descricoesAnteriores: descricoesConcluidas
        };
        let validacao = validarDescricaoVisualCena(descVisual, trechoPt, contextoValidacao);

        // Se a descrição foi rejeitada na regeneração ou veio ausente:
        if (!validacao.valido || !descVisual) {
          let corrigido = false;
          if (typeof chamarIaFn === 'function') {
            const descAnterior = descricoesConcluidas[descricoesConcluidas.length - 1] || '';
            const enqAnt = detectarTipoEnquadramento(descAnterior);
            const enqSugerido = (enqAnt === 'aberto') ? 'close' : 'aberto';
            const persCena = detectarPersonagensNaDescricao(trechoPt);

            for (let tent = 1; tent <= 2; tent++) {
              try {
                const motivoRej = validacao.motivo || 'Scene missing from regeneration batch or empty';
                const promptTroca = `You are an expert biblical art director creating ONE visual description for Scene ${c.numero}.
The previous attempt was rejected: "${motivoRej}".
Narration excerpt: "${trechoPt}".
Characters present: ${persCena.join(', ') || 'biblical figures'}.
Camera framing: MUST be ${enqSugerido} (different from previous: "${enqAnt}").
CRITICAL RULES:
- Describe the physical concrete action happening in this scene (e.g. praying, fire falling from heaven onto the stone altar, frantic pagan leaping, stunned silence).
- Characters must be actively engaged in their specific physical action and location, NEVER a static portrait.
- Output strictly JSON: [{"numero": "${c.numero}", "descricaoVisual": "..."}]`;

                const respTroca = await chamarIaFn(promptTroca);
                const itensTroca = extrairJsonLote(respTroca);
                const itemTroca = localizarItemIaCena(itensTroca, c, 0);
                const candDesc = extrairTextoDescricaoVisual(itemTroca);
                if (candDesc) {
                  const valTroca = validarDescricaoVisualCena(candDesc, trechoPt, contextoValidacao);
                  if (valTroca.valido) {
                    descVisual = candDesc;
                    validacao = valTroca;
                    corrigido = true;
                    break;
                  }
                }
              } catch (_) {}
            }
          }

          // Se após as tentativas ainda não validou, aciona fallback semântico rico
          if (!corrigido || !validacao.valido) {
            const descAnterior = descricoesConcluidas[descricoesConcluidas.length - 1] || '';
            const enqAnt = detectarTipoEnquadramento(descAnterior);
            descVisual = gerarFallbackEnquadramentoAlternativo(trechoPt, c.numero, enqAnt, {
              ...contexto,
              descricoesAnteriores: descricoesConcluidas
            });
            validacao = { valido: true, motivo: '' };
          }
        }

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

    const descricoesAcumuladas = [];
    for (const c of cenas) {
      const trechoPt = c.frases.join(' ');
      const descVisual = gerarDescricaoVisualFallback(trechoPt, c.numero, {
        ...contexto,
        descricoesAnteriores: descricoesAcumuladas
      });
      c.descricaoVisual = descVisual;
      c.promptIngles = montarPromptFinalCena(descVisual, trechoPt, contexto);
      descricoesAcumuladas.push(descVisual);
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

    // PONTO B: extrai ou gera fichas dos personagens presentes no roteiro
    if (!contexto.fichasPersonagens) {
      extrairOuGerarFichasDoRoteiro(narracaoLimpa, null, contexto);
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
   * NUNCA introduz quebras de linha no trecho da linha e NUNCA contém colchetes [ ].
   */
  function expandirTrechoParaMinimoPalavras(fraseInicio, textoBase, minPalavras = 5) {
    let trecho = (fraseInicio || '')
      .replace(/\*{0,2}\[[^\]\r\n]*\]\*{0,2}\s*:?/g, '')
      .replace(/[\[\]]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    let palavras = trecho.match(/\S+/g) || [];
    if (palavras.length >= minPalavras) {
      return trecho;
    }

    const baseNorm = (textoBase || '')
      .replace(/\*{0,2}\[[^\]\r\n]*\]\*{0,2}\s*:?/g, '')
      .replace(/[\[\]]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ');
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
   * NUNCA contém colchetes [ ou ].
   */
  function gerarCenasTxt(cenas, narracaoLimpa) {
    if (!cenas || !Array.isArray(cenas)) return '';
    const textoBase = (narracaoLimpa || '')
      .replace(/\*{0,2}\[[^\]\r\n]*\]\*{0,2}\s*:?/g, '')
      .replace(/[\[\]]/g, '')
      .trim();

    const linhas = cenas.map(c => {
      let trechoFinal = expandirTrechoParaMinimoPalavras(c.fraseInicio, textoBase, 5);
      trechoFinal = trechoFinal.replace(/[\[\]]/g, '').trim();
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

  /**
   * PONTO 4: Validação automática de integridade estrutural do roteiro pós-geração.
   * Checagens:
   * 1. Aspas abertas = fechadas (sem aspas desbalanceadas ou faltando fechar)
   * 2. Nenhuma frase ou expressão significativa repetida
   * 3. Nenhuma citação solta fora de uma fala (ou aspas isoladas sem texto bíblico válido)
   * 4. Desfecho completo presente (narração do clímax do episódio bíblico, fogo/vitória e reação do povo)
   */
  function validarIntegridadeEstruturalRoteiro(roteiro, contexto = {}) {
    if (!roteiro || typeof roteiro !== 'string' || roteiro.trim().length === 0) {
      return { valido: false, erros: ['Roteiro vazio ou inválido.'] };
    }

    const erros = [];
    const texto = roteiro.trim();

    // 1. Aspas balanceadas (aspas abertas = fechadas)
    const aspasRetas = (texto.match(/"/g) || []).length;
    if (aspasRetas % 2 !== 0) {
      erros.push(`Aspas duplas desbalanceadas: número ímpar (${aspasRetas}) de aspas detectado no texto.`);
    }

    const aspasAbreTipograficas = (texto.match(/[“«]/g) || []).length;
    const aspasFechaTipograficas = (texto.match(/[”»]/g) || []).length;
    if (aspasAbreTipograficas !== aspasFechaTipograficas) {
      erros.push(`Aspas tipográficas desbalanceadas: ${aspasAbreTipograficas} abertura(s) vs ${aspasFechaTipograficas} fechamento(s).`);
    }

    // 2. Nenhuma frase repetida
    // Divide em frases e normaliza para detectar repetições mecânicas (ex: "três vezes", orações duplicadas)
    const frasesRoteiro = dividirEmFrases(texto);
    const mapaFrases = new Map();
    for (const f of frasesRoteiro) {
      const fNorm = f.toLowerCase().replace(/["'”»“«]/g, '').replace(/[.,;:!?…\s]+/g, ' ').trim();
      const numPalavras = contarPalavras(fNorm);
      if (numPalavras >= 2 && fNorm.length >= 8) {
        if (mapaFrases.has(fNorm)) {
          erros.push(`Frase repetida detectada no roteiro: "${f.trim()}".`);
          break;
        }
        mapaFrases.set(fNorm, true);
      }
    }

    // 3. Nenhuma citação solta fora de uma fala
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const linha of linhas) {
      if (/^"\s*$/.test(linha) || /^\s*"\s*\(?\d?\s*[A-ZÀ-Ú][a-zà-ú]+\s+\d+:\d+\)?\s*$/.test(linha)) {
        erros.push(`Citação solta ou aspas órfãs detectadas: "${linha}".`);
        break;
      }
    }

    // 4. Desfecho completo do episódio bíblico presente antes da conclusão/CTA
    const temaLower = `${contexto.tema || ''} ${contexto.ideia || ''} ${contexto.titulo || ''} ${texto.slice(0, 300)}`.toLowerCase();
    const textoLower = texto.toLowerCase();

    // Verificação de desfecho para ciclo de Elias no Carmelo / profetas de Baal
    const ehCicloEliasCarmelo = /\b(?:elias|carmelo|baal)\b/i.test(temaLower);
    if (ehCicloEliasCarmelo) {
      const narrouFogo = /\b(?:fogo\s+(?:do\s+senhor|do\s+c[eé]u|caiu|desceu|consumiu)|chamas?\s+(?:do\s+senhor|consumir(?:am)?))\b/i.test(textoLower);
      const narrouReacaoPovo = /\b(?:povo\s+(?:viu|caiu|prostr(?:ou|aram)|declarou|gritou|clamou)|rostos?\s+em\s+terra|o\s+senhor\s+[eé]\s+deus)\b/i.test(textoLower);
      if (!narrouFogo || !narrouReacaoPovo) {
        erros.push('Roteiro incompleto: falta o desfecho completo do episódio (o fogo do Senhor caindo do céu e a reação do povo se prostrando e proclamando que o Senhor é Deus).');
      }
    }

    // Verificação de desfecho para Davi e Golias
    const ehCicloDaviGolias = /\b(?:davi|golias|goliath)\b/i.test(temaLower);
    if (ehCicloDaviGolias) {
      const narrouPedraOuQueda = /\b(?:pedra\s+(?:cravou|afundou|acertou|atingiu)|caiu\s+com\s+o\s+rosto|gigante\s+caiu|tombou|morto)\b/i.test(textoLower);
      if (!narrouPedraOuQueda) {
        erros.push('Roteiro incompleto: falta o desfecho de Davi e Golias (o impacto decisivo da pedra na testa e a queda do gigante).');
      }
    }

    return {
      valido: erros.length === 0,
      erros
    };
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
    detectarTipoEnquadramento,
    detectarPersonagensNaDescricao,
    montarPromptFinalCena,
    gerarDescricaoVisualSemantica,
    gerarDescricaoVisualFallback,
    gerarFallbackEnquadramentoAlternativo,
    limparExpressoesGenealogicas,
    extrairOuGerarFichasDoRoteiro,
    gerarFichaDeterministica,
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
    gerarNomeZipCurto,
    validarIntegridadeEstruturalRoteiro,
    validarPacoteScriptorium,
    criarZipScriptorium,
    lerArquivosDeZip
  };
});
