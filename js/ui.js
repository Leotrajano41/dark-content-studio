/**
 * Módulo de Interface do Usuário (UI Helper)
 */
const UI = {
  /**
   * Inicializa navegadores de abas
   */
  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.classList.add('active');
        }
      });
    });
  },

  /**
   * Configura comportamento dos Comboboxes com opção "Personalizável"
   */
  setupConditionalCombobox(selectId, containerCustomId, inputCustomId) {
    const selectEl = document.getElementById(selectId);
    const containerEl = document.getElementById(containerCustomId);

    if (!selectEl || !containerEl) return;

    selectEl.addEventListener('change', () => {
      if (selectEl.value === 'Personalizável') {
        containerEl.classList.remove('hidden');
        if (inputCustomId) {
          const inputEl = document.getElementById(inputCustomId);
          if (inputEl) inputEl.focus();
        }
      } else {
        containerEl.classList.add('hidden');
      }
    });
  },

  /**
   * Retorna o valor real de um campo (do select ou do input customizado)
   */
  getValue(selectId, inputCustomId) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return '';

    if (selectEl.value === 'Personalizável' && inputCustomId) {
      const inputEl = document.getElementById(inputCustomId);
      return inputEl ? inputEl.value.trim() || 'Personalizado' : 'Personalizado';
    }
    return selectEl.value;
  },

  /**
   * Dispara um aviso tipo Toast (sucesso, erro, warning)
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;

    if (type === 'error') {
      iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    } else if (type === 'warning') {
      iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  },

  /**
   * Controla o estado de carregamento do botão (Spinner & Disabled)
   */
  setButtonLoading(buttonEl, isLoading, loadingText = 'Gerando com IA...') {
    if (!buttonEl) return;
    const spinner = buttonEl.querySelector('.spinner');
    const textSpan = buttonEl.querySelector('.btn-text');

    if (isLoading) {
      buttonEl.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (textSpan) {
        buttonEl.dataset.originalText = textSpan.innerText;
        textSpan.innerText = loadingText;
      }
    } else {
      buttonEl.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (textSpan && buttonEl.dataset.originalText) {
        textSpan.innerText = buttonEl.dataset.originalText;
      }
    }
  },

  /**
   * Atualiza o badge de status da API no cabeçalho da página
   */
  updateApiStatusBadge() {
    const badge = document.getElementById('api-status-badge');
    if (!badge) return;

    const key = OpenRouterAPI.getApiKey();
    if (key) {
      badge.className = 'status-badge status-active';
      badge.innerHTML = '<span class="status-dot"></span> API Configurada';
    } else {
      badge.className = 'status-badge status-pending';
      badge.innerHTML = '<span class="status-dot"></span> API Não Configurada';
    }
  },

  /**
   * Inicializa botões de cópia para a área de transferência
   */
  initClipboardButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-copy');
      if (!btn) return;

      const targetId = btn.getAttribute('data-clipboard-target');
      const targetTextarea = document.getElementById(targetId);

      if (!targetTextarea || !targetTextarea.value.trim()) {
        UI.showToast('Nada para copiar. Gere o conteúdo primeiro!', 'warning');
        return;
      }

      navigator.clipboard.writeText(targetTextarea.value)
        .then(() => {
          const originalHTML = btn.innerHTML;
          btn.classList.add('copied');
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copiado!
          `;

          UI.showToast('Conteúdo copiado para a área de transferência!');

          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalHTML;
          }, 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar: ', err);
          UI.showToast('Falha ao copiar. Tente selecionar manualmente.', 'error');
        });
    });
  }
};
