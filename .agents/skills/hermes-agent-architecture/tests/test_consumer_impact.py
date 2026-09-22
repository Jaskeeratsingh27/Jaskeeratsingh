#!/usr/bin/env python3
"""Regression tests for repository consumer-impact mapping."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "maintenance" / "consumer_impact.py"


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


spec = importlib.util.spec_from_file_location("hermes_consumer_impact", ENGINE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


def main() -> None:
    cases = load("tests/consumer-impact-cases.json").get("cases", [])
    if not cases:
        fail("no consumer-impact cases")

    for case in cases:
        result = module.compute(case["impact"])
        expected = case["expected"]
        consumer_ids = sorted(item["consumer_id"] for item in result["affected_consumers"])
        if consumer_ids != sorted(expected.get("consumer_ids", [])):
            fail(f"{case['id']}: consumers expected {expected.get('consumer_ids')}, got {consumer_ids}")
        for field in ("requires_consumer_review","coverage_gap","blocking_consumer_ids"):
            if field in expected and result.get(field) != expected[field]:
                fail(f"{case['id']}: {field} expected {expected[field]!r}, got {result.get(field)!r}")

    print(f"PASS: {len(cases)} consumer-impact scenarios")
    print("PASS: affected consumers, review actions, blocking consumers, and coverage gaps")


if __name__ == "__main__":
    main()
