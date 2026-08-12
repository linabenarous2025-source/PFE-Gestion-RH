@echo off
echo Arret des serveurs Python...
taskkill /f /im pythonw.exe >nul 2>&1
echo Serveurs arretes !
pause
