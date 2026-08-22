# Arregla pantalla negra ATS Desk en Windows (sin HDMI / headless).
# Ejecutar en el PC controlado (PowerShell como administrador recomendado).
$ErrorActionPreference = "Stop"

$repo = if ($env:ATS_DESK_REPO) { $env:ATS_DESK_REPO } else { "$HOME\albesa\ats-desk" }
$cfgPaths = @(
    "$repo\custom_client_config.json",
    (Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) "..\..\custom_client_config.json")
)

function Update-JsonConfig($path) {
    if (-not (Test-Path $path)) { return }
    $json = Get-Content $path -Raw | ConvertFrom-Json
    if (-not $json.override-settings) { $json | Add-Member -NotePropertyName override-settings -NotePropertyValue (@{}) }
    $json.override-settings["allow-d3d-render"] = "N"
    $json | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
    Write-Host "[fix-black-screen] allow-d3d-render=N en $path"
}

foreach ($p in $cfgPaths) { Update-JsonConfig $p }

# Copiar config junto al exe si existe instalación Flutter
$exeDirs = @(
    "$env:LOCALAPPDATA\ATS Desk",
    "$env:ProgramFiles\ATS Desk",
    "$repo\flutter\build\windows\x64\runner\Release"
)
foreach ($dir in $exeDirs) {
    $src = "$repo\custom_client_config.json"
    if ((Test-Path $dir) -and (Test-Path $src)) {
        Copy-Item $src (Join-Path $dir "custom_client_config.json") -Force
        Write-Host "[fix-black-screen] Copiado config a $dir"
    }
}

# Reiniciar servicio RustDesk/ATS Desk si existe
$svcNames = @("RustDesk", "ATS Desk", "rustdesk")
foreach ($name in $svcNames) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($svc) {
        Restart-Service $name -Force
        Write-Host "[fix-black-screen] Servicio reiniciado: $name"
    }
}

Write-Host @"
[fix-black-screen] Listo.
Si sigue negro sin HDMI: instala el driver de pantalla virtual desde el instalador ATS Desk
y reinicia el PC. El renderizado D3D en el cliente que CONECTA también debe estar desactivado.
"@
