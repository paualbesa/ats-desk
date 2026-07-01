#!/usr/bin/env python3
"""Genera iconos ATS Desk para móvil (Expo) y escritorio (Flutter/Windows) desde un PNG maestro 1024×1024."""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    try:
        from PIL import Image
    except ImportError:
        print("pip install Pillow")
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source",
        nargs="?",
        default=str(ROOT / "mobile-expo/assets/images/icon.png"),
        help="PNG maestro (1024×1024 recomendado)",
    )
    args = parser.parse_args()
    source = Path(args.source)
    if not source.is_file():
        print(f"No existe: {source}")
        sys.exit(1)

    master = Image.open(source).convert("RGBA")

    def save(img: Image.Image, path: Path, size: int, bg: str | None = None) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        if bg:
            canvas = Image.new("RGBA", (size, size), bg)
            icon = img.resize((size, size), Image.Resampling.LANCZOS)
            canvas.paste(icon, (0, 0), icon)
            canvas.save(path, optimize=True)
        else:
            img.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)

    mobile = ROOT / "mobile-expo/assets/images"
    save(master, mobile / "icon.png", 1024)
    save(master, mobile / "logo.png", 128)
    save(master, mobile / "favicon.png", 48)

    splash = Image.new("RGBA", (1024, 1024), "#0D0D0F")
    icon512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    splash.paste(icon512, (256, 256), icon512)
    splash.save(mobile / "splash-icon.png", optimize=True)

    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    icon_fg = master.resize((660, 660), Image.Resampling.LANCZOS)
    fg.paste(icon_fg, (182, 182), icon_fg)
    fg.save(mobile / "android-icon-foreground.png", optimize=True)
    Image.new("RGB", (1024, 1024), "#0D0D0F").save(mobile / "android-icon-background.png", optimize=True)

    for name, size in [
        ("ATSDESKicon1080.png", 1080),
        ("ATSDESKiconfill1080.png", 1080),
        ("ATSDESKicon256.png", 256),
    ]:
        path = ROOT / "flutter/assets" / name
        if "fill" in name:
            canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            icon = master.resize((int(size * 0.72), int(size * 0.72)), Image.Resampling.LANCZOS)
            off = (size - icon.width) // 2
            canvas.paste(icon, (off, off), icon)
            canvas.save(path, optimize=True)
        else:
            save(master, path, size)

    sizes = (256, 48, 32, 24, 16)
    icons = [master.resize((s, s), Image.Resampling.LANCZOS) for s in sizes]
    ico = ROOT / "flutter/windows/runner/resources/ATSDESKicon.ico"
    icons[0].save(ico, format="ICO", sizes=[(s, s) for s in sizes], append_images=icons[1:])
    shutil.copy2(ico, ROOT / "flutter/assets/ATSDESKicon.ico")
    print("Iconos generados en mobile-expo/assets/images y flutter/assets")


if __name__ == "__main__":
    main()
