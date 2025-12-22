@echo off
REM Install AI Assistant Skills - Windows Batch Version

echo === Installing AI Assistant Skills ===

REM Create temp directory
if not exist temp_skills mkdir temp_skills

echo.
echo [1/4] Cloning wshobson/commands...
git clone --depth 1 https://github.com/wshobson/commands.git temp_skills\commands

echo.
echo [2/4] Cloning czlonkowski/n8n-skills...
git clone --depth 1 https://github.com/czlonkowski/n8n-skills.git temp_skills\n8n-skills

echo.
echo [3/4] Cloning qdhenry/Claude-Command-Suite...
git clone --depth 1 https://github.com/qdhenry/Claude-Command-Suite.git temp_skills\claude-command-suite

echo.
echo [4/4] Cloning parruda/swarm...
git clone --depth 1 https://github.com/parruda/swarm.git temp_skills\swarm

echo.
echo === Skills Downloaded ===
dir temp_skills

echo.
echo Next: Run ANALYZE_SKILLS.bat to see structure
pause
