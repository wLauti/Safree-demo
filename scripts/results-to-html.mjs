#!/usr/bin/env node
/** Render Vitest JSON output into a branded HTML report at reports/test-results.html. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = path.join(root, 'reports', 'test-results.json')
const outPath = path.join(root, 'reports', 'test-results.html')

let data
try { data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) }
catch { console.log('results-to-html: no test-results.json yet; skipping'); process.exit(0) }

const total = data.numTotalTests ?? 0
const passed = data.numPassedTests ?? 0
const failed = data.numFailedTests ?? 0
const files = (data.testResults ?? []).map(f => {
  const name = (f.name ?? f.testFilePath ?? '').replace(root, '').replace(/^[\\/]/, '')
  const ok = (f.status ?? f.assertionResults?.every(a => a.status === 'passed')) === 'passed'
    || (f.assertionResults ?? []).every(a => a.status === 'passed')
  const count = (f.assertionResults ?? []).length
  return { name, ok, count }
})

const date = new Date().toISOString().replace('T', ' ').slice(0, 19)
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Safree Test Results</title>
<style>
body{background:#fff;font-family:Inter,Arial,sans-serif;color:#1a1a1a;padding:2rem;max-width:900px;margin:auto}
h1{color:#822626;border-bottom:3px solid #822626;padding-bottom:.3rem}
.summary{display:flex;gap:1rem;margin:1rem 0}
.card{flex:1;padding:1rem;border-radius:8px;text-align:center;border:1px solid #eee}
.pass{color:#1a7f37}.fail{color:#822626}.muted{color:#888}
table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{border:1px solid #ddd;padding:.5rem;text-align:left}
th{background:#f4f0e6}
</style></head><body>
<h1>SAFREE — Test Results</h1>
<p class="muted">Generated: ${date}</p>
<div class="summary">
  <div class="card"><h2>${total}</h2><div class="muted">Total</div></div>
  <div class="card"><h2 class="pass">${passed}</h2><div class="muted">Passed</div></div>
  <div class="card"><h2 class="${failed ? 'fail' : 'muted'}">${failed}</h2><div class="muted">Failed</div></div>
</div>
<table><thead><tr><th>Test File</th><th>Tests</th><th>Status</th></tr></thead><tbody>
${files.map(f => `<tr><td>${f.name}</td><td>${f.count}</td><td class="${f.ok ? 'pass' : 'fail'}">${f.ok ? '✓ pass' : '✗ fail'}</td></tr>`).join('\n')}
</tbody></table>
<p class="muted">Coverage report: <a href="./coverage/index.html">reports/coverage/index.html</a></p>
</body></html>`

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, html)
console.log(`\x1b[32m✓ Test results HTML → reports/test-results.html\x1b[0m`)
