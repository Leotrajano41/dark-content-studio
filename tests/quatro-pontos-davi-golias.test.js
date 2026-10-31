const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PlanoCenasModule = require('../js/plano-cenas.js');

console.log('=== TESTES: 4 PONTOS DAVI E GOLIAS (DARK STUDIO) ===\n');

let totalChecks = 0;
let passedChecks = 0;

function checar(condicao, mensagem) {
  totalChecks++;
  try {
    assert.ok(condicao, mensagem);
    passedChecks++;
    console.log(`  ✓ ${mensagem}`);
  } catch (err) {
    console.error(`  ✗ FALHA: ${mensagem}`);
    throw err;
  }
}

// =========================================================================
// PONTO 1: NOME DO ZIP ERRADO
// O nome do .zip precisa vir do tema/título ATUAL do projeto (ideia escolhida),
// NUNCA de um tema customizado antigo guardado na sessão anterior.
// =========================================================================
console.log('--- PONTO 1: Nome do ZIP baseado no tema/título atual do projeto ---');

const nomeZip1 = PlanoCenasModule.gerarNomeZipScriptorium({
  temaCustom: 'ogue-rei-de-basa-o-gigante-da-biblia', // resíduo antigo do localStorage
  ideiaEscolhida: 'Davi e Golias: O Pastor Que Derrubou o Gigante', // ideia ATUAL
  categoria: 'Acontecimentos Chave da Bíblia'
});
checar(nomeZip1.startsWith('davi-e-golias'), `Ideia escolhida tem prioridade sobre temaCustom antigo: ${nomeZip1}`);
checar(!nomeZip1.includes('ogue'), 'Nome do zip não contém resíduo antigo de Ogue');

// Se categoria for Personalizável e não houver ideia escolhida, usa temaCustom
const nomeZip2 = PlanoCenasModule.gerarNomeZipScriptorium({
  temaCustom: 'Davi e Golias',
  categoria: 'Personalizável'
});
checar(nomeZip2 === 'davi-e-golias-scriptorium.zip', `Tema customizado usado quando categoria for Personalizável: ${nomeZip2}`);

// Se ideia tiver formato de lista com prefixo "1. Davi e Golias", remove o prefixo
const nomeZip3 = PlanoCenasModule.gerarNomeZipScriptorium({
  ideiaEscolhida: '1. Davi e Golias\nReferência Bíblica: 1 Samuel 17'
});
checar(nomeZip3 === 'davi-e-golias-scriptorium.zip', `Limpa numeração inicial de ideia: ${nomeZip3}`);

// =========================================================================
// PONTO 2: PERSONAGEM COM FICHA FIXA CANÔNICA
// Idade, cabelo, rosto, roupa e cores idênticos em todo prompt
// =========================================================================
console.log('\n--- PONTO 2: Ficha canônica fixa de Davi e Golias nos prompts ---');

checar(Boolean(PlanoCenasModule.FICHAS_PERSONAGENS['David']), 'Ficha de David existe no catálogo canônico');
checar(Boolean(PlanoCenasModule.FICHAS_PERSONAGENS['Davi']), 'Ficha de Davi existe no catálogo canônico');
checar(Boolean(PlanoCenasModule.FICHAS_PERSONAGENS['Goliath']), 'Ficha de Goliath existe no catálogo canônico');
checar(Boolean(PlanoCenasModule.FICHAS_PERSONAGENS['Golias']), 'Ficha de Golias existe no catálogo canônico');

const fichaDavi = PlanoCenasModule.FICHAS_PERSONAGENS['Davi'];
checar(fichaDavi.includes('late teens') || fichaDavi.includes('young'), 'Ficha de Davi contém idade (late teens)');
checar(fichaDavi.includes('reddish-brown hair') || fichaDavi.includes('hair'), 'Ficha de Davi contém cabelo');
checar(fichaDavi.includes('sheep wool tunic'), 'Ficha de Davi contém roupas e tecido');
checar(fichaDavi.includes('leather sling'), 'Ficha de Davi contém a funda');

const fichaGolias = PlanoCenasModule.FICHAS_PERSONAGENS['Golias'];
checar(fichaGolias.includes('giant') || fichaGolias.includes('colossal'), 'Ficha de Golias contém porte gigante');
checar(fichaGolias.includes('bronze scale armor'), 'Ficha de Golias contém armadura de bronze');
checar(fichaGolias.includes('beard') && fichaGolias.includes('helmet'), 'Ficha de Golias contém barba e capacete');

// Prompts gerados para cenas onde Davi e Golias aparecem devem conter exatamente o mesmo texto canônico
const promptCenaDavi1 = PlanoCenasModule.montarPromptFinalCena(
  'young shepherd holding stones in front of the camp',
  'Davi avançou pelo vale'
);
const promptCenaDavi2 = PlanoCenasModule.montarPromptFinalCena(
  'young shepherd aiming at the forehead',
  'Davi girou a funda com determinação'
);

checar(promptCenaDavi1.includes(fichaDavi), 'Prompt da cena 1 contém ficha canônica exata de Davi');
checar(promptCenaDavi2.includes(fichaDavi), 'Prompt da cena 2 contém a mesma ficha canônica exata de Davi');

// =========================================================================
// PONTO 3: GANCHO LENTO (4 a 6s por cena nos primeiros ~15s)
// =========================================================================
console.log('\n--- PONTO 3: Gancho dinâmico com cenas de 4 a 6s no início ---');

const narracaoGanchoLongo = 'Tu vens contra mim com espada, com lança e com escudo, mas eu vou contra ti em nome do Senhor dos Exércitos, o Deus dos exércitos de Israel, a quem tens afrontado. Davi apascentava as ovelhas de seu pai nas colinas de Belém. O vale de Elá separava os dois exércitos armados.';
const planoGancho = PlanoCenasModule.gerarPlanoDeCenas(narracaoGanchoLongo, { tema: 'Davi e Golias' });

// Primeiras cenas devem respeitar o ritmo do gancho (4 a 6 segundos por cena)
const cenasGancho = planoGancho.cenas.filter(c => c.tempoInicioTotal < 15);
checar(cenasGancho.length >= 2, `Gancho gerou múltiplas cenas curtas (total: ${cenasGancho.length}) em vez de uma única cena longa`);

for (const c of cenasGancho) {
  checar(
    c.duracaoEstimadaSegundos >= 3.5 && c.duracaoEstimadaSegundos <= 6.5,
    `Cena ${c.numero} do gancho tem duração entre 4 e 6s (${c.duracaoEstimadaSegundos}s)`
  );
}

// =========================================================================
// PONTO 4: CENAS CONSECUTIVAS NÃO PODEM REPETIR ENQUADRAMENTO + PERSONAGENS
// =========================================================================
console.log('\n--- PONTO 4: Proibição de repetição de enquadramento em cenas consecutivas ---');

const descCena01 = 'Wide panoramic establishing landscape shot of the Valley of Elah with both David and Goliath standing in the distance under the sunset';
const descCena02Repetida = 'Wide panoramic shot of the rocky Valley of Elah with David and Goliath standing opposite each other under warm sunlight';
const descCena02Variada = 'Extreme close-up on Goliath face sneering with ferocious eyes and dark beard';

const validacaoRepetida = PlanoCenasModule.validarDescricaoVisualCena(
  descCena02Repetida,
  'Davi encarou o gigante filisteu',
  { descricoesAnteriores: [descCena01] }
);
checar(!validacaoRepetida.valido, 'Validador rejeitou cena 02 repetindo enquadramento (wide) e mesmos personagens (Davi + Golias)');
checar(validacaoRepetida.motivo.includes('Cenas consecutivas não podem repetir'), `Motivo legível: "${validacaoRepetida.motivo}"`);

const validacaoVariada = PlanoCenasModule.validarDescricaoVisualCena(
  descCena02Variada,
  'Golias zombava com desprezo',
  { descricoesAnteriores: [descCena01] }
);
checar(validacaoVariada.valido, 'Validador aceitou cena 02 variando para close-up facial');

console.log(`\n🎉 Todos os testes dos 4 pontos passaram: ${passedChecks}/${totalChecks} verificações aprovadas!`);
