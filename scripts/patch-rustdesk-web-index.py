#!/usr/bin/env python3
"""Inserta Worker polyfill en rustdesk-web/index.html para WebView móvil."""
import pathlib
import re
import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("usage: patch-rustdesk-web-index.py <rustdesk-web-dir>")
        return 1
    root = pathlib.Path(sys.argv[1])
    index = root / "index.html"
    worker_ts = pathlib.Path(__file__).resolve().parents[1] / "mobile-expo/src/remote/workerPolyfill.ts"
    if not index.is_file():
        print(f"missing {index}")
        return 1
    poly_src = worker_ts.read_text(encoding="utf-8")
    m = re.search(r"export const WORKER_POLYFILL_SCRIPT = `([\s\S]*?)`;", poly_src)
    if not m:
        print("worker polyfill not found")
        return 1
    inject = f"<script id=\"ats-worker-polyfill\">{m.group(1)}</script>"
    html = index.read_text(encoding="utf-8")
    if "ats-worker-polyfill" in html:
        return 0
    if re.search(r"<head[^>]*>", html, re.I):
        html = re.sub(r"<head([^>]*)>", lambda mo: f"<head{mo.group(1)}>{inject}", html, count=1, flags=re.I)
    else:
        html = inject + html
    index.write_text(html, encoding="utf-8")
    print(f"patched {index}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
