#!/usr/bin/env python3
"""Genera iconos ATS Desk desde los PNG maestros del usuario (2048×2048).

Fuentes (assets/branding/):
  - ATSDeskTransparenticon.png  → logo UI, splash, Android foreground, fill1080
  - ATSDeskicon.png              → icono de app con fondo blanco (launcher, .ico)
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / "assets" / "branding"

TRANSPARENT_NAMES = (
    "ATSDeskTransparenticon.png",
    "ATSDeskTransparentIcon.png",
    "atsdesktransparenticon.png",
)

WHITE_NAMES = (
    "ATSDeskicon.png",
    "ATSDeskIcon.png",
    "ATSDeskWhiteicon.png",
    "ATSDeskWhiteIcon.png",
    "atsdeskicon.png",
)


def find_in_branding(names: tuple[str, ...]) -> Path | None:
    if not BRANDING.is_dir():
        return None
    # Coincidencia exacta (sensible a mayúsculas en Linux; en Windows Path.exists es case-insensitive)
    for name in names:
        path = BRANDING / name
        if path.is_file():
            return path
    # Fallback: comparar sin distinguir mayúsculas
    lower_map = {p.name.lower(): p for p in BRANDING.glob("*.png")}
    for name in names:
        hit = lower_map.get(name.lower())
        if hit and hit.is_file():
            return hit
    return None


def resolve_transparent(explicit: Path | None) -> Path:
    if explicit is not None:
        p = explicit if explicit.is_absolute() else (Path.cwd() / explicit)
        if p.is_file():
            return p.resolve()
    found = find_in_branding(TRANSPARENT_NAMES)
    if found:
        return found
    return BRANDING / TRANSPARENT_NAMES[0]


def resolve_white(explicit: Path | None, transparent: Path) -> Path:
    if explicit is not None:
        p = explicit if explicit.is_absolute() else (Path.cwd() / explicit)
        if p.is_file():
            return p.resolve()
    found = find_in_branding(WHITE_NAMES)
    if found:
        return found
    # Cualquier otro PNG en branding que no sea el transparente
    if BRANDING.is_dir():
        for png in sorted(BRANDING.glob("*.png")):
            if png.resolve() != transparent.resolve():
                return png
    return BRANDING / WHITE_NAMES[0]


def list_branding_files() -> str:
    if not BRANDING.is_dir():
        return f"(la carpeta no existe: {BRANDING})"
    files = sorted(BRANDING.glob("*.png"))
    if not files:
        return "(no hay archivos .png)"
    return "\n".join(f"  - {f.name}" for f in files)


def main() -> None:
    try:
        from PIL import Image
    except ImportError:
        print("pip install Pillow")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Genera iconos ATS Desk desde branding maestro")
    parser.add_argument(
        "--transparent",
        type=Path,
        default=None,
        help="PNG transparente 2048 (por defecto: assets/branding/ATSDeskTransparenticon.png)",
    )
    parser.add_argument(
        "--white",
        type=Path,
        default=None,
        help="PNG fondo blanco 2048 (por defecto: assets/branding/ATSDeskicon.png)",
    )
    args = parser.parse_args()

    transparent_path = resolve_transparent(args.transparent)
    white_path = resolve_white(args.white, transparent_path)

    missing = []
    if not transparent_path.is_file():
        missing.append(("transparente", transparent_path, TRANSPARENT_NAMES[0]))
    if not white_path.is_file():
        missing.append(("blanco", white_path, WHITE_NAMES[0]))

    if missing:
        print("ERROR: faltan PNG maestros en assets/branding/\n")
        for label, path, example in missing:
            print(f"  {label}: no encontrado ({path})")
            print(f"    nombre esperado: {example}")
        print(f"\nArchivos .png actuales en {BRANDING}:")
        print(list_branding_files())
        print("\nCopia tus PNG 2048×2048 y vuelve a ejecutar:")
        print("  python scripts/generate_ats_icons.py")
        sys.exit(1)

    transparent = Image.open(transparent_path).convert("RGBA")
    white = Image.open(white_path).convert("RGBA")

    def resize(img: Image.Image, size: int) -> Image.Image:
        return img.resize((size, size), Image.Resampling.LANCZOS)

    def save(img: Image.Image, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, optimize=True)

    mobile = ROOT / "mobile-expo/assets/images"

    # Launcher iOS/Android — fondo blanco
    save(resize(white, 1024), mobile / "icon.png")
    save(resize(transparent, 128), mobile / "logo.png")
    save(resize(white, 48), mobile / "favicon.png")

    # Splash: logo transparente sobre fondo oscuro de la app
    splash = Image.new("RGBA", (1024, 1024), "#0D0D0F")
    icon512 = resize(transparent, 512)
    splash.paste(icon512, (256, 256), icon512)
    save(splash, mobile / "splash-icon.png")

    # Android adaptive: foreground transparente, background oscuro
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    icon_fg = resize(transparent, 660)
    fg.paste(icon_fg, (182, 182), icon_fg)
    save(fg, mobile / "android-icon-foreground.png")
    save(Image.new("RGB", (1024, 1024), "#0D0D0F"), mobile / "android-icon-background.png")

    mono = resize(transparent, 660).convert("L")
    mono_rgba = Image.merge("RGBA", (mono, mono, mono, mono))
    mono_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mono_canvas.paste(mono_rgba, (182, 182))
    save(mono_canvas, mobile / "android-icon-monochrome.png")

    # Flutter / escritorio
    save(resize(white, 1080), ROOT / "flutter/assets/ATSDESKicon1080.png")

    fill = Image.new("RGBA", (1080, 1080), (0, 0, 0, 0))
    fill_icon = resize(transparent, int(1080 * 0.72))
    off = (1080 - fill_icon.width) // 2
    fill.paste(fill_icon, (off, off), fill_icon)
    save(fill, ROOT / "flutter/assets/ATSDESKiconfill1080.png")
    save(resize(transparent, 256), ROOT / "flutter/assets/ATSDESKicon256.png")

    sizes = (256, 48, 32, 24, 16)
    icons = [resize(white, s) for s in sizes]
    ico = ROOT / "flutter/windows/runner/resources/ATSDESKicon.ico"
    icons[0].save(ico, format="ICO", sizes=[(s, s) for s in sizes], append_images=icons[1:])
    shutil.copy2(ico, ROOT / "flutter/assets/ATSDESKicon.ico")

    print("OK — iconos generados desde tus PNG maestros:")
    print(f"  transparente: {transparent_path}")
    print(f"  blanco:       {white_path}")


if __name__ == "__main__":
    main()
