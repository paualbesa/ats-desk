#!/usr/bin/env python3
"""Inserta Worker polyfill y shell móvil en rustdesk-web/index.html."""
import pathlib
import re
import sys

MOBILE_SHELL_MARKER = 'data-ats-mobile-shell'


def worker_polyfill_script(worker_ts: pathlib.Path) -> str:
    poly_src = worker_ts.read_text(encoding='utf-8')
    m = re.search(r"export const WORKER_POLYFILL_SCRIPT = `([\s\S]*?)`;", poly_src)
    if not m:
        raise SystemExit('worker polyfill not found')
    return m.group(1)


def build_mobile_shell(worker_script: str, custom_ini: str) -> str:
    return f"""<!DOCTYPE html>
<html {MOBILE_SHELL_MARKER}="1">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <base href="./" />
  <style>
    html, body {{ margin: 0; height: 100%; background: #000; overflow: hidden; }}
    #ats-canvas {{ display: block; width: 100%; height: 100%; touch-action: none; }}
    #div-background, #root {{ display: none !important; }}
  </style>
  <script id="ats-worker-polyfill">{worker_script}</script>
  <script id="custom-config" type="text/plain">{custom_ini}</script>
  <script type="module" crossorigin src="js/dist/index.js"></script>
  <link rel="modulepreload" href="js/dist/vendor.js" />
</head>
<body>
  <canvas id="ats-canvas"></canvas>
  <div id="root"></div>
</body>
</html>
"""


def main() -> int:
    if len(sys.argv) < 2:
        print('usage: patch-rustdesk-web-index.py <rustdesk-web-dir>')
        return 1
    root = pathlib.Path(sys.argv[1])
    index = root / 'index.html'
    worker_ts = pathlib.Path(__file__).resolve().parents[1] / 'mobile-expo/src/remote/workerPolyfill.ts'
    if not index.is_file():
        print(f'missing {index}')
        return 1

    worker_script = worker_polyfill_script(worker_ts)
    custom_ini = (
        '[default-settings]\n'
        'custom-rendezvous-server=rd.albesa.tech:21116\n'
        'relay-server=rd.albesa.tech:21117\n'
        'key=RoldVL1Npn0FLv274f1N6zlbWlhZKoOiYUvObjDLomo=\n'
        'force-always-relay=Y\n'
    )
    index.write_text(build_mobile_shell(worker_script, custom_ini), encoding='utf-8')
    print(f'patched {index} (mobile shell)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
