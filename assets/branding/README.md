# Iconos maestros ATS Desk

Coloca aquí los PNG **originales 2048×2048** (no uses iconos generados por IA):

| Archivo | Uso |
|---------|-----|
| `ATSDeskTransparenticon.png` | Fondo transparente — logo en UI, splash, Android foreground |
| `ATSDeskicon.png` | Fondo blanco — icono de app (móvil + escritorio) |

Si el blanco tiene otro nombre, el script intenta detectarlo automáticamente o puedes indicarlo:

```bash
python scripts/generate_ats_icons.py --white "assets/branding/TuArchivoBlanco.png"
```

Generar todos los tamaños (desde la raíz del repo):

```bash
python scripts/generate_ats_icons.py
```

Requisito: `pip install Pillow`
