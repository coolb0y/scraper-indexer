@echo off
set "source=..\opensearch\data"
set "destination=%~1"

robocopy "%source%" "%destination%" /E

echo Copy completed.
