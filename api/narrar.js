// api/narrar.js
// Serverless Function — Narração via OpenAI TTS (gpt-4o-mini-tts)
//
// POST /api/narrar
// Body (application/json): { texto: string, voz: string, tom: string }
// Response: áudio MP3 binário (audio/mpeg)
//
// LIMITE DE TAMANHO: Vercel Serverless tem limite de ~4.5 MB por resposta,
// o que equivale a aproximadamente 4-5 minutos de áudio em MP3.
// Para roteiros completos (18-20 min), recomenda-se dividir em seções no frontend.

const CHUNK_MAX_CHARS = 3500; // Margem de segurança abaixo do limite de 4096 da OpenAI TTS

// Instruções de narração por tom — em inglês para melhor aderência da OpenAI TTS
const TOM_INSTRUCTIONS = {
  'Investigativo e Curioso':
    'Narrate in a deeply investigative and curious tone. Build suspense progressively, ' +
    'pause subtly at key revelations, and convey a continuous sense of discovery and intrigue. ' +
    'Keep the listener on edge, as if slowly unveiling a great mystery.',

  'Didático e Sério':
    'Narrate in a clear, didactic and serious tone. Be authoritative, measured and precise. ' +
    'Deliver each piece of information with gravitas and confidence, like an expert academic ' +
    'presenting irrefutable evidence.',

  'Inspirador e Reflexivo':
    'Narrate in an inspiring and deeply reflective tone. Be thoughtful, emotionally resonant ' +
    'and moving. Allow the weight of each statement to land. Create a sense of spiritual wonder, ' +
    'depth and transcendence.',

  'Dramático e Impactante':
    'Narrate in a dramatic and highly impactful tone. Use strong emphasis on key words, ' +
    'vary your pace purposefully for maximum effect, and deliver each phrase with intensity ' +
    'and cinematic gravitas — like a seasoned Hollywood documentary narrator.',
};

const DEFAULT_INSTRUCTION =
  'Narrate in a compelling, clear and engaging tone suited for a biblical documentary YouTube channel. ' +
  'Be authoritative yet approachable, dramatic when the content calls for it, and keep the ' +
  'audience captivated throughout.';

// ---------------------------------------------------------------------------
// Algoritmo de chunking: parágrafo → frase → sem corte de palavra/frase
// ---------------------------------------------------------------------------

/**
 * Divide texto longo em pedaços respeitando limites naturais de linguagem.
 * Prioridade: fim de parágrafo (\n\n) > fim de frase (.?!) > nunca mid-frase.
 *
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function splitTextIntoChunks(text, maxChars = CHUNK_MAX_CHARS) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const candidate = currentChunk ? currentChunk + '\n\n' + para : para;

    if (candidate.length <= maxChars) {
      // Parágrafo cabe junto com o acumulado
      currentChunk = candidate;
    } else {
      // Salva o acumulado antes de processar o parágrafo atual
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      if (para.length > maxChars) {
        // Parágrafo sozinho > limite: corta por sentenças
        const sentenceChunks = splitBySentence(para, maxChars);
        // Todos menos o último vão como chunks fechados
        for (let i = 0; i < sentenceChunks.length - 1; i++) {
          chunks.push(sentenceChunks[i]);
        }
        // O último pode se combinar com o próximo parágrafo
        currentChunk = sentenceChunks[sentenceChunks.length - 1] || '';
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Divide texto em frases, agrupando-as até o limite de caracteres.
 * Usa lookbehind para cortar APÓS a pontuação (. ? !), nunca antes.
 *
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function splitBySentence(text, maxChars) {
  const result = [];
  // Divide após . ? ! seguido de espaço — mantém a pontuação com a frase de origem
  const sentences = text.split(/(?<=[.?!])\s+/);
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? current + ' ' + sentence : sentence;

    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) result.push(current.trim());

      if (sentence.length > maxChars) {
        // Frase única excede o limite — adiciona mesmo assim (não é possível cortar sem
        // quebrar a frase; melhor enviar um pedaço ligeiramente maior do que cortar mid-frase)
        result.push(sentence.trim());
        current = '';
      } else {
        current = sentence;
      }
    }
  }

  if (current.trim()) result.push(current.trim());
  return result.filter(c => c.length > 0);
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

module.exports = async function handler(req, res) {
  // OPTIONS: preflight CORS já tratado pelo vercel.json; retornamos 204 aqui por segurança
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 1. Validação da API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY não está configurada nas variáveis de ambiente do servidor.',
    });
  }

  // 2. Extração e validação dos parâmetros do body (Vercel auto-parseia application/json)
  const { texto, voz = 'alloy', tom = '' } = req.body || {};

  if (!texto || typeof texto !== 'string' || !texto.trim()) {
    return res.status(400).json({
      error: 'Parâmetro obrigatório ausente: "texto" deve ser uma string não vazia.',
    });
  }

  // Vozes válidas da OpenAI TTS
  const validVoices = ['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
  const selectedVoice = validVoices.includes(voz) ? voz : 'alloy';

  const instruction = TOM_INSTRUCTIONS[tom] || DEFAULT_INSTRUCTION;
  const chunks = splitTextIntoChunks(texto.trim());

  if (chunks.length === 0) {
    return res.status(400).json({
      error: 'Não foi possível extrair conteúdo do texto fornecido após o processamento.',
    });
  }

  console.log(
    `[narrar] Iniciando: ${chunks.length} pedaço(s) | voz="${selectedVoice}" | tom="${tom}"`
  );

  // 3. Geração do áudio: chama OpenAI TTS para cada pedaço e acumula os buffers
  try {
    const audioBuffers = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[narrar] Pedaço ${i + 1}/${chunks.length} — ${chunk.length} chars`);

      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          input: chunk,
          voice: selectedVoice,
          instructions: instruction,
          response_format: 'mp3',
        }),
      });

      if (!ttsResponse.ok) {
        // Tenta extrair mensagem de erro da OpenAI
        const errBody = await ttsResponse.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || `Erro HTTP ${ttsResponse.status} da OpenAI TTS`;
        console.error(`[narrar] Falha no pedaço ${i + 1}:`, errMsg);
        return res.status(502).json({
          error: `Falha ao gerar narração (pedaço ${i + 1} de ${chunks.length}): ${errMsg}`,
        });
      }

      const arrayBuffer = await ttsResponse.arrayBuffer();
      const chunkBuffer = Buffer.from(arrayBuffer);
      audioBuffers.push(chunkBuffer);
      console.log(`[narrar] Pedaço ${i + 1} OK — ${chunkBuffer.length} bytes`);
    }

    // 4. Concatenação direta de buffers MP3
    // Válido pois todos os pedaços foram gerados com os mesmos parâmetros (voz, formato, modelo)
    const finalAudio = Buffer.concat(audioBuffers);
    console.log(`[narrar] Áudio final concatenado: ${finalAudio.length} bytes`);

    // 5. Retorna o MP3 como resposta binária
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(finalAudio.length));
    res.setHeader('Content-Disposition', 'inline; filename="narracao.mp3"');
    return res.status(200).end(finalAudio);

  } catch (err) {
    console.error('[narrar] Erro inesperado:', err);
    return res.status(500).json({
      error: `Erro interno no servidor: ${err.message}`,
    });
  }
};
