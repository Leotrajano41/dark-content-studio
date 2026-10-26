// js/cronologia.js — cronologia bíblica de referência (Êxodo a Deuteronômio) e detector de intervalos de tempo (ITEM 44)
// Regra do projeto: NUNCA afirmar intervalos de tempo (anos, décadas, séculos) que o texto bíblico não traz.
// Funciona no navegador (CronologiaModule) e no Node (testes offline).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CronologiaModule = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const LINHA_DO_TEMPO = `LINHA DO TEMPO DE REFERÊNCIA (Êxodo a Deuteronômio; serve para NÃO errar intervalos):
- 1º ano: saída do Egito (Êxodo 12; Números 33:3), Mar Vermelho, chegada ao Sinai no 3º mês (Êxodo 19:1).
- 2º ano: tabernáculo erguido no 1º dia do 1º mês (Êxodo 40:17); Nadabe e Abiú morrem na consagração (Levítico 10); censo no Sinai no 1º dia do 2º mês (Números 1:1); partida do Sinai no 20º dia do 2º mês (Números 10:11); espias e rebelião em Cades-Barneia, com a sentença dos 40 anos (Números 13 e 14).
- Do 2º ao 40º ano: peregrinação no deserto; 38 anos de Cades-Barneia até o ribeiro de Zerede (Deuteronômio 2:14). Corá (Números 16) vem depois da rebelião dos espias.
- 40º ano: Números 20 inteiro (Miriã morre em Cades no 1º mês, Números 20:1; Meribá, Números 20:2-13; Arão morre no monte Hor no 1º dia do 5º mês do ano 40, Números 33:38), a serpente de bronze e as vitórias sobre Seom e Ogue (Números 21), e os discursos de Deuteronômio, que começam no 1º dia do 11º mês do ano 40 (Deuteronômio 1:3).
- Moisés morre aos 120 anos, depois dos discursos (Deuteronômio 34:7); o luto dura 30 dias (Deuteronômio 34:8).
REGRA: Números 20 e Deuteronômio são do MESMO ano (o 40º): nunca escreva "anos depois" ou "décadas depois" entre eles. Para eventos que não estão nesta lista, não diga quantos anos, décadas ou séculos passaram entre eles: use "depois" ou o dado literal do texto.`;

  const REGRA_INTERVALOS = 'PROIBIDO afirmar intervalos de tempo (anos, décadas, séculos, "anos depois", "anos pela frente") que o texto bíblico citado não traz. Use "depois", "mais tarde" ou o dado literal do texto. Não calcule idades nem datas que a Escritura não dá.';

  // Intervalos de tempo longos (anos/décadas/séculos). "dias/meses depois" ficam de fora: são comuns e muitos são literais do texto.
  const REGEX_INTERVALOS = [
    /(?<![\p{L}])(?:anos|d[ée]cadas|s[ée]culos)\s+(?:depois|mais\s+tarde|ap[óo]s|antes|atr[áa]s|pela\s+frente|de\s+dist[âa]ncia)(?![\p{L}])/iu,
    /(?<![\p{L}])depois\s+de\s+(?:[\p{L}]+\s+){0,3}(?:anos|d[ée]cadas|s[ée]culos)(?![\p{L}])/iu
  ];

  // Eventos agrupados pelo período em que ACONTECERAM (cada grupo = mesmo ano, segundo a linha do tempo)
  const PERIODOS = [
    {
      id: '40º ano',
      eventos: [
        { id: 'Meribá', re: /(?<![\p{L}])(?:Merib[áa]|Merib[áa]-Cades|[ÁA]guas\s+de\s+Merib[áa]|Números\s+20|Nm\s*20|Miri[ãa]\s+morreu|morte\s+de\s+Miri[ãa])(?![\p{L}])/iu },
        { id: 'monte Hor', re: /(?<![\p{L}])(?:monte\s+Hor|morte\s+de\s+Ar[ãa]o|Ar[ãa]o\s+morreu)(?![\p{L}])/iu },
        { id: 'serpente de bronze', re: /(?<![\p{L}])serpente\s+de\s+bronze(?![\p{L}])/iu },
        { id: 'Seom e Ogue', re: /(?<![\p{L}])(?:Seom|Ogue)(?![\p{L}])/u },
        { id: 'Deuteronômio', re: /(?<![\p{L}])(?:Deuteron[ôo]mio|planície\s+de\s+Moabe|monte\s+Nebo|Pisga|discursos?\s+de\s+Mois[ée]s)(?![\p{L}])/iu }
      ]
    },
    {
      id: '2º ano',
      eventos: [
        { id: 'Nadabe e Abiú', re: /(?<![\p{L}])(?:Nadabe|Abi[úu]|fogo\s+estranho|Lev[íi]tico\s+10)(?![\p{L}])/iu },
        { id: 'espias', re: /(?<![\p{L}])(?:espias|Cades-Barneia|N[úu]meros\s+1[34])(?![\p{L}])/iu },
        { id: 'tabernáculo', re: /(?<![\p{L}])(?:tabern[áa]culo\s+(?:foi\s+)?erguido|censo\s+do\s+Sinai)(?![\p{L}])/iu }
      ]
    },
    {
      id: '1º ano',
      eventos: [
        { id: 'saída do Egito', re: /(?<![\p{L}])(?:sa[íi]da\s+do\s+Egito|Mar\s+Vermelho|travessia\s+do\s+mar|primeira\s+P[áa]scoa|pragas\s+do\s+Egito)(?![\p{L}])/iu },
        { id: 'bezerro de ouro', re: /(?<![\p{L}])bezerro\s+de\s+ouro(?![\p{L}])/iu }
      ]
    }
  ];

  const dividirFrases = (t) => String(t || '').match(/[^.!?]+(?:[.!?]+["”']?)?/g) || [];
  const temIntervalo = (frase) => REGEX_INTERVALOS.some(r => r.test(String(frase || '').replace(/["“«][^"”»]*["”»]/g, ' ')));

  /** Frases com intervalo de tempo longo ("anos depois", "cento e vinte anos pela frente"): servem de aviso para revisão manual. */
  function detectarIntervalos(texto) {
    const achados = [];
    String(texto || '').split(/\n\s*\n/).forEach(par => {
      dividirFrases(par).forEach(f => { if (temIntervalo(f)) achados.push({ frase: f.trim() }); });
    });
    return achados;
  }

  /**
   * Conflito de cronologia: frase com intervalo de tempo ("anos depois") ligando eventos que, pela linha do tempo,
   * aconteceram no MESMO período (ex.: Meribá, em Números 20, e Deuteronômio: ambos no 40º ano).
   */
  function detectarConflitos(texto) {
    const conflitos = [];
    String(texto || '').split(/\n\s*\n/).forEach(par => {
      const frases = dividirFrases(par);
      frases.forEach((f, i) => {
        if (!temIntervalo(f)) return;
        for (const per of PERIODOS) {
          const idsNoParagrafo = new Set(per.eventos.filter(e => e.re.test(par)).map(e => e.id));
          const vizinhas = [frases[i - 1], f, frases[i + 1]].filter(Boolean).join(' ');
          const idsPerto = per.eventos.filter(e => e.re.test(vizinhas)).map(e => e.id);
          if (idsNoParagrafo.size >= 2 && idsPerto.length >= 1) {
            conflitos.push({
              frase: f.trim(),
              periodo: per.id,
              eventos: [...idsNoParagrafo],
              motivo: `A frase afirma que passou tempo ("anos depois"), mas ${[...idsNoParagrafo].join(' e ')} aconteceram no mesmo período (${per.id}).`
            });
            return;
          }
        }
      });
    });
    return conflitos;
  }

  return { LINHA_DO_TEMPO, REGRA_INTERVALOS, REGEX_INTERVALOS, PERIODOS, temIntervalo, detectarIntervalos, detectarConflitos };
});
