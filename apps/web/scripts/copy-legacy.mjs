import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copy the preserved v1 app into the site's public folder at build time.
 *
 * This keeps the original capstone submission live at /v1 without
 * duplicating it in the repo — the case for v2 is much stronger when a
 * reader can click through to the thing it replaced rather than take a
 * screenshot's word for it. Running it as a prebuild step means it can
 * never drift from legacy/v1/.
 */
const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../../legacy/v1');
const target = resolve(here, '../public/v1');

if (!existsSync(source)) {
  console.error(`copy-legacy: nothing at ${source}`);
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log(`copy-legacy: v1 -> public/v1`);
