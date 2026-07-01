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
TRANSPARENT = BRANDING / "ATSDeskTransparenticon.png"
WHITE_CANDIDATES = (
    BRANDING / "ATSDeskicon.png",
    BRANDING / "ATSDeskWhiteicon.png",
)


def resolve_white(explicit: Path | None) -> Path:
    if explicit and explicit.is_file():
        return explicit
    for path in WHITE_CANDIDATES:
        if path.is_file():
            return path
    return WHITE_CANDIDATES[0]


def main() -> None:
    try:
        from PIL import Image
    except ImportError:
        print("pip install Pillow")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Genera iconos ATS Desk desde branding maestro")
    parser.add_argument("--transparent", type=Path, default=TRANSPARENT, help="PNG transparente 2048")
    parser.add_argument("--white", type=Path, default=None, help="PNG fondo blanco 2048")
    args = parser.parse_args()

    white_path = resolve_white(args.white)
    for label, path in [("transparente", args.transparent), ("blanco", white_path)]:
        if not path.is_file():
            print(f"ERROR: falta el PNG {label}: {path}")
            print("Copia tus archivos 2048×2048 en assets/branding/:")
            print(f"  - {TRANSPARENT.name}")
            print(f"  - {WHITE.name}")
            sys.exit(1)

    transparent = Image.open(args.transparent).convert("RGBA")
    white = Image.open(args.white).convert("RGBA")

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
    print(f"  transparente: {args.transparent}")
    print(f"  blanco:       {args.white}")


if __name__ == "__main__":
    main()
