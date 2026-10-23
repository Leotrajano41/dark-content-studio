## Opção "Inglês" (Idioma do Conteúdo)
- Status: disponível no dropdown, mas NÃO testada/calibrada.
- Fluxo de produção oficial: 100% português (roteiro + narração), título em inglês, alcance global via auto-dubbing do YouTube.
- Problemas conhecidos em inglês (teste Dalila, 02/10/2026): limite de frases de descarte e filtro de termos defensivos não funcionam em inglês.
- Antes de usar em produção: rodar tests/checklist-roteiro.js em inglês e corrigir até ficar 100% verde.
- Só trabalhar nesta opção com pedido explícito do Leo.

## Regras para quem mexer nos pós-processadores de texto (aprendidas na auditoria de 23/10/2026)
- NUNCA usar `\b` em regex que roda sobre português: o `\b` do JavaScript só entende letras ASCII e trata `ç`, `ã`, `é` etc. como borda de palavra ("força" virava "paraça", "então o rei" virava "então rei"). Usar `(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])` com a flag `u`.
- NUNCA trocar palavra por sinônimo/tradução automaticamente. Palavra proibida, inglês/espanhol e marcador repetido → a FRASE é regenerada pela IA (`reescreverFraseComIA`); se persistir, só aviso.
- Rótulos da Narração Limpa ("Afirmação:", "Conclusão:"...) só saem no INÍCIO da linha.
- Tradução padrão = ARC (`pt_arc.json`). A JFA só entra se pedida (`traducao: 'jfa'`).
- Conteúdo de expansão entra ANTES do fechamento (`inserirAntesDoFechamento`), nunca "nos 2 últimos parágrafos".
- Todo pós-processador novo precisa de teste offline em `tests/pos-processadores.test.js`.
