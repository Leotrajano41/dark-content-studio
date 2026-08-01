/**
 * Módulo de Integração Direta com a API da OpenRouter
 */
const OpenRouterAPI = {
  // Chaves de armazenamento no localStorage
  KEY_STORAGE_KEY: 'dark_studio_openrouter_api_key',
  MODEL_STORAGE_KEY: 'dark_studio_openrouter_model',

  // Modelo Padrão caso não seja especificado
  DEFAULT_MODEL: 'google/gemini-2.0-flash-001',

  /**
   * Obtém a API Key salva
   */
  getApiKey() {
    return localStorage.getItem(this.KEY_STORAGE_KEY) || '';
  },

  /**
   * Obtém o modelo configurado
   */
  getModel() {
    return localStorage.getItem(this.MODEL_STORAGE_KEY) || this.DEFAULT_MODEL;
  },

  /**
   * Salva as configurações de API no localStorage
   */
  saveConfig(apiKey, model) {
    const cleanKey = apiKey.trim();
    const cleanModel = model.trim() || this.DEFAULT_MODEL;

    localStorage.setItem(this.KEY_STORAGE_KEY, cleanKey);
    localStorage.setItem(this.MODEL_STORAGE_KEY, cleanModel);
    return { apiKey: cleanKey, model: cleanModel };
  },

  /**
   * Envia o prompt interno para a API do OpenRouter e retorna a resposta da IA
   */
  async generateContent(promptText) {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    if (!apiKey) {
      throw new Error('API Key da OpenRouter não configurada. Insira sua chave no painel superior.');
    }

    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Dark Studio Pro'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente sênior especialista em produção de conteúdo, roteiros e SEO para canais dark no YouTube, seguindo a estética e fórmula de sucesso do canal Explicador Bíblico.'
            },
            {
              role: 'user',
              content: promptText
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let msg = `Erro HTTP ${response.status}`;

        if (response.status === 401) {
          msg = 'API Key inválida ou não autorizada na OpenRouter. Verifique sua chave nas configurações.';
        } else if (response.status === 402) {
          msg = 'Créditos insuficientes na sua conta OpenRouter.';
        } else if (response.status === 404) {
          msg = `Modelo de IA "${model}" não foi encontrado ou não está disponível na sua conta.`;
        } else if (response.status === 429) {
          msg = 'Limite de requisições (Rate Limit) atingido na OpenRouter. Aguarde alguns instantes.';
        } else if (errorData.error && errorData.error.message) {
          msg = `Erro OpenRouter: ${errorData.error.message}`;
        }

        throw new Error(msg);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Resposta vazia recebida da IA na OpenRouter.');
      }
    } catch (err) {
      console.error('OpenRouter API Error:', err);
      throw err;
    }
  }
};
