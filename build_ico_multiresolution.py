#!/usr/bin/env python3
"""
Genera ATSDESKicon.ico multiresolución para que el icono se vea nítido
en la barra de tareas de Windows (sin pixelado).

Requisito: pip install Pillow

Uso:
  python build_ico_multiresolution.py
  python build_ico_multiresolution.py ruta/a/imagen.png

Si no se pasa ruta, busca en orden:
  - flutter/windows/runner/resources/ATSDESKicon256.png
  - flutter/assets/ATSDESKicon256.png
  - flutter/assets/ATSDESKicon1080.png
"""

import os
import sys

# Tamaños que Windows usa para barra de tareas, menú inicio, etc.
# Incluir 256 evita pixelado en pantallas de alta resolución.
SIZES = (256, 48, 32, 24, 16)

OUTPUT_DIR = "flutter/windows/runner/resources"
OUTPUT_FILE = "ATSDESKicon.ico"

SOURCE_CANDIDATES = [
    "flutter/windows/runner/resources/ATSDESKicon256.png",
    "flutter/windows/runner/resources/ATSDESKicon1080.png",
    "flutter/assets/ATSDESKicon256.png",
    "flutter/assets/ATSDESKicon1080.png",
]


def main():
    try:
        from PIL import Image
    except ImportError:
        print("Se necesita Pillow. Instala con: pip install Pillow")
        sys.exit(1)

    if len(sys.argv) >= 2:
        source = sys.argv[1]
        if not os.path.isfile(source):
            print(f"No se encontró el archivo: {source}")
            sys.exit(1)
    else:
        source = None
        for p in SOURCE_CANDIDATES:
            if os.path.isfile(p):
                source = p
                break
        if not source:
            print("No se encontró ninguna imagen fuente.")
            print("Coloca ATSDESKicon256.png o ATSDESKicon1080.png en:")
            for p in SOURCE_CANDIDATES:
                print("  -", p)
            print("O ejecuta: python build_ico_multiresolution.py <ruta/a/imagen.png>")
            sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)

    img = Image.open(source)
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    # Redimensionar a cada tamaño (LANCZOS para buena calidad)
    icons = [img.resize((size, size), Image.Resampling.LANCZOS) for size in SIZES]

    # Guardar .ico multiresolución (primera imagen + resto con append_images)
    icons[0].save(
        out_path,
        format="ICO",
        sizes=[(s, s) for s in SIZES],
        append_images=icons[1:],
    )
    print(f"Generado: {out_path} (tamaños: {', '.join(str(s) for s in SIZES)} px)")
    print("Vuelve a compilar la app para que el icono se actualice en la barra de tareas.")


if __name__ == "__main__":
    main()
