// js/regras-conteudo.js — detectores em CÓDIGO das regras de conteúdo (itens 25, 26 e 27 da auditoria)
//  a) interpretação/costume sempre com marcador de contexto, nunca atribuído a "as Escrituras registram"/"o texto diz"
//  b) sem absolutos históricos ("exclusivamente", "qualquer líder", "precisão absoluta") nem cenas inventadas
//  e) toda citação entre aspas com a referência (Livro c:v)
//  i) marcadores de contexto variados (a lista de marcadores é compartilhada com o variador de marcadores)
// Detectores só LOCALIZAM frases. Quem corrige é a IA (a frase inteira é reescrita; nunca troca de palavra).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RegrasModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const L = '(?<![\\p{L}])';
  const R = '(?![\\p{L}])';
  const rx = (src) => new RegExp(src, 'iu');

  // Marcadores de contexto (o mais específico primeiro)
  const MARCADORES = [
    { id: 'muitos estudiosos explicam', re: rx(`${L}muitos\\s+estudiosos\\s+(?:explicam|apontam|entendem|observam|veem|defendem)${R}`) },
    { id: 'segundo historiadores', re: rx(`${L}segundo\\s+(?:os\\s+)?historiadores${R}`) },
    { id: 'historiadores observam', re: rx(`${L}historiadores\\s+(?:observam|explicam|apontam|notam)${R}`) },
    { id: 'segundo estudiosos', re: rx(`${L}segundo\\s+(?:os\\s+)?estudiosos${R}`) },
    { id: 'estudiosos observam', re: rx(`${L}estudiosos(?:\\s+d[oa]s?\\s+\\p{L}+(?:\\s+\\p{L}+){0,2})?\\s+(?:explicam|apontam|observam|notam|entendem|veem)${R}`) },
    { id: 'naquela cultura', re: rx(`${L}(?:naquela\\s+cultura|naquele\\s+contexto\\s+cultural|naquela\\s+sociedade)${R}`) },
    { id: 'naquele tempo', re: rx(`${L}(?:naquele\\s+tempo|naqueles\\s+dias|naquele\\s+contexto)${R}`) },
    { id: 'na época', re: rx(`${L}(?:na|naquela|[àa])\\s+[eé]poca${R}`) }
  ];

  const foraDeAspas = (t) => String(t || '').replace(/["“«][^"”»]*["”»]/g, ' ');
  const dividirFrases = (t) => String(t || '').match(/[^.!?]+(?:[.!?]+["”']?)?/g) || [];

  function marcadorDeContexto(frase) {
    const fora = foraDeAspas(frase);
    for (const m of MARCADORES) if (m.re.test(fora)) return m.id;
    return '';
  }

  // Frases que contam um COSTUME ou uma INTERPRETAÇÃO ("era costume", "simbolizava", "representava", "era sinal de")
  const CUE_COSTUME = rx(`${L}(?:(?:era|eram|foi|é|são)\\s+(?:costume|comum|habitual|tradi[cç][aã]o|considerad[oa]s?|vist[oa]s?\\s+como|entendid[oa]s?\\s+como|sinal\\s+de|s[íi]mbolo\\s+de|sin[ôo]nimo\\s+de)|costumava|costumavam|simboliz(?:ava|avam|a|am)|representava|representavam|significava|significavam|equivalia|equivaliam)${R}`);

  // "As Escrituras registram / o texto diz / a Bíblia diz ..."
  const ATRIBUICAO = rx(`${L}(?:as\\s+(?:sagradas\\s+)?escrituras\\s+(?:registram|dizem|afirmam|declaram|ensinam|mostram)|a\\s+(?:b[ií]blia|escritura)\\s+(?:diz|registra|afirma|declara|ensina)|o\\s+(?:texto|texto\\s+b[ií]blico|relato)\\s+(?:diz|afirma|registra|declara|ensina))${R}`);

  const ABSOLUTOS = rx(`${L}(?:exclusivamente|absolut[oa]s?|absolutamente|em\\s+hip[óo]tese\\s+alguma)${R}|${L}(?:qualquer|nenhum[a]?|todos?\\s+os|todas?\\s+as)\\s+(?:l[íi]der(?:es)?|judeu(?:s)?|romano(?:s)?|homem|homens|pessoa|pessoas|cidad[aã]o|israelita(?:s)?|fariseu(?:s)?|soldado(?:s)?|rei(?:s)?|povo(?:s)?|cultura(?:s)?|sociedade)${R}|${L}sempre\\s+(?:foi|era|fizeram|faziam)${R}|${L}nunca\\s+(?:foi|era|houve|existiu)${R}`);

  const CENAS = rx(`${L}(?:seu|sua|seus|suas)\\s+(?:cora[cç][aã]o|olhos|m[aã]os|voz|rosto|l[aá]bios|pernas|joelhos)\\s+(?:tremi\\p{L}*|disparou|bateu|ard\\p{L}*|fraquej\\p{L}*|falhou|embargou)|${L}suor\\s+(?:escorr\\p{L}*|frio)|${L}l[aá]grimas?\\s+(?:escorr\\p{L}*|rolar\\p{L}*)|${L}um\\s+murm[uú]rio\\s+percorr\\p{L}*|${L}o\\s+sil[eê]ncio\\s+(?:pesado|ensurdecedor|tomou)|${L}ningu[eé]m\\s+ousou|${L}o\\s+ar\\s+(?:pesado|ficou\\s+pesado)|${L}o\\s+vento\\s+uivou|${L}poeira\\s+(?:subia|levantou)|${L}ao\\s+longe,?\\s+(?:ouvia|ecoava)`);

  const REFERENCIA = /\(?\s*(?:[1-3]\s*)?[A-ZÁÂÃÉÊÍÓÔÕÚÇ][\p{L}]+(?:\s+[A-ZÁÂÃÉÊÍÓÔÕÚÇ][\p{L}]+)?\s+\d+[:.]\d+(?:[-–]\d+)?/u;

  function varrerFrases(texto, testar) {
    const achados = [];
    String(texto || '').split(/\n\s*\n/).forEach((par, pIdx) => {
      const frases = dividirFrases(par);
      frases.forEach((f, i) => {
        const motivo = testar(f, frases, i);
        if (motivo) achados.push({ frase: f.trim(), paragrafo: pIdx, motivo });
      });
    });
    return achados;
  }

  /** Costume/interpretação SEM marcador de contexto (nem na frase nem nas vizinhas). */
  function detectarCostumeSemMarcador(texto) {
    return varrerFrases(texto, (f, frases, i) => {
      if (!CUE_COSTUME.test(foraDeAspas(f))) return '';
      const janela = [frases[i - 1], f, frases[i + 1]].filter(Boolean);
      if (janela.some(x => marcadorDeContexto(x))) return '';
      return 'costume ou interpretação sem marcador de contexto';
    });
  }

  /** "As Escrituras registram/o texto diz" antes de costume ou interpretação (não de citação literal). */
  function detectarAtribuicaoIndevida(texto) {
    return varrerFrases(texto, (f) => {
      if (!ATRIBUICAO.test(foraDeAspas(f))) return '';
      if (/["“«][^"”»]{12,}["”»]/.test(f)) return ''; // há citação literal na frase
      if (CUE_COSTUME.test(foraDeAspas(f)) || marcadorDeContexto(f)) return 'costume ou interpretação atribuído às Escrituras';
      return '';
    });
  }

  function detectarAbsolutos(texto) {
    return varrerFrases(texto, (f) => (ABSOLUTOS.test(foraDeAspas(f)) ? 'afirmação absoluta sem base no texto' : ''));
  }

  function detectarCenasInventadas(texto) {
    return varrerFrases(texto, (f) => (CENAS.test(foraDeAspas(f)) ? 'possível cena, ação ou emoção que o texto bíblico não registra' : ''));
  }

  /** Citação entre aspas (5+ palavras) sem a referência (Livro c:v) logo antes ou depois. */
  function detectarCitacoesSemReferencia(texto) {
    const achados = [];
    const re = /["“]([^"”]{10,600}?)["”]/g;
    const t = String(texto || '');
    let m;
    while ((m = re.exec(t)) !== null) {
      if ((m[1].match(/\S+/g) || []).length < 5) continue;
      const depois = t.slice(m.index + m[0].length, m.index + m[0].length + 80);
      const antes = t.slice(Math.max(0, m.index - 80), m.index);
      if (!REFERENCIA.test(depois) && !REFERENCIA.test(antes)) achados.push({ frase: m[0].slice(0, 120), motivo: 'citação sem referência' });
    }
    return achados;
  }

  return { MARCADORES, marcadorDeContexto, detectarCostumeSemMarcador, detectarAtribuicaoIndevida, detectarAbsolutos, detectarCenasInventadas, detectarCitacoesSemReferencia };
});
