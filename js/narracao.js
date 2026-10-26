// js/narracao.js — utilitários da narração em PARTES (ITEM 47) e Legendas Alinhadas
// O Vercel limita a resposta de uma função a ~4,5 MB. Um roteiro Longo (~2.800 palavras, ~19 min) gera um MP3 de
// 8 a 20 MB (conforme o bitrate), então o áudio é pedido em partes pequenas e juntado no navegador.
// Além disso, evita truncamento do modelo neural de TTS dividindo em blocos de até ~1.300 caracteres,
// sempre no final de frases completas.
// Funciona no navegador (window.NarracaoModule) e no Node (testes offline).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NarracaoModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LIMITE_RESPOSTA_BYTES = 4.5 * 1024 * 1024;
  const PALAVRAS_POR_MINUTO = 150; // Padrão geral da ferramenta para estimativas
  const VELOCIDADE_REFERENCIA_VOZ = 165; // Referência inicial para vozes rápidas como Onyx antes de calibrar
  const MAX_CHARS_POR_PARTE = 1300; // Margem segura contra truncamento do buffer da OpenAI TTS (~180-220 palavras)

  /** Tamanho esperado do MP3 a partir do número de palavras (duração) e do bitrate. Não chama nenhuma API. */
  function estimarMp3({ palavras, kbps = 128, palavrasPorMinuto = PALAVRAS_POR_MINUTO }) {
    const segundos = (palavras / palavrasPorMinuto) * 60;
    const bytes = segundos * kbps * 1000 / 8;
    return { segundos, bytes, mb: bytes / (1024 * 1024), passaDoLimite: bytes > LIMITE_RESPOSTA_BYTES };
  }

  /**
   * Conta palavras de forma consistente ignorando pontuações isoladas.
   */
  function contarPalavras(texto) {
    if (!texto || typeof texto !== 'string') return 0;
    const tokens = texto.match(/\S+/g);
    return tokens ? tokens.length : 0;
  }

  /**
   * Calcula a duração esperada em segundos com base no número de palavras e na velocidade (PPM).
   */
  function calcularDuracaoEsperada(texto, ppm = VELOCIDADE_REFERENCIA_VOZ) {
    const palavras = contarPalavras(texto);
    if (palavras === 0) return 0;
    const taxa = ppm > 0 ? ppm : VELOCIDADE_REFERENCIA_VOZ;
    return (palavras / taxa) * 60;
  }

  /**
   * Valida se a duração real da parte gerada atinge a tolerância mínima (default 75%)
   * em relação à velocidade esperada/calibrada.
   */
  function validarDuracaoParte(duracaoRealSegundos, texto, ppmCalibrado = VELOCIDADE_REFERENCIA_VOZ, tolerancia = 0.75) {
    const duracao = Number(duracaoRealSegundos) || 0;
    const palavras = contarPalavras(texto);
    if (palavras === 0) return { valida: true, duracaoRealSegundos: 0, segundosEsperados: 0, minimoAceitavel: 0, ppmObservado: 0 };

    const segundosEsperados = (palavras / ppmCalibrado) * 60;
    const minimoAceitavel = segundosEsperados * tolerancia;
    const valida = duracao >= minimoAceitavel;
    const ppmObservado = duracao > 0 ? (palavras / duracao) * 60 : 0;

    return {
      valida,
      duracaoRealSegundos: duracao,
      segundosEsperados,
      minimoAceitavel,
      ppmObservado,
      palavras
    };
  }

  /**
   * Atualiza a velocidade média (palavras por minuto) das partes completas já recebidas.
   */
  function calibrarVelocidade(historicoPartes) {
    if (!Array.isArray(historicoPartes) || historicoPartes.length === 0) return VELOCIDADE_REFERENCIA_VOZ;
    let totalPalavras = 0;
    let totalSegundos = 0;

    for (const h of historicoPartes) {
      if (h && h.palavras > 0 && h.duracaoSegundos > 0) {
        totalPalavras += h.palavras;
        totalSegundos += h.duracaoSegundos;
      }
    }

    if (totalSegundos <= 0 || totalPalavras <= 0) return VELOCIDADE_REFERENCIA_VOZ;
    const ppm = (totalPalavras / totalSegundos) * 60;
    // Limites de sanidade para vozes TTS (entre 120 e 220 ppm)
    return Math.max(120, Math.min(220, ppm));
  }

  /**
   * Divide em partes de até maxChars SEMPRE no fim de uma frase (nunca no meio).
   * Mantém todo o conteúdo textual original sem perder nem duplicar nada.
   */
  function dividirTextoEmPartes(texto, maxChars = MAX_CHARS_POR_PARTE) {
    if (!texto || typeof texto !== 'string') return [];
    const partes = [];
    let atual = '';
    const fechar = () => { if (atual.trim()) partes.push(atual.trim()); atual = ''; };

    // Divide em parágrafos preservando blocos
    const paragrafos = String(texto || '').split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);

    // Extrai frases completas: qualquer sequência terminada em ponto, exclamação, interrogação ou reticências
    // tratando aspas que fecham após a pontuação.
    const frasesDe = (p) => {
      const regex = /([^.!?…]+(?:[.!?…]+["”']?)?\s*)/g;
      const res = [];
      let m;
      while ((m = regex.exec(p)) !== null) {
        const item = m[1].trim();
        if (item) res.push(item);
      }
      return res.length > 0 ? res : [p.trim()];
    };

    for (const p of paragrafos) {
      const candidato = atual ? atual + '\n\n' + p : p;
      if (candidato.length <= maxChars) {
        atual = candidato;
        continue;
      }

      fechar();

      if (p.length <= maxChars) {
        atual = p;
        continue;
      }

      // Parágrafo longo: divide estritamente nas fronteiras de frase
      for (const f of frasesDe(p)) {
        const cand = atual ? atual + ' ' + f : f;
        if (cand.length <= maxChars) {
          atual = cand;
          continue;
        }
        fechar();
        // Frase única maior que o limite vai inteira (nunca cortar no meio)
        atual = f;
      }
    }
    fechar();
    return partes;
  }

  /** Remove o cabeçalho ID3v2 de um MP3 (Uint8Array). */
  function removerId3(u8) {
    if (u8.length >= 10 && u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) {
      const tamanho = ((u8[6] & 0x7f) << 21) | ((u8[7] & 0x7f) << 14) | ((u8[8] & 0x7f) << 7) | (u8[9] & 0x7f);
      return u8.subarray(10 + tamanho);
    }
    return u8;
  }

  /** Junta os MP3 das partes em um só: a 1ª mantém o ID3; as seguintes perdem o cabeçalho. */
  function juntarMp3(arrays) {
    const limpos = arrays.map((a, i) => (i === 0 ? a : removerId3(a)));
    const total = limpos.reduce((s, a) => s + a.length, 0);
    const saida = new Uint8Array(total);
    let pos = 0;
    for (const a of limpos) { saida.set(a, pos); pos += a.length; }
    return saida;
  }

  // ---- Legendas por partes e Alinhamento Forçado com Narração Limpa (SRT) ----
  const paraSegundos = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
  function formatarTempoSrt(segundos) {
    const totalMs = Math.max(0, Math.round(segundos * 1000));
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${p(h)}:${p(m)}:${p(s)},${p(ms, 3)}`;
  }

  /**
   * Normaliza uma palavra para comparação fonética/textual suave (remove pontuação, minúsculas, diacríticos).
   */
  function normalizarPalavraParaMatch(w) {
    if (!w) return '';
    return String(w)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Alinha o texto exato da Narração Limpa com os timestamps retornados pela AssemblyAI.
   * Regra absoluta: o texto exibido na legenda é SEMPRE o da Narração Limpa.
   * Da AssemblyAI são aproveitados exclusivamente os tempos (start e end).
   * Se o alinhamento falhar em algum trecho, interpola os tempos linearmente.
   *
   * @param {Array<{text: string, start: number, end: number}>} wordsAssembly
   * @param {string} textoNarracaoLimpa
   * @param {number} duracaoTotalSegundos
   * @returns {string} Conteúdo SRT completo com as palavras exatas da Narração Limpa
   */
  function alinharLegendaComTextoLimpo(wordsAssembly, textoNarracaoLimpa, duracaoTotalSegundos) {
    if (!textoNarracaoLimpa || typeof textoNarracaoLimpa !== 'string' || !textoNarracaoLimpa.trim()) {
      return '';
    }

    // Extrai palavras originais da Narração Limpa preservando grafia, pontuação e caixa
    const palavrasOriginais = (textoNarracaoLimpa.match(/\S+/g) || []).map(p => ({
      textoOriginal: p,
      norm: normalizarPalavraParaMatch(p),
      startMs: null,
      endMs: null
    }));

    if (palavrasOriginais.length === 0) return '';

    const duracaoMsTotal = Math.max(1000, Math.round((Number(duracaoTotalSegundos) || 0) * 1000));
    const wordsAI = Array.isArray(wordsAssembly) ? wordsAssembly.map(w => ({
      text: w.text || '',
      norm: normalizarPalavraParaMatch(w.text || ''),
      start: Number(w.start) || 0,
      end: Number(w.end) || 0
    })) : [];

    // Alinhamento sequencial por similaridade
    let aiIndex = 0;
    for (let origIdx = 0; origIdx < palavrasOriginais.length; origIdx++) {
      const orig = palavrasOriginais[origIdx];
      if (aiIndex >= wordsAI.length) break;

      // Busca na janela próxima da IA (até 6 palavras à frente)
      let matchIdx = -1;
      for (let look = 0; look < 6 && (aiIndex + look) < wordsAI.length; look++) {
        const aiCandidate = wordsAI[aiIndex + look];
        if (orig.norm === aiCandidate.norm) {
          matchIdx = aiIndex + look;
          break;
        }
        // Match aproximado se tiver pelo menos 3 caracteres e prefixo idêntico
        if (orig.norm.length >= 3 && aiCandidate.norm.length >= 3) {
          if (orig.norm.startsWith(aiCandidate.norm.slice(0, 3)) || aiCandidate.norm.startsWith(orig.norm.slice(0, 3))) {
            matchIdx = aiIndex + look;
            break;
          }
        }
      }

      if (matchIdx !== -1) {
        orig.startMs = wordsAI[matchIdx].start;
        orig.endMs = wordsAI[matchIdx].end;
        aiIndex = matchIdx + 1;
      }
    }

    // Interpolação de tempos para palavras que não deram match direto (REGRA 3: NUNCA usar texto da transcrição)
    let ultimoTempoConhecido = 0;
    for (let i = 0; i < palavrasOriginais.length; i++) {
      if (palavrasOriginais[i].startMs === null) {
        // Encontra o próximo tempo conhecido
        let proxTempoConhecido = duracaoMsTotal;
        let proximoIndice = palavrasOriginais.length;
        for (let k = i + 1; k < palavrasOriginais.length; k++) {
          if (palavrasOriginais[k].startMs !== null) {
            proxTempoConhecido = palavrasOriginais[k].startMs;
            proximoIndice = k;
            break;
          }
        }

        const qtdSemTempo = proximoIndice - i;
        const deltaMs = Math.max(100, (proxTempoConhecido - ultimoTempoConhecido) / (qtdSemTempo + 1));

        for (let j = i; j < proximoIndice; j++) {
          palavrasOriginais[j].startMs = Math.round(ultimoTempoConhecido + (j - i + 1) * deltaMs * 0.95);
          palavrasOriginais[j].endMs = Math.round(palavrasOriginais[j].startMs + Math.min(600, deltaMs));
        }
        i = proximoIndice - 1;
      } else {
        ultimoTempoConhecido = palavrasOriginais[i].endMs || palavrasOriginais[i].startMs;
      }
    }

    // Agrupamento em blocos SRT (máximo 7 palavras por bloco ou quebra antecipada em pontuação terminal)
    const MAX_WORDS_PER_BLOCK = 7;
    const srtBlocks = [];
    let blockIndex = 1;
    let idx = 0;

    while (idx < palavrasOriginais.length) {
      const blockStartMs = palavrasOriginais[idx].startMs;
      const blockWords = [];

      while (idx < palavrasOriginais.length && blockWords.length < MAX_WORDS_PER_BLOCK) {
        const item = palavrasOriginais[idx];
        blockWords.push(item.textoOriginal);
        idx++;

        // Quebra antecipada ao detectar fim de frase (. ? !)
        const limpa = item.textoOriginal.replace(/['"»)\]]+$/, '');
        if (/[.?!]$/.test(limpa)) break;
      }

      const blockEndMs = Math.max(blockStartMs + 200, palavrasOriginais[idx - 1].endMs);

      srtBlocks.push(
        `${blockIndex}\n` +
        `${formatarTempoSrt(blockStartMs / 1000)} --> ${formatarTempoSrt(blockEndMs / 1000)}\n` +
        `${blockWords.join(' ')}`
      );
      blockIndex++;
    }

    return srtBlocks.join('\n\n') + '\n';
  }

  /**
   * Junta os SRT das partes do áudio: desloca os tempos pela duração acumulada das partes anteriores e renumera.
   * @param {{srt:string, duracaoSegundos:number}[]} partes
   */
  function juntarSrtDasPartes(partes) {
    let deslocamento = 0;
    let numero = 1;
    const blocosFinais = [];
    for (const parte of partes) {
      const blocos = String(parte.srt || '').trim().split(/\n\s*\n/).filter(Boolean);
      for (const bloco of blocos) {
        const linhas = bloco.split('\n').map(l => l.trim());
        const idxTempo = linhas.findIndex(l => l.includes('-->'));
        if (idxTempo === -1) continue;
        const m = linhas[idxTempo].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
        if (!m) continue;
        const ini = paraSegundos(m[1], m[2], m[3], m[4]) + deslocamento;
        const fim = paraSegundos(m[5], m[6], m[7], m[8]) + deslocamento;
        const texto = linhas.slice(idxTempo + 1).join('\n');
        blocosFinais.push(`${numero++}\n${formatarTempoSrt(ini)} --> ${formatarTempoSrt(fim)}\n${texto}`);
      }
      deslocamento += Number(parte.duracaoSegundos) || 0;
    }
    return blocosFinais.join('\n\n') + '\n';
  }

  /** Fim (em segundos) da última legenda de um SRT; usado se a duração do MP3 não puder ser lida. */
  function ultimoFimDoSrt(srt) {
    let ultimo = 0;
    const re = /-->\s*(\d+):(\d+):(\d+)[,.](\d+)/g;
    let m;
    while ((m = re.exec(String(srt || ''))) !== null) ultimo = Math.max(ultimo, paraSegundos(m[1], m[2], m[3], m[4]));
    return ultimo;
  }

  return {
    ultimoFimDoSrt,
    formatarTempoSrt,
    juntarSrtDasPartes,
    alinharLegendaComTextoLimpo,
    normalizarPalavraParaMatch,
    contarPalavras,
    calcularDuracaoEsperada,
    validarDuracaoParte,
    calibrarVelocidade,
    LIMITE_RESPOSTA_BYTES,
    PALAVRAS_POR_MINUTO,
    MAX_CHARS_POR_PARTE,
    estimarMp3,
    dividirTextoEmPartes,
    removerId3,
    juntarMp3
  };
});
