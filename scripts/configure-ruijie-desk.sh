#!/usr/bin/env bash
# Configura reenvío ATS Desk en Ruijie Reyee (ejecutar EN el servidor ATS, LAN 192.168.110.x).
# Requiere: python3, openssl, acceso HTTP al router 192.168.110.1
#
# Uso:
#   RUIJIE_PASS='tu_password' bash scripts/configure-ruijie-desk.sh
#   RUIJIE_PASS='...' RUIJIE_ROUTER=192.168.110.1 DESK_LAN_IP=192.168.110.224 bash ...
set -euo pipefail

ROUTER="${RUIJIE_ROUTER:-192.168.110.1}"
PASS="${RUIJIE_PASS:-}"
SERVER="${DESK_LAN_IP:-192.168.110.224}"
USER="${RUIJIE_USER:-admin}"

if [[ -z "$PASS" ]]; then
  echo "ERROR: Define RUIJIE_PASS"
  exit 1
fi

python3 - "$ROUTER" "$USER" "$PASS" "$SERVER" <<'PY'
import json, subprocess, sys, urllib.request, time

router, user, password, server = sys.argv[1:5]
sn = None

def enc(p):
    return subprocess.check_output(
        ["openssl", "enc", "-aes-256-cbc", "-a", "-k", "RjYkhwzx$2018!", "-md", "md5"],
        input=p, text=True,
    ).strip()

def login():
    global sn
    body = {"method": "login", "params": {
        "username": user, "password": enc(password), "encry": True,
        "time": int(time.time()), "limit": False,
    }}
    req = urllib.request.Request(
        f"http://{router}/cgi-bin/luci/api/auth",
        data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read().decode())["data"]
    sn = data.get("sn") or "H1U6114006086"
    return data["sid"]

def cmd_arr(sid, modules):
    body = {"method": "cmdArr", "params": {"device": "pc", "params": modules}}
    url = f"http://{router}/cgi-bin/luci/api/cmd?auth={sid}"
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "Cookie": f"{sn}={sid}"},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode())

def rule_exists(rules, port, proto=None):
    for r in rules:
        if r.get("destIp") != server:
            continue
        sp = r.get("srcPort", "")
        if str(port) in sp or sp == str(port):
            if proto and proto not in r.get("proto", ""):
                continue
            return True
    return False

sid = login()
pm = cmd_arr(sid, [{"method": "devConfig.get", "params": {"module": "port_mapping"}}])
cfg = pm["data"][0]
rules = list(cfg.get("portMapping", []))

wanted = [
    ("ATS Desk", "21116", "tcp+udp", "21116"),
    ("ATS Desk 21115", "21115", "tcp", "21115"),
    ("ATS Desk relay", "21117-21119", "tcp", "21117-21119"),
]

for name, src_port, proto, dest_port in wanted:
    if not rule_exists(rules, src_port.split("-")[0], proto):
        rules.append({
            "ruleName": name, "src": "wan", "proto": proto,
            "srcIp": "", "intf": "", "srcPort": src_port,
            "destIp": server, "destPort": dest_port,
        })
        print(f"+ regla {name} {proto} {src_port} -> {server}:{dest_port}")

if len(rules) != len(cfg.get("portMapping", [])):
    upd = cmd_arr(sid, [{
        "method": "devConfig.update",
        "params": {"module": "port_mapping", "data": {"portMapping": rules}},
    }])
    if upd.get("code") != 0:
        print("ERROR al actualizar:", upd)
        sys.exit(1)
    print("Reglas actualizadas en el Ruijie.")
else:
    print("Reenvío ATS Desk ya estaba configurado.")

pm2 = cmd_arr(sid, [{"method": "devConfig.get", "params": {"module": "port_mapping"}}])
for r in pm2["data"][0].get("portMapping", []):
  if r.get("destIp") == server:
    print(f"  {r.get('ruleName')}: {r.get('proto')} {r.get('srcPort')} -> {r.get('destIp')}:{r.get('destPort')}")
PY

echo ""
echo "HTTP/WebSocket móvil: https://desk.albesa.tech (túnel Cloudflare)"
echo "RustDesk: rd.albesa.tech:21116 (registro A gris en Cloudflare)"
