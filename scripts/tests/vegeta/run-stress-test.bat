@echo off
SET TARGETS_FILE=targets.txt
SET RESULTS_FILE=results.bin
SET REPORT_FILE=report.txt

echo [Vegeta] Starting stress test...
type %TARGETS_FILE% | vegeta attack -duration=30s -rate=50 -output=%RESULTS_FILE%

echo [Vegeta] Test complete. Generating report...
vegeta report -type=text %RESULTS_FILE% > %REPORT_FILE%
vegeta report -type=text %RESULTS_FILE%
