#!/usr/bin/env python3
import importlib.util, json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("hcp",ROOT/"controller"/"hermes_control_plane.py")
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

job=json.loads((ROOT/"examples"/"job.example.json").read_text())
assert not m.validate(job,"job-example-001.json")

bad=dict(job)
bad["job_id"]="../escape"
assert m.validate(bad,"../escape.json")

bad=dict(job)
bad["unexpected"]=True
assert any("unknown fields" in x for x in m.validate(bad,"job-example-001.json"))

assert m.TERMINAL=={"completed","failed","cancelled","interrupted"}

print("PASS: Hermes control-plane v0.1 contracts")
