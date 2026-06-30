@echo off
REM Genera bridge_generated.rs y generated_bridge.dart antes de compilar
setlocal EnableExtensions
set "ROOT=%~dp0\.."
cd /d "%ROOT%"

echo Inicializando submodulos...
git submodule update --init --recursive
if errorlevel 1 goto :fail

where flutter_rust_bridge_codegen >nul 2>&1
if errorlevel 1 (
  echo Instalando flutter_rust_bridge_codegen...
  cargo install flutter_rust_bridge_codegen --version 1.80.1 --features uuid --locked
  if errorlevel 1 goto :fail
)

echo flutter pub get...
pushd "%ROOT%\flutter"
flutter pub get
if errorlevel 1 (
  popd
  goto :fail
)
popd

echo Generando bridge...
cd /d "%ROOT%"
flutter_rust_bridge_codegen --rust-input ./src/flutter_ffi.rs --dart-output ./flutter/lib/generated_bridge.dart --c-output ./flutter/macos/Runner/bridge_generated.h --class-name Rustdesk
if errorlevel 1 goto :fail

echo build_runner...
pushd "%ROOT%\flutter"
dart run build_runner build --delete-conflicting-outputs
if errorlevel 1 (
  popd
  goto :fail
)
popd

cd /d "%ROOT%"
echo Bridge generado correctamente.
endlocal
exit /b 0

:fail
cd /d "%ROOT%"
echo ERROR generando bridge.
endlocal
exit /b 1
