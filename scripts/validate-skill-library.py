#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = ROOT / ".agents" / "skills"
PLUGIN = ROOT / "plugins" / "personal-skill-library"
MIRROR = PLUGIN / "skills"
MARKETPLACE = ROOT / ".agents" / "plugins" / "marketplace.json"

errors: list[str] = []
warnings: list[str] = []

def fail(message: str) -> None:
    errors.append(message)

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def files_under(root: Path) -> dict[str, Path]:
    return {
        str(path.relative_to(root)).replace("\\", "/"): path
        for path in root.rglob("*")
        if path.is_file()
    }

def parse_frontmatter(path: Path) -> tuple[str | None, str | None]:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not match:
        fail(f"{path}: missing YAML frontmatter")
        return None, None
    block = match.group(1)
    name_match = re.search(r"^name:\s*(.+?)\s*$", block, re.M)
    desc_match = re.search(r"^description:\s*(.+?)\s*$", block, re.M)
    name = name_match.group(1).strip().strip('"\'') if name_match else None
    description = desc_match.group(1).strip().strip('"\'') if desc_match else None
    if not name:
        fail(f"{path}: missing non-empty name")
    if not description:
        fail(f"{path}: missing non-empty description")
    elif len(description) > 1024:
        fail(f"{path}: description exceeds 1024 characters")
    return name, description

def validate_openai_yaml(skill_dir: Path) -> None:
    meta = skill_dir / "agents" / "openai.yaml"
    if not meta.exists():
        fail(f"{skill_dir.name}: missing agents/openai.yaml")
        return
    text = meta.read_text(encoding="utf-8")
    if "display_name:" not in text:
        fail(f"{skill_dir.name}: openai.yaml missing interface.display_name")
    if "short_description:" not in text:
        fail(f"{skill_dir.name}: openai.yaml missing interface.short_description")
    if "CHAT" not in text:
        fail(f"{skill_dir.name}: openai.yaml does not target CHAT")
    if "CODEX" not in text:
        fail(f"{skill_dir.name}: openai.yaml does not target CODEX")
    if not re.search(r"allow_implicit_invocation:\s*true", text):
        fail(f"{skill_dir.name}: implicit invocation is not enabled")

try:
    manifest = json.loads((PLUGIN / "plugin.json").read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"plugin.json unreadable or invalid JSON: {exc}")
    manifest = {}

for key in ("$schema", "name", "version", "description"):
    if not manifest.get(key):
        fail(f"plugin.json missing required field: {key}")

plugin_name = manifest.get("name", "")
if plugin_name != "personal-skill-library":
    fail(f"unexpected plugin name: {plugin_name!r}")
if manifest.get("version") != "2.1.0":
    fail(f"expected plugin version 2.1.0, got {manifest.get('version')!r}")

interface = manifest.get("extensions", {}).get("com.openai", {}).get("interface", {})
for key in ("displayName", "shortDescription", "longDescription", "developerName", "category"):
    if not interface.get(key):
        fail(f"plugin OpenAI interface missing {key}")

try:
    marketplace = json.loads(MARKETPLACE.read_text(encoding="utf-8"))
    entries = marketplace.get("plugins", [])
    entry = next((p for p in entries if p.get("name") == plugin_name), None)
    if not entry:
        fail("personal-skill-library is not registered in marketplace.json")
    elif entry.get("source", {}).get("path") != "./plugins/personal-skill-library":
        fail("marketplace path for personal-skill-library is incorrect")
except Exception as exc:
    fail(f"marketplace.json unreadable or invalid JSON: {exc}")

canonical_files = files_under(CANONICAL)
mirror_files = files_under(MIRROR)

missing = sorted(set(canonical_files) - set(mirror_files))
extra = sorted(set(mirror_files) - set(canonical_files))
for rel in missing:
    fail(f"plugin mirror missing canonical file: {rel}")
for rel in extra:
    fail(f"plugin mirror has unexpected file: {rel}")

for rel in sorted(set(canonical_files) & set(mirror_files)):
    if sha256(canonical_files[rel]) != sha256(mirror_files[rel]):
        fail(f"plugin mirror drift: {rel}")

names: dict[str, str] = {}
for skill_dir in sorted(p for p in CANONICAL.iterdir() if p.is_dir()):
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        warnings.append(f"{skill_dir.name}: no SKILL.md; ignored as non-skill directory")
        continue
    name, _ = parse_frontmatter(skill_file)
    validate_openai_yaml(skill_dir)
    if name:
        if name in names:
            fail(f"duplicate skill name {name!r}: {names[name]} and {skill_file}")
        else:
            names[name] = str(skill_file)
        if len(f"{plugin_name}:{name}") > 64:
            fail(f"combined plugin/skill identity exceeds 64 chars: {plugin_name}:{name}")

index_path = MIRROR / "skill-library-router" / "references" / "skills-index.json"
try:
    index = json.loads(index_path.read_text(encoding="utf-8"))
    indexed = {item["name"] for item in index.get("skills", [])}
    actual = set(names)
    if indexed != actual:
        for name in sorted(actual - indexed):
            fail(f"skill missing from index: {name}")
        for name in sorted(indexed - actual):
            fail(f"index contains nonexistent skill: {name}")
    if index.get("products") != ["CHAT", "CODEX"]:
        fail("v2 index must target CHAT and CODEX")
    if index.get("allow_implicit_invocation") is not True:
        fail("v2 index must enable implicit invocation")
    if index.get("runtime_github_fetch_required") is not False:
        fail("v2 index must set runtime_github_fetch_required=false")
except Exception as exc:
    fail(f"skills-index.json unreadable or invalid: {exc}")

print("Personal Skill Library validation")
print(f"  plugin version: {manifest.get('version', 'unknown')}")
print(f"  canonical skills: {len(names)}")
print(f"  canonical files: {len(canonical_files)}")
print(f"  mirrored files: {len(mirror_files)}")
print("  required products: CHAT, CODEX")
for required in ("scripts/install-personal-skill-library.ps1", "scripts/install-personal-skill-library.sh", "docs/V2_1_ACTIVATION_TEST.md"):
    if not (ROOT / required).exists():
        fail(f"missing v2.1 installation asset: {required}")

for warning in warnings:
    print(f"WARNING: {warning}")

if errors:
    print(f"FAIL: {len(errors)} issue(s)")
    for error in errors:
        print(f"  - {error}")
    sys.exit(1)

print("PASS: v2.1 Chat/Codex metadata, canonical mirror, registry, marketplace, and install assets are consistent")
