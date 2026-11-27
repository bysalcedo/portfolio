// Falla si el contenido publico contiene datos internos del homelab: IPs, MACs, UUIDs, hostnames
// internos de bysalcedo.com o los terminos de SANITIZE_DENYLIST (un secret de CI, una linea por termino:
// nombres de familiares, SSID, usuarios... no pueden vivir en este repo porque es publico).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/content', 'src/data', 'src/i18n'];
const rules = [
  ['IPv4', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
  ['MAC', /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi],
  ['UUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi],
  ['hostname interno', /\b[a-z0-9-]+\.bysalcedo\.com\b/gi],
];
// Lo que es publico a proposito: el dominio del email de contacto (alias de Proton) y la direccion multicast estandar de STP.
const allow = [/^alias\.bysalcedo\.com$/i, /^01:80:c2:00:00:00$/i];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Palabra completa: "ana" no debe saltar con "banana" ni con "Anaconda".
const deny = (process.env.SANITIZE_DENYLIST || '')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(s)}(?![\\p{L}\\p{N}])`, 'iu'));

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
roots.forEach(walk);

let bad = 0;
for (const f of files.filter((p) => /\.(md|ya?ml|json|ts)$/.test(p))) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const [name, re] of rules) {
      for (const m of line.matchAll(re)) {
        if (allow.some((a) => a.test(m[0]))) continue;
        console.log(`${f}:${i + 1}  ${name}: ${m[0]}`);
        bad++;
      }
    }
    // Sin imprimir el termino: el log de CI de un repo publico tambien es publico.
    if (deny.some((re) => re.test(line))) {
      console.log(`${f}:${i + 1}  termino de la denylist`);
      bad++;
    }
  });
}
if (!deny.length) console.log('aviso: SANITIZE_DENYLIST vacia, solo se comprueban los patrones');
console.log(bad ? `${bad} hallazgo(s)` : 'sin hallazgos');
process.exit(bad ? 1 : 0);
