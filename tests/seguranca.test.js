// tests/seguranca.test.js — ITEM 33: chaves no servidor, endpoints restritos e legendas por partes. 100% offline.
const fs = require('fs');
const path = require('path');

let total = 0;
function assert(c, m) { total++; if (!c) { console.error(`  ❌ [FALHOU] ${m}`); process.exitCode = 1; } else console.log(`  ✅ [PASSOU] ${m}`); }

process.env.ASSEMBLYAI_API_KEY = 'SEGREDO-ASSEMBLY-123';
process.env.OPENAI_API_KEY = 'SEGREDO-OPENAI-456';
delete process.env.APP_ACCESS_TOKEN;
let fetchChamado = false;
global.fetch = async () => { fetchChamado = true; throw new Error('fetch NÃO deveria ser chamado neste teste'); };

function mockRes() {
  const res = { statusCode: 200, headers: {}, corpo: undefined };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.corpo = o; return res; };
  res.send = (b) => { res.corpo = b; return res; };
  res.end = (b) => { if (b !== undefined) res.corpo = b; return res; };
  return res;
}
const req = (metodo, headers = {}, body) => ({ method: metodo, headers: { host: 'app.exemplo.vercel.app', ...headers }, body, on() {}, socket: { remoteAddress: '1.2.3.4' } });
const mesmaOrigem = { origin: 'https://app.exemplo.vercel.app', 'sec-fetch-site': 'same-origin' };

(async () => {
  const legendas = require('../api/legendas.js');
  const narrar = require('../api/narrar.js');
  const seg = (() => { try { return require('../api/_seguranca.js'); } catch (e) { return null; } })();

  console.log('\n📋 33. /api/legendas não devolve mais a chave');
  let res = mockRes();
  await legendas(req('GET', mesmaOrigem), res);
  assert(res.statusCode === 405, `GET /api/legendas agora responde 405 (respondeu ${res.statusCode})`);
  assert(!JSON.stringify(res.corpo || '').includes('SEGREDO-ASSEMBLY-123') && !JSON.stringify(res.headers).includes('SEGREDO'), 'A chave da AssemblyAI não aparece na resposta');
  res = mockRes();
  await legendas(req('GET', mesmaOrigem), res);
  assert(!/token/i.test(JSON.stringify(res.corpo || {})), 'A resposta não tem campo "token"');

  console.log('\n📋 33. /api/legendas não aceita mais audio_url de qualquer um');
  res = mockRes();
  await legendas(req('POST', { ...mesmaOrigem, 'content-type': 'application/json' }, { audio_url: 'https://qualquer-site.com/x.mp3' }), res);
  assert(res.statusCode === 400 && /audio_url|n[ãa]o [ée] mais aceito|áudio/i.test(JSON.stringify(res.corpo)), `POST com audio_url é recusado (${res.statusCode})`);
  assert(fetchChamado === false, 'Nenhuma chamada externa foi feita com a chave');
  res = mockRes();
  await legendas(req('POST', { ...mesmaOrigem, 'content-type': 'audio/mpeg', 'content-length': String(6 * 1024 * 1024) }), res);
  assert(res.statusCode === 413, 'Áudio acima de 4,4 MB recebe 413 com mensagem clara (o front envia por partes)');

  console.log('\n📋 33. Acesso restrito ao próprio site');
  res = mockRes();
  await narrar(req('POST', { 'content-type': 'application/json' }, { texto: 'x'.repeat(10) }), res);
  assert(res.statusCode === 403, '/api/narrar sem Origin (curl) é recusado com 403');
  res = mockRes();
  await narrar(req('POST', { origin: 'https://site-malicioso.com', 'sec-fetch-site': 'cross-site' }, { texto: 'x' }), res);
  assert(res.statusCode === 403, '/api/narrar chamado por outro site é recusado com 403');
  res = mockRes();
  await legendas(req('POST', { origin: 'https://site-malicioso.com', 'content-type': 'audio/mpeg' }), res);
  assert(res.statusCode === 403, '/api/legendas chamado por outro site é recusado com 403');
  res = mockRes();
  await narrar(req('POST', { ...mesmaOrigem, 'content-type': 'application/json' }, { texto: 'Frase de teste. '.repeat(400) }), res);
  assert(res.statusCode === 413, 'Do próprio site passa pelo controle de acesso (e texto grande demais recebe 413 antes de gastar a chave)');
  assert(fetchChamado === false, 'A OpenAI não foi chamada');

  console.log('\n📋 33. Código de acesso opcional (APP_ACCESS_TOKEN)');
  process.env.APP_ACCESS_TOKEN = 'codigo-secreto';
  res = mockRes();
  await narrar(req('POST', { ...mesmaOrigem, 'content-type': 'application/json' }, { texto: 'Frase de teste. '.repeat(400) }), res);
  assert(res.statusCode === 401, 'Com APP_ACCESS_TOKEN configurado, requisição sem o código recebe 401');
  res = mockRes();
  await narrar(req('POST', { ...mesmaOrigem, 'x-acesso-token': 'errado', 'content-type': 'application/json' }, { texto: 'x'.repeat(5000) }), res);
  assert(res.statusCode === 401, 'Código errado recebe 401');
  res = mockRes();
  await narrar(req('POST', { ...mesmaOrigem, 'x-acesso-token': 'codigo-secreto', 'content-type': 'application/json' }, { texto: 'Frase de teste. '.repeat(400) }), res);
  assert(res.statusCode === 413, 'Código certo passa pelo controle (413 pelo tamanho do texto)');
  delete process.env.APP_ACCESS_TOKEN;

  console.log('\n📋 33. Limite de uso por IP (melhor esforço)');
  assert(seg && typeof seg.limitarUso === 'function', 'api/_seguranca.js exporta limitarUso');
  if (seg) {
    const chave = 'ip-teste-' + Date.now();
    let bloqueou = false;
    for (let i = 0; i < 40; i++) { if (!seg.limitarUso(chave, { max: 30, janelaMs: 600000 })) { bloqueou = i; break; } }
    assert(bloqueou === 30, `A 31ª requisição na janela é bloqueada (bloqueou na ${bloqueou + 1}ª)`);
  }

  console.log('\n📋 33. vercel.json e front');
  const vj = fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf-8');
  assert(!/Access-Control-Allow-Origin/i.test(vj), 'vercel.json não libera mais CORS "*" para /api/*');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
  assert(!/action=token/.test(html) && !/api\.assemblyai\.com/.test(html), 'O front não busca token nem fala direto com a AssemblyAI');
  assert(/NarracaoModule\.juntarSrtDasPartes/.test(html) && /currentAudioParts/.test(html), 'O front gera a legenda por partes e junta os SRT');
  assert(/x-acesso-token/.test(html) && /input-codigo-acesso/.test(html), 'O front envia o código de acesso opcional');

  console.log('\n📋 33. Junção das legendas por partes');
  const Narracao = require('../js/narracao.js');
  const srt1 = '1\n00:00:00,500 --> 00:00:02,000\nPrimeira frase.\n\n2\n00:00:02,100 --> 00:00:04,000\nSegunda frase.\n';
  const srt2 = '1\n00:00:00,300 --> 00:00:01,500\nTerceira frase.\n';
  const junto = Narracao.juntarSrtDasPartes([{ srt: srt1, duracaoSegundos: 4.5 }, { srt: srt2, duracaoSegundos: 2 }]);
  assert(/^3\n00:00:04,800 --> 00:00:06,000\nTerceira frase\./m.test(junto), 'A 2ª parte é deslocada pela duração da 1ª (0,3 s + 4,5 s = 4,8 s) e renumerada');
  assert(/^1\n00:00:00,500 --> 00:00:02,000/m.test(junto) && (junto.match(/-->/g) || []).length === 3, 'A 1ª parte fica como está e o total de legendas é 3');
  const comHora = Narracao.juntarSrtDasPartes([{ srt: srt1, duracaoSegundos: 3590 }, { srt: srt2, duracaoSegundos: 2 }]);
  assert(/01:39:50,300 --> 00:39:51/.test(comHora) === false && /00:59:50,300 --> 00:59:51,500/.test(comHora), 'Deslocamentos grandes continuam no formato HH:MM:SS,mmm');

  console.log(`\n${process.exitCode ? '❌ HÁ FALHAS' : '🎉'} ${total} verificações.\n`);
})();
