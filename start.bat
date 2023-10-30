@echo off
setlocal enabledelayedexpansion

REM Prompt the user for the project name
set /p project="Enter the project name: "
set /p loggingmode="Extra logging?  Enter v for Vebose or i for info: "


REM Start the executable file with the project name as an argument
start "Directory Scanner and Indexer Tool" "server-win.exe" "!project!" "!loggingmode!"

endlocal
