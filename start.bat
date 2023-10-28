@echo off
setlocal enabledelayedexpansion

REM Prompt the user for the project name
set /p project="Enter the project name: "


REM Start the executable file with the project name as an argument
start "Directory Scanner and Indexer Tool" "server-win.exe" "!project!"

endlocal
