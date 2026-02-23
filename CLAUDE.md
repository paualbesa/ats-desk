# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build Commands
- `cargo run` - Build and run the desktop application (requires libsciter library)
- `python3 build.py --flutter` - Build Flutter version (desktop)
- `python3 build.py --flutter --release` - Build Flutter version in release mode
- `python3 build.py --hwcodec` - Build with hardware codec support
- `python3 build.py --vram` - Build with VRAM feature (Windows only)
- `cargo build --release` - Build Rust binary in release mode
- `cargo build --features hwcodec` - Build with specific features

### Flutter Windows (requisito previo)
- **Antes de `flutter run` o `flutter build windows`** hay que compilar la DLL de Rust con el feature `flutter`, o verás "Failed to get rustdesk_core_main":
  - Debug: `cargo build --features flutter --lib` (genera `target\debug\librustdesk.dll`)
  - Release: `cargo build --features flutter --lib --release` (genera `target\release\librustdesk.dll`)
- CMake copia la DLL desde `target/<Debug|Release>/librustdesk.dll` al ejecutable de Flutter.

### Flutter Mobile Commands
- `cd flutter && flutter build android` - Build Android APK
- `cd flutter && flutter build ios` - Build iOS app
- `cd flutter && flutter run` - Run Flutter app in development mode
- `cd flutter && flutter test` - Run Flutter tests

### Testing
- `cargo test` - Run Rust tests
- `cd flutter && flutter test` - Run Flutter tests

### Platform-Specific Build Scripts
- `flutter/build_android.sh` - Android build script
- `flutter/build_ios.sh` - iOS build script
- `flutter/build_fdroid.sh` - F-Droid build script

## Project Architecture

### Directory Structure
- **`src/`** - Main Rust application code
  - `src/ui/` - Legacy Sciter UI (deprecated, use Flutter instead)
  - `src/server/` - Audio/clipboard/input/video services and network connections
  - `src/client.rs` - Peer connection handling
  - `src/platform/` - Platform-specific code
- **`flutter/`** - Flutter UI code for desktop and mobile
- **`libs/`** - Core libraries
  - `libs/hbb_common/` - Video codec, config, network wrapper, protobuf, file transfer utilities
  - `libs/scrap/` - Screen capture functionality
  - `libs/enigo/` - Platform-specific keyboard/mouse control
  - `libs/clipboard/` - Cross-platform clipboard implementation

### Key Components
- **Remote Desktop Protocol**: Custom protocol implemented in `src/rendezvous_mediator.rs` for communicating with rustdesk-server
- **Screen Capture**: Platform-specific screen capture in `libs/scrap/`
- **Input Handling**: Cross-platform input simulation in `libs/enigo/`
- **Audio/Video Services**: Real-time audio/video streaming in `src/server/`
- **File Transfer**: Secure file transfer implementation in `libs/hbb_common/`

### UI Architecture
- **Legacy UI**: Sciter-based (deprecated) - files in `src/ui/`
- **Modern UI**: Flutter-based - files in `flutter/`
  - Desktop: `flutter/lib/desktop/`
  - Mobile: `flutter/lib/mobile/`
  - Shared: `flutter/lib/common/` and `flutter/lib/models/`

## Important Build Notes

### Dependencies
- Requires vcpkg for C++ dependencies: `libvpx`, `libyuv`, `opus`, `aom`
- Set `VCPKG_ROOT` environment variable
- Download appropriate Sciter library for legacy UI support

### Ignore Patterns
When working with files, ignore these directories:
- `target/` - Rust build artifacts
- `flutter/build/` - Flutter build output
- `flutter/.dart_tool/` - Flutter tooling files

### Cross-Platform Considerations
- Windows builds require additional DLLs and virtual display drivers
- macOS builds need proper signing and notarization for distribution
- Linux builds support multiple package formats (deb, rpm, AppImage)
- Mobile builds require platform-specific toolchains (Android SDK, Xcode)

### Feature Flags
- `hwcodec` - Hardware video encoding/decoding
- `vram` - VRAM optimization (Windows only)
- `flutter` - Enable Flutter UI
- `unix-file-copy-paste` - Unix file clipboard support
- `screencapturekit` - macOS ScreenCaptureKit (macOS only)

### Config
All configurations or options are under `libs/hbb_common/src/config.rs` file, 4 types:
- Settings
- Local
- Display
- Built-in

### ATS Desk / Custom client
- Si el nombre de la app no es "RustDesk" (custom client), la opción **ID/Relay Server** en Ajustes → Red está **oculta por defecto**.
- **Config sin firma**: archivo `custom_client_config.json` junto al ejecutable (o ruta en env **`ATS_DESK_CONFIG`**) con JSON: `app-name`, `default-settings`, `override-settings`. Permite definir servidor (custom-rendezvous-server, relay-server, api-server) y opciones built-in (hide-*-settings, etc.) sin firmar. Ver `load_unsigned_custom_config` en `src/common.rs`.
- **Guía completa**: `docs/ATS_DESK_DEPLOY.md` (servidor, ocultar opciones, cuenta/login, permisos, branding, pruebas). Ejemplo de config: `custom_client_config.json.example`.
