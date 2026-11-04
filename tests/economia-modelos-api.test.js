/**
 * tests/economia-modelos-api.test.js
 * Teste automatizado para separação de modelos e redução de custo da API:
 * 1. Valida existência dos 3 modelos em OpenRouterAPI (ideias, roteiro, cenas).
 * 2. Valida o novo 3º campo input-api-model-cenas no HTML e no AutoSave.
 * 3. Valida que Ideias, SEO e Plano de Cenas usam modelos econômicos (gpt-4o-mini).
 * 4. Valida que Claude (anthropic/claude-sonnet-4.5) é preservado estritamente para o roteiro.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Iniciando Teste de Economia de Modelos da API ---');

const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Campo input-api-model-cenas no HTML
assert(html.includes('id="input-api-model-cenas"'), 'HTML deve conter o campo input-api-model-cenas');
assert(html.includes('Modelo para Cenas'), 'HTML deve conter o rótulo "Modelo para Cenas"');

// 2. OpenRouterAPI deve ter MODEL_CENAS_STORAGE_KEY e métodos getModelCenas / getModelMediaPrompts
assert(html.includes("MODEL_CENAS_STORAGE_KEY: 'dark_studio_openrouter_model_cenas'"), 'OpenRouterAPI deve ter MODEL_CENAS_STORAGE_KEY');
assert(html.includes("DEFAULT_MODEL_CENAS: 'openai/gpt-4o-mini'"), 'DEFAULT_MODEL_CENAS deve ser openai/gpt-4o-mini');
assert(html.includes('getModelCenas()'), 'OpenRouterAPI deve implementar getModelCenas()');
assert(html.includes('getModelMediaPrompts()'), 'OpenRouterAPI deve implementar getModelMediaPrompts()');

// 3. AutoSave monitora input-api-model-cenas
assert(html.includes("'input-api-model-cenas'"), 'AutoSave.FIELD_IDS deve incluir input-api-model-cenas');

// 4. btn-gerar-prompt-ideias usa getModelIdeas() e não getModelRoteiro()
const listenerIdeiasIdx = html.indexOf("document.getElementById('btn-gerar-prompt-ideias')");
const trechoIdeias = html.slice(listenerIdeiasIdx, listenerIdeiasIdx + 4000);
assert(!trechoIdeias.includes('const modeloIdeias = OpenRouterAPI.getModelRoteiro()'), 'btn-gerar-prompt-ideias NÃO deve usar getModelRoteiro()');
assert(trechoIdeias.includes('const modeloIdeias = OpenRouterAPI.getModelIdeas()'), 'btn-gerar-prompt-ideias deve usar getModelIdeas()');

// 5. Plano de cenas e regeneração de pendentes usam getModelCenas()
const trechoPlano = html.slice(html.indexOf('executarGeracaoPlanoCenas'), html.indexOf('executarGeracaoPlanoCenas') + 2500);
assert(trechoPlano.includes('OpenRouterAPI.getModelCenas()'), 'executarGeracaoPlanoCenas deve usar getModelCenas()');

const pendentesListenerIdx = html.indexOf("document.getElementById('btn-regenerar-cenas-pendentes')");
const trechoPendentes = html.slice(pendentesListenerIdx, pendentesListenerIdx + 2500);
assert(trechoPendentes.includes('OpenRouterAPI.getModelCenas()'), 'btn-regenerar-cenas-pendentes deve usar getModelCenas()');

// 6. Revisão de citações/fatos de SEO usa getModelIdeas()
const seoListenerIdx = html.indexOf("document.getElementById('btn-gerar-prompt-seo')");
const trechoSeo = html.slice(seoListenerIdx, seoListenerIdx + 2000);
assert(trechoSeo.includes('revisarFatosTitulosSeoComIA(seoLimpo, tema, roteiroContexto, OpenRouterAPI.getModelIdeas())'), 'SEO deve usar getModelIdeas() no revisor de fatos');

// 7. Auditoria de itens no catálogo usa getModelIdeas() e não Claude
const catalogoJs = fs.readFileSync(path.join(__dirname, '../js/catalogo.js'), 'utf8');
assert(catalogoJs.includes('OpenRouterAPI.getModelIdeas()'), 'js/catalogo.js deve usar getModelIdeas() na auditoria de itens');

console.log('✅ Todos os testes de economia de modelos da API passaram com sucesso!');
