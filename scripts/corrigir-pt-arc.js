// scripts/corrigir-pt-arc.js
// Sanitiza pt_arc.json corrigindo apenas erros de digitação e espaçamento
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'bible', 'pt_arc.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let totalHifenPronomes = 0;
let totalEspacoPontuacao = 0;
let totalEspacoDuplo = 0;

for (const book of data) {
  for (let c = 0; c < book.chapters.length; c++) {
    for (let v = 0; v < book.chapters[c].length; v++) {
      let orig = book.chapters[c][v];
      let txt = orig;

      // 1. Corrige hífen com pronome quebrado: ex "Indignaram-n o" -> "Indignaram-no", "traze-m os" -> "traze-mos"
      const h1 = txt.match(/-\s*([nlmtvs])\s+([oaes]{1,2})\b/gi);
      if (h1) {
        totalHifenPronomes += h1.length;
        txt = txt.replace(/-\s*([nlmtvs])\s+([oaes]{1,2})\b/gi, "-$1$2");
      }

      // Hífen seguido de espaço antes do pronome: ex "vendo- os" -> "vendo-os", "deu- a" -> "deu-a"
      const h2 = txt.match(/-\s+([a-záàâãéêíóôõúç]{1,4})\b/gi);
      if (h2) {
        totalHifenPronomes += h2.length;
        txt = txt.replace(/-\s+([a-záàâãéêíóôõúç]{1,4})\b/gi, "-$1");
      }

      // 2. Corrige espaço antes de pontuação: "Senhor !" -> "Senhor!", "Senhor ," -> "Senhor,"
      const p1 = txt.match(/\s+([,.;:!?])/g);
      if (p1) {
        totalEspacoPontuacao += p1.length;
        txt = txt.replace(/\s+([,.;:!?])/g, "$1");
      }

      // 3. Corrige espaços duplos
      const sp = txt.match(/ {2,}/g);
      if (sp) {
        totalEspacoDuplo += sp.length;
        txt = txt.replace(/ {2,}/g, " ");
      }

      txt = txt.trim();
      book.chapters[c][v] = txt;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(data));
console.log('=== RELATÓRIO DE CORREÇÕES EM PT_ARC.JSON ===');
console.log('Pronomes enclíticos / hífens corrigidos:', totalHifenPronomes);
console.log('Espaços antes de pontuação eliminados:', totalEspacoPontuacao);
console.log('Espaços duplos corrigidos:', totalEspacoDuplo);
console.log('TOTAL DE CORREÇÕES:', totalHifenPronomes + totalEspacoPontuacao + totalEspacoDuplo);
