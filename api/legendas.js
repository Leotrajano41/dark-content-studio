// api/legendas.js
// Serverless Function — Legendas via AssemblyAI
//
// POST /api/legendas
// Body: áudio MP3 binário (Content-Type: audio/mpeg)
// Response: conteúdo SRT como texto (text/plain; charset=utf-8)
//
// Fluxo:
//   1. Lê o body binário do áudio (sem auto-parsing do Vercel, pois é audio/mpeg)
//   2. Faz upload do áudio para AssemblyAI (/v2/upload)
//   3. Solicita transcrição com timestamps por palavra (/v2/transcript)
//   4. Polling até status=completed (timeout de 55s)
//   5. Converte o array de words para formato SRT padrão
//   6. Retorna o SRT como text/plain
//
// LIMITE: Vercel Hobby aceita body até ~4.5 MB. Para áudios maiores (>5 min),
// considere Vercel Pro ou dividir o áudio em segmentos no frontend.

const ASSEMBLYAI_BASE   = 'https://api.assemblyai.com/v2';
const POLL_INTERVAL_MS  = 3000;   // 3 segundos entre cada verificação de status
const POLL_TIMEOUT_MS   = 270000; // 270s (4.5 min) para suportar com folga áudios de 18+ min

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Lê o body da requisição como Buffer binário bruto (bypassa o auto-parser do Vercel). */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Aguarda ms milissegundos. */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Etapas do pipeline AssemblyAI
// ---------------------------------------------------------------------------

/**
 * Faz upload do buffer de áudio para a AssemblyAI.
 * @returns {Promise<string>} upload_url
 */
async function uploadAudio(audioBuffer, apiKey) {
  const response = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Falha no upload para AssemblyAI (HTTP ${response.status}): ${err.error || 'sem detalhe'}`
    );
  }

  const { upload_url } = await response.json();
  if (!upload_url) throw new Error('AssemblyAI não retornou upload_url após o upload.');
  return upload_url;
}

/**
 * Solicita a transcrição com timestamps por palavra e pontuação.
 * @returns {Promise<string>} ID da transcrição
 */
async function requestTranscription(audioUrl, apiKey) {
  const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url:   audioUrl,
      punctuate:   true,   // Adiciona pontuação automática
      format_text: true,   // Capitalização e formatação
      // word timestamps são incluídos por padrão no campo "words" da resposta
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Falha ao solicitar transcrição na AssemblyAI (HTTP ${response.status}): ${err.error || 'sem detalhe'}`
    );
  }

  const { id, status } = await response.json();
  if (!id) throw new Error('AssemblyAI não retornou ID da transcrição.');

  console.log(`[legendas] Transcrição iniciada — ID: ${id} | status inicial: ${status}`);
  return id;
}

/**
 * Polling até a transcrição completar, falhar ou atingir o timeout.
 * @returns {Promise<Object>} Objeto completo da transcrição (com campo "words")
 */
async function pollTranscription(transcriptId, apiKey) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Erro ao consultar status da transcrição (HTTP ${response.status}): ${err.error || 'sem detalhe'}`
      );
    }

    const data = await response.json();
    const remaining = Math.round((deadline - Date.now()) / 1000);
    console.log(`[legendas] Polling — status: "${data.status}" | tempo restante: ${remaining}s`);

    if (data.status === 'completed') return data;

    if (data.status === 'error') {
      throw new Error(`AssemblyAI reportou erro na transcrição: ${data.error}`);
    }

    // Status 'queued' ou 'processing' — continua polling
  }

  throw new Error(
    'Timeout: a transcrição demorou mais de 55 segundos. ' +
    'Tente com um áudio mais curto ou use a AssemblyAI diretamente para arquivos longos.'
  );
}

// ---------------------------------------------------------------------------
// Geração do SRT
// ---------------------------------------------------------------------------

/**
 * Converte o array de palavras com timestamps da AssemblyAI em formato SRT padrão.
 *
 * Estratégia de agrupamento:
 * - Máximo de 7 palavras por bloco de legenda
 * - Quebra antecipada ao detectar fim de frase (. ? !)
 *
 * @param {Array<{text: string, start: number, end: number}>} words
 * @returns {string} Conteúdo SRT completo
 */
function generateSRT(words) {
  if (!words || words.length === 0) return '';

  const MAX_WORDS_PER_BLOCK = 7;
  const srtBlocks = [];
  let blockIndex = 1;
  let i = 0;

  while (i < words.length) {
    const blockStartMs = words[i].start;
    const blockWords = [];

    while (i < words.length && blockWords.length < MAX_WORDS_PER_BLOCK) {
      const word = words[i];
      blockWords.push(word.text);
      i++;

      // Quebra antecipada em fim de frase (ignora aspas/parênteses ao checar a pontuação)
      const cleanedText = word.text.replace(/['"»)\]]+$/, '');
      if (/[.?!]$/.test(cleanedText)) break;
    }

    const blockEndMs = words[i - 1].end;

    srtBlocks.push(
      `${blockIndex}\n` +
      `${msToSrtTime(blockStartMs)} --> ${msToSrtTime(blockEndMs)}\n` +
      `${blockWords.join(' ')}`
    );
    blockIndex++;
  }

  return srtBlocks.join('\n\n');
}

/**
 * Converte milissegundos para o formato de timestamp SRT: HH:MM:SS,mmm
 */
function msToSrtTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const s   = totalSec % 60;
  const msr = ms % 1000;
  return `${p2(h)}:${p2(m)}:${p2(s)},${p3(msr)}`;
}

function p2(n) { return String(n).padStart(2, '0'); }
function p3(n) { return String(n).padStart(3, '0'); }

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

module.exports = async function handler(req, res) {
  // OPTIONS: preflight CORS já tratado pelo vercel.json
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1. Validação da API Key
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ASSEMBLYAI_API_KEY não está configurada nas variáveis de ambiente do servidor.',
    });
  }

  // 2. GET: Entrega token para upload direto do áudio via navegador para a AssemblyAI (contorna limite 4.5MB da Vercel)
  if (req.method === 'GET') {
    return res.status(200).json({ token: apiKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use GET ou POST.' });
  }

  const contentType = req.headers['content-type'] || '';

  try {
    let uploadUrl = '';

    // Modo 1 (Recomendado para áudios longos 18+ min): Cliente enviou JSON com { audio_url } após upload direto
    if (contentType.includes('application/json')) {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try { bodyData = JSON.parse(bodyData); } catch (e) {}
      } else if (!bodyData) {
        const raw = await readRawBody(req);
        try { bodyData = JSON.parse(raw.toString('utf-8')); } catch (e) {}
      }

      uploadUrl = bodyData?.audio_url || bodyData?.audioUrl || '';
      if (!uploadUrl) {
        return res.status(400).json({
          error: 'JSON inválido: informe o campo "audio_url" retornado pelo upload da AssemblyAI.',
        });
      }
      console.log('[legendas] Transcrição via URL direta de áudio recebida:', uploadUrl);

    // Modo 2: Upload binário direto pelo body (áudios curtos < 4.5MB)
    } else if (contentType.includes('audio/')) {
      console.log('[legendas] Lendo áudio do body...');
      const audioBuffer = await readRawBody(req);

      if (!audioBuffer || audioBuffer.length === 0) {
        return res.status(400).json({
          error: 'Body vazio: envie o arquivo de áudio MP3 binário no corpo da requisição.',
        });
      }
      console.log(`[legendas] Áudio recebido: ${audioBuffer.length} bytes`);

      console.log('[legendas] Fazendo upload para AssemblyAI...');
      uploadUrl = await uploadAudio(audioBuffer, apiKey);
      console.log('[legendas] Upload OK:', uploadUrl);

    } else {
      return res.status(400).json({
        error:
          'Content-Type incorreto. Envie "application/json" com { "audio_url": "..." } ou áudio com "Content-Type: audio/mpeg".',
      });
    }

    // 3. Solicita transcrição
    const transcriptId = await requestTranscription(uploadUrl, apiKey);

    // 4. Polling até completar
    console.log('[legendas] Aguardando processamento...');
    const transcript = await pollTranscription(transcriptId, apiKey);
    console.log(`[legendas] Transcrição concluída! ${transcript.words?.length || 0} palavra(s).`);

    // 7. Valida que há palavras com timestamps
    if (!transcript.words || transcript.words.length === 0) {
      return res.status(422).json({
        error:
          'A transcrição foi concluída mas não retornou palavras com timestamps. ' +
          'Verifique se o áudio contém fala audível.',
      });
    }

    // 8. Gera SRT e retorna
    const srtContent = generateSRT(transcript.words);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="legendas.srt"');
    return res.status(200).send(srtContent);

  } catch (err) {
    console.error('[legendas] Erro:', err.message);
    return res.status(500).json({
      error: err.message || 'Erro interno no servidor.',
    });
  }
};
