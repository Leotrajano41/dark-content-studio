// tests/narracao.test.js — ITEM 47: narração do roteiro Longo x limite de resposta do Vercel (4,5 MB)
// 100% offline: NÃO chama a OpenAI. O tamanho do MP3 é calculado por duração x bitrate.
const fs = require('fs');
const path = require('path');

let total = 0;
function assert(c, m) { total++; if (!c) { console.error(`  ❌ [FALHOU] ${m}`); process.exit(1); } console.log(`  ✅ [PASSOU] ${m}`); }

const LIMITE = 4.5 * 1024 * 1024;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const narrarSrc = fs.readFileSync(path.join(__dirname, '..', 'api', 'narrar.js'), 'utf-8');

console.log('\n📋 47. O erro: um roteiro Longo (~2.800 palavras) gera um MP3 maior que o limite do Vercel');
const PALAVRAS = 2800;
const minutos = PALAVRAS / 150;               // fala em ~150 palavras/min
const segundos = minutos * 60;
const mbDe = (kbps) => (segundos * kbps * 1000 / 8) / (1024 * 1024);
console.log(`     duração estimada: ${minutos.toFixed(1)} min | MP3 a 32 kbps: ${mbDe(32).toFixed(1)} MB | 64 kbps: ${mbDe(64).toFixed(1)} MB | 128 kbps: ${mbDe(128).toFixed(1)} MB (limite 4,5 MB)`);
assert(mbDe(64) > 4.5 && mbDe(128) > 4.5, 'A 64 e a 128 kbps o MP3 do Longo passa do limite de 4,5 MB');
// calibragem com o que o próprio projeto registra: "4,5 MB ~ 4 a 5 minutos de áudio" (api/narrar.js, cabeçalho)
const kbpsDoProjeto = (4.5 * 1024 * 1024 * 8) / (4.5 * 60) / 1000;
assert(kbpsDoProjeto > 100 && mbDe(kbpsDoProjeto) > 4 * 4.5, `Pela calibragem do projeto (~${kbpsDoProjeto.toFixed(0)} kbps) o Longo teria ~${mbDe(kbpsDoProjeto).toFixed(0)} MB: mais de 4x o limite`);

console.log('\n📋 47. A correção: áudio em partes, juntado no navegador');
const Narracao = require('../js/narracao.js');
const paragrafo = (i) => Array.from({ length: 6 }, (_, k) => `Frase número ${i}-${k} da narração, com palavras suficientes para parecer um parágrafo de verdade do roteiro.`).join(' ');
const texto = Array.from({ length: 34 }, (_, i) => paragrafo(i)).join('\n\n');   // ~2.900 palavras
const palavras = (texto.match(/\S+/g) || []).length;
assert(palavras > 2600, `Texto de teste tem ${palavras} palavras`);
const partes = Narracao.dividirTextoEmPartes(texto, 3000);
assert(partes.length >= 6, `O texto foi dividido em ${partes.length} partes`);
assert(partes.every(p => p.length <= 3000), 'Nenhuma parte passa de 3.000 caracteres');
assert(partes.join(' ').replace(/\s+/g, ' ').trim() === texto.replace(/\s+/g, ' ').trim(), 'Juntando as partes volta exatamente o texto (nada perdido nem repetido)');
assert(partes.every(p => /[.!?]["”]?$/.test(p)), 'Toda parte termina no fim de uma frase (nada cortado no meio)');
const maiorMb = Math.max(...partes.map(p => Narracao.estimarMp3({ palavras: (p.match(/\S+/g) || []).length, kbps: 128 }).mb));
assert(maiorMb < 4.0, `A maior parte gera ~${maiorMb.toFixed(2)} MB mesmo a 128 kbps (limite 4,5 MB)`);

// junção de MP3: tira o cabeçalho ID3 das partes seguintes
const id3 = (n) => Uint8Array.from([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, n, ...new Array(n).fill(7)]);
const frames = (marca, n) => new Uint8Array(n).fill(marca);
const a = new Uint8Array([...id3(4), ...frames(1, 20)]);
const b = new Uint8Array([...id3(6), ...frames(2, 20)]);
const unido = Narracao.juntarMp3([a, b]);
assert(unido.length === a.length + (b.length - 10 - 6), 'A 2ª parte perde o cabeçalho ID3 ao juntar');
assert(unido[0] === 0x49 && unido.slice(-20).every(x => x === 2), 'A 1ª parte mantém o ID3 e os frames da 2ª vêm inteiros no fim');

console.log('\n📋 47. O front e o servidor usam a solução');
assert(/NarracaoModule\.dividirTextoEmPartes/.test(html) && /NarracaoModule\.juntarMp3/.test(html), 'O botão "Gerar Narração" divide em partes e junta no navegador');
assert(!/body: JSON\.stringify\(\{ texto: roteiro, voz, tom \}\)/.test(html), 'O front não manda mais o roteiro inteiro numa chamada só');
assert(/<script src="js\/narracao\.js"><\/script>/.test(html), 'js/narracao.js é carregado pela página');
assert(/413/.test(narrarSrc) && /MAX_CHARS_POR_REQUISICAO/.test(narrarSrc), 'O servidor recusa com 413 e mensagem clara texto maior que uma parte (em vez de falhar no limite do Vercel)');

console.log(`\n🎉 ${total} verificações passaram.\n`);
