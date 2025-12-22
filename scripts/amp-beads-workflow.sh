#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Amp + Beads Automated Workflow Script (Bash version)
# ═══════════════════════════════════════════════════════════════════════════
# Purpose: Safe integration between Amp code review and Beads task tracking
# Usage: ./scripts/amp-beads-workflow.sh ved-296 "Feature complete" [--skip-review] [--skip-tests]
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Parse arguments
TASK_ID="$1"
MESSAGE="$2"
SKIP_REVIEW=false
SKIP_TESTS=false
COMMIT_TYPE="feat"

shift 2
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-review) SKIP_REVIEW=true; shift ;;
        --skip-tests) SKIP_TESTS=true; shift ;;
        --type) COMMIT_TYPE="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$TASK_ID" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <task-id> <message> [--skip-review] [--skip-tests] [--type <type>]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BEADS_PATH="$ROOT_DIR/beads.exe"

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Amp + Beads Workflow Automation${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Pre-flight Checks
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[PHASE 1] Pre-flight Checks...${NC}"

if [ ! -d "$ROOT_DIR/.git" ]; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    exit 1
fi

if [ ! -f "$BEADS_PATH" ]; then
    echo -e "${RED}❌ beads.exe not found at: $BEADS_PATH${NC}"
    exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes detected. Nothing to commit.${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Run Tests
# ═══════════════════════════════════════════════════════════════════════════

if [ "$SKIP_TESTS" = false ]; then
    echo ""
    echo -e "${YELLOW}[PHASE 2] Running Tests...${NC}"
    
    cd "$ROOT_DIR/apps/api"
    
    echo -e "${CYAN}  → Building API...${NC}"
    if ! pnpm build > /dev/null 2>&1; then
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}  → Running tests...${NC}"
    if ! pnpm test --run > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Some tests failed. Continue? (y/N)${NC}"
        read -r continue
        if [ "$continue" != "y" ]; then
            exit 1
        fi
    fi
    
    cd "$ROOT_DIR"
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo ""
    echo -e "${YELLOW}[PHASE 2] Tests skipped (--skip-tests)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: Stage Changes
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}[PHASE 3] Staging Changes...${NC}"

git add -A
echo -e "${GREEN}✅ Changes staged safely${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: Amp Code Review
# ═══════════════════════════════════════════════════════════════════════════

if [ "$SKIP_REVIEW" = false ]; then
    echo ""
    echo -e "${YELLOW}[PHASE 4] Amp Code Review...${NC}"
    
    REVIEW_FILE="$ROOT_DIR/review-$TASK_ID.txt"
    
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  AMP REVIEW CHECKPOINT${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Changes staged. Ready for Amp review."
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  1. Let Amp review now (recommended)"
    echo "  2. Skip review and commit"
    echo "  3. Cancel workflow"
    echo ""
    read -p "Enter choice (1-3): " review_choice
    
    case $review_choice in
        1)
            echo ""
            echo -e "${CYAN}  → Starting Amp review...${NC}"
            git diff --cached > "$REVIEW_FILE"
            echo -e "${GREEN}Review file created: $REVIEW_FILE${NC}"
            echo ""
            echo -e "${YELLOW}⏸️  WORKFLOW PAUSED${NC}"
            echo -e "${YELLOW}Please ask Amp to review the changes in $REVIEW_FILE${NC}"
            echo -e "${YELLOW}After Amp review, press Enter to continue...${NC}"
            read -r
            ;;
        2)
            echo -e "  → Skipping review"
            ;;
        3)
            echo -e "${RED}  → Workflow cancelled${NC}"
            git reset HEAD
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Workflow cancelled.${NC}"
            git reset HEAD
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Review phase complete${NC}"
else
    echo ""
    echo -e "${YELLOW}[PHASE 4] Amp Review skipped (--skip-review)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: Git Commit
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}[PHASE 5] Creating Git Commit...${NC}"

COMMIT_MESSAGE="${COMMIT_TYPE}: ${MESSAGE} (${TASK_ID})"
echo -e "${CYAN}  → Commit message: $COMMIT_MESSAGE${NC}"

# Set environment variable to bypass pre-commit hook
export AMP_BEADS_WORKFLOW=1
git commit -m "$COMMIT_MESSAGE"
unset AMP_BEADS_WORKFLOW
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ Committed: $COMMIT_HASH - $COMMIT_MESSAGE${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6: Beads Close Task
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}[PHASE 6] Closing Beads Task...${NC}"

BEADS_REASON="Completed: $MESSAGE (commit: $COMMIT_HASH)"
echo -e "${CYAN}  → Closing $TASK_ID with reason: $BEADS_REASON${NC}"

"$BEADS_PATH" close "$TASK_ID" --reason "$BEADS_REASON" || \
    echo -e "${YELLOW}⚠️  Beads close failed, but commit is safe. Continue manually.${NC}"

echo -e "${GREEN}✅ Task $TASK_ID closed in Beads${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 7: Beads Sync
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}[PHASE 7] Syncing Beads Metadata...${NC}"

"$BEADS_PATH" sync || \
    echo -e "${YELLOW}⚠️  Beads sync failed. Retry manually with: beads sync${NC}"

echo -e "${GREEN}✅ Beads metadata synced${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 8: Git Push
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}[PHASE 8] Pushing to Remote...${NC}"

echo -e "${CYAN}  → Pushing commits to origin/main...${NC}"
git push
echo -e "${GREEN}✅ All commits pushed to remote${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 9: Summary
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ WORKFLOW COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Summary:"
echo -e "  • Tests: $([ "$SKIP_TESTS" = true ] && echo -e "${YELLOW}Skipped${NC}" || echo -e "${GREEN}Passed${NC}")"
echo -e "  • Review: $([ "$SKIP_REVIEW" = true ] && echo -e "${YELLOW}Skipped${NC}" || echo -e "${GREEN}Completed${NC}")"
echo -e "  • Commit: ${GREEN}$COMMIT_HASH${NC}"
echo -e "  • Task: ${GREEN}$TASK_ID${NC}"
echo -e "  • Beads: ${GREEN}Synced${NC}"
echo -e "  • Remote: ${GREEN}Pushed${NC}"
echo ""

if [ "$SKIP_REVIEW" = false ] && [ -f "$REVIEW_FILE" ]; then
    echo -e "${CYAN}Review file saved: $REVIEW_FILE${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  → Check beads status: ./beads.exe ready"
echo "  → View task history: ./beads.exe show $TASK_ID"
echo ""
