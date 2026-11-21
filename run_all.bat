@echo off
chcp 65001 > nul
title Khoi Dong Du An Linh Kien IoT-AI (Tran Huu Nhan - HCMUNRE)
echo ==============================================================================
echo   HE THONG WEB BAN LINH KIEN MAY TINH TICH HOP IOTS VA AI
echo   Tac gia: Tran Huu Nhan (HCMUNRE) - GVHD: ThS. Nguyen Thanh Truyen
echo ==============================================================================
echo.

set "ROOT_DIR=%~dp0"
set "PYTHON_EXE=python"
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"

echo [1/3] Dang khoi dong Backend Spring Boot (Port 8080)...
if exist "%ROOT_DIR%backend\target\linhkien-iot-ai-1.0.0.jar" (
    start "Backend Spring Boot" cmd /k "title Backend Spring Boot (Port 8080) && cd /d "%ROOT_DIR%backend" && java -jar target\linhkien-iot-ai-1.0.0.jar"
) else (
    start "Backend Spring Boot" cmd /k "title Backend Spring Boot (Port 8080) && cd /d "%ROOT_DIR%backend" && mvn spring-boot:run"
)

timeout /t 5 > nul

echo [2/3] Dang khoi dong Frontend React (Port 5173)...
start "Frontend React" cmd /k "title Frontend React (Port 5173) && cd /d "%ROOT_DIR%frontend" && npm run dev"

timeout /t 3 > nul

echo [3/3] Dang khoi dong PC Hardware Agent (Doc thong so PC that qua MQTT)...
start "PC Hardware Agent" cmd /k "title PC Hardware Agent (MQTT HiveMQ) && cd /d "%ROOT_DIR%" && "%PYTHON_EXE%" pc_agent.py"

echo.
echo ==============================================================================
echo   TAT CA DICH VU DA DUOC KHOI DONG THANH CONG!
echo   Trang chu & Mua sam:   http://localhost:5173
echo   IoT Live Dashboard:    http://localhost:5173/iot
echo   Tro ly AI Tu van:      http://localhost:5173/ai
echo   PC Builder:            http://localhost:5173/pc-builder
echo   Quan tri Admin:        http://localhost:5173/admin
echo ==============================================================================
pause
