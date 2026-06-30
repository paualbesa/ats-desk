@echo off
REM Build rapido de ATS Desk - genera ATS-Desk.exe en la raiz del proyecto
setlocal EnableExtensions
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo [1/2] Generando bridge (flutter_rust_bridge)...
call "%ROOT%scripts\generate_bridge.bat"
if errorlevel 1 (
  echo Error generando bridge.
  pause
  exit /b 1
)

REM Asegurar que estamos en la raiz (generate_bridge puede dejar cwd en flutter)
cd /d "%ROOT%"

echo [2/2] Compilando ATS Desk (Flutter + Rust)...
python "%ROOT%build_ats_desk.py" --release --flutter --skip-bridge
if errorlevel 1 (
  echo Error en la compilacion.
  pause
  exit /b 1
)

echo.
echo Listo! Ejecuta ATS-Desk.exe desde esta carpeta (junto a las DLL y data/).
pause
endlocal
