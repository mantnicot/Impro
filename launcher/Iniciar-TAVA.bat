@echo off
title TAVA Object Roulette
cd /d "%~dp0.."

echo.
echo  ========================================
echo    TAVA Object Roulette - Iniciando...
echo  ========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo desde https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
)

echo Abriendo aplicacion en http://localhost:3000
start "" "http://localhost:3000"
call npm run dev
