/**
 * VersaoRevisadaModule
 * Permite colar uma versão revisada da Narração Limpa, propaga para todas as etapas seguintes,
 * detecta alterações frase por frase e armazena registros para relatório mensal de correções.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./pontuacao'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let pontuacao;
    try { pontuacao = require('./pontuacao'); } catch (e) { pontuacao = null; }
    module.exports = factory(pontuacao);
  } else {
    root.VersaoRevisadaModule = factory(root.PontuacaoModule);
  }
}(typeof self !== 'undefined' ? self : this, function (PontuacaoModule) {
  'use strict';

  const STORAGE_KEY = 'dark_studio_registros_correcoes';

  /**
   * Divide um texto em frases/sentenças individuais, preservando a pontuação terminal
   * e tratando adequadamente pontuações como . ? ! … e : seguidos de citação ou espaço.
   */
  function extrairFrases(texto) {
    if (!texto || typeof texto !== 'string') return [];
    
    const linhas = texto.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    const frases = [];

    for (const linha of linhas) {
      // Divide por pontuação terminal (. ? ! …) ou por dois pontos antes de aspas/citações
      // Regex que pega sequências até [.?!…]+["'”»]? ou :["'”»]?
      const regex = /([^.?!…:]+(?:[.?!…]+["'”»]?|:[ "'”»]?|$))/g;
      let match;
      while ((match = regex.exec(linha)) !== null) {
        let f = match[1].trim();
        if (f.length > 0) {
          frases.push(f);
        }
      }
    }

    return frases;
  }

  /**
   * Compara duas sequências de frases usando algoritmo de Longest Common Subsequence (LCS)
   * ou pareamento posicional / similaridade para extrair as alterações (antes -> depois).
   */
  /**
   * Compara duas sequências de frases usando algoritmo de Longest Common Subsequence (LCS)
   * para identificar com exatidão cirúrgica quais frases foram modificadas, adicionadas ou removidas.
   */
  function compararFrases(textoOriginal, textoRevisado) {
    if (!textoOriginal && !textoRevisado) return [];
    if (String(textoOriginal).trim() === String(textoRevisado).trim()) return [];

    // Limpeza defensiva de marcações de roteiro se houver no original
    const limparMarcacoesRoteiro = (t) => {
      return String(t || '')
        .replace(/\[(?:CENA|EFEITO\s+SONORO|TRILHA|PAUSA|IMAGEM|VÍDEO)[^\]]*\]/gi, '')
        .replace(/^Narrador:\s*/gim, '')
        .trim();
    };

    const frasesOriginais = extrairFrases(limparMarcacoesRoteiro(textoOriginal));
    const frasesRevisadas = extrairFrases(limparMarcacoesRoteiro(textoRevisado));

    if (frasesOriginais.length === 0 && frasesRevisadas.length === 0) return [];

    const m = frasesOriginais.length;
    const n = frasesRevisadas.length;

    // Normalização suave para match de frases
    const norm = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const saoIguais = (a, b) => a === b || norm(a) === norm(b);

    // Tabela DP do LCS
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (saoIguais(frasesOriginais[i], frasesRevisadas[j])) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    // Reconstrução do diff do final para o início
    let i = m;
    let j = n;
    const diffTokens = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && saoIguais(frasesOriginais[i - 1], frasesRevisadas[j - 1])) {
        diffTokens.unshift({ tipo: 'igual', antes: frasesOriginais[i - 1], depois: frasesRevisadas[j - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diffTokens.unshift({ tipo: 'adicionado', antes: null, depois: frasesRevisadas[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        diffTokens.unshift({ tipo: 'removido', antes: frasesOriginais[i - 1], depois: null });
        i--;
      }
    }

    // Agrupa blocos contíguos de mudanças
    const mudancas = [];
    let k = 0;
    while (k < diffTokens.length) {
      if (diffTokens[k].tipo === 'igual') {
        k++;
        continue;
      }

      const rems = [];
      const adds = [];
      while (k < diffTokens.length && diffTokens[k].tipo !== 'igual') {
        if (diffTokens[k].tipo === 'removido') rems.push(diffTokens[k].antes);
        if (diffTokens[k].tipo === 'adicionado') adds.push(diffTokens[k].depois);
        k++;
      }

      const maxLen = Math.max(rems.length, adds.length);
      for (let x = 0; x < maxLen; x++) {
        mudancas.push({
          antes: rems[x] || '(nenhuma)',
          depois: adds[x] || '(removida)'
        });
      }
    }

    return mudancas;
  }

  /**
   * Normaliza pontuação e aspas sem alterar palavras nem conteúdo.
   */
  function normalizarTextoRevisado(texto) {
    if (!texto) return '';
    if (PontuacaoModule && typeof PontuacaoModule.normalizarAspasEPontuacao === 'function') {
      return PontuacaoModule.normalizarAspasEPontuacao(texto);
    }
    // Fallback básico se PontuacaoModule não estiver carregado
    return texto
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/\s+([.,!?:;])/g, '$1')
      .replace(/([.,!?:;])(?!\s|$|[0-9.,])/g, '$1 ');
  }

  /**
   * Valida o texto revisado e emite apenas AVISOS (sem alterar nada).
   * - Palavras em inglês ou espanhol comuns
   * - Chaves { } (placeholders não preenchidos)
   * - Aspas desbalanceadas
   * - Mais de um CTA
   */
  function validarEAvisar(texto) {
    const avisos = [];
    if (!texto) return avisos;

    // 1. Chaves { }
    const chavesEncontradas = texto.match(/\{[^}]*\}/g);
    if (chavesEncontradas && chavesEncontradas.length > 0) {
      avisos.push({
        tipo: 'chaves',
        mensagem: `Detectadas chaves não preenchidas no texto: ${chavesEncontradas.slice(0, 3).join(', ')}${chavesEncontradas.length > 3 ? '...' : ''}`
      });
    }

    // 2. Aspas desbalanceadas
    const totalAspasRetas = (texto.match(/"/g) || []).length;
    const aspasAberturaCurvas = (texto.match(/“/g) || []).length;
    const aspasFechamentoCurvas = (texto.match(/”/g) || []).length;
    if (totalAspasRetas % 2 !== 0 || aspasAberturaCurvas !== aspasFechamentoCurvas) {
      avisos.push({
        tipo: 'aspas',
        mensagem: 'O texto possui aspas desbalanceadas (abertas sem fechar).'
      });
    }

    // 3. Mais de um CTA
    const padroesCTA = [
      /\b(?:se\s+inscreva|inscreva-se|inscrevam-se)\b/gi,
      /\b(?:deixe\s+seu\s+like|deixa\s+o\s+like|curta\s+o\s+v[ií]deo|curta\s+este\s+v[ií]deo)\b/gi,
      /\b(?:compartilhe\s+com\s+algu[eé]m|compartilhe\s+este\s+v[ií]deo)\b/gi,
      /\b(?:comente\s+aqui|comente\s+abaixo|deixe\s+nos\s+coment[aá]rios)\b/gi,
      /\b(?:ative\s+o\s+sininho|ativa\s+o\s+sino)\b/gi
    ];
    let totalCTAs = 0;
    const ctasEncontrados = [];
    for (const padrao of padroesCTA) {
      const matches = texto.match(padrao);
      if (matches) {
        totalCTAs += matches.length;
        ctasEncontrados.push(...matches);
      }
    }
    if (totalCTAs > 1) {
      avisos.push({
        tipo: 'multiplos_cta',
        mensagem: `Detectado mais de um CTA no roteiro (${totalCTAs} encontrados: "${ctasEncontrados.slice(0, 3).join('", "')}"). A regra recomenda no máximo 1 CTA no final.`
      });
    }

    // 4. Palavras em inglês/espanhol
    const palavrasEstrangeiras = [
      // Espanhol
      'pero', 'entonces', 'tambien', 'también', 'ahora', 'despues', 'después', 'quando',
      'gracias', 'senor', 'dios', 'porque', 'siempre', 'nunca', 'verdad', 'nuestro', 'vida',
      // Inglês
      'the', 'and', 'with', 'from', 'this', 'that', 'have', 'were', 'which', 'their',
      'about', 'after', 'before', 'would', 'could', 'should', 'today', 'story', 'faith', 'lord'
    ];
    // Criar regex de busca de palavras exatas
    const regexEstrangeiras = new RegExp(`\\b(${palavrasEstrangeiras.join('|')})\\b`, 'gi');
    const termosEstrangeiros = [];
    let m;
    while ((m = regexEstrangeiras.exec(texto)) !== null) {
      const termo = m[1].toLowerCase();
      // Ignorar falsos positivos válidos em português
      if (['dios', 'vida', 'quando'].includes(termo)) continue;
      if (!termosEstrangeiros.includes(termo)) {
        termosEstrangeiros.push(termo);
      }
    }
    if (termosEstrangeiros.length > 0) {
      avisos.push({
        tipo: 'estrangeirismos',
        mensagem: `Possíveis palavras em inglês ou espanhol detectadas: ${termosEstrangeiros.slice(0, 5).join(', ')}`
      });
    }

    return avisos;
  }

  /**
   * Salva um registro de correções no localStorage.
   */
  function salvarRegistro(tema, mudancas, customStorage) {
    if (!mudancas || mudancas.length === 0) return null;

    const storage = customStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return null;

    const agora = new Date();
    const registro = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      dataISO: agora.toISOString(),
      dataLegivel: agora.toLocaleString('pt-BR'),
      tema: (tema || 'Vídeo Sem Título').trim(),
      totalMudancas: mudancas.length,
      mudancas: mudancas.map(m => ({
        antes: m.antes,
        depois: m.depois
      }))
    };

    try {
      const historicoRaw = storage.getItem(STORAGE_KEY);
      const historico = historicoRaw ? JSON.parse(historicoRaw) : [];
      historico.unshift(registro);
      storage.setItem(STORAGE_KEY, JSON.stringify(historico));
    } catch (e) {
      console.error('[VersaoRevisadaModule] Erro ao salvar registro no storage:', e);
    }

    return registro;
  }

  /**
   * Retorna todos os registros salvos.
   */
  function listarRegistros(customStorage) {
    const storage = customStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return [];
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Limpa todos os registros de correções do storage.
   */
  function limparRegistros(customStorage) {
    const storage = customStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return false;
    try {
      storage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Gera o relatório consolidado do mês atual (ou especificado), formatado em texto legível para cópia.
   * Formato de data de referência: Date ou string YYYY-MM.
   */
  function gerarRelatorioMensal(mesRef, customStorage) {
    const registros = listarRegistros(customStorage);
    const dataAlvo = mesRef instanceof Date ? mesRef : (mesRef ? new Date(mesRef) : new Date());
    const anoAlvo = dataAlvo.getFullYear();
    const mesAlvo = dataAlvo.getMonth(); // 0 a 11

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[mesAlvo];

    // Filtra registros do mês alvo
    const registrosDoMes = registros.filter(r => {
      if (!r.dataISO) return false;
      const d = new Date(r.dataISO);
      return d.getFullYear() === anoAlvo && d.getMonth() === mesAlvo;
    });

    if (registrosDoMes.length === 0) {
      return `RELATÓRIO MENSAL DE CORREÇÕES - ${nomeMes.toUpperCase()} DE ${anoAlvo}\n` +
             `------------------------------------------------------------\n` +
             `Nenhuma correção registrada neste mês.\n`;
    }

    let totalFrasesCorrigidas = 0;
    for (const reg of registrosDoMes) {
      totalFrasesCorrigidas += (reg.mudancas ? reg.mudancas.length : 0);
    }

    const linhas = [];
    linhas.push(`============================================================`);
    linhas.push(`RELATÓRIO MENSAL DE CORREÇÕES - ${nomeMes.toUpperCase()} DE ${anoAlvo}`);
    linhas.push(`============================================================`);
    linhas.push(`Total de vídeos com versão revisada: ${registrosDoMes.length}`);
    linhas.push(`Total de frases corrigidas no mês: ${totalFrasesCorrigidas}`);
    linhas.push(`------------------------------------------------------------\n`);

    registrosDoMes.forEach((reg, idx) => {
      linhas.push(`[${idx + 1}] VÍDEO: "${reg.tema}"`);
      linhas.push(`Data da revisão: ${reg.dataLegivel || reg.dataISO}`);
      linhas.push(`Frases alteradas (${reg.mudancas ? reg.mudancas.length : 0}):`);
      
      if (reg.mudancas && reg.mudancas.length > 0) {
        reg.mudancas.forEach((m, mIdx) => {
          linhas.push(`  (${mIdx + 1}) ANTES:  ${m.antes}`);
          linhas.push(`      DEPOIS: ${m.depois}`);
        });
      } else {
        linhas.push(`  (nenhuma alteração pontual detectada)`);
      }
      linhas.push(''); // Linha em branco entre vídeos
    });

    return linhas.join('\n');
  }

  return {
    extrairFrases,
    compararFrases,
    normalizarTextoRevisado,
    validarEAvisar,
    salvarRegistro,
    listarRegistros,
    limparRegistros,
    gerarRelatorioMensal,
    STORAGE_KEY
  };
}));
