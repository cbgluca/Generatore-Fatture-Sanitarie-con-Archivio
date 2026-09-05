@echo off
chcp 65001 >nul
title Generatore di Fatture - Ricevute Sanitarie
cd /d "%~dp0"

echo ========================================================
echo    Generatore di Fatture - Avvio Applicazione
echo ========================================================
echo.

:: 1. Verifica presenza di Python
where python >nul 2>nul
if %errorlevel% equ 0 goto CHECK_VENV

echo [ERRORE] Python non e' installato o non e' presente nel PATH.
echo.
echo Scarica e installa Python dal sito ufficiale:
echo https://www.python.org/downloads/
echo.
echo IMPORTANTE: Durante l'installazione assicurati di spuntare:
echo "Add python.exe to PATH"
echo.
pause
exit /b 1

:CHECK_VENV
:: 2. Se venv esiste gia', salta direttamente all'avvio
if exist "venv\Scripts\python.exe" goto LAUNCH

echo [1/3] Primo avvio: creazione ambiente virtuale in corso...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERRORE] Creazione dell'ambiente virtuale fallita.
    pause
    exit /b 1
)

echo [2/3] Installazione librerie necessarie, attendere qualche istante...
venv\Scripts\python.exe -m pip install --upgrade pip --quiet
venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERRORE] Errore durante l'installazione delle librerie.
    pause
    exit /b 1
)
echo [3/3] Configurazione iniziale completata con successo!
echo.

:LAUNCH
:: 3. Avvio dell'applicazione tramite il launcher Python run.py
echo [INFO] Avvio del server e apertura del browser...
venv\Scripts\python.exe run.py

if %errorlevel% neq 0 (
    echo.
    echo [AVVISO] Il server e' stato interrotto o si e' verificato un errore.
    pause
)
