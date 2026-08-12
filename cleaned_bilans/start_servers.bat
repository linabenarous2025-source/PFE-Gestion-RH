@echo off
cd /d C:\wamp64\www\PFE\cleaned_bilans

start /min "Dashboard" pythonw dashboard.py
timeout /t 3 /nobreak >nul
start /min "Predictions" pythonw prediction_2026_2027.py
