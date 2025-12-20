@echo off
SET TARGETS=scripts\tests\vegeta\targets.txt
SET OUTPUT=scripts\tests\vegeta\results.bin
SET REPORT=scripts\tests\vegeta\report.txt

echo Running Vegeta attack...
scripts\tests\vegeta\vegeta.exe attack -targets=%TARGETS% -duration=5s -rate=10 | scripts\tests\vegeta\vegeta.exe encode > %OUTPUT%

echo Generating report...
scripts\tests\vegeta\vegeta.exe report %OUTPUT% > %REPORT%
type %REPORT%
