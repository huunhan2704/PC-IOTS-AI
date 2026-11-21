@echo off
title LinhKien IoT-AI Desktop Hardware Agent
color 0b
echo ========================================================
echo   KHOI DONG UNG DUNG GIAM SAT PHAN CUNG DESKTOP IOT-AI
echo ========================================================
echo Dang kiem tra thu vien...
set "PYTHON_EXE=python"
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
"%PYTHON_EXE%" -m pip install psutil paho-mqtt -q
echo Dang bat giao dien Desktop Monitor...
"%PYTHON_EXE%" desktop_app.py
pause
