// Bricht den Build ab, solange in einer Seite noch Platzhalter wie [[E-MAIL]] stehen.
// So geht nichts Halbfertiges (Impressum, Datenschutz) aus Versehen online.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const skip = new Set(['node_modules', 'dist', '.git', 'public', 'src', 'scripts']);
const found = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.html')) {
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const m of line.matchAll(/\[\[[^\]]+\]\]/g)) found.push(`${path}:${i + 1}  ${m[0]}`);
        });
    }
  }
}

walk('.');
if (found.length > 0) {
  console.error('Noch offene Platzhalter, bitte ausfüllen:\n' + found.join('\n'));
  process.exit(1);
}
