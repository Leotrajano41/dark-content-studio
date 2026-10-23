// js/pontuacao.js — normalização ÚNICA de aspas e pontuação (usada pelo roteiro, pela Narração Limpa e pelo Catálogo)
// Antes havia duas implementações diferentes (index.html e js/catalogo.js). Funciona no navegador (PontuacaoModule) e no Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PontuacaoModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Aspas: distingue ABERTURA de FECHAMENTO.
   * - abertura: espaço antes (inclusive depois de dois-pontos) e NENHUM espaço depois;
   * - fechamento: nenhum espaço antes e um espaço depois quando seguido de palavra.
   */
  function normalizarEspacosDeAspas(linha) {
    if (!/["“”«»]/.test(linha)) return linha;
    const usarParidade = ((linha.match(/"/g) || []).length % 2) === 0;
    const chars = Array.from(linha);
    let out = '';
    let abertas = false;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      let abre;
      if (c === '“' || c === '«') {
        abre = true;
      } else if (c === '”' || c === '»') {
        abre = false;
      } else if (c === '"') {
        if (usarParidade) {
          abre = !abertas;
        } else {
          const ant = out.slice(-1);
          abre = !ant || /[\s(\[¿—–:]/.test(ant);
        }
      } else {
        out += c;
        continue;
      }
      abertas = abre;
      if (abre) {
        if (out && !/[\s(\[¿—–]$/.test(out)) out += ' ';
        out += c;
        while (i + 1 < chars.length && /[^\S\r\n]/.test(chars[i + 1])) i++;
      } else {
        out = out.replace(/[^\S\r\n]+$/, '');
        out += c;
        const prox = chars[i + 1];
        if (prox && /[\p{L}\p{N}(]/u.test(prox)) out += ' ';
      }
    }
    return out;
  }

  /** Pontuação solta: ponto duplicado, ". .", ";.", ",.", "!.", ponto depois de aspas + minúscula... Nunca mexe em "...". */
  function limparPontuacaoSolta(texto) {
    return texto
      // "outra".. -> "outra".   |   "!. -> "!   |   !". -> !"   |   ?". -> ?"
      .replace(/(["”»])\.\.(?!\.)/g, '$1.')
      .replace(/(["”»][!?])\.(?!\.)/g, '$1')
      .replace(/([!?]["”»])\.(?!\.)/g, '$1')
      // ponto SOLTO depois de aspas de fechamento seguido de palavra minúscula: implacável". sobe -> implacável" sobe
      .replace(/(["”»])\.[^\S\r\n]+(?=\p{Ll})/gu, '$1 ')
      // espaço depois da pontuação que vem colada nas aspas: ".Depois / ",e
      .replace(/(["”»][.!?;:,])(?=[\p{L}\p{N}])/gu, '$1 ')
      // sequência de pontos ("feriu. . a rocha", ".."): vira um ponto; as reticências "..." (e 4+ pontos coladas) viram "..."
      .replace(/\.(?:[^\S\r\n]*\.)+/g, (m) => {
        if (/\s/.test(m)) return '.';
        const n = m.length;
        return n >= 3 ? '...' : '.';
      })
      // vírgula, ponto e vírgula ou dois-pontos colados antes do ponto final: ";." ",." ":." -> "."
      .replace(/[,;:][^\S\r\n]*\.(?!\.)/g, '.')
      // "!." e "?." -> "!" e "?"
      .replace(/([!?])[^\S\r\n]*\.(?!\.)/g, '$1')
      // vírgulas ou pontos e vírgulas repetidos
      .replace(/([,;])(?:[^\S\r\n]*\1)+/g, '$1')
      // espaço antes da pontuação (não mexe no que está antes de letra, p. ex. "3 : 5")
      .replace(/[^\S\r\n]+([.,;:!?])(?=[^\S\r\n]|$|["”»])/g, '$1');
  }

  function normalizarAspasEPontuacao(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const comAspas = texto.split('\n').map(normalizarEspacosDeAspas).join('\n');
    // duas passadas: uma regra pode expor outra (ex.: '" . . e' -> '". e' -> '" e')
    return limparPontuacaoSolta(limparPontuacaoSolta(comAspas));
  }

  return { normalizarAspasEPontuacao, normalizarEspacosDeAspas, limparPontuacaoSolta };
});
