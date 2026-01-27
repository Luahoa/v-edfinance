@echo off
echo.
echo === Starting MCP Agent Mail Server ===
echo Port: 8080
echo.
cd /d "%~dp0..\..\mcp_agent_mail"
".venv\Scripts\python.exe" -m mcp_agent_mail serve-http --port 8080
