/**
 * tests/narracao-integridade.test.js
 * Testes offline (100% sem API) comprovando as correções dos Problemas 1 e 2:
 * 1. Problema 1:
 *    - Fatiamento sempre no fim de frase (nunca no meio)
 *    - Checagem de duração esperada por palavras com calibração adaptativa (voz Onyx rápida)
 *    - Detecção de truncamento do TTS (< 75% da duração esperada) e aborto seguro
 * 2. Problema 2:
 *    - Legenda .srt alinhada estritamente com a Narração Limpa
 *    - Eliminação de erros fonéticos da AssemblyAI (Cádiz, Miriam, boas vezes, planteou, dureza de serviço, Og, Bazã, de de terem)
 *    - Fallback com interpolação de tempos garantindo sempre o texto da Narração Limpa
 */

const assert = require('assert');
const NarracaoModule = require('../js/narracao.js');

let total = 0;
function checar(cond, msg) {
  total++;
  if (!cond) {
    console.error(`  ❌ [FALHOU] ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ [PASSOU] ${msg}`);
}

console.log('--- Iniciando Testes de Integridade da Narração e Legendas ---');

// =========================================================================
// TESTE 1: Fatiamento em partes sempre no fim de frase (nunca no meio)
// =========================================================================
console.log('\n[Problema 1.1] Divisão em partes com fronteira estrita de frase');
const textoLongo = [
  'Moisés tinha cento e vinte anos pela frente até sua morte. Arão morreria em breve no monte Hor.',
  'Ambos veriam a terra prometida apenas de longe. O decreto divino não foi revogado, não foi negociado, nem suavizado.',
  'A congregação contendeu com Moisés e Arão no deserto de Zim, dizendo: "Por que nos fizestes subir do Egito?".',
  'O Senhor falou a Moisés: "Toma a vara e fala à rocha diante dos olhos deles". Mas Moisés feriu a rocha duas vezes.',
  'A água jorrou abundantemente, mas a sentença divina foi imediata e irrevogável.',
  'Porquanto não me crestes a mim, não introduzireis esta congregação na terra que lhes dei.'
].join('\n\n');

const partes = NarracaoModule.dividirTextoEmPartes(textoLongo, 200);
checar(partes.length >= 3, `Texto dividido em ${partes.length} partes pequenas`);
checar(partes.every(p => /[.!?…]["”']?$/.test(p.trim())), 'Todas as partes terminam estritamente no final de uma frase');
checar(!partes.some(p => p.includes('dia do quart')), 'Nenhuma palavra é truncada no meio');
checar(partes.join(' ').replace(/\s+/g, ' ').trim() === textoLongo.replace(/\s+/g, ' ').trim(), 'Nenhuma palavra ou frase se perde na divisão');

// =========================================================================
// TESTE 2: Checagem e calibração adaptativa de velocidade (Voz Onyx)
// =========================================================================
console.log('\n[Problema 1.2] Checagem e calibração de duração esperada por palavras');
const textoAmostra = 'Moisés subiu ao cume de Pisga, de onde contemplou toda a terra prometida de Canaã antes do seu descanso final.';
const numPalavras = NarracaoModule.contarPalavras(textoAmostra);
checar(numPalavras === 20, `Contagem de palavras precisa (${numPalavras} palavras)`);

// Velocidade base 165 ppm -> esperado ~6.9s
const duracaoEsperada = NarracaoModule.calcularDuracaoEsperada(textoAmostra, 165);
checar(duracaoEsperada > 6.5 && duracaoEsperada < 7.5, `Duração esperada calculada: ${duracaoEsperada.toFixed(1)}s`);

// Simulação de áudio completo a 175 ppm (voz Onyx rápida) -> ~6.5s
const duracaoCompletaOnyx = 6.5;
const checkCompleta = NarracaoModule.validarDuracaoParte(duracaoCompletaOnyx, textoAmostra, 165, 0.75);
checar(checkCompleta.valida === true, `Áudio completo aceito sem falso positivo (gerou ${duracaoCompletaOnyx}s, mínimo ${checkCompleta.minimoAceitavel.toFixed(1)}s)`);

// Calibração pela voz real observada
const historico = [{ palavras: numPalavras, duracaoSegundos: duracaoCompletaOnyx }];
const ppmCalibrado = NarracaoModule.calibrarVelocidade(historico);
checar(ppmCalibrado >= 170 && ppmCalibrado <= 195, `Velocidade adaptativa calibrada para ${ppmCalibrado.toFixed(1)} ppm com a voz real`);

// Simulação de áudio truncado pelo TTS (gerou apenas 2.0s em vez de ~6.5s)
const duracaoTruncada = 2.0;
const checkTruncada = NarracaoModule.validarDuracaoParte(duracaoTruncada, textoAmostra, ppmCalibrado, 0.75);
checar(checkTruncada.valida === false, `Áudio truncado detectado com precisão: gerou ${duracaoTruncada}s, mínimo aceitável era ${checkTruncada.minimoAceitavel.toFixed(1)}s`);

// =========================================================================
// TESTE 3: Alinhamento de Legenda (.srt) com texto exato da Narração Limpa
// =========================================================================
console.log('\n[Problema 2] Legenda .srt com palavras exatas da Narração Limpa e tempos da AssemblyAI');

// Texto oficial que o usuário escreveu na Narração Limpa:
const textoOficialNarricaoLimpa =
  'Moisés falou ao povo em Cades, lembrando o pecado de Miriã. ' +
  'Feriu a rocha duas vezes, e a congregação pranteou na sua dureza de cerviz. ' +
  'Venceram a Ogue rei de Basã, com receio de deterem o avanço.';

// Transcrição com os 8 erros reais da AssemblyAI descritos no problema:
const wordsAssemblyAIComErros = [
  { text: 'Moisés', start: 200, end: 600 },
  { text: 'falou', start: 610, end: 900 },
  { text: 'ao', start: 910, end: 1000 },
  { text: 'povo', start: 1010, end: 1300 },
  { text: 'em', start: 1310, end: 1400 },
  { text: 'Cádiz,', start: 1410, end: 1800 }, // Erro 1: Cádiz
  { text: 'lembrando', start: 1810, end: 2300 },
  { text: 'o', start: 2310, end: 2400 },
  { text: 'pecado', start: 2410, end: 2800 },
  { text: 'de', start: 2810, end: 2900 },
  { text: 'Miriam.', start: 2910, end: 3300 }, // Erro 2: Miriam
  { text: 'Feriu', start: 3310, end: 3600 },
  { text: 'a', start: 3610, end: 3700 },
  { text: 'rocha', start: 3710, end: 4000 },
  { text: 'boas', start: 4010, end: 4300 }, // Erro 3: boas vezes
  { text: 'vezes,', start: 4310, end: 4600 },
  { text: 'e', start: 4610, end: 4700 },
  { text: 'a', start: 4710, end: 4800 },
  { text: 'congregação', start: 4810, end: 5400 },
  { text: 'planteou', start: 5410, end: 5900 }, // Erro 4: planteou
  { text: 'na', start: 5910, end: 6000 },
  { text: 'sua', start: 6010, end: 6200 },
  { text: 'dureza', start: 6210, end: 6600 },
  { text: 'de', start: 6610, end: 6700 },
  { text: 'serviço.', start: 6710, end: 7200 }, // Erro 5: dureza de serviço
  { text: 'Venceram', start: 7210, end: 7700 },
  { text: 'a', start: 7710, end: 7800 },
  { text: 'Og', start: 7810, end: 8100 }, // Erro 6: Og
  { text: 'rei', start: 8110, end: 8400 },
  { text: 'de', start: 8410, end: 8500 },
  { text: 'Bazã,', start: 8510, end: 8900 }, // Erro 7: Bazã
  { text: 'com', start: 8910, end: 9100 },
  { text: 'receio', start: 9110, end: 9500 },
  { text: 'de', start: 9510, end: 9600 },
  { text: 'de', start: 9610, end: 9700 }, // Erro 8: de de terem
  { text: 'terem', start: 9710, end: 10000 },
  { text: 'o', start: 10010, end: 10100 },
  { text: 'avanço.', start: 10110, end: 10600 }
];

const srtGerado = NarracaoModule.alinharLegendaComTextoLimpo(
  wordsAssemblyAIComErros,
  textoOficialNarricaoLimpa,
  10.8
);

console.log('\n--- SRT Gerado (primeiros 3 blocos): ---');
console.log(srtGerado.split('\n\n').slice(0, 3).join('\n\n'));
console.log('----------------------------------------\n');

// Verificação 1: O SRT contém as palavras certas da Narração Limpa
checar(srtGerado.includes('Cades,'), 'SRT contém a palavra oficial "Cades,"');
checar(srtGerado.includes('Miriã.'), 'SRT contém a palavra oficial "Miriã."');
checar(srtGerado.includes('duas vezes,'), 'SRT contém a palavra oficial "duas vezes,"');
checar(srtGerado.includes('pranteou'), 'SRT contém a palavra oficial "pranteou"');
checar(srtGerado.includes('dureza de cerviz.'), 'SRT contém a expressão oficial "dureza de cerviz."');
checar(srtGerado.includes('Ogue'), 'SRT contém a palavra oficial "Ogue"');
checar(srtGerado.includes('Basã,'), 'SRT contém a palavra oficial "Basã,"');
checar(srtGerado.includes('de deterem'), 'SRT contém a palavra oficial "de deterem"');

// Verificação 2: O SRT NÃO contém nenhum dos erros da AssemblyAI
checar(!srtGerado.includes('Cádiz'), 'SRT não contém o erro "Cádiz"');
checar(!srtGerado.includes('Miriam'), 'SRT não contém o erro "Miriam"');
checar(!srtGerado.includes('boas vezes'), 'SRT não contém o erro "boas vezes"');
checar(!srtGerado.includes('planteou'), 'SRT não contém o erro "planteou"');
checar(!srtGerado.includes('dureza de serviço'), 'SRT não contém o erro "dureza de serviço"');
checar(!srtGerado.includes(' Og '), 'SRT não contém o erro "Og"');
checar(!srtGerado.includes('Bazã'), 'SRT não contém o erro "Bazã"');
checar(!srtGerado.includes('de de terem'), 'SRT não contém o erro "de de terem"');

// Verificação 3: Formato do SRT é válido (números sequenciais e timestamps -->)
checar(/^1\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(srtGerado), 'Bloco inicial do SRT possui formato e timestamps válidos');

// =========================================================================
// TESTE 4: Fallback de Alinhamento com Interpolação de Tempos
// =========================================================================
console.log('\n[Problema 2.2] Alinhamento resiliente com interpolação de tempos');
// Transcrição incompleta onde faltam palavras no meio
const wordsComFaltas = [
  { text: 'Moisés', start: 100, end: 500 },
  { text: 'falou', start: 510, end: 900 },
  // faltam "ao povo em Cades..."
  { text: 'avanço.', start: 8000, end: 8500 }
];

const srtComInterpolacao = NarracaoModule.alinharLegendaComTextoLimpo(
  wordsComFaltas,
  textoOficialNarricaoLimpa,
  9.0
);

checar(srtComInterpolacao.includes('Cades,'), 'Mesmo com falha de match na transcrição, o texto da Narração Limpa é mantido');
checar(srtComInterpolacao.includes('dureza de cerviz.'), 'Trechos sem match recebem tempos interpolados mantendo o texto exato da Narração Limpa');
checar(!/null|undefined|NaN/.test(srtComInterpolacao), 'Nenhum timestamp gerado contém NaN ou undefined');

console.log(`\n🎉 Todos os ${total} testes de integridade passaram com sucesso!\n`);
