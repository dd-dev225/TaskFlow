@echo off
chcp 65001 > nul
echo ============================================
echo   DEPLOIEMENT TaskFlow sur IIS
echo ============================================
echo.

:: Verification droits administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Ce script doit etre lance en tant qu'administrateur.
    echo.
    echo Faites : clic droit sur ce fichier ^> "Executer en tant qu'administrateur"
    pause
    exit /b 1
)

set SOURCE=%~dp0
set DEST=C:\inetpub\wwwroot\PW2

echo [1/5] Creation du dossier de deploiement...
if not exist "%DEST%" (
    mkdir "%DEST%"
    echo      OK : dossier cree
) else (
    echo      OK : dossier existant
)

echo.
echo [2/5] Correction des permissions sur le dossier...
icacls "%DEST%" /grant "%USERNAME%":F /T > nul 2>&1
icacls "%DEST%" /grant "IIS_IUSRS":R /T > nul 2>&1
echo      OK : permissions corrigees

echo.
echo [3/5] Copie des fichiers du projet...
copy /Y "%SOURCE%index.html" "%DEST%\index.html" > nul
if %errorlevel% neq 0 ( echo      [ERREUR] index.html ) else ( echo      OK : index.html )
copy /Y "%SOURCE%style.css"  "%DEST%\style.css"  > nul
if %errorlevel% neq 0 ( echo      [ERREUR] style.css  ) else ( echo      OK : style.css  )
copy /Y "%SOURCE%app.js"     "%DEST%\app.js"     > nul
if %errorlevel% neq 0 ( echo      [ERREUR] app.js     ) else ( echo      OK : app.js     )

echo.
echo [4/5] Verification du service IIS...
sc query W3SVC | find "RUNNING" > nul
if %errorlevel% neq 0 (
    echo      Demarrage de IIS...
    net start W3SVC > nul
) else (
    echo      OK : IIS est actif
)

echo.
echo [5/5] Verification finale...
set OK=1
if not exist "%DEST%\index.html" ( echo      [ERREUR] index.html manquant & set OK=0 )
if not exist "%DEST%\style.css"  ( echo      [ERREUR] style.css  manquant & set OK=0 )
if not exist "%DEST%\app.js"     ( echo      [ERREUR] app.js     manquant & set OK=0 )
if "%OK%"=="1" echo      OK : tous les fichiers sont en place

echo.
echo ============================================
echo   Adresse : http://localhost/PW2/
echo ============================================
echo.

start "" "http://localhost/PW2/"
pause
