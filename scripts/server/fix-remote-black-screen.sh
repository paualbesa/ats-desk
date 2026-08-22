#!/usr/bin/env bash
# Arregla pantalla negra al conectar por ATS Desk / RustDesk (host sin monitor/HDMI).
# Ejecutar EN EL SERVIDOR como el usuario que corre ATS Desk (normalmente ats-server).
set -euo pipefail

REPO="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"
LOG_TAG="[fix-black-screen]"

echo "$LOG_TAG Inicio — $(date -Iseconds)"
echo "$LOG_TAG Hostname: $(hostname)"
echo "$LOG_TAG Usuario: $(whoami)"

fix_linux() {
  echo "$LOG_TAG Linux — diagnóstico de pantalla"
  echo "  DISPLAY=${DISPLAY:-<vacío>}"
  if command -v xdpyinfo >/dev/null 2>&1 && [[ -n "${DISPLAY:-}" ]]; then
    xdpyinfo 2>/dev/null | head -5 || echo "  xdpyinfo falló (sin sesión gráfica activa)"
  else
    echo "  Sin DISPLAY activo o xdpyinfo no instalado"
  fi

  if command -v loginctl >/dev/null 2>&1; then
    loginctl list-sessions 2>/dev/null | head -10 || true
  fi

  MISSING=()
  for pkg in xorg xserver-xorg xserver-xorg-video-dummy dbus-x11 xfce4 xfce4-session; do
    if ! dpkg -s "$pkg" >/dev/null 2>&1; then
      MISSING+=("$pkg")
    fi
  done

  if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo "$LOG_TAG Instalando paquetes gráficos headless: ${MISSING[*]}"
    sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
      xorg xserver-xorg xserver-xorg-video-dummy dbus-x11 \
      xfce4 xfce4-session x11-xserver-utils
  else
    echo "$LOG_TAG Paquetes gráficos ya instalados"
  fi

  DUMMY_CONF="/etc/X11/xorg.conf.d/10-dummy.conf"
  if [[ ! -f "$DUMMY_CONF" ]]; then
    echo "$LOG_TAG Creando monitor virtual (dummy) 1920x1080"
    sudo mkdir -p /etc/X11/xorg.conf.d
    sudo tee "$DUMMY_CONF" >/dev/null <<'XORG'
Section "Monitor"
  Identifier "DummyMonitor"
  HorizSync 28.0-80.0
  VertRefresh 48.0-75.0
  Modeline "1920x1080" 148.50 1920 2448 2492 2640 1080 1084 1089 1125 +HSync +VSync
EndSection

Section "Device"
  Identifier "DummyDevice"
  Driver "dummy"
  VideoRam 256000
EndSection

Section "Screen"
  Identifier "DummyScreen"
  Device "DummyDevice"
  Monitor "DummyMonitor"
  DefaultDepth 24
  SubSection "Display"
    Depth 24
    Modes "1920x1080"
  EndSubSection
EndSection

Section "ServerLayout"
  Identifier "DummyLayout"
  Screen "DummyScreen"
EndSection
XORG
  fi

  # Config cliente ATS Desk junto al repo (Linux portable / build local)
  CFG="${REPO}/custom_client_config.json"
  if [[ -f "$CFG" ]]; then
    if command -v python3 >/dev/null 2>&1; then
      python3 - "$CFG" <<'PY'
import json, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
ov = data.setdefault("override-settings", {})
ov.setdefault("allow-d3d-render", "N")
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("allow-d3d-render=N en", path)
PY
    fi
  fi

  # Servicios RustDesk / ATS Desk habituales
  for svc in rustdesk rustdesk.service ats-desk; do
    if systemctl list-unit-files "$svc" 2>/dev/null | grep -q "$svc"; then
      echo "$LOG_TAG Reiniciando $svc"
      sudo systemctl restart "$svc" 2>/dev/null || true
    fi
  done

  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart ats-desk 2>/dev/null || true
  fi

  echo "$LOG_TAG Linux listo. Si sigue negro: inicia sesión gráfica (xfce) o reconecta tras 10s."
}

fix_windows_hint() {
  cat <<'WIN'
[Windows] Pantalla negra sin HDMI:
  1. Junto a ATS-Desk.exe, custom_client_config.json con "allow-d3d-render": "N"
  2. Instalar driver de pantalla virtual (instalador ATS Desk / RustDesk)
  3. Reiniciar ATS Desk servicio o la app
WIN
}

case "$(uname -s)" in
  Linux) fix_linux ;;
  MINGW*|MSYS*|CYGWIN*)
    fix_windows_hint
    echo "$LOG_TAG En Windows ejecuta fix-remote-black-screen.ps1 desde PowerShell"
    ;;
  *)
    echo "$LOG_TAG OS no soportado: $(uname -s)"
    exit 1
  ;;
esac

echo "$LOG_TAG Fin"
