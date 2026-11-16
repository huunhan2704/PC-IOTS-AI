@echo off
title LinhKien IoT-AI Desktop Hardware Agent
color 0b
echo ========================================================
echo   KHOI DONG UNG DUNG GIAM SAT PHAN CUNG DESKTOP IOT-AI
echo ========================================================
echo Dang kiem tra thu vien...
pip install psutil paho-mqtt -q
echo Dang bat giao dien Desktop Monitor...
python desktop_app.py
pause
