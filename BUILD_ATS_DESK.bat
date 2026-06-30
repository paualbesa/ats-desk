@echo off
REM Build rapido de ATS Desk - genera ATS-Desk.exe en la raiz del proyecto
cd /d "%~dp0"
echo [1/2] Generando bridge (flutter_rust_bridge)...
call scripts\generate_bridge.bat
if %ERRORLEVEL% NEQ 0 (
  echo Error generando bridge.
  pause
  exit /b 1
)
echo [2/2] Compilando ATS Desk (Flutter + Rust)...
python build_ats_desk.py --release --flutter --skip-bridge
if %ERRORLEVEL% NEQ 0 (
  echo Error en la compilacion.
  pause
  exit /b 1
)
echo.
echo Listo! Ejecuta ATS-Desk.exe desde esta carpeta.
pause
