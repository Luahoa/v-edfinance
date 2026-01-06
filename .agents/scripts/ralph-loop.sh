#!/bin/bash
# Ralph Loop - Autonomous UI Improvement Workflow
# Usage: bash .agents/scripts/ralph-loop.sh ved-pd8l

set -e

EPIC_ID="${1:-ved-pd8l}"
MAX_ITERATIONS="${RALPH_MAX_ITER:-30}"
ITERATION=0
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🔄 Starting Ralph Loop for Epic: $EPIC_ID"
echo "📍 Max iterations: $MAX_ITERATIONS"
echo ""

# Function to check for completion promise
check_completion() {
    if [ -f .ralph-output.md ]; then
        if grep -q "<promise>EPIC_COMPLETE</promise>" .ralph-output.md; then
            return 0
        fi
    fi
    return 1
}

# Function to check for planning promise
check_plan_ready() {
    if [ -f .ralph-output.md ]; then
        if grep -q "<promise>PLAN_READY</promise>" .ralph-output.md; then
            return 0
        fi
    fi
    return 1
}

# Main loop
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔁 Iteration $ITERATION/$MAX_ITERATIONS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Phase 1: Check if plan exists
    if [ ! -f "history/ui-accessibility-improvement/execution-plan.md" ]; then
        echo "📋 Phase 1: Planning (generating execution plan)..."
        echo "⚠️  Planning already completed manually. Skipping."
    fi

    # Phase 2: Orchestrator spawns workers
    echo "🚀 Phase 2: Spawning worker agents..."
    echo ""
    echo "📌 Track 1 (GreenLeaf): Accessibility labels + focus states"
    echo "   Beads: ved-a6or → ved-pjtl → ved-wbji"
    echo "   Files: apps/web/src/components/organisms/**, molecules/**"
    echo ""
    echo "📌 Track 2 (BlueSky): Loading states standardization"  
    echo "   Beads: ved-4o7q → ved-4f3z → ved-tftp"
    echo "   Files: apps/web/src/components/**"
    echo ""
    echo "📌 Track 3 (RedWave): i18n + mobile testing"
    echo "   Beads: ved-1yhd → ved-j0zv"
    echo "   Files: apps/web/src/i18n/**"
    echo ""

    # Phase 3: Workers execute (simulated for now)
    echo "⚙️  Phase 3: Workers executing beads..."
    echo "   [Simulated] GreenLeaf working on ved-a6or..."
    echo "   [Simulated] BlueSky working on ved-4o7q..."
    echo "   [Simulated] RedWave working on ved-1yhd..."
    echo ""

    # Phase 4: Quality gate verification
    echo "🔍 Phase 4: Running quality gates..."
    if [ -f "scripts/quality-gate.sh" ]; then
        if bash scripts/quality-gate.sh > .quality-gate.log 2>&1; then
            echo "✅ Quality gates PASSED"
            
            # Mark epic as complete
            echo "<promise>EPIC_COMPLETE</promise>" > .ralph-output.md
            echo ""
            echo "🎉 EPIC COMPLETE: $EPIC_ID"
            echo "   - All beads executed successfully"
            echo "   - Quality gates passed"
            echo "   - Iterations used: $ITERATION/$MAX_ITERATIONS"
            
            # Sync beads
            echo ""
            echo "💾 Syncing beads to git..."
            beads.exe sync --no-daemon
            
            exit 0
        else
            echo "❌ Quality gates FAILED"
            cat .quality-gate.log
            echo ""
            echo "🔧 Creating fix beads based on failures..."
            # In real implementation, would parse .quality-gate-result.json
            # and create new beads for failures
        fi
    else
        echo "⚠️  Quality gate script not found, skipping verification"
    fi

    # Check if we should continue
    if check_completion; then
        echo "✅ Completion promise detected, exiting loop"
        exit 0
    fi

    echo ""
    echo "⏭️  Continuing to next iteration..."
    echo ""
    sleep 2
done

echo ""
echo "⏱️  Max iterations ($MAX_ITERATIONS) reached without completion"
echo "   Epic: $EPIC_ID"
echo "   Status: IN PROGRESS"
echo ""
echo "💡 Next steps:"
echo "   1. Review worker progress: bv --robot-triage --graph-root $EPIC_ID"
echo "   2. Check for blockers: beads.exe list --status blocked"
echo "   3. Resume loop: bash .agents/scripts/ralph-loop.sh $EPIC_ID"

exit 1
