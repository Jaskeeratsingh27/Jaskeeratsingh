from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'source'
errors=[]; passed=[]

def ok(name, cond, msg=''):
    (passed if cond else errors).append(name if cond else f'{name}: {msg}')

required = [
    'README.md','RECOVERY_MANIFEST.json','RECOVERY_REPORT.md',
    'source/README.md','source/SETUP.md','source/instructions/STHAPATI-INSTRUCTIONS.md',
    'source/knowledge/brief.md','source/knowledge/build-method.md',
    'source/knowledge/project-anatomy.md','source/knowledge/research-discipline.md',
    'source/knowledge/run-ledger.md','source/knowledge/sources.md'
]
for rel in required:
    ok(f'present:{rel}', (ROOT/rel).exists(), 'missing')

ok('withheld_tests_not_committed', not any(ROOT.rglob('sthapati-tests.md')), 'private held-out pack leaked')

inst=(SRC/'instructions/STHAPATI-INSTRUCTIONS.md').read_text()
wc=len(inst.split())
ok('instructions_at_or_below_800', wc <= 800, f'{wc} words')
ok('instructions_at_or_below_1000', wc <= 1000, f'{wc} words')
for name in ['brief.md','sources.md','worked-build.md','build-method.md','research-discipline.md','instruction-craft.md','test-pack.md','file-patterns.md','failure-modes.md','quality-gates.md','project-anatomy.md','run-ledger.md']:
    ok(f'instruction_pointer:{name}', name in inst, 'missing pointer')

setup=(SRC/'SETUP.md').read_text(); readme=(SRC/'README.md').read_text()
ok('setup_declares_12_knowledge_files', 'All **12** files' in setup)
ok('readme_declares_12_knowledge_files', '| **Sthapati** (स्थपति) | Builds Claude Projects | **Opus** | 12 |' in readme)
ok('setup_records_747_words', '747 words' in setup)

sources=(SRC/'knowledge/sources.md').read_text()
for token in ['## Claim map','papers.nips.cc','anthropic.com','support.anthropic.com','genai.owasp.org','developers.google.com','[historical evidence]']:
    ok(f'sources:{token}', token in sources, 'missing')

for p in [SRC/'knowledge/brief.md', SRC/'knowledge/build-method.md', SRC/'knowledge/project-anatomy.md', SRC/'knowledge/research-discipline.md', SRC/'knowledge/run-ledger.md', SRC/'knowledge/sources.md']:
    ok(f'owns:{p.name}', bool(re.search(r'^> \*\*Owns:\*\*',p.read_text(),re.M)), 'missing ownership')

manifest=json.loads((ROOT/'RECOVERY_MANIFEST.json').read_text())
ok('original_zip_hash', manifest.get('original_zip_sha256') == 'edce29356f83cdcf3da0579a4b2eb687505730dbf01ec552fe188a05fd421f09')
hidden=manifest.get('withheld_test_pack',{})
ok('hidden_pack_hash_recorded', hidden.get('sha256') == 'c6f18305760448851a60702fc6b42a374137730731712c8d83d26fae50ebb7e7')
ok('hidden_pack_public_flag_false', hidden.get('committed_to_public_repo') is False)

combined='\n'.join(p.read_text() for p in SRC.rglob('*.md'))
for stale in ['RAG applies to free plans','Zero builds run','999 words','All **10** files']:
    ok(f'no_stale:{stale}', stale not in combined, 'stale claim found')

print('PATCHSET PASS',len(passed))
for x in passed: print('  +',x)
print('PATCHSET FAIL',len(errors))
for x in errors: print('  -',x)
if errors: sys.exit(1)
