/**
 * JARVIS Smoke Test
 * Runs directly against compiled dist/ files — no Electron required.
 * Usage: node smoke-test.js
 */
const { execSync } = require('child_process');

// Load tool registry and register tools
const { ToolRegistry } = require('./dist/tools/ToolRegistry');
require('./dist/tools/fileTools');
require('./dist/tools/searchTools');
require('./dist/tools/webTools');

let passed = 0;
let failed = 0;

async function test(label, fn) {
  process.stdout.write(`  ${label.padEnd(40, '.')}`);
  try {
    const result = await fn();
    if (result.success) {
      passed++;
      const preview = JSON.stringify(result.data ?? '').substring(0, 80);
      console.log(` PASS  ${preview}`);
    } else {
      failed++;
      console.log(` FAIL  ${result.error}`);
    }
  } catch (e) {
    failed++;
    console.log(` ERROR ${e.message}`);
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║        JARVIS COMMAND SMOKE TEST         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── FILESYSTEM ─────────────────────────────────
  console.log('[ FILESYSTEM ]');
  await test('list_directory (Jarvis root)', async () =>
    ToolRegistry.get('list_directory').execute({ path: 'C:\\Projects\\Jarvis' })
  );
  await test('read_file (package.json)', async () =>
    ToolRegistry.get('read_file').execute({ path: 'C:\\Projects\\Jarvis\\package.json' })
  );
  await test('search_files (*.ts in src)', async () =>
    ToolRegistry.get('search_files').execute({ path: 'C:\\Projects\\Jarvis\\src', pattern: '.ts' })
  );

  // ── WEB SEARCH via SearXNG ──────────────────────
  console.log('\n[ WEB SEARCH — SearXNG @ localhost:8081 ]');
  await test('news: "world news today"', async () =>
    ToolRegistry.get('web_search').execute({ query: 'world news today' })
  );
  await test('weather: "weather London"', async () =>
    ToolRegistry.get('web_search').execute({ query: 'weather London' })
  );
  await test('tech: "AI news 2025"', async () =>
    ToolRegistry.get('web_search').execute({ query: 'AI news 2025' })
  );

  // ── OLLAMA ─────────────────────────────────────
  console.log('\n[ OLLAMA @ localhost:11434 ]');
  process.stdout.write('  connectivity + models'.padEnd(42, '.'));
  try {
    const raw = execSync('curl -s --max-time 5 http://localhost:11434/api/tags', { timeout: 6000 });
    const models = JSON.parse(raw.toString()).models ?? [];
    passed++;
    console.log(` PASS  ${models.length} model(s): ${models.map(m => m.name).join(', ') || 'none'}`);
  } catch (e) {
    failed++;
    console.log(` FAIL  Ollama not reachable — ${e.message}`);
  }

  // ── SEARXNG direct ─────────────────────────────
  console.log('\n[ SEARXNG direct health ]');
  process.stdout.write('  GET /search?q=test&format=json'.padEnd(42, '.'));
  try {
    const raw = execSync(
      'curl -s --max-time 10 "http://localhost:8081/search?q=test&format=json"',
      { timeout: 12000 }
    );
    const data = JSON.parse(raw.toString());
    const count = (data.results ?? []).length;
    passed++;
    console.log(` PASS  ${count} result(s) returned`);
  } catch (e) {
    failed++;
    console.log(` FAIL  ${e.message}`);
  }

  // ── SUMMARY ────────────────────────────────────
  console.log('\n──────────────────────────────────────────');
  console.log(`  PASSED: ${passed}   FAILED: ${failed}   TOTAL: ${passed + failed}`);
  console.log('──────────────────────────────────────────\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
