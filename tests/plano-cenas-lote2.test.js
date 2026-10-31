// Teste dedicado: Correção do 2º lote no Plano de Cenas, Regeneração de Cenas Pendentes e Exportação ZIP
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

console.log('--- TESTES: 2º Lote do Plano de Cenas (12 a 16 cenas) ---');

// Narração completa de Davi e Golias com extensão de Shorts Estendido (gera de 12 a 16 cenas)
const frasesDavi = [
  "Tu vens contra mim com espada, com lança e com escudo, mas eu vou contra ti em nome do Senhor dos Exércitos, o Deus dos exércitos de Israel, a quem tens afrontado.",
  "Davi era o filho mais moço de Jessé e apascentava as ovelhas de seu pai nas colinas de Belém.",
  "O acampamento dos filisteus estava situado sobre um monte de um lado, e o acampamento de Israel sobre outro monte do outro lado.",
  "E havia entre eles o vale profundo de Elá, onde as duas forças armadas se encaravam.",
  "Saiu então do acampamento dos filisteus um guerreiro campeão chamado Golias de Gate, cuja altura ultrapassava quase três metros.",
  "Ele trazia na cabeça um capacete de bronze maciço e vestia uma cota de malha de escamas de bronze que pesava cinquenta quilos.",
  "As caneleiras de bronze cobriam as suas pernas e trazia um dardo de bronze suspenso entre os ombros.",
  "A haste da sua lança era como o órgão de um tecelão, e a ponta de ferro da lança pesava mais de seis quilos.",
  "Diante do gigante caminhava um escudeiro segurando um imenso escudo de madeira revestida de couro.",
  "Golias parou e gritou com voz de trovão para as fileiras atemorizadas de Israel.",
  "Por quarenta dias seguidos, pela manhã e à tarde, o filisteu se apresentava e desafiava o povo.",
  "Saul e todo o exército de Israel ouviam aquelas afrontas e ficavam grandemente espantados e tomados de pavor.",
  "Davi chegou ao acampamento trazendo pães e queijos para o capitão e para seus irmãos mais velhos.",
  "Ao ouvir o insulto contra o Deus vivo, Davi se apresentou diante do rei Saul para lutar contra o filisteu.",
  "Saul vestiu Davi com sua própria armadura real, mas o jovem não pôde andar e tirou tudo de si.",
  "Davi tomou apenas o seu cajado, escolheu cinco pedras lisas do ribeiro e as pôs no alforje de pastor.",
  "Com a funda na mão, avançou corajosamente contra o filisteu enquanto o gigante zombava da sua juventude.",
  "Davi meteu a mão no alforje, tirou dali uma pedra e a atirou com a funda, cravando-a na testa do guerreiro.",
  "Golias caiu com o rosto em terra e todo o exército dos filisteus fugiu em debandada pelo vale.",
  "Inscreva-se no canal para acompanhar mais histórias fascinantes de coragem e fé bíblica."
];

const narracao14Cenas = frasesDavi.join(' ');

const plano = PlanoCenasModule.gerarPlanoDeCenas(narracao14Cenas, {
  tema: 'Davi e Golias',
  personagemPrincipal: 'Davi'
});

checar(plano.cenas.length >= 12, `Gerou ${plano.cenas.length} cenas (esperado >= 12 cenas)`);

// 2. Teste do prompt do 2º lote (cenas 11 até o fim)
const cenasLote2 = plano.cenas.slice(10);
const payloadLote2 = cenasLote2.map(c => ({ numero: c.numero, trecho: c.frases.join(' ') }));
const promptLote2 = PlanoCenasModule.construirPromptIaLoteCenas(payloadLote2, { tema: 'Davi e Golias' });

checar(promptLote2.includes('[Cena 11]:'), 'Prompt do lote 2 inclui [Cena 11]:');
checar(promptLote2.includes('[Cena 12]:'), 'Prompt do lote 2 inclui [Cena 12]:');
checar(promptLote2.includes('11, 12'), 'Prompt do lote 2 instrui explicitamente os números exatos esperados (11, 12...)');

// Banco de descrições variadas para os testes não esbarrarem na regra de 60% de semelhança
const descricoesVariadas = [
  "panoramic wide landscape of the arid Valley of Elah with steep rugged limestone cliffs",
  "medium view of young shepherd David tending a flock of white sheep in grassy hills of Bethlehem",
  "wide perspective of Philistine army encampment pitched upon a fortified rocky mountain crest",
  "dramatic deep gorge between two opposing army camps under dark overcast dramatic storm clouds",
  "towering Philistine warrior Goliath wearing enormous bronze helmet advancing menacingly",
  "heavy brass scale armor coat glinting under midday sun with leather strapping",
  "macro detail of bronze greaves fastened to massive muscular legs standing on dry dirt path",
  "thick wooden weaver beam spear shaft tipped with razor sharp heavy iron blade point",
  "crouched armor bearer lifting a wide rectangular wooden shield covered in dark leather hides",
  "imposing giant shouting challenges toward the trembling Hebrew camp with booming anger",
  "close-up of Saul seated inside royal royal tent his weathered face gripped by grim anxiety",
  "pastor boy carrying woven wicker basket filled with flat loaves of bread into military camp"
];

// 3. Teste de correspondência quando a IA devolve números exatos em formato de array
(async () => {
  const cenasTeste1 = JSON.parse(JSON.stringify(plano.cenas));
  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasTeste1,
    narracao14Cenas,
    async (prompt) => {
      if (prompt.includes('[Cena 11]')) {
        return JSON.stringify([
          { numero: "11", descricaoVisual: descricoesVariadas[10] },
          { numero: "12", descricaoVisual: descricoesVariadas[11] }
        ]);
      }
      // Lote 1 (01 a 10)
      return JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          numero: String(i + 1).padStart(2, '0'),
          descricaoVisual: descricoesVariadas[i]
        }))
      );
    },
    { tema: 'Davi e Golias' }
  );

  const pendentes1 = cenasTeste1.filter(c => c.status === 'PENDENTE');
  checar(pendentes1.length === 0, `Com IA exata, 0 cenas pendentes (restaram: ${pendentes1.length})`);
  checar(cenasTeste1[10].status === 'CONCLUIDA', 'Cena 11 CONCLUIDA com sucesso');
  checar(cenasTeste1[11].status === 'CONCLUIDA', 'Cena 12 CONCLUIDA com sucesso');

  // 4. Teste CRÍTICO: Quando a IA renumera o 2º lote a partir de 1 ("01", "02")
  const cenasTeste2 = JSON.parse(JSON.stringify(plano.cenas));
  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasTeste2,
    narracao14Cenas,
    async (prompt) => {
      if (prompt.includes('[Cena 11]')) {
        return JSON.stringify([
          { numero: "01", descricaoVisual: "close-up of Saul seated inside royal tent his face gripped by anxiety" },
          { numero: "02", descricaoVisual: "pastor boy carrying woven wicker basket filled with loaves into camp" }
        ]);
      }
      return JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          numero: String(i + 1).padStart(2, '0'),
          descricaoVisual: descricoesVariadas[i]
        }))
      );
    },
    { tema: 'Davi e Golias' }
  );

  const pendentes2 = cenasTeste2.filter(c => c.status === 'PENDENTE');
  checar(pendentes2.length === 0, `Com IA renumerando a partir de 01 no 2º lote, 0 cenas pendentes (restaram: ${pendentes2.length})`);
  checar(cenasTeste2[10].status === 'CONCLUIDA', 'Cena 11 resolvida mesmo com IA devolvendo "01"');
  checar(cenasTeste2[11].status === 'CONCLUIDA', 'Cena 12 resolvida mesmo com IA devolvendo "02"');

  // 5. Teste: Quando a IA devolve chaves em inglês ("description", "visual_description") e envelope de objeto
  const cenasTeste3 = JSON.parse(JSON.stringify(plano.cenas));
  await PlanoCenasModule.gerarDescricoesVisuaisComIa(
    cenasTeste3,
    narracao14Cenas,
    async (prompt) => {
      if (prompt.includes('[Cena 11]')) {
        return JSON.stringify({
          scenes: [
            { scene: 11, description: "close-up of Saul inside royal military pavilion staring into distance" },
            { scene: 12, visual_description: "young shepherd stepping through perimeter of tents carrying provisions" }
          ]
        });
      }
      return JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          numero: String(i + 1).padStart(2, '0'),
          descricaoVisual: descricoesVariadas[i]
        }))
      );
    },
    { tema: 'Davi e Golias' }
  );

  checar(cenasTeste3[10].status === 'CONCLUIDA', 'Cena 11 resolvida com objeto envelopador { scenes: [...] } e chave description');
  checar(cenasTeste3[11].status === 'CONCLUIDA', 'Cena 12 resolvida com objeto envelopador e chave visual_description');

  // 6. Teste de regenerarCenasPendentes com sucesso e com erro real
  const cenasComPendentes = JSON.parse(JSON.stringify(plano.cenas));
  cenasComPendentes[10].status = 'PENDENTE';
  cenasComPendentes[10].motivoPendente = 'Descrição visual vazia.';
  cenasComPendentes[11].status = 'PENDENTE';
  cenasComPendentes[11].motivoPendente = 'Descrição visual vazia.';

  // 6a: Regeneração com sucesso (mesmo que a IA devolva "01" e "02")
  const resRegenSucesso = await PlanoCenasModule.regenerarCenasPendentes(
    cenasComPendentes,
    narracao14Cenas,
    async (prompt) => {
      return JSON.stringify([
        { numero: "01", descricaoVisual: "weathered face of King Saul looking out across rocky mountain pass" },
        { numero: "02", descricaoVisual: "young shepherd boy arriving at Israeli camp trenches carrying provisions" }
      ]);
    },
    { tema: 'Davi e Golias' }
  );

  checar(resRegenSucesso.pendentesRestantes.length === 0, 'regenerarCenasPendentes resolveu todas as pendências');
  checar(cenasComPendentes[10].status === 'CONCLUIDA', 'Cena 11 passou para CONCLUIDA após regenerar');
  checar(cenasComPendentes[11].status === 'CONCLUIDA', 'Cena 12 passou para CONCLUIDA após regenerar');

  // 6b: Regeneração com erro de IA (deve registrar o motivo real e não silenciar)
  cenasComPendentes[10].status = 'PENDENTE';
  cenasComPendentes[10].motivoPendente = 'Pendente';
  const resRegenErro = await PlanoCenasModule.regenerarCenasPendentes(
    cenasComPendentes,
    narracao14Cenas,
    async () => {
      throw new Error('OpenRouter 429 Rate Limit Exceeded');
    },
    { tema: 'Davi e Golias' }
  );

  checar(resRegenErro.pendentesRestantes.length === 1, 'Registrou pendência restante quando IA falha');
  checar(resRegenErro.erroIa.includes('429'), 'Retorna erroIa legível informando 429 Rate Limit');
  checar(cenasComPendentes[10].motivoPendente.includes('429'), 'Cena 10 guarda o erro real da IA no motivoPendente');

  // 7. Teste do .ZIP com áudio binário real (NUNCA [object Blob])
  const fakeMp3Bytes = new Uint8Array([0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00]);
  const fakeBlob = {
    arrayBuffer: async () => fakeMp3Bytes.buffer
  };

  const zipBlob = await PlanoCenasModule.criarZipScriptorium([
    { nome: 'cenas.txt', conteudo: '01 | Trecho 1\n02 | Trecho 2' },
    { nome: 'narracao.mp3', conteudo: fakeBlob }
  ]);

  const arquivosExtraidos = await PlanoCenasModule.lerArquivosDeZip(zipBlob);
  const mp3Extraido = arquivosExtraidos.find(a => a.nome === 'narracao.mp3');
  checar(Boolean(mp3Extraido), 'narracao.mp3 incluído no pacote .zip');
  checar(mp3Extraido.bytes.length === fakeMp3Bytes.length, `Tamanho do mp3 preservado: ${mp3Extraido.bytes.length} bytes`);
  checar(mp3Extraido.bytes[0] === 0xFF && mp3Extraido.bytes[1] === 0xFB, 'Bytes binários do MP3 intactos (não virou "[object Blob]")');

  // Teste de rejeição se passar string '[object Blob]'
  const zipSemCorrupcao = await PlanoCenasModule.criarZipScriptorium([
    { nome: 'cenas.txt', conteudo: '01 | Trecho 1' },
    { nome: 'narracao.mp3', conteudo: '[object Blob]' }
  ]);
  const arquivosSemCorrupcao = await PlanoCenasModule.lerArquivosDeZip(zipSemCorrupcao);
  const mp3Corrompido = arquivosSemCorrupcao.find(a => a.nome === 'narracao.mp3');
  checar(!mp3Corrompido, 'Rejeitou com segurança gravação de string corrompida "[object Blob]" no .zip');

  // 8. Teste do nome do .zip pelo tema
  const nomeZipCustom = PlanoCenasModule.gerarNomeZipScriptorium({
    temaCustom: 'Davi e Golias',
    categoria: 'Personagens Bíblicos'
  });
  checar(nomeZipCustom === 'davi-e-golias-scriptorium.zip', `Nome do zip gerado corretamente por temaCustom: ${nomeZipCustom}`);

  const nomeZipIdeia = PlanoCenasModule.gerarNomeZipScriptorium({
    ideiaEscolhida: 'Davi e Golias: A Verdadeira Arma que Derrubou o Gigante',
    categoria: 'Curiosidades Bíblicas'
  });
  checar(nomeZipIdeia.startsWith('davi-e-golias'), `Nome do zip gerado por ideiaEscolhida: ${nomeZipIdeia}`);
  checar(!nomeZipIdeia.includes('curiosidades'), 'Nome do zip não contém nome da categoria do menu');

  console.log(`\nResultado dos novos testes: ${passedChecks}/${totalChecks} verificações passaram.`);
  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
})();
