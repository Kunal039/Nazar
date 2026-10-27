@echo off
rem Starts the on-device speech server and opens Nazar in Chrome.
set VENV=%~dp0..\stt-data\venv\Scripts\python.exe
if not exist "%VENV%" set VENV=python
start "" http://localhost:8000
"%VENV%" "%~dp0server\server.py" %*
