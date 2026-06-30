#!/usr/bin/env bash
# Genera bridge_generated.rs y generated_bridge.dart (requerido antes de compilar Flutter).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Inicializando submódulos..."
git submodule update --init --recursive

echo "==> Instalando flutter_rust_bridge_codegen 1.80.1 (si no está)..."
if ! command -v flutter_rust_bridge_codegen >/dev/null 2>&1; then
  cargo install flutter_rust_bridge_codegen --version 1.80.1 --features uuid --locked
fi

echo "==> flutter pub get..."
pushd flutter >/dev/null
flutter pub get
popd >/dev/null

echo "==> Generando bridge..."
flutter_rust_bridge_codegen \
  --rust-input ./src/flutter_ffi.rs \
  --dart-output ./flutter/lib/generated_bridge.dart \
  --c-output ./flutter/macos/Runner/bridge_generated.h \
  --class-name Rustdesk

cp -f ./flutter/macos/Runner/bridge_generated.h ./flutter/ios/Runner/bridge_generated.h 2>/dev/null || true

echo "==> build_runner (freezed)..."
pushd flutter >/dev/null
dart run build_runner build --delete-conflicting-outputs || true
popd >/dev/null

echo "✓ Bridge generado:"
ls -la src/bridge_generated.rs flutter/lib/generated_bridge.dart
