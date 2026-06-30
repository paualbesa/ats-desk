#!/usr/bin/env python3
"""
Build ATS Desk y copia el ejecutable a la raíz del proyecto para pruebas rápidas.

Uso:
  python3 build_ats_desk.py              # build debug (más rápido)
  python3 build_ats_desk.py --release    # build release
  python3 build_ats_desk.py --release --flutter   # build Flutter completo

Resultado en la raíz:
  Windows: ATS-Desk.exe + custom_client_config.json
  Linux:   ATS-Desk + custom_client_config.json
  macOS:   ATS-Desk.app (carpeta)
"""
from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG_SRC = ROOT / "custom_client_config.json"
CONFIG_EXAMPLE = ROOT / "custom_client_config.json.example"


def run(cmd: str, cwd: Path | None = None) -> None:
    print(f"\n>>> {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=cwd or ROOT)
    if r.returncode != 0:
        sys.exit(r.returncode)


def ensure_config() -> None:
    if not CONFIG_SRC.exists():
        if CONFIG_EXAMPLE.exists():
            shutil.copy(CONFIG_EXAMPLE, CONFIG_SRC)
            print(f"Copiado {CONFIG_EXAMPLE.name} -> custom_client_config.json")
        else:
            print("Aviso: no hay custom_client_config.json")


def copy_config(dest_dir: Path) -> None:
    if CONFIG_SRC.exists():
        shutil.copy(CONFIG_SRC, dest_dir / "custom_client_config.json")
        print(f"Config copiada a {dest_dir / 'custom_client_config.json'}")


def build_flutter(release: bool) -> Path:
    mode = "release" if release else "debug"
    run("cargo build --features flutter --lib" + (" --release" if release else ""))
    flutter_dir = ROOT / "flutter"
    run(f"flutter build windows --{mode}" if platform.system() == "Windows"
        else (f"flutter build linux --{mode}" if platform.system() == "Linux"
              else f"flutter build macos --{mode}"), cwd=flutter_dir)

    if platform.system() == "Windows":
        sub = "Release" if release else "Debug"
        return flutter_dir / f"build/windows/x64/runner/{sub}"
    if platform.system() == "Linux":
        return flutter_dir / f"build/linux/x64/{mode}/bundle"
    return flutter_dir / f"build/macos/Build/Products/{'Release' if release else 'Debug'}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build ATS Desk para pruebas rápidas")
    parser.add_argument("--release", action="store_true", help="Build en modo release")
    parser.add_argument("--flutter", action="store_true", help="Build Flutter UI (recomendado)")
    args = parser.parse_args()

    ensure_config()
    is_win = platform.system() == "Windows"
    out_name = "ATS-Desk.exe" if is_win else "ATS-Desk"

    if args.flutter:
        bundle = build_flutter(args.release)
        if is_win:
            src_exe = bundle / "rustdesk.exe"
            if not src_exe.exists():
                src_exe = bundle / "ats_desk.exe"
            dest = ROOT / out_name
            shutil.copy2(src_exe, dest)
            copy_config(bundle)
            copy_config(ROOT)
            print(f"\n✓ Listo: {dest}")
            print("  Ejecuta ATS-Desk.exe desde la raíz del proyecto.")
        elif platform.system() == "Linux":
            src = bundle / "rustdesk"
            dest = ROOT / out_name
            shutil.copy2(src, dest)
            os.chmod(dest, 0o755)
            copy_config(bundle)
            copy_config(ROOT)
            print(f"\n✓ Listo: {dest}")
        else:
            app = bundle / "rustdesk.app"
            dest = ROOT / "ATS-Desk.app"
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(app, dest)
            copy_config(bundle)
            copy_config(ROOT)
            print(f"\n✓ Listo: {dest}")
    else:
        cmd = "cargo build" + (" --release" if args.release else "")
        run(cmd)
        sub = "release" if args.release else "debug"
        src = ROOT / "target" / sub / ("rustdesk.exe" if is_win else "rustdesk")
        dest = ROOT / out_name
        shutil.copy2(src, dest)
        if not is_win:
            os.chmod(dest, 0o755)
        copy_config(ROOT)
        print(f"\n✓ Listo: {dest}")

    print("\nServidor configurado en custom_client_config.json (server.albesa.tech)")


if __name__ == "__main__":
    main()
