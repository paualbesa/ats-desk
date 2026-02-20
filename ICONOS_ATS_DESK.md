# 📁 Ubicación de Iconos ATS Desk

## ✅ Archivos ya configurados en el código

He actualizado el código para usar tus iconos ATS Desk. Ahora solo necesitas **colocar los archivos en las siguientes ubicaciones**:

---

## 📂 **1. Iconos para Windows (ejecutable .exe)**

**Ubicación:** `flutter/windows/runner/resources/`

**Archivos a colocar:**
- ✅ **`ATSDESKicon.ico`** → **Ya configurado en Runner.rc** (icono principal del .exe)
- ⚠️ `ATSDESKiconfill.ico` → Opcional (reserva por si quieres cambiar)

**Nota:** El código ya está configurado para usar `ATSDESKicon.ico` como icono del ejecutable de Windows.

### 🔧 Icono pixelado en la barra de tareas / dock

Si el icono se ve **pixelado o borroso** en la barra de tareas de Windows, es porque el `.ico` debe contener **varias resoluciones** en un solo archivo. Con una sola resolución, Windows escala la imagen y se ve mal.

**Solución:** Generar un `.ico` **multiresolución** con al menos estos tamaños:
- **16×16** – Barra de tareas (100% DPI)
- **24×24** – (125% DPI)
- **32×32** – Accesos directos
- **48×48** – Menú inicio, bandeja
- **256×256** – Pantallas alta resolución (imprescindible para que se vea nítido)

**Opciones para generar el .ico:**

1. **Script incluido (recomendado):** En la raíz del proyecto hay un script que genera `ATSDESKicon.ico` multiresolución a partir de tu PNG de 256 o 1080 px:
   ```bash
   python build_ico_multiresolution.py
   ```
   Coloca antes en `flutter/windows/runner/resources/` una imagen fuente (por ejemplo `ATSDESKicon256.png` o `ATSDESKicon1080.png`) o indica la ruta en el script.

2. **Online:** [iconresizer.com](https://iconresizer.com/) – sube tu PNG y descarga un .ico con varios tamaños.

3. **ImageMagick** (si lo tienes instalado):
   ```bash
   magick convert flutter/assets/ATSDESKicon256.png -define icon:auto-resize=256,48,32,16 flutter/windows/runner/resources/ATSDESKicon.ico
   ```

4. **GIMP:** Abre el PNG, exporta como .ico y en el diálogo activa/agrega las resoluciones 16, 32, 48 y 256.

---

## 📂 **2. Iconos para Flutter UI (assets)**

**Ubicación:** `flutter/assets/`

**Archivos a colocar (todos aquí):**

### **Archivos esenciales (requeridos):**
1. ✅ **`ATSDESKiconfill1080.png`** → Logo grande usado en la pantalla principal (`loadLogo()`)
2. ✅ **`ATSDESKicon256.png`** → Icono pequeño circular usado en tabbar y otros lugares (`loadIcon()`)
3. ✅ **`ATSDESKicon256.svg`** → Fallback SVG para icono pequeño (si PNG falla)

### **Archivos para launcher (Android/iOS):**
4. ✅ **`ATSDESKicon1080.png`** → Para generar iconos de launcher en Android/iOS (configurado en `pubspec.yaml`)

### **Archivos opcionales (puedes colocarlos también):**
- `ATSDESKicon1080.svg` → Opcional
- `ATSDESKiconfill256.png` → Opcional
- `ATSDESKiconfill256.svg` → Opcional
- `ATSDESKiconfill1080.svg` → Opcional

**Resumen mínimo:** Necesitas al menos los 4 archivos esenciales arriba.

---

## 📋 **Resumen de cambios realizados:**

### ✅ **Código actualizado:**

1. **`flutter/windows/runner/Runner.rc`**
   - Configurado para usar `ATSDESKicon.ico`

2. **`flutter/lib/common.dart`**
   - `loadLogo()` → Usa `ATSDESKiconfill1080.png`
   - `loadIcon()` → Usa `ATSDESKicon256.png` (fallback a SVG)

3. **`flutter/pubspec.yaml`**
   - `flutter_icons` configurado para usar `ATSDESKicon1080.png` para Android/iOS
   - Windows usa `ATSDESKicon.ico` desde assets

4. **`flutter/lib/desktop/widgets/tabbar_widget.dart`**
   - Texto cambiado de "RustDesk" a "ATS Desk"

---

## 🚀 **Próximos pasos:**

1. **Coloca los archivos** en las ubicaciones indicadas arriba
2. **Regenera iconos de launcher** (opcional, para Android/iOS):
   ```bash
   cd flutter
   flutter pub run flutter_launcher_icons
   ```
3. **Compila y prueba** la aplicación

---

## 📝 **Notas:**

- Los iconos `.ico` van en `flutter/windows/runner/resources/`
- Los iconos `.png` y `.svg` van en `flutter/assets/`
