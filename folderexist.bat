@echo off
setlocal

set "folderPath=%~1"

if exist "%folderPath%" (
    echo ankur1455h5j44h34
    exit /b 0
) else (
    echo Folder does not exist.
    exit /b 0
)
