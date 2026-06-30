#!/usr/bin/env python3
"""
Build ATS Desk y copia el ejecutable a la raíz del proyecto para pruebas rápidas.

Uso:
  python3 build_ats_desk.py --release --flutter

Resultado en la raíz:
  Windows: ATS-Desk.exe + custom_client_config.json
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
BRIDGE_RUST = ROOT / "src" / "bridge_generated.rs"
BRIDGE_DART = ROOT / "flutter" / "lib" / "generated_bridge.dart"


def run(cmd: str, cwd: Path | None = None, check: bool = True) -> int:
    print(f"\n>>> {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=cwd or ROOT)
    if check and r.returncode != 0:
        sys.exit(r.returncode)
    return r.returncode


def ensure_config() -> None:
    if not CONFIG_SRC.exists() and CONFIG_EXAMPLE.exists():
        shutil.copy(CONFIG_EXAMPLE, CONFIG_SRC)
        print(f"Copiado {CONFIG_EXAMPLE.name} -> custom_client_config.json")


def ensure_submodules() -> None:
    if not (ROOT / "libs" / "hbb_common" / "Cargo.toml").exists():
        print("Inicializando submódulos git...")
        run("git submodule update --init --recursive")


def ensure_bridge() -> None:
    """Genera bridge_generated si falta (obligatorio para compilar con feature flutter)."""
    if BRIDGE_RUST.exists() and BRIDGE_DART.exists():
        print("Bridge ya generado, omitiendo codegen.")
        return

    print("Generando flutter_rust_bridge (bridge_generated.rs)...")
    is_win = platform.system() == "Windows"
    script = ROOT / ("scripts/generate_bridge.bat" if is_win else "scripts/generate_bridge.sh")
    if script.exists():
        cmd = str(script) if is_win else f"bash {script}"
        run(cmd)
    else:
        run("git submodule update --init --recursive")
        run("cargo install flutter_rust_bridge_codegen --version 1.80.1 --features uuid --locked", check=False)
        frb = "flutter_rust_bridge_codegen"
        run("flutter pub get", cwd=ROOT / "flutter")
        run(
            f'{frb} --rust-input ./src/flutter_ffi.rs '
            f'--dart-output ./flutter/lib/generated_bridge.dart '
            f'--c-output ./flutter/macos/Runner/bridge_generated.h'
        )

    if not BRIDGE_RUST.exists():
        print("ERROR: No se generó src/bridge_generated.rs")
        print("Ejecuta manualmente: scripts\\generate_bridge.bat")
        sys.exit(1)


def copy_config(dest_dir: Path) -> None:
    if CONFIG_SRC.exists():
        shutil.copy(CONFIG_SRC, dest_dir / "custom_client_config.json")


def build_flutter(release: bool) -> Path:
    mode = "release" if release else "debug"
    flags = "--features flutter --lib" + (" --release" if release else "")
    run(f"cargo build {flags}")
    flutter_dir = ROOT / "flutter"
    if platform.system() == "Windows":
        run(f"flutter build windows --{mode}", cwd=flutter_dir)
        sub = "Release" if release else "Debug"
        return flutter_dir / f"build/windows/x64/runner/{sub}"
    if platform.system() == "Linux":
        run(f"flutter build linux --{mode}", cwd=flutter_dir)
        return flutter_dir / f"build/linux/x64/{mode}/bundle"
    run(f"flutter build macos --{mode}", cwd=flutter_dir)
    return flutter_dir / f"build/macos/Build/Products/{'Release' if release else 'Debug'}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build ATS Desk para pruebas rápidas")
    parser.add_argument("--release", action="store_true")
    parser.add_argument("--flutter", action="store_true")
    parser.add_argument("--skip-bridge", action="store_true", help="No regenerar bridge")
    args = parser.parse_args()

    ensure_config()
    ensure_submodules()
    if args.flutter and not args.skip_bridge:
        ensure_bridge()

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
        elif platform.system() == "Linux":
            shutil.copy2(bundle / "rustdesk", ROOT / out_name)
            os.chmod(ROOT / out_name, 0o755)
            copy_config(bundle)
            copy_config(ROOT)
            print(f"\n✓ Listo: {ROOT / out_name}")
        else:
            dest = ROOT / "ATS-Desk.app"
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(bundle / "rustdesk.app", dest)
            copy_config(bundle)
            copy_config(ROOT)
            print(f"\n✓ Listo: {dest}")
    else:
        run("cargo build" + (" --release" if args.release else ""))
        sub = "release" if args.release else "debug"
        src = ROOT / "target" / sub / ("rustdesk.exe" if is_win else "rustdesk")
        shutil.copy2(src, ROOT / out_name)
        copy_config(ROOT)
        print(f"\n✓ Listo: {ROOT / out_name}")


if __name__ == "__main__":
    main()
