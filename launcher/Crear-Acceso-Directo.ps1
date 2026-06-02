# Crea un acceso directo en el Escritorio para TAVA Object Roulette
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LauncherBat = Join-Path $ProjectRoot "launcher\Iniciar-TAVA.bat"
$IconPath = Join-Path $ProjectRoot "launcher\tava-icon.png"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "TAVA Object Roulette.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $LauncherBat
$Shortcut.WorkingDirectory = Join-Path $ProjectRoot "launcher"
$Shortcut.IconLocation = "$IconPath,0"
$Shortcut.Description = "Ruleta de objetos teatrales - Grupo TAVA"
$Shortcut.Save()

Write-Host ""
Write-Host " Acceso directo creado en el Escritorio:" -ForegroundColor Green
Write-Host " $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host " Haz doble clic en 'TAVA Object Roulette' para iniciar." -ForegroundColor Cyan
Write-Host ""
