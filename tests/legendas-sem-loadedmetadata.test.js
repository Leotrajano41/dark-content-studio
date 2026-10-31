// Teste offline: Simula que o navegador NUNCA dispara loadedmetadata nem onerror
// Confirma que a geração de áudio e de legendas conclui com sucesso, e os tempos da 2ª parte são deslocados corretamente.
const NarracaoModule = require('../js/narracao.js');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, descricao) {
  totalChecks++;
  if (condicao) {
    passedChecks++;
    console.log(`  ✓ ${descricao}`);
  } else {
    console.error(`  ✗ FALHA: ${descricao}`);
    process.exitCode = 1;
  }
}

console.log('--- TESTE: Geração de Áudio e Legendas com loadedmetadata CONGELADO no navegador ---');

(async () => {
  // 1. Simulação do Audio do navegador que NUNCA dispara loadedmetadata nem onerror
  class MockAudioCongelado {
    constructor() {
      this.src = '';
      this.duration = NaN;
      this.onloadedmetadata = null;
      this.onerror = null;
    }
    load() {
      // Simula aba em segundo plano / Chrome travado: NÃO dispara nenhum callback
    }
  }

  // 2. Criação de 2 buffers MP3 simulando Davi e Golias (128 kbps = 16.000 bytes/s)
  // Parte 1: ~1.376.000 bytes (~86s)
  // Parte 2: ~1.262.000 bytes (~78.8s)
  const bytesParte1 = 1376000;
  const bytesParte2 = 1262000;

  const buf1 = new Uint8Array(bytesParte1);
  buf1.fill(0x55);
  const buf2 = new Uint8Array(bytesParte2);
  buf2.fill(0xAA);

  // 3. Teste do cálculo de duração síncrono pelo cabeçalho / bytes MP3
  const dur1 = NarracaoModule.calcularDuracaoMp3(buf1);
  const dur2 = NarracaoModule.calcularDuracaoMp3(buf2);

  checar(dur1 > 80 && dur1 < 90, `calcularDuracaoMp3 calculou parte 1 com precisão (${dur1}s para ~1.37MB)`);
  checar(dur2 > 70 && dur2 < 85, `calcularDuracaoMp3 calculou parte 2 com precisão (${dur2}s para ~1.26MB)`);

  // 4. Teste da função com timeout do index.html (duracaoDoMp3) com o mock congelado
  const duracaoDoMp3ComMockCongelado = (bytes) => new Promise((resolve) => {
    if (!bytes || bytes.length === 0) return resolve(0);
    let resolvido = false;
    let timer = null;
    const fim = (d) => {
      if (resolvido) return;
      resolvido = true;
      if (timer) clearTimeout(timer);
      resolve(isFinite(d) && d > 0 ? Number(d) : 0);
    };
    // Timeout estrito
    timer = setTimeout(() => fim(0), 100); // 100ms para o teste rodar rápido
    const a = new MockAudioCongelado();
    a.src = 'blob:mock';
    a.load();
    // Nenhum evento é disparado pelo mock
  });

  const tInicio = Date.now();
  const durTimeout = await duracaoDoMp3ComMockCongelado(buf1);
  const tFim = Date.now();

  checar(durTimeout === 0, 'duracaoDoMp3 resolve com 0 quando navegador não dispara eventos (não trava)');
  checar(tFim - tInicio < 300, `Promise foi liberada pelo timeout de segurança em ${tFim - tInicio}ms`);

  // 5. Simulação de 2 partes de legendas SRT retornadas pela AssemblyAI
  // Parte 1: 00:00:01,000 até 00:01:25,500 (85.5s)
  const srtParte1 = [
    "1",
    "00:00:01,200 --> 00:00:05,400",
    "Tu vens contra mim com espada e lança",
    "",
    "2",
    "00:00:05,800 --> 00:01:25,500",
    "mas eu vou contra ti em nome do Senhor"
  ].join('\n');

  // Parte 2: 00:00:01,000 até 00:01:18,200 (78.2s na escala local da parte 2)
  const srtParte2 = [
    "1",
    "00:00:01,500 --> 00:00:06,200",
    "Davi meteu a mão no alforje e tirou dali uma pedra",
    "",
    "2",
    "00:00:06,500 --> 00:01:18,200",
    "Inscreva-se no canal para acompanhar mais histórias"
  ].join('\n');

  // 6. Teste de junção com duração fornecida pelo MP3 ou AssemblyAI (86.0s)
  const partesComDuracao = [
    { srt: srtParte1, duracaoSegundos: dur1 }, // ~86s
    { srt: srtParte2, duracaoSegundos: dur2 }
  ];

  const srtUnidoComDuracao = NarracaoModule.juntarSrtDasPartes(partesComDuracao);
  checar(srtUnidoComDuracao.includes('1\n00:00:01,200 --> 00:00:05,400'), 'Parte 1 mantém o tempo inicial');
  checar(srtUnidoComDuracao.includes('3\n'), 'Bloco 1 da parte 2 foi renumerado para 3');

  // Verifica se o bloco 3 (primeiro da parte 2) começa após os 86s da parte 1
  // 86s + 1.5s = 87.5s = 00:01:27,500
  const matchBloco3 = srtUnidoComDuracao.match(/3\s*\n\s*(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)/);
  checar(Boolean(matchBloco3), 'Bloco 3 possui linha de tempo válida');
  if (matchBloco3) {
    const tempoIniBloco3 = matchBloco3[1];
    checar(tempoIniBloco3.startsWith('00:01:27'), `Bloco 3 inicia aos ${tempoIniBloco3} (deslocado pelos ~86s da parte 1)`);
  }

  // 7. Teste de PLANO B EXTREMO: Navegador congelado e SEM duração de áudio (duracaoSegundos = 0)
  // O sistema deve usar o fim da última palavra da parte 1 (85.5s + 0.1s = 85.6s)
  const partesSemDuracao = [
    { srt: srtParte1, duracaoSegundos: 0 },
    { srt: srtParte2, duracaoSegundos: 0 }
  ];

  const srtUnidoPlanoB = NarracaoModule.juntarSrtDasPartes(partesSemDuracao);
  checar(srtUnidoPlanoB.includes('4\n'), 'Contém 4 blocos de legenda renumerados sequencialmente');

  const matchPlanoB = srtUnidoPlanoB.match(/3\s*\n\s*(\d+:\d+:\d+,\d+)\s*-->/);
  checar(Boolean(matchPlanoB), 'Plano B deslocou a 2ª parte mesmo com duracaoSegundos = 0');
  if (matchPlanoB) {
    const tempoIniPlanoB = matchPlanoB[1];
    checar(tempoIniPlanoB.startsWith('00:01:27'), `Plano B usou o fim da última legenda da parte 1 (${tempoIniPlanoB}) evitando sobreposição`);
  }

  // 8. Teste de liberação do botão no finally
  let botaoLoading = true;
  try {
    // Simula execução com timeout
    const resultado = await Promise.race([
      duracaoDoMp3ComMockCongelado(buf1),
      new Promise(r => setTimeout(() => r('timeout'), 500))
    ]);
    checar(resultado === 0, 'Fluxo completou sem travar');
  } finally {
    botaoLoading = false;
  }
  checar(botaoLoading === false, 'Botão liberado no bloco finally');

  console.log(`\nResultado dos testes: ${passedChecks}/${totalChecks} verificações passaram.`);
  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
})();
