@echo off
REM Add agentic tools to PATH for current session
set "PROJECT_ROOT=%~dp0..\.."
set "PATH=%PROJECT_ROOT%;%PATH%"
set "PATH=%PROJECT_ROOT%\scripts\agentic;%PATH%"
set "PATH=%PROJECT_ROOT%\mcp_agent_mail\.venv\Scripts;%PATH%"

echo.
echo === Agentic Toolkit Ready ===
echo.
echo Available commands:
echo   bd / beads    - Issue tracking
echo   bv            - Graph triage
echo   gt            - Multi-agent orchestration
echo   dcg           - Command safety check
echo   ms            - Skill management
echo.
echo Quick scripts:
echo   next-task     - Get AI-recommended task
echo   claim ^<id^>    - Claim a task
echo   close ^<id^>    - Close a task
echo   triage        - Full triage report
echo.
