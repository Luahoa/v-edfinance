@echo off
REM Ralph CLI Test Script
REM Usage: test-ralph.bat <command> [args...]

npx tsx libs\ralph-cli\src\index.ts %*
