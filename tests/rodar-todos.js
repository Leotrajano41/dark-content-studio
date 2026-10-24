// tests/rodar-todos.js — roda TODOS os testes offline (sem API) em sequência e resume o resultado.
// Uso: node tests/rodar-todos.js
// (tests/checklist-roteiro.js NÃO entra: ele chama a API de verdade e precisa de chave.)
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const arquivos = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let falhas = 0;
for (const arq of arquivos) {
  const r = spawnSync(process.execPath, [path.join(__dirname, arq)], { encoding: 'utf-8' });
  const ok = r.status === 0;
  const passou = (r.stdout.match(/PASSOU/g) || []).length;
  console.log(`${ok ? '✅' : '❌'} ${arq}${passou ? ` (${passou} verificações)` : ''}`);
  if (!ok) {
    falhas++;
    const linhas = (r.stdout + r.stderr).split('\n').filter(l => /FALHOU|Error|erro/i.test(l)).slice(0, 8);
    linhas.forEach(l => console.log('     ' + l));
  }
}
console.log(falhas ? `\n❌ ${falhas} arquivo(s) com falha` : `\n🎉 Todos os ${arquivos.length} arquivos de teste passaram`);
process.exit(falhas ? 1 : 0);
