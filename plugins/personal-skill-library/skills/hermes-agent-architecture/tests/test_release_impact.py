#!/usr/bin/env python3
"""Regression tests for the Hermes release-impact engine."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE_PATH = ROOT / "maintenance" / "impact_engine.py"


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


spec = importlib.util.spec_from_file_location("hermes_impact_engine", ENGINE_PATH)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


def main() -> None:
    cases = load("tests/release-impact-cases.json").get("cases", [])
    if not cases:
        fail("no release-impact regression cases")

    for case in cases:
        result = module.classify(case["event"])
        expected = case["expected"]

        for field in ("severity", "review_required", "affected_capabilities", "needs_revalidation", "unknown_source_ids"):
            if field in expected and result.get(field) != expected[field]:
                fail(f"{case['id']}: {field} expected {expected[field]!r}, got {result.get(field)!r}")

        for regression_id in expected.get("must_include_regression_case_ids", []):
            if regression_id not in result.get("recommended_regression_case_ids", []):
                fail(f"{case['id']}: missing targeted regression case {regression_id}")

    print(f"PASS: {len(cases)} release-impact scenarios")
    print("PASS: severity, review gates, blast radius, and targeted regression selection")


if __name__ == "__main__":
    main()
