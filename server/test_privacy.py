"""Privacy guards for the speech server: fails if a change could leak call audio or text."""
import ast, os, re, sys

src = open(os.path.join(os.path.dirname(__file__), "server.py"), encoding="utf-8").read()
tree = ast.parse(src)
fail = []

# 1. Only reachable from this machine.
hosts = re.findall(r'host\s*=\s*"([^"]+)"', src)
if hosts != ["127.0.0.1"]:
    fail.append(f"server must listen on 127.0.0.1 only, found {hosts}")

# 2. Never prints the transcribed text.
for node in ast.walk(tree):
    if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "print":
        names = {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}
        if "text" in names:
            fail.append(f"line {node.lineno}: print() uses the call text")

# 3. Never writes files (no recordings, no transcripts).
for node in ast.walk(tree):
    if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "open":
        mode = node.args[1].value if len(node.args) > 1 and isinstance(node.args[1], ast.Constant) else "r"
        if any(c in mode for c in "wax+"):
            fail.append(f"line {node.lineno}: open() for writing")
if re.search(r"\b(sf\.write|wavfile\.write|soundfile|\.tofile\(|np\.save)", src):
    fail.append("server writes audio or arrays to disk")

for f in fail:
    print("FAIL", f)
print("PASS" if not fail else f"{len(fail)} failed")
sys.exit(1 if fail else 0)
