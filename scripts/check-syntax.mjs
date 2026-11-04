import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sourceDirectories = ['scripts', 'src', 'functions', 'tests'];
let checked = 0;
let failures = 0;
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
    } else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) {
      checked++;
      try {
        execFileSync(process.execPath, ['--check', absolute], { stdio: 'pipe' });
      } catch (error) {
        failures++;
        console.error(`Syntax error in ${relative(root, absolute)}:`);
        console.error(error.stderr?.toString() || error.message);
      }
    }
  }
}
for (const part of sourceDirectories) {
  const directory = join(root, part);
  if (statSync(directory, { throwIfNoEntry: false })?.isDirectory()) walk(directory);
}
console.log(`Syntax check: ${checked} JavaScript files checked; ${failures} failed.`);
if (failures) process.exitCode = 1;
