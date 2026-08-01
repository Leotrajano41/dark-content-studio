/**
 * Motor de Prompts Internos - Fórmula Explicador Bíblico
 */
const PromptEngine = {

  /**
   * Seção 2.1 - Prompt Interno para 10 Ideias Virais de Vídeos
   */
  generateIdeasPrompt({ tema, idioma }) {
    return `Atuando como um especialista em YouTube e SEO para canais 'dark' no nicho de ${tema}, gere 10 ideias de títulos e temas de vídeos que sigam a fórmula de sucesso do canal 'Explicador Bíblico', focando em curiosidade, revelação e quebra de mitos. As ideias devem ser virais e otimizadas para ${idioma}.

Formato de Saída:
Forneça as 10 ideias numeradas (1 a 10) com Títulos que utilizem a fórmula: Pergunta/Afirmação Impactante + Palavras-Chave Fortes + CAPS LOCK estratégico em termos chamativos + Promessa de Conteúdo Completo.`;
  },

  /**
   * Seção 2.1 - Prompt Interno para Roteiro Completo
   */
  generateScriptPrompt({ ideia, estiloRoteiro, tomVoz, tipoGancho, idioma }) {
    const duracaoText = estiloRoteiro.includes("1 minuto") ? "aproximadamente 1 minuto (vídeo curto)" : "aproximadamente 18-20 minutos (vídeo longo)";

    return `Atuando como roteirista profissional para canais 'dark' no YouTube, crie um roteiro completo para um vídeo sobre '${ideia}'. 

O roteiro deve ter um estilo de ${estiloRoteiro} (aprox. ${duracaoText}) e seguir a estrutura e o estilo de narrativa do canal 'Explicador Bíblico'. O tom deve ser ${tomVoz} e o gancho inicial ${tipoGancho}. 

Inclua obrigatoriamente:
- Hook (0-15s): Uma frase impactante.
- Introdução (0-45s): Contextualização e promessa do conteúdo.
- Pontos Enumerados: Divida o conteúdo em 3-7 pontos principais, cada um com Afirmação, Desenvolvimento, Evidências/Referências (se aplicável), e Análise/Impacto.
- CTAs Orgânicas: Sugestões de onde inserir chamadas para ação (like, inscrição, compartilhamento) com um motivo claro.
- Ganchos Internos: Frases para manter a retenção ao longo do vídeo.
- Conclusão: Síntese da mensagem e CTA final. 

O roteiro deve ser apenas o texto a ser falado, sem dicas de edição ou legendas, e no idioma ${idioma}.`;
  },

  /**
   * Seção 2.2 - Prompt Interno para Keywords de Mídia (Pixabay/Pexels/Envato)
   */
  generateMediaKeywordsPrompt({ roteiro }) {
    return `Com base no roteiro a seguir, identifique e liste as principais keywords (palavras-chave) para buscar vídeos e imagens de banco de dados (Pixabay, Pexels, Envato) que ilustrem cada segmento do texto. Divida as keywords por seções do roteiro.

Roteiro:
${roteiro}`;
  },

  /**
   * Seção 2.2 - Prompt Interno para IA Visual (Midjourney / DALL-E / RunwayML)
   */
  generateAiVisualPrompts({ roteiro }) {
    return `Atuando como diretor de arte e prompt engineer, crie prompts detalhados para uma IA de geração de imagens/vídeos (como Midjourney v6, DALL-E 3, RunwayML) que ilustrem visualmente cada segmento do roteiro a seguir. 

Os prompts devem capturar o estilo visual do canal 'Explicador Bíblico' (ilustrações simbólicas, cores sóbrias/dramáticas, impacto visual, estilo pintura histórica/iluminação chiaroscuro). 
Use proporção 16:9. Os prompts devem ser em inglês.

Roteiro:
${roteiro}`;
  },

  /**
   * Seção 2.3 - Prompt Interno para 3 Thumbnails A/B/C
   */
  generateThumbnailPrompts({ tema, estilo, cores, elementos }) {
    return `Crie 3 prompts distintos para uma IA de geração de imagens (como Midjourney, DALL-E 3) para thumbnails de YouTube sobre '${tema}'. Cada prompt deve ser para um teste A/B/C, seguindo o estilo do canal 'Explicador Bíblico' (texto grande, imagens simbólicas, cores sóbrias/dramáticas, composição clara, gerando curiosidade).

Diretrizes Escolhidas pelo Usuário:
- Estilo: ${estilo}
- Cores: ${cores}
- Elementos: ${elementos}

Forneça os 3 prompts com as seguintes estruturas:
Opção A (Texto & Mistério): Foco em texto impactante e um elemento visual sutil de mistério. Inclua indicação de texto grande.
Opção B (Foco Simbólico & Dramático): Imagem simbólica central com cores dramáticas e pouco texto.
Opção C (Revelação & Contraste): Elemento visual que sugere uma revelação ou contraste, com texto provocativo.

IMPORTANTE: Os 3 prompts visuais devem ser escritos em INGLÊS e incluir a proporção '--ar 16:9' no final de cada um. Forneça o resultado rotulando claramente Opção A, Opção B e Opção C.`;
  },

  /**
   * Seção 2.4 - Prompt Interno para SEO Completo
   */
  generateSeoPrompt({ tema, resumo, idioma }) {
    return `Atuando como especialista em SEO para YouTube, gere 3 opções de títulos otimizados, uma lista de tags relevantes (15-20) e 5-7 hashtags para um vídeo sobre '${tema}' com base no seguinte resumo/palavras-chave: 
${resumo || tema}

Os títulos devem seguir a fórmula do canal 'Explicador Bíblico' (impacto, curiosidade, CAPS LOCK estratégico, números) e ser no idioma ${idioma || 'Português (Brasil)'}.`;
  }
};
