// api/_seguranca.js — controle de acesso dos endpoints que gastam chaves do servidor (/api/narrar e /api/legendas)
// (arquivos que começam com "_" dentro de /api não viram função no Vercel)
//
// O que faz:
//  1. NÃO libera CORS: só o próprio site consegue chamar (Sec-Fetch-Site: same-origin, ou Origin igual ao Host).
//  2. Código de acesso opcional: se a variável APP_ACCESS_TOKEN existir no Vercel, toda requisição precisa enviar o
//     mesmo valor no cabeçalho x-acesso-token (o campo "Código de acesso" da tela). Sem a variável, vale só o item 1.
//  3. Limite de uso por IP (melhor esforço: a memória é por instância serverless).
//
// Limite honesto: o item 1 impede uso por OUTROS SITES e por navegadores, mas quem falsifica cabeçalhos com curl passa;
// por isso o código de acesso (item 2) é o que realmente fecha a porta.
const crypto = require('crypto');

const usos = new Map();

function limitarUso(chave, { max = 60, janelaMs = 10 * 60 * 1000 } = {}) {
  const agora = Date.now();
  const lista = (usos.get(chave) || []).filter(t => agora - t < janelaMs);
  if (lista.length >= max) { usos.set(chave, lista); return false; }
  lista.push(agora);
  usos.set(chave, lista);
  if (usos.size > 5000) {
    for (const [k, v] of usos) { if (!v.some(t => agora - t < janelaMs)) usos.delete(k); }
  }
  return true;
}

function origemPermitida(req) {
  const sf = req.headers['sec-fetch-site'];
  if (sf) return sf === 'same-origin'; // enviado pelo navegador; a página não consegue falsificar
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host.toLowerCase() === String(req.headers.host || '').toLowerCase(); } catch (e) { return false; }
}

function iguais(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** @returns {boolean} true = pode seguir; false = a resposta de erro já foi enviada */
function verificarAcesso(req, res, { rota = 'api', max = 60 } = {}) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; } // sem cabeçalhos CORS: nenhum outro site é liberado

  const esperado = process.env.APP_ACCESS_TOKEN;
  if (esperado) {
    const recebido = req.headers['x-acesso-token'];
    if (!recebido || !iguais(recebido, esperado)) {
      res.status(401).json({ error: 'Código de acesso ausente ou incorreto. Preencha o campo "Código de acesso" nas configurações da ferramenta.' });
      return false;
    }
  } else if (!origemPermitida(req)) {
    res.status(403).json({ error: 'Acesso negado: este recurso só pode ser usado pelo próprio site da ferramenta.' });
    return false;
  }

  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'desconhecido').split(',')[0].trim();
  if (!limitarUso(`${rota}:${ip}`, { max })) {
    res.status(429).json({ error: 'Muitas requisições em pouco tempo. Aguarde alguns minutos e tente de novo.' });
    return false;
  }
  return true;
}

module.exports = { verificarAcesso, limitarUso, origemPermitida };
