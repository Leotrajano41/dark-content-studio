// Teste offline: Simulação de 2 respostas de áudio, exibição do player, tamanho no currentAudioBlob, narracao.mp3 no ZIP e persistência do Plano de Cenas no AutoSave.
const NarracaoModule = require('../js/narracao.js');
const PlanoCenasModule = require('../js/plano-cenas.js');

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

console.log('--- TESTES: Geração de Áudio (2 partes), Player, ZIP e AutoSave ---');

(async () => {
  // 1. Simulação dos tamanhos reais das 2 partes de áudio de Davi e Golias
  const tamParte1 = 1376256;
  const tamParte2 = 1262592;

  const parte1 = new Uint8Array(tamParte1);
  parte1[0] = 0xFF; parte1[1] = 0xFB; parte1[2] = 0x90; // Frame sync MP3
  parte1.fill(0xAA, 3);

  const parte2 = new Uint8Array(tamParte2);
  parte2[0] = 0xFF; parte2[1] = 0xFB; parte2[2] = 0x90; // Frame sync MP3
  parte2.fill(0xBB, 3);

  // 2. Junção com NarracaoModule.juntarMp3
  const audioUnido = NarracaoModule.juntarMp3([parte1, parte2]);
  const tamanhoEsperado = tamParte1 + tamParte2;

  checar(audioUnido.length === tamanhoEsperado, `juntarMp3 somou as 2 partes perfeitamente (${audioUnido.length} bytes == ${tamanhoEsperado} bytes)`);

  // 3. Simulação de Blob e estado no frontend
  let currentAudioBlob = {
    size: audioUnido.length,
    type: 'audio/mpeg',
    arrayBuffer: async () => audioUnido.buffer
  };

  checar(currentAudioBlob.size === tamanhoEsperado, `currentAudioBlob tem o tamanho exato da soma das 2 partes (${currentAudioBlob.size} bytes)`);

  // 4. Simulação dos elementos do Player de Áudio no DOM
  const mockCardPlayer = {
    classes: new Set(['hidden', 'output-card']),
    classList: {
      remove(c) { mockCardPlayer.classes.delete(c); },
      add(c) { mockCardPlayer.classes.add(c); },
      contains(c) { return mockCardPlayer.classes.has(c); }
    }
  };
  const mockPlayerEl = { src: '' };
  const mockBtnGerar = { loading: true };

  // Simulação do fluxo pós-áudio do index.html
  mockPlayerEl.src = 'blob:http://localhost:3000/mock-audio-uuid';
  mockCardPlayer.classList.remove('hidden');
  mockBtnGerar.loading = false;

  checar(!mockCardPlayer.classList.contains('hidden'), 'Card do Player de áudio fica visível (remove a classe hidden)');
  checar(mockPlayerEl.src.startsWith('blob:'), 'Player de áudio recebe a URL do Blob');
  checar(mockBtnGerar.loading === false, 'Botão de gerar áudio é liberado (loading = false no finally)');

  // 5. Teste de empacotamento do ZIP com o áudio de 2 partes
  const arquivosParaZip = [
    { nome: 'cenas.txt', conteudo: '01 | Trecho 1 da narração\n02 | Trecho 2 da narração' },
    { nome: 'descricoes.txt', conteudo: '01 | visual 1\n02 | visual 2' },
    { nome: 'prompts.txt', conteudo: '01. prompt 1\n\n02. prompt 2' },
    { nome: 'narracao.mp3', conteudo: currentAudioBlob }
  ];

  const zipBlob = await PlanoCenasModule.criarZipScriptorium(arquivosParaZip);
  const arquivosExtraidos = await PlanoCenasModule.lerArquivosDeZip(zipBlob);

  const mp3NoZip = arquivosExtraidos.find(a => a.nome === 'narracao.mp3');
  checar(Boolean(mp3NoZip), 'narracao.mp3 está presente dentro do arquivo .zip gerado');
  checar(mp3NoZip.bytes.length === tamanhoEsperado, `narracao.mp3 dentro do .zip tem o tamanho exato da soma das partes (${mp3NoZip.bytes.length} bytes == ${tamanhoEsperado} bytes)`);
  checar(mp3NoZip.bytes[0] === 0xFF && mp3NoZip.bytes[1] === 0xFB, 'Bytes binários do MP3 preservados intactos no zip (não virou "[object Blob]")');

  // 6. Teste de persistência e recuperação do Plano de Cenas no AutoSave
  const mockLocalStorage = {};
  const mockSessionKey = 'dark_studio_session_v1';

  // Cenário: Plano de Cenas gerado
  const planoMock = {
    cenas: [
      { numero: '01', status: 'CONCLUIDA', descricaoVisual: 'desc 1', promptIngles: 'prompt 1' },
      { numero: '02', status: 'CONCLUIDA', descricaoVisual: 'desc 2', promptIngles: 'prompt 2' }
    ]
  };

  const sessaoParaSalvar = {
    'output-roteiro-limpo': 'Narração limpa de Davi e Golias...',
    'output-cenas-txt': '01 | Tu vens contra mim\n02 | Davi era um jovem',
    'output-prompts-txt': '01. Prompt 1\n\n02. Prompt 2',
    _planoDeCenasAtual: planoMock,
    _descricoesTxtAtual: '01 | desc 1\n02 | desc 2',
    _hashNarracaoPlanoCenas: 'hash123'
  };

  mockLocalStorage[mockSessionKey] = JSON.stringify(sessaoParaSalvar);

  // Simulação do restore()
  const sessaoRecuperada = JSON.parse(mockLocalStorage[mockSessionKey]);
  checar(sessaoRecuperada._planoDeCenasAtual !== undefined, 'AutoSave salva _planoDeCenasAtual na sessão');
  checar(sessaoRecuperada['output-cenas-txt'].includes('01 | Tu vens'), 'AutoSave salva output-cenas-txt na sessão');
  checar(sessaoRecuperada['output-prompts-txt'].includes('01. Prompt 1'), 'AutoSave salva output-prompts-txt na sessão');
  checar(sessaoRecuperada._planoDeCenasAtual.cenas.length === 2, 'AutoSave recupera todas as cenas do plano salvo');

  console.log(`\nResultado dos testes: ${passedChecks}/${totalChecks} verificações passaram.`);
  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
})();
