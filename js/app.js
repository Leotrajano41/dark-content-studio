/**
 * Controlador Principal da Aplicação com Integração OpenRouter API
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicialização de UI
  UI.initTabs();
  UI.initClipboardButtons();

  // 2. Carregar Configurações salvas da API
  const inputApiKey = document.getElementById('input-api-key');
  const inputApiModel = document.getElementById('input-api-model');

  if (inputApiKey) inputApiKey.value = OpenRouterAPI.getApiKey();
  if (inputApiModel) inputApiModel.value = OpenRouterAPI.getModel();
  UI.updateApiStatusBadge();

  // Listener para Salvar Configurações da API
  document.getElementById('btn-save-api-config').addEventListener('click', () => {
    const key = inputApiKey.value;
    const model = inputApiModel.value;

    OpenRouterAPI.saveConfig(key, model);
    UI.updateApiStatusBadge();

    if (key.trim()) {
      UI.showToast(`Configurações salvas! Modelo: ${OpenRouterAPI.getModel()}`);
    } else {
      UI.showToast('Configurações salvas sem API Key. A ferramenta funcionará em modo gerador de prompts.', 'warning');
    }
  });

  // 3. Comboboxes Condicionais ("Personalizável")
  UI.setupConditionalCombobox('select-tema', 'container-tema-custom', 'input-tema-custom');
  UI.setupConditionalCombobox('select-idioma', 'container-idioma-custom', 'input-idioma-custom');
  UI.setupConditionalCombobox('select-tom', 'container-tom-custom', 'input-tom-custom');
  UI.setupConditionalCombobox('select-gancho', 'container-gancho-custom', 'input-gancho-custom');
  UI.setupConditionalCombobox('select-estilo-thumb', 'container-estilo-thumb-custom', 'input-estilo-thumb-custom');
  UI.setupConditionalCombobox('select-cores-thumb', 'container-cores-thumb-custom', 'input-cores-thumb-custom');
  UI.setupConditionalCombobox('select-elementos-thumb', 'container-elementos-thumb-custom', 'input-elementos-thumb-custom');

  // Elementos de Sincronização
  const selectTema = document.getElementById('select-tema');
  const inputTemaCustom = document.getElementById('input-tema-custom');
  const inputTemaThumb = document.getElementById('input-tema-thumb');
  const inputTemaSeo = document.getElementById('input-tema-seo');
  const inputIdeiaEscolhida = document.getElementById('input-ideia-escolhida');
  const textareaRoteiroGerado = document.getElementById('textarea-roteiro-gerado');

  // 4. Sincronização Automática do Tema
  function syncTema() {
    const temaAtual = UI.getValue('select-tema', 'input-tema-custom');
    if (inputTemaThumb && (!inputTemaThumb.value || inputTemaThumb.dataset.autoSynced === 'true')) {
      inputTemaThumb.value = temaAtual;
      inputTemaThumb.dataset.autoSynced = 'true';
    }
    if (inputTemaSeo && (!inputTemaSeo.value || inputTemaSeo.dataset.autoSynced === 'true')) {
      inputTemaSeo.value = temaAtual;
      inputTemaSeo.dataset.autoSynced = 'true';
    }
  }

  selectTema.addEventListener('change', syncTema);
  if (inputTemaCustom) inputTemaCustom.addEventListener('input', syncTema);
  if (inputTemaThumb) inputTemaThumb.addEventListener('input', () => inputTemaThumb.dataset.autoSynced = 'false');
  if (inputTemaSeo) inputTemaSeo.addEventListener('input', () => inputTemaSeo.dataset.autoSynced = 'false');
  syncTema();

  /**
   * Executa a chamada à API ou devolve o prompt caso a chave não esteja inserida
   */
  async function executeApiCall(btnId, promptText, outputTextareaId, successMessage) {
    const btn = document.getElementById(btnId);
    const outputEl = document.getElementById(outputTextareaId);
    const hasApiKey = Boolean(OpenRouterAPI.getApiKey());

    UI.setButtonLoading(btn, true);

    try {
      if (hasApiKey) {
        const aiResponse = await OpenRouterAPI.generateContent(promptText);
        if (outputEl) outputEl.value = aiResponse;
        UI.showToast(successMessage || 'Conteúdo gerado com sucesso via OpenRouter!');
        return aiResponse;
      } else {
        // Fallback: Exibe o prompt gerado caso a chave não esteja configurada
        if (outputEl) outputEl.value = promptText;
        UI.showToast('Prompt gerado! Insira sua API Key no topo para gerar diretamente com IA.', 'warning');
        return promptText;
      }
    } catch (err) {
      UI.showToast(err.message, 'error');
      // Em caso de erro na chamada da API, mostra o prompt para não travar o fluxo do usuário
      if (outputEl && !outputEl.value) outputEl.value = promptText;
    } finally {
      UI.setButtonLoading(btn, false);
    }
  }

  // 5. Handlers dos Botões de Ação

  // Seção 2.1 - 10 Ideias Virais
  document.getElementById('btn-gerar-prompt-ideias').addEventListener('click', async () => {
    const tema = UI.getValue('select-tema', 'input-tema-custom');
    const idioma = UI.getValue('select-idioma', 'input-idioma-custom');
    const promptText = PromptEngine.generateIdeasPrompt({ tema, idioma });

    await executeApiCall(
      'btn-gerar-prompt-ideias',
      promptText,
      'output-prompt-ideias',
      '10 Ideias virais geradas com sucesso!'
    );
  });

  // Seção 2.1 - Roteiro Completo
  document.getElementById('btn-gerar-prompt-roteiro').addEventListener('click', async () => {
    const ideia = inputIdeiaEscolhida.value.trim() || UI.getValue('select-tema', 'input-tema-custom');
    const estiloRoteiro = document.getElementById('select-estilo-roteiro').value;
    const tomVoz = UI.getValue('select-tom', 'input-tom-custom');
    const tipoGancho = UI.getValue('select-gancho', 'input-gancho-custom');
    const idioma = UI.getValue('select-idioma', 'input-idioma-custom');

    const promptText = PromptEngine.generateScriptPrompt({
      ideia,
      estiloRoteiro,
      tomVoz,
      tipoGancho,
      idioma
    });

    const resultText = await executeApiCall(
      'btn-gerar-prompt-roteiro',
      promptText,
      'output-prompt-roteiro',
      'Roteiro completo gerado com sucesso!'
    );

    // Auto-transmite o roteiro gerado para a Seção 2 (Mídias)
    if (resultText && textareaRoteiroGerado) {
      textareaRoteiroGerado.value = resultText;
    }
  });

  // Seção 2.2 - Keywords de Mídia
  document.getElementById('btn-gerar-prompt-keywords').addEventListener('click', async () => {
    const roteiro = textareaRoteiroGerado.value.trim();
    if (!roteiro) {
      UI.showToast('Cole ou gere o roteiro no campo acima primeiro!', 'warning');
      return;
    }

    const promptText = PromptEngine.generateMediaKeywordsPrompt({ roteiro });

    await executeApiCall(
      'btn-gerar-prompt-keywords',
      promptText,
      'output-prompt-keywords',
      'Keywords de mídia geradas!'
    );
  });

  // Seção 2.2 - Prompts IA Visual
  document.getElementById('btn-gerar-prompt-imagens-ia').addEventListener('click', async () => {
    const roteiro = textareaRoteiroGerado.value.trim();
    if (!roteiro) {
      UI.showToast('Cole ou gere o roteiro no campo acima primeiro!', 'warning');
      return;
    }

    const promptText = PromptEngine.generateAiVisualPrompts({ roteiro });

    await executeApiCall(
      'btn-gerar-prompt-imagens-ia',
      promptText,
      'output-prompt-imagens-ia',
      'Prompts para IA visual gerados!'
    );
  });

  // Seção 2.3 - Thumbnails A/B/C
  document.getElementById('btn-gerar-prompts-thumb').addEventListener('click', async () => {
    const tema = inputTemaThumb.value.trim() || UI.getValue('select-tema', 'input-tema-custom');
    const estilo = UI.getValue('select-estilo-thumb', 'input-estilo-thumb-custom');
    const cores = UI.getValue('select-cores-thumb', 'input-cores-thumb-custom');
    const elementos = UI.getValue('select-elementos-thumb', 'input-elementos-thumb-custom');

    const promptText = PromptEngine.generateThumbnailPrompts({ tema, estilo, cores, elementos });
    const btn = document.getElementById('btn-gerar-prompts-thumb');
    const hasApiKey = Boolean(OpenRouterAPI.getApiKey());

    UI.setButtonLoading(btn, true);

    try {
      if (hasApiKey) {
        const aiResponse = await OpenRouterAPI.generateContent(promptText);

        // Se a resposta contiver Opção A/B/C, tenta separar nos 3 blocos
        const partsA = aiResponse.split(/Opção B|Conceito B/i);
        const promptA = partsA[0] || aiResponse;
        let promptB = '';
        let promptC = '';

        if (partsA[1]) {
          const partsBC = partsA[1].split(/Opção C|Conceito C/i);
          promptB = partsBC[0] || '';
          promptC = partsBC[1] || '';
        }

        document.getElementById('output-thumb-a').value = promptA.trim();
        document.getElementById('output-thumb-b').value = promptB ? ('Opção B' + promptB).trim() : aiResponse;
        document.getElementById('output-thumb-c').value = promptC ? ('Opção C' + promptC).trim() : aiResponse;

        UI.showToast('3 Prompts de Thumbnail gerados via IA!');
      } else {
        // Fallback local caso não tenha API key
        const local = PromptEngine.generateThumbnailPrompts({ tema, estilo, cores, elementos });
        document.getElementById('output-thumb-a').value = `Option A (Text & Mystery): Cinematic YouTube thumbnail for "${tema}". High contrast dark aesthetic, large bold title text "A VERDADE REVELADA", single dramatic symbolic item in gold spotlight, subtle ancient textures, Explicador Bíblico channel style --ar 16:9`;
        document.getElementById('output-thumb-b').value = `Option B (Symbolic & Dramatic): Dramatic historical digital painting thumbnail for "${tema}". Dark red and sepia color scheme, central ancient icon with intense rim lighting, text "O FIM TRÁGICO" --ar 16:9`;
        document.getElementById('output-thumb-c').value = `Option C (Revelation & Contrast): Mysterious YouTube thumbnail about "${tema}". Dividing background with ancient scroll vs shadow, bold title "NÃO FOI COMO PENSAVA", maximum visual curiosity --ar 16:9`;

        UI.showToast('3 Prompts de Thumbnail gerados (Modo Modelo)! Insira a API Key no topo para gerar via IA.', 'warning');
      }
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading(btn, false);
    }
  });

  // Seção 2.4 - SEO Completo
  document.getElementById('btn-gerar-prompt-seo').addEventListener('click', async () => {
    const tema = inputTemaSeo.value.trim() || UI.getValue('select-tema', 'input-tema-custom');
    const resumo = document.getElementById('textarea-resumo-seo').value.trim();
    const idioma = UI.getValue('select-idioma', 'input-idioma-custom');

    const promptText = PromptEngine.generateSeoPrompt({ tema, resumo, idioma });

    await executeApiCall(
      'btn-gerar-prompt-seo',
      promptText,
      'output-prompt-seo',
      'SEO Completo gerado com sucesso!'
    );
  });

  // 6. Botão "Carregar Exemplo" (Preset demonstrativo)
  document.getElementById('btn-load-preset').addEventListener('click', () => {
    selectTema.value = 'Fins Trágicos Bíblicos';
    document.getElementById('select-idioma').value = 'Português (Brasil)';
    document.getElementById('select-estilo-roteiro').value = 'Vídeo Longo (aprox. 18-20 minutos)';
    document.getElementById('select-tom').value = 'Investigativo e Curioso';
    document.getElementById('select-gancho').value = 'Pergunta Intrigante';

    document.querySelectorAll('.custom-input-container').forEach(el => el.classList.add('hidden'));

    inputIdeiaEscolhida.value = 'O Trágico Fim de Judas Iscariotes Que a Teologia Tradicional Ocultou';

    const sampleScript = `HOOK (0-15s): Você sabia que o relato sobre a morte de Judas Iscariotes no Evangelho de Mateus contraria frontalmente o que está escrito no livro de Atos dos Apóstolos?

INTRODUÇÃO (0-45s): Poucos personagens bíblicos despertam tanto fascínio e aversão quanto Judas Iscariotes. Conhecido historicamente como o traidor de Jesus por 30 moedas de prata, o seu destino final é cercado de mistérios e traduções contraditórias...

PONTO 1: A Contradição das 30 Moedas de Prata e o Campo de Sangue
Afirmação: Segundo Mateus 27, Judas arrependeu-se e devolveu as moedas aos sacerdotes. Porém, em Atos 1, Pedro declara que o próprio Judas comprou o campo com o preço da iniquidade.
Desenvolvimento: Para entender essa aparente contradição histórica, precisamos analisar os costumes judaicos de compra e remissão de terras no primeiro século...`;

    textareaRoteiroGerado.value = sampleScript;
    document.getElementById('textarea-resumo-seo').value = 'Vídeo focado no estudo comparativo do fim de Judas Iscariotes entre os textos de Mateus 27 e Atos 1, abordando o remorso, as 30 moedas de prata e o contexto histórico de Jerusalém no Século I.';

    syncTema();

    // Dispara geração demonstrativa
    document.getElementById('btn-gerar-prompt-ideias').click();
    document.getElementById('btn-gerar-prompt-roteiro').click();
    document.getElementById('btn-gerar-prompt-keywords').click();
    document.getElementById('btn-gerar-prompts-thumb').click();
    document.getElementById('btn-gerar-prompt-seo').click();

    UI.showToast('Exemplo demonstrativo carregado!');
  });

  // 7. Botão "Limpar"
  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('Deseja limpar todos os campos e conteúdos gerados?')) {
      document.querySelectorAll('input[type="text"]').forEach(i => {
        if (i.id !== 'input-api-model') i.value = '';
      });
      document.querySelectorAll('textarea').forEach(t => t.value = '');
      selectTema.value = 'Fins Trágicos Bíblicos';
      document.getElementById('select-idioma').value = 'Português (Brasil)';
      document.querySelectorAll('.custom-input-container').forEach(el => el.classList.add('hidden'));
      syncTema();
      UI.showToast('Todos os campos foram limpos.', 'warning');
    }
  });
});
