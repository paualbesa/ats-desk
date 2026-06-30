@echo off
REM Build rapido de ATS Desk - genera ATS-Desk.exe en la raiz del proyecto
cd /d "%~dp0"
echo Compilando ATS Desk (Flutter + Rust)...
python build_ats_desk.py --release --flutter
if %ERRORLEVEL% NEQ 0 (
  echo Error en la compilacion.
  pause
  exit /b 1
)
echo.
echo Listo! Ejecuta ATS-Desk.exe desde esta carpeta.
pause
