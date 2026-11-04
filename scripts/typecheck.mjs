// Type-check the changed canvas artwork without retyping the preserved game.
// Supply a TypeScript CLI installed outside the shipped site as the first argument.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = join(root, 'test/scratch/typecheck');
const html = await readFile(join(root, 'index.html'), 'utf8');
const art = html.slice(html.indexOf('// Decorative art is optional'), html.indexOf('/* ---------- the Raid Table:'));
await mkdir(scratch, { recursive: true });
await writeFile(join(scratch, 'art.js'), art);
await writeFile(join(scratch, 'environment.d.ts'), `
declare const S: any;
declare const LM_MM: number, DAY: number, HALF: number;
declare function $(id: string): HTMLCanvasElement;
declare function rng(seed: string): () => number;
declare function rgba(hex: string, alpha: number): string;
declare function mix(a: string, b: string, t: number): string;
declare function clamp(value: number, min: number, max: number): number;
declare function num(value: any): number;
declare function fmtKm(value: number, digits?: number): string;
declare function biomeAt(world: any, position: number): any;
declare function buildWorld(): any;
declare function series(day: any): number[];
declare function smooth(values: number[], radius: number): number[];
declare function lmKind(name: string): string;
declare function dayFacts(day: any): any;
declare function renderChapters(): void;
`);
const args = ['--allowJs', '--checkJs', '--noEmit', '--target', 'ES2022', '--lib', 'ES2022,DOM,DOM.Iterable', '--skipLibCheck', join(scratch, 'environment.d.ts'), join(scratch, 'art.js')];
const result = process.argv[2]
  ? spawnSync(process.execPath, [process.argv[2], ...args], { stdio: 'inherit' })
  : spawnSync('tsc', args, { stdio: 'inherit' });
if (result.error) console.error('Supply the path to an installed TypeScript bin/tsc as the first argument.');
if (result.status === 0) console.log('Canvas artwork typecheck passed. Preserved game code is outside this check.');
process.exitCode = result.status ?? 1;
