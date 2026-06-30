@echo off
REM Genera bridge_generated.rs y generated_bridge.dart antes de compilar
cd /d "%~dp0\.."
echo Inicializando submodulos...
git submodule update --init --recursive
if %ERRORLEVEL% NEQ 0 exit /b 1

where flutter_rust_bridge_codegen >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Instalando flutter_rust_bridge_codegen...
  cargo install flutter_rust_bridge_codegen --version 1.80.1 --features uuid --locked
)

echo flutter pub get...
pushd flutter
flutter pub get
if %ERRORLEVEL% NEQ 0 exit /b 1
popd

echo Generando bridge...
flutter_rust_bridge_codegen --rust-input ./src/flutter_ffi.rs --dart-output ./flutter/lib/generated_bridge.dart --c-output ./flutter/macos/Runner/bridge_generated.h
if %ERRORLEVEL% NEQ 0 exit /b 1

echo build_runner...
pushd flutter
dart run build_runner build --delete-conflicting-outputs
popd

echo Bridge generado correctamente.
exit /b 0
