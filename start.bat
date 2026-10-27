@echo off
rem Starts the on-device speech server and opens Nazar in Chrome.
rem Uses the downloaded model only, so it works with Wi-Fi off.
set HF_HUB_OFFLINE=1
set "VENV=%~dp0..\stt-data\venv\Scripts\python.exe"
if not exist "%VENV%" set "VENV=python"
rem Open the page after the model has had time to load.
start "" /min cmd /c "timeout /t 15 >nul & start http://localhost:8000"
"%VENV%" "%~dp0server\server.py" %*
