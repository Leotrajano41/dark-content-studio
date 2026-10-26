// js/citacao.js — conferência do FIM de uma citação bíblica entre aspas (ITEM 43)
// Regra: a citação entre aspas deve terminar no fim de uma oração do versículo (pontuação do versículo ou fim dele).
// Se terminar no meio de uma oração, o texto é COMPLETADO com a redação do versículo (ARC) quando faltam poucas
// palavras; se faltarem muitas, as aspas devem ser retiradas. Funciona no navegador e no Node.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CitacaoModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX_EXTENSAO_PALAVRAS = 14;

  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fimDeOracao = (tokenCru) => /[.!?;:,]["”')\]]*$/.test(tokenCru);

  /**
   * @returns {{status:'ok'|'truncada'|'indeterminada', completada?:string|null, extensao?:number}}
   *  - 'indeterminada': a citação não aparece (palavra por palavra) no versículo: quem chama decide (ex.: trocar pela ARC)
   *  - 'truncada': termina no meio de uma oração; `completada` = texto do versículo até o fim da oração (ou null se
   *    faltam mais de MAX_EXTENSAO_PALAVRAS palavras: nesse caso o correto é tirar as aspas)
   */
  function analisarFimDaCitacao(versiculo, citacao, { maxExtensao = MAX_EXTENSAO_PALAVRAS } = {}) {
    const vCru = String(versiculo || '').trim().split(/\s+/).filter(Boolean);
    const itens = vCru.map((cru, i) => ({ cru, n: norm(cru), i })).filter(x => x.n);
    const cNorm = String(citacao || '').trim().split(/\s+/).map(norm).filter(Boolean);
    if (!itens.length || !cNorm.length) return { status: 'indeterminada' };

    let ini = -1;
    for (let s = 0; s + cNorm.length <= itens.length; s++) {
      let bate = true;
      for (let k = 0; k < cNorm.length; k++) { if (itens[s + k].n !== cNorm[k]) { bate = false; break; } }
      if (bate) { ini = s; break; }
    }
    if (ini === -1) return { status: 'indeterminada' };

    const fim = ini + cNorm.length - 1;
    const ultimo = itens[fim];
    if (fim === itens.length - 1 || fimDeOracao(ultimo.cru)) return { status: 'ok' };

    let b = fim + 1;
    while (b < itens.length - 1 && !fimDeOracao(itens[b].cru)) b++;
    const extensao = b - fim;
    if (extensao > maxExtensao) return { status: 'truncada', extensao, completada: null };
    const texto = itens.slice(ini, b + 1).map(x => x.cru).join(' ').replace(/[:;,]+(["”')\]]*)$/, '.$1');
    return { status: 'truncada', extensao, completada: texto };
  }

  return { MAX_EXTENSAO_PALAVRAS, analisarFimDaCitacao, fimDeOracao };
});
