// js/narracao.js — utilitários da narração em PARTES (ITEM 47)
// O Vercel limita a resposta de uma função a ~4,5 MB. Um roteiro Longo (~2.800 palavras, ~19 min) gera um MP3 de
// 8 a 20 MB (conforme o bitrate), então o áudio é pedido em partes pequenas e juntado no navegador.
// Funciona no navegador (window.NarracaoModule) e no Node (testes offline).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NarracaoModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LIMITE_RESPOSTA_BYTES = 4.5 * 1024 * 1024;
  const PALAVRAS_POR_MINUTO = 150;
  const MAX_CHARS_POR_PARTE = 3000; // ~500 palavras ≈ 3,3 min ≈ 3,2 MB mesmo a 128 kbps

  /** Tamanho esperado do MP3 a partir do número de palavras (duração) e do bitrate. Não chama nenhuma API. */
  function estimarMp3({ palavras, kbps = 128, palavrasPorMinuto = PALAVRAS_POR_MINUTO }) {
    const segundos = (palavras / palavrasPorMinuto) * 60;
    const bytes = segundos * kbps * 1000 / 8;
    return { segundos, bytes, mb: bytes / (1024 * 1024), passaDoLimite: bytes > LIMITE_RESPOSTA_BYTES };
  }

  /** Divide em partes de até maxChars, sempre no fim de parágrafo ou de frase (nunca no meio de uma frase). */
  function dividirTextoEmPartes(texto, maxChars = MAX_CHARS_POR_PARTE) {
    const partes = [];
    let atual = '';
    const fechar = () => { if (atual.trim()) partes.push(atual.trim()); atual = ''; };
    const paragrafos = String(texto || '').split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);

    const frasesDe = (p) => p.match(/[^.!?]+(?:[.!?]+["”']?)?\s*/g).map(f => f.trim()).filter(Boolean);

    for (const p of paragrafos) {
      const candidato = atual ? atual + '\n\n' + p : p;
      if (candidato.length <= maxChars) { atual = candidato; continue; }
      fechar();
      if (p.length <= maxChars) { atual = p; continue; }
      for (const f of frasesDe(p)) {
        const cand = atual ? atual + ' ' + f : f;
        if (cand.length <= maxChars) { atual = cand; continue; }
        fechar();
        atual = f; // frase maior que o limite vai inteira (melhor que cortar no meio)
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

  // ---- Legendas por partes (SRT) ----
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

  return { ultimoFimDoSrt, formatarTempoSrt, juntarSrtDasPartes, LIMITE_RESPOSTA_BYTES, PALAVRAS_POR_MINUTO, MAX_CHARS_POR_PARTE, estimarMp3, dividirTextoEmPartes, removerId3, juntarMp3 };
});
