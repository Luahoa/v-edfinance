@echo off
REM DCG is a Claude Code PreToolUse hook - it's automatically integrated
REM For manual testing, DCG blocks dangerous commands through the hook system
REM
REM This script shows what commands DCG blocks (for reference)

echo.
echo === Destructive Command Guard (DCG) ===
echo.
echo DCG is a Claude Code PreToolUse hook that automatically blocks dangerous commands.
echo.
echo BLOCKED COMMANDS:
echo   Git:
echo     - git reset --hard
echo     - git checkout -- ^<path^>
echo     - git push --force
echo     - git branch -D
echo     - git clean -f
echo.
echo   Filesystem:
echo     - rm -rf outside /tmp
echo.
echo   Containers:
echo     - docker system prune -f
echo.
echo To configure, add to ~/.claude/settings.json:
echo   {"hooks": {"PreToolUse": [{"matcher": "Bash", "hooks": [{"type": "command", "command": "dcg"}]}]}}
echo.
