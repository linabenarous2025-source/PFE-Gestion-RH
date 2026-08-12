@echo off
echo ========================================
echo   Configuration du Task Scheduler...
echo ========================================
echo.

:: Supprimer les anciennes taches si elles existent
schtasks /delete /tn "PFE_Dashboard" /f >nul 2>&1
schtasks /delete /tn "PFE_Predictions" /f >nul 2>&1

:: Creer la tache pour dashboard.py (port 8051)
schtasks /create /tn "PFE_Dashboard" ^
  /tr "pythonw C:\wamp64\www\PFE\cleaned_bilans\dashboard.py" ^
  /sc ONLOGON ^
  /delay 0000:10 ^
  /rl HIGHEST ^
  /f

:: Creer la tache pour prediction_2026_2027.py (port 8050)
schtasks /create /tn "PFE_Predictions" ^
  /tr "pythonw C:\wamp64\www\PFE\cleaned_bilans\prediction_2026_2027.py" ^
  /sc ONLOGON ^
  /delay 0000:20 ^
  /rl HIGHEST ^
  /f

echo.
echo ========================================
echo   TERMINE ! Les serveurs demarreront
echo   automatiquement a chaque connexion.
echo.
echo   Redemarrez votre PC pour tester.
echo ========================================
echo.
pause
