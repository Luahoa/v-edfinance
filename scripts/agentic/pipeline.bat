@echo off
REM ============================================================================
REM  UNIFIED AGENTIC PIPELINE - V-EdFinance
REM  Orchestrates: bv (triage) + beads (tracking) + gt (parallel) + dcg (safety)
REM                + mcp-agent-mail (coordination) + ms (skills)
REM ============================================================================

setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0..\.."
set "BEADS=%PROJECT_ROOT%\beads.exe"
set "BV=%PROJECT_ROOT%\bv.exe"
set "GT=%PROJECT_ROOT%\gt.exe"
set "DCG=%PROJECT_ROOT%\dcg.exe"
set "MS=%PROJECT_ROOT%\ms.exe"
set "MCP_MAIL=%PROJECT_ROOT%\mcp_agent_mail\.venv\Scripts\python.exe"

REM Parse command
set "CMD=%~1"
if "%CMD%"=="" goto :help

if /i "%CMD%"=="start" goto :start
if /i "%CMD%"=="next" goto :next
if /i "%CMD%"=="claim" goto :claim
if /i "%CMD%"=="done" goto :done
if /i "%CMD%"=="sync" goto :sync
if /i "%CMD%"=="status" goto :status
if /i "%CMD%"=="full" goto :full
if /i "%CMD%"=="parallel" goto :parallel
if /i "%CMD%"=="triage" goto :triage
if /i "%CMD%"=="safety" goto :safety
if /i "%CMD%"=="help" goto :help
goto :help

REM ============================================================================
:start
REM Start a new work session - sync first, then get next task
REM ============================================================================
echo.
echo === Starting Work Session ===
echo.

echo [1/3] Syncing beads from remote...
"%BEADS%" sync --no-daemon
if errorlevel 1 (
    echo Warning: Sync had issues, continuing anyway...
)

echo.
echo [2/3] Getting AI-recommended task...
"%BV%" --robot-next

echo.
echo [3/3] Ready to work!
echo.
echo Next steps:
echo   pipeline claim ^<bead-id^>   - Claim and start working
echo   pipeline done ^<bead-id^>    - Complete and sync
echo.
goto :end

REM ============================================================================
:next
REM Get next recommended task
REM ============================================================================
echo.
echo === AI-Recommended Next Task ===
echo.
"%BV%" --robot-next
goto :end

REM ============================================================================
:claim
REM Claim a task and start working
REM ============================================================================
set "BEAD_ID=%~2"
if "%BEAD_ID%"=="" (
    echo Usage: pipeline claim ^<bead-id^>
    echo.
    echo Getting next recommended task...
    "%BV%" --robot-next
    goto :end
)

echo.
echo === Claiming Task: %BEAD_ID% ===
echo.

echo [1/2] Updating status to in_progress...
"%BEADS%" update %BEAD_ID% --status=in_progress
if errorlevel 1 (
    echo Error: Failed to claim task
    goto :end
)

echo.
echo [2/2] Showing task details...
"%BEADS%" show %BEAD_ID%

echo.
echo ============================================
echo  Task claimed! Start working on: %BEAD_ID%
echo ============================================
echo.
echo When done, run:
echo   pipeline done %BEAD_ID% "Your completion message"
echo.
goto :end

REM ============================================================================
:done
REM Complete a task with reason and sync
REM ============================================================================
set "BEAD_ID=%~2"
set "REASON=%~3"

if "%BEAD_ID%"=="" (
    echo Usage: pipeline done ^<bead-id^> ["completion reason"]
    echo Example: pipeline done ved-xxxx "Implemented feature X"
    goto :end
)

if "%REASON%"=="" set "REASON=Completed"

echo.
echo === Completing Task: %BEAD_ID% ===
echo.

echo [1/3] Closing bead with reason: %REASON%
"%BEADS%" close %BEAD_ID% --reason "%REASON%"
if errorlevel 1 (
    echo Error: Failed to close task
    goto :end
)

echo.
echo [2/3] Syncing to git...
"%BEADS%" sync --no-daemon
if errorlevel 1 (
    echo Warning: Sync had issues, check manually
)

echo.
echo [3/3] Getting next recommended task...
"%BV%" --robot-next

echo.
echo ============================================
echo  Task %BEAD_ID% completed and synced!
echo ============================================
echo.
goto :end

REM ============================================================================
:sync
REM Just sync beads to git
REM ============================================================================
echo.
echo === Syncing Beads ===
echo.
"%BEADS%" sync --no-daemon
echo.
echo Sync complete!
goto :end

REM ============================================================================
:status
REM Show current status
REM ============================================================================
echo.
echo === Pipeline Status ===
echo.

echo [Open Tasks]
"%BEADS%" list --status open --json 2>nul | findstr /c:"\"id\"" | find /c /v "" > nul
for /f %%i in ('"%BEADS%" list --status open 2^>nul ^| find /c /v ""') do echo   Count: %%i

echo.
echo [In Progress]
"%BEADS%" list --status in_progress 2>nul

echo.
echo [Top 3 Recommendations]
"%BV%" --robot-next 2>nul

goto :end

REM ============================================================================
:full
REM Full pipeline: start -> claim -> (work) -> done -> sync
REM Usage: pipeline full <bead-id> "reason"
REM ============================================================================
set "BEAD_ID=%~2"
set "REASON=%~3"

if "%BEAD_ID%"=="" (
    echo.
    echo === Full Pipeline Mode ===
    echo.
    echo This runs the complete workflow for a single task.
    echo.
    echo Usage: pipeline full ^<bead-id^> ["completion reason"]
    echo.
    echo Steps executed:
    echo   1. Sync from remote
    echo   2. Claim task
    echo   3. Show task details (you do the work)
    echo   4. Close task with reason
    echo   5. Sync to remote
    echo   6. Show next task
    echo.
    echo Example:
    echo   pipeline full ved-xxxx "Fixed the authentication bug"
    echo.
    goto :end
)

if "%REASON%"=="" set "REASON=Completed"

echo.
echo === Full Pipeline: %BEAD_ID% ===
echo.

echo [1/6] Syncing from remote...
"%BEADS%" sync --no-daemon

echo.
echo [2/6] Claiming task...
"%BEADS%" update %BEAD_ID% --status=in_progress

echo.
echo [3/6] Task details:
"%BEADS%" show %BEAD_ID%

echo.
echo [4/6] Closing with reason: %REASON%
"%BEADS%" close %BEAD_ID% --reason "%REASON%"

echo.
echo [5/6] Syncing to remote...
"%BEADS%" sync --no-daemon

echo.
echo [6/6] Next recommended task:
"%BV%" --robot-next

echo.
echo ============================================
echo  Full pipeline complete for %BEAD_ID%!
echo ============================================
goto :end

REM ============================================================================
:help
REM ============================================================================
echo.
echo === Unified Agentic Pipeline ===
echo.
echo Orchestrates: bv + beads + gt + dcg + mcp-agent-mail + ms
echo.
echo Usage: pipeline ^<command^> [options]
echo.
echo SINGLE AGENT WORKFLOW:
echo   start                    Sync + get next task
echo   next                     Get AI-recommended task
echo   claim ^<id^>               Claim task and start working
echo   done ^<id^> ["reason"]     Close + sync + show next
echo   full ^<id^> ["reason"]     Full cycle (claim-^>done-^>sync)
echo   sync                     Sync beads to git
echo   status                   Show current status
echo.
echo MULTI-AGENT WORKFLOW:
echo   parallel ^<id1^> ^<id2^> ... Spawn parallel workers for tracks
echo   triage                   Full AI triage report
echo.
echo SAFETY ^& TOOLS:
echo   safety                   Show DCG blocked commands
echo.
echo Vietnamese:
echo   "Bat dau lam viec"       -^> pipeline start
echo   "Task tiep theo"         -^> pipeline next
echo   "Nhan task ved-xxxx"     -^> pipeline claim ved-xxxx
echo   "Xong task ved-xxxx"     -^> pipeline done ved-xxxx "Ly do"
echo   "Spawn 3 workers"        -^> pipeline parallel ved-t1 ved-t2 ved-t3
echo.
echo Workflow:
echo   1. pipeline start        # Sync + get recommendation
echo   2. pipeline claim ved-x  # Claim the task
echo   3. (do your work...)     # DCG auto-protects dangerous commands
echo   4. pipeline done ved-x   # Close + sync + next
echo.
echo Or parallel execution:
echo   pipeline parallel ved-track1 ved-track2 ved-track3
echo.
goto :end

REM ============================================================================
:parallel
REM Spawn parallel workers using Gastown
REM ============================================================================
set "TRACK1=%~2"
set "TRACK2=%~3"
set "TRACK3=%~4"
set "TRACK4=%~5"
set "TRACK5=%~6"

if "%TRACK1%"=="" (
    echo.
    echo === Parallel Execution Mode ===
    echo.
    echo Usage: pipeline parallel ^<bead-1^> [bead-2] [bead-3] ...
    echo.
    echo This spawns parallel workers (Polecats) for each track.
    echo Each worker gets exclusive file reservations via MCP Agent Mail.
    echo DCG protects all workers from dangerous commands.
    echo.
    echo Example:
    echo   pipeline parallel ved-track1 ved-track2 ved-track3
    echo.
    echo Steps:
    echo   1. Sync beads from remote
    echo   2. Start MCP Agent Mail server (if not running)
    echo   3. Spawn Polecat workers via Gastown
    echo   4. Each worker claims its task and works
    echo   5. Workers sync when done
    echo.
    goto :end
)

echo.
echo === Spawning Parallel Workers ===
echo.

echo [1/4] Syncing beads...
"%BEADS%" sync --no-daemon

echo.
echo [2/4] Checking Gastown status...
"%GT%" status 2>nul || (
    echo Gastown not initialized. Initializing...
    "%GT%" init . 2>nul
)

echo.
echo [3/4] Creating convoy...
set "CONVOY_BEADS=%TRACK1%"
if not "%TRACK2%"=="" set "CONVOY_BEADS=%CONVOY_BEADS% %TRACK2%"
if not "%TRACK3%"=="" set "CONVOY_BEADS=%CONVOY_BEADS% %TRACK3%"
if not "%TRACK4%"=="" set "CONVOY_BEADS=%CONVOY_BEADS% %TRACK4%"
if not "%TRACK5%"=="" set "CONVOY_BEADS=%CONVOY_BEADS% %TRACK5%"

"%GT%" convoy create "Parallel Execution" %CONVOY_BEADS% 2>nul

echo.
echo [4/4] Spawning workers...

if not "%TRACK1%"=="" (
    echo   Spawning worker for: %TRACK1%
    "%GT%" polecat spawn --bead %TRACK1% 2>nul || echo   (Using Task API for %TRACK1%)
)
if not "%TRACK2%"=="" (
    echo   Spawning worker for: %TRACK2%
    "%GT%" polecat spawn --bead %TRACK2% 2>nul || echo   (Using Task API for %TRACK2%)
)
if not "%TRACK3%"=="" (
    echo   Spawning worker for: %TRACK3%
    "%GT%" polecat spawn --bead %TRACK3% 2>nul || echo   (Using Task API for %TRACK3%)
)
if not "%TRACK4%"=="" (
    echo   Spawning worker for: %TRACK4%
    "%GT%" polecat spawn --bead %TRACK4% 2>nul || echo   (Using Task API for %TRACK4%)
)
if not "%TRACK5%"=="" (
    echo   Spawning worker for: %TRACK5%
    "%GT%" polecat spawn --bead %TRACK5% 2>nul || echo   (Using Task API for %TRACK5%)
)

echo.
echo ============================================
echo  Workers spawned! Each protected by DCG.
echo  Monitor: gt status / gt agents
echo ============================================
goto :end

REM ============================================================================
:triage
REM Full AI triage report
REM ============================================================================
echo.
echo === Full AI Triage Report ===
echo.
"%BV%" --robot-triage
goto :end

REM ============================================================================
:safety
REM Show DCG safety information
REM ============================================================================
echo.
echo === Destructive Command Guard (DCG) ===
echo.
echo DCG is a PreToolUse hook that automatically blocks dangerous commands.
echo It protects ALL Bash commands executed by any agent in this project.
echo.
echo BLOCKED COMMANDS:
echo.
echo   Git:
echo     - git reset --hard
echo     - git checkout -- ^<path^>
echo     - git push --force
echo     - git branch -D
echo     - git clean -f
echo     - git stash drop/clear
echo.
echo   Filesystem:
echo     - rm -rf outside /tmp
echo.
echo   Containers:
echo     - docker system prune -f
echo.
echo   Kubernetes:
echo     - kubectl delete namespace
echo     - kubectl delete --all
echo.
echo   Databases:
echo     - DROP DATABASE
echo     - TRUNCATE
echo.
echo   Cloud:
echo     - terraform destroy -auto-approve
echo.
echo Configuration: .claude/settings.json
echo Documentation: docs/AGENTIC_ORCHESTRATION_PLAN.md
echo.
goto :end

:end
endlocal
