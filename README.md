# 🚀 Ferramenta de Automação de Conteúdo para Canais "Dark"

Uma ferramenta web poderosa para otimizar a criação de conteúdo de vídeo (curto e longo) para canais "dark" no YouTube e outras redes sociais. Inspirada na "fórmula de sucesso" do canal "Explicador Bíblico", esta ferramenta oferece geração de conteúdo de IA diretamente na aplicação, com foco em usabilidade e eficiência.

## ✨ Funcionalidades Principais

-   **Geração de Ideias e Roteiros:** Crie ideias de vídeos virais e roteiros completos, adaptados ao estilo do canal modelo, com opções de idioma, tom de voz e tipo de gancho.
-   **Geração de Mídia:** Obtenha palavras-chave para bancos de imagens/vídeos (Pixabay, Pexels, Envato) e prompts detalhados para IAs visuais (Midjourney, DALL-E 3, RunwayML) com estética dramática e histórica.
-   **Geração de Thumbnails A/B/C:** Gere 3 prompts distintos para IAs de imagem, otimizados para testes A/B/C, seguindo o estilo visual do canal modelo.
-   **Geração de SEO Completo:** Crie títulos otimizados com CAPS LOCK estratégico, tags e hashtags para maximizar a visibilidade do seu vídeo.
-   **Integração Direta com OpenRouter API:** Configure sua API Key e modelo de IA para gerar conteúdo diretamente na ferramenta.
-   **Usabilidade Aprimorada:** Tooltips informativos, descrições de seção claras e indicadores de carregamento para uma experiência de usuário intuitiva.

## 🛠️ Tecnologias Utilizadas

-   **HTML5:** Estrutura semântica da aplicação.
-   **CSS3:** Estilização moderna com Glassmorphism, paleta de cores sóbria e tipografia otimizada (Google Fonts: Cinzel, Inter, JetBrains Mono).
-   **JavaScript:** Lógica de front-end, gerenciamento de UI, geração de prompts internos e integração com a API da OpenRouter.
-   **OpenRouter API:** Para comunicação com diversos modelos de IA.

## ⚙️ Como Configurar e Usar

1.  **Clone o Repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO]
    cd nome-do-seu-projeto
    ```
2.  **Abra a Ferramenta:**
    *   Abra o arquivo `index.html` diretamente no seu navegador web.
    *   Alternativamente, você pode usar um servidor local (ex: `python3 -m http.server 8080` no terminal) e acessar `http://localhost:8080`.
3.  **Configure a API:**
    *   No painel superior da ferramenta, insira sua **API Key da OpenRouter** e o **Modelo de IA** desejado (ex: `gpt-4o`, `claude-3.5-sonnet`).
    *   Clique em **"Salvar Configurações"**. Suas credenciais serão salvas localmente no seu navegador (localStorage).
4.  **Comece a Criar Conteúdo:**
    *   Use os comboboxes e campos de texto para definir suas preferências.
    *   Clique nos botões **"Gerar..."** para que a IA crie o conteúdo diretamente na ferramenta.
    *   Para uma demonstração rápida, clique no botão **"Carregar Exemplo"** no canto superior direito.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
