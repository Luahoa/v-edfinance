# Auto-Generated File Move Script
# Generated: 2026-01-03T06:26:17.059Z
# DO NOT EDIT - Regenerate from categorization.json if needed

param(
    [string]$DryRun = "true"  # Set to "false" to actually move files
)

Write-Host "📦 File Move Script" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun -eq "true") {
    Write-Host "🔍 DRY RUN MODE - No files will be moved" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  LIVE MODE - Files will be moved!" -ForegroundColor Red
    $confirm = Read-Host "Type YES to confirm"
    if ($confirm -ne "YES") {
        Write-Host "Aborted" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# CORE FILES (79 files) - KEEP IN ROOT
# ═══════════════════════════════════════════════════════════

Write-Host "✅ Core files: 79 files (keeping in root)" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# EDTECH (8 files)
# ═══════════════════════════════════════════════════════════

Write-Host "🎓 Edtech: 8 files" -ForegroundColor Cyan

# Target: docs/behavioral-design/test-reports/ (8 files)

# AI_SERVICE_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "AI_SERVICE_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "AI_SERVICE_TEST_REPORT.md" "docs/behavioral-design/test-reports/AI_SERVICE_TEST_REPORT.md"
        Write-Host "  ✅ Moved: AI_SERVICE_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_SERVICE_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# ANTI_HALLUCINATION_SPEC.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "ANTI_HALLUCINATION_SPEC.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "ANTI_HALLUCINATION_SPEC.md" "docs/behavioral-design/test-reports/ANTI_HALLUCINATION_SPEC.md"
        Write-Host "  ✅ Moved: ANTI_HALLUCINATION_SPEC.md"
    }
} else {
    Write-Host "  🔍 Would move: ANTI_HALLUCINATION_SPEC.md → docs/behavioral-design/test-reports/"
}

# COMMITMENT_CONTRACTS_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "COMMITMENT_CONTRACTS_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "COMMITMENT_CONTRACTS_TEST_REPORT.md" "docs/behavioral-design/test-reports/COMMITMENT_CONTRACTS_TEST_REPORT.md"
        Write-Host "  ✅ Moved: COMMITMENT_CONTRACTS_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: COMMITMENT_CONTRACTS_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# GAMIFICATION_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "GAMIFICATION_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "GAMIFICATION_TEST_REPORT.md" "docs/behavioral-design/test-reports/GAMIFICATION_TEST_REPORT.md"
        Write-Host "  ✅ Moved: GAMIFICATION_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: GAMIFICATION_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# LOSS_AVERSION_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "LOSS_AVERSION_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "LOSS_AVERSION_TEST_REPORT.md" "docs/behavioral-design/test-reports/LOSS_AVERSION_TEST_REPORT.md"
        Write-Host "  ✅ Moved: LOSS_AVERSION_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: LOSS_AVERSION_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# MARKET_SIMULATION_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "MARKET_SIMULATION_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "MARKET_SIMULATION_TEST_REPORT.md" "docs/behavioral-design/test-reports/MARKET_SIMULATION_TEST_REPORT.md"
        Write-Host "  ✅ Moved: MARKET_SIMULATION_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: MARKET_SIMULATION_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# NUDGE_TRIGGER_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NUDGE_TRIGGER_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "NUDGE_TRIGGER_TEST_REPORT.md" "docs/behavioral-design/test-reports/NUDGE_TRIGGER_TEST_REPORT.md"
        Write-Host "  ✅ Moved: NUDGE_TRIGGER_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: NUDGE_TRIGGER_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}

# SOCIAL_PROOF_TEST_REPORT.md → docs/behavioral-design/test-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SOCIAL_PROOF_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/behavioral-design/test-reports" | Out-Null
        Move-Item "SOCIAL_PROOF_TEST_REPORT.md" "docs/behavioral-design/test-reports/SOCIAL_PROOF_TEST_REPORT.md"
        Write-Host "  ✅ Moved: SOCIAL_PROOF_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: SOCIAL_PROOF_TEST_REPORT.md → docs/behavioral-design/test-reports/"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# TESTING (33 files)
# ═══════════════════════════════════════════════════════════

Write-Host "🧪 Testing: 33 files" -ForegroundColor Cyan

# Target: docs/testing/ (33 files)

# AI_TESTING_ARMY_BEADS_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AI_TESTING_ARMY_BEADS_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AI_TESTING_ARMY_BEADS_PLAN.md" "docs/testing/AI_TESTING_ARMY_BEADS_PLAN.md"
        Write-Host "  ✅ Moved: AI_TESTING_ARMY_BEADS_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_TESTING_ARMY_BEADS_PLAN.md → docs/testing/"
}

# AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md" "docs/testing/AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md"
        Write-Host "  ✅ Moved: AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_TESTING_ARMY_DEPLOYMENT_COMPLETE.md → docs/testing/"
}

# AI_TESTING_ARMY_FINAL_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AI_TESTING_ARMY_FINAL_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AI_TESTING_ARMY_FINAL_REPORT.md" "docs/testing/AI_TESTING_ARMY_FINAL_REPORT.md"
        Write-Host "  ✅ Moved: AI_TESTING_ARMY_FINAL_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_TESTING_ARMY_FINAL_REPORT.md → docs/testing/"
}

# AI_TESTING_ARMY_INTEGRATION_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AI_TESTING_ARMY_INTEGRATION_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AI_TESTING_ARMY_INTEGRATION_PLAN.md" "docs/testing/AI_TESTING_ARMY_INTEGRATION_PLAN.md"
        Write-Host "  ✅ Moved: AI_TESTING_ARMY_INTEGRATION_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_TESTING_ARMY_INTEGRATION_PLAN.md → docs/testing/"
}

# AI_TESTING_TOOLS_ANALYSIS.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AI_TESTING_TOOLS_ANALYSIS.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AI_TESTING_TOOLS_ANALYSIS.md" "docs/testing/AI_TESTING_TOOLS_ANALYSIS.md"
        Write-Host "  ✅ Moved: AI_TESTING_TOOLS_ANALYSIS.md"
    }
} else {
    Write-Host "  🔍 Would move: AI_TESTING_TOOLS_ANALYSIS.md → docs/testing/"
}

# AMP_AUTO_WORKFLOW_TEST_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AMP_AUTO_WORKFLOW_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AMP_AUTO_WORKFLOW_TEST_REPORT.md" "docs/testing/AMP_AUTO_WORKFLOW_TEST_REPORT.md"
        Write-Host "  ✅ Moved: AMP_AUTO_WORKFLOW_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: AMP_AUTO_WORKFLOW_TEST_REPORT.md → docs/testing/"
}

# ANALYTICS_INTEGRATION_TEST_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "ANALYTICS_INTEGRATION_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "ANALYTICS_INTEGRATION_TEST_REPORT.md" "docs/testing/ANALYTICS_INTEGRATION_TEST_REPORT.md"
        Write-Host "  ✅ Moved: ANALYTICS_INTEGRATION_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: ANALYTICS_INTEGRATION_TEST_REPORT.md → docs/testing/"
}

# AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md" "docs/testing/AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md"
        Write-Host "  ✅ Moved: AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: AUTH_MODULE_TEST_ENHANCEMENT_REPORT.md → docs/testing/"
}

# AUTO_TEST_SYSTEM.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "AUTO_TEST_SYSTEM.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "AUTO_TEST_SYSTEM.md" "docs/testing/AUTO_TEST_SYSTEM.md"
        Write-Host "  ✅ Moved: AUTO_TEST_SYSTEM.md"
    }
} else {
    Write-Host "  🔍 Would move: AUTO_TEST_SYSTEM.md → docs/testing/"
}

# COURSES_TEST_COVERAGE_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "COURSES_TEST_COVERAGE_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "COURSES_TEST_COVERAGE_REPORT.md" "docs/testing/COURSES_TEST_COVERAGE_REPORT.md"
        Write-Host "  ✅ Moved: COURSES_TEST_COVERAGE_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: COURSES_TEST_COVERAGE_REPORT.md → docs/testing/"
}

# COVERAGE_BASELINE_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "COVERAGE_BASELINE_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "COVERAGE_BASELINE_REPORT.md" "docs/testing/COVERAGE_BASELINE_REPORT.md"
        Write-Host "  ✅ Moved: COVERAGE_BASELINE_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: COVERAGE_BASELINE_REPORT.md → docs/testing/"
}

# DATABASE_SEED_TESTING_EXECUTION.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "DATABASE_SEED_TESTING_EXECUTION.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "DATABASE_SEED_TESTING_EXECUTION.md" "docs/testing/DATABASE_SEED_TESTING_EXECUTION.md"
        Write-Host "  ✅ Moved: DATABASE_SEED_TESTING_EXECUTION.md"
    }
} else {
    Write-Host "  🔍 Would move: DATABASE_SEED_TESTING_EXECUTION.md → docs/testing/"
}

# DATABASE_SEED_TESTING_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "DATABASE_SEED_TESTING_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "DATABASE_SEED_TESTING_PLAN.md" "docs/testing/DATABASE_SEED_TESTING_PLAN.md"
        Write-Host "  ✅ Moved: DATABASE_SEED_TESTING_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: DATABASE_SEED_TESTING_PLAN.md → docs/testing/"
}

# E2B_TESTING_STRATEGY.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "E2B_TESTING_STRATEGY.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "E2B_TESTING_STRATEGY.md" "docs/testing/E2B_TESTING_STRATEGY.md"
        Write-Host "  ✅ Moved: E2B_TESTING_STRATEGY.md"
    }
} else {
    Write-Host "  🔍 Would move: E2B_TESTING_STRATEGY.md → docs/testing/"
}

# E2E_TESTING_GUIDE.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "E2E_TESTING_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "E2E_TESTING_GUIDE.md" "docs/testing/E2E_TESTING_GUIDE.md"
        Write-Host "  ✅ Moved: E2E_TESTING_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: E2E_TESTING_GUIDE.md → docs/testing/"
}

# FIRST_E2E_TEST_RUN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "FIRST_E2E_TEST_RUN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "FIRST_E2E_TEST_RUN.md" "docs/testing/FIRST_E2E_TEST_RUN.md"
        Write-Host "  ✅ Moved: FIRST_E2E_TEST_RUN.md"
    }
} else {
    Write-Host "  🔍 Would move: FIRST_E2E_TEST_RUN.md → docs/testing/"
}

# FIX_TEST_ERROR.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "FIX_TEST_ERROR.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "FIX_TEST_ERROR.md" "docs/testing/FIX_TEST_ERROR.md"
        Write-Host "  ✅ Moved: FIX_TEST_ERROR.md"
    }
} else {
    Write-Host "  🔍 Would move: FIX_TEST_ERROR.md → docs/testing/"
}

# GOOGLE_GEMINI_API_FOR_TESTING.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "GOOGLE_GEMINI_API_FOR_TESTING.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "GOOGLE_GEMINI_API_FOR_TESTING.md" "docs/testing/GOOGLE_GEMINI_API_FOR_TESTING.md"
        Write-Host "  ✅ Moved: GOOGLE_GEMINI_API_FOR_TESTING.md"
    }
} else {
    Write-Host "  🔍 Would move: GOOGLE_GEMINI_API_FOR_TESTING.md → docs/testing/"
}

# MASTER_TESTING_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "MASTER_TESTING_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "MASTER_TESTING_PLAN.md" "docs/testing/MASTER_TESTING_PLAN.md"
        Write-Host "  ✅ Moved: MASTER_TESTING_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: MASTER_TESTING_PLAN.md → docs/testing/"
}

# OPTION_B_TESTING_COMPLETE.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "OPTION_B_TESTING_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "OPTION_B_TESTING_COMPLETE.md" "docs/testing/OPTION_B_TESTING_COMPLETE.md"
        Write-Host "  ✅ Moved: OPTION_B_TESTING_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: OPTION_B_TESTING_COMPLETE.md → docs/testing/"
}

# PHASE1_TEST_FIX_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "PHASE1_TEST_FIX_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "PHASE1_TEST_FIX_REPORT.md" "docs/testing/PHASE1_TEST_FIX_REPORT.md"
        Write-Host "  ✅ Moved: PHASE1_TEST_FIX_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: PHASE1_TEST_FIX_REPORT.md → docs/testing/"
}

# QUICK_START_TESTING.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "QUICK_START_TESTING.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "QUICK_START_TESTING.md" "docs/testing/QUICK_START_TESTING.md"
        Write-Host "  ✅ Moved: QUICK_START_TESTING.md"
    }
} else {
    Write-Host "  🔍 Would move: QUICK_START_TESTING.md → docs/testing/"
}

# SKIPPED_TESTS_ANALYSIS.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "SKIPPED_TESTS_ANALYSIS.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "SKIPPED_TESTS_ANALYSIS.md" "docs/testing/SKIPPED_TESTS_ANALYSIS.md"
        Write-Host "  ✅ Moved: SKIPPED_TESTS_ANALYSIS.md"
    }
} else {
    Write-Host "  🔍 Would move: SKIPPED_TESTS_ANALYSIS.md → docs/testing/"
}

# STRESS_TEST_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "STRESS_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "STRESS_TEST_REPORT.md" "docs/testing/STRESS_TEST_REPORT.md"
        Write-Host "  ✅ Moved: STRESS_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: STRESS_TEST_REPORT.md → docs/testing/"
}

# SWARM_TESTING_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "SWARM_TESTING_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "SWARM_TESTING_PLAN.md" "docs/testing/SWARM_TESTING_PLAN.md"
        Write-Host "  ✅ Moved: SWARM_TESTING_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: SWARM_TESTING_PLAN.md → docs/testing/"
}

# TEST_ANALYSIS_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_ANALYSIS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_ANALYSIS_REPORT.md" "docs/testing/TEST_ANALYSIS_REPORT.md"
        Write-Host "  ✅ Moved: TEST_ANALYSIS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_ANALYSIS_REPORT.md → docs/testing/"
}

# TEST_COVERAGE_100_PERCENT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_COVERAGE_100_PERCENT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_COVERAGE_100_PERCENT.md" "docs/testing/TEST_COVERAGE_100_PERCENT.md"
        Write-Host "  ✅ Moved: TEST_COVERAGE_100_PERCENT.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_COVERAGE_100_PERCENT.md → docs/testing/"
}

# TEST_COVERAGE_ANALYSIS_2025-12-23.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_COVERAGE_ANALYSIS_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_COVERAGE_ANALYSIS_2025-12-23.md" "docs/testing/TEST_COVERAGE_ANALYSIS_2025-12-23.md"
        Write-Host "  ✅ Moved: TEST_COVERAGE_ANALYSIS_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_COVERAGE_ANALYSIS_2025-12-23.md → docs/testing/"
}

# TEST_COVERAGE_PLAN.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_COVERAGE_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_COVERAGE_PLAN.md" "docs/testing/TEST_COVERAGE_PLAN.md"
        Write-Host "  ✅ Moved: TEST_COVERAGE_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_COVERAGE_PLAN.md → docs/testing/"
}

# TEST_DB_SETUP.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_DB_SETUP.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_DB_SETUP.md" "docs/testing/TEST_DB_SETUP.md"
        Write-Host "  ✅ Moved: TEST_DB_SETUP.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_DB_SETUP.md → docs/testing/"
}

# TEST_ENVIRONMENT_GUIDE.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_ENVIRONMENT_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_ENVIRONMENT_GUIDE.md" "docs/testing/TEST_ENVIRONMENT_GUIDE.md"
        Write-Host "  ✅ Moved: TEST_ENVIRONMENT_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_ENVIRONMENT_GUIDE.md → docs/testing/"
}

# TEST_FIX_ANALYSIS_REPORT.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_FIX_ANALYSIS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "TEST_FIX_ANALYSIS_REPORT.md" "docs/testing/TEST_FIX_ANALYSIS_REPORT.md"
        Write-Host "  ✅ Moved: TEST_FIX_ANALYSIS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_FIX_ANALYSIS_REPORT.md → docs/testing/"
}

# VED-SM0_FIX_92_TESTS_COMPLETE.md → docs/testing/
if ($DryRun -eq "false") {
    if (Test-Path "VED-SM0_FIX_92_TESTS_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null
        Move-Item "VED-SM0_FIX_92_TESTS_COMPLETE.md" "docs/testing/VED-SM0_FIX_92_TESTS_COMPLETE.md"
        Write-Host "  ✅ Moved: VED-SM0_FIX_92_TESTS_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-SM0_FIX_92_TESTS_COMPLETE.md → docs/testing/"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# ARCHIVE (69 files)
# ═══════════════════════════════════════════════════════════

Write-Host "📦 Archive: 69 files" -ForegroundColor Cyan

# Target: docs/archive/2025-12/audits/ (5 files)

# AUDIT_REPORT_100_AGENT_ORCHESTRATION.md → docs/archive/2025-12/audits/
if ($DryRun -eq "false") {
    if (Test-Path "AUDIT_REPORT_100_AGENT_ORCHESTRATION.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits" | Out-Null
        Move-Item "AUDIT_REPORT_100_AGENT_ORCHESTRATION.md" "docs/archive/2025-12/audits/AUDIT_REPORT_100_AGENT_ORCHESTRATION.md"
        Write-Host "  ✅ Moved: AUDIT_REPORT_100_AGENT_ORCHESTRATION.md"
    }
} else {
    Write-Host "  🔍 Would move: AUDIT_REPORT_100_AGENT_ORCHESTRATION.md → docs/archive/2025-12/audits/"
}

# AUDIT_REPORT_2025-12-22.md → docs/archive/2025-12/audits/
if ($DryRun -eq "false") {
    if (Test-Path "AUDIT_REPORT_2025-12-22.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits" | Out-Null
        Move-Item "AUDIT_REPORT_2025-12-22.md" "docs/archive/2025-12/audits/AUDIT_REPORT_2025-12-22.md"
        Write-Host "  ✅ Moved: AUDIT_REPORT_2025-12-22.md"
    }
} else {
    Write-Host "  🔍 Would move: AUDIT_REPORT_2025-12-22.md → docs/archive/2025-12/audits/"
}

# COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md → docs/archive/2025-12/audits/
if ($DryRun -eq "false") {
    if (Test-Path "COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits" | Out-Null
        Move-Item "COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md" "docs/archive/2025-12/audits/COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md"
        Write-Host "  ✅ Moved: COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: COMPREHENSIVE_AUDIT_AND_OPTIMIZATION_ROADMAP_2025-12-23.md → docs/archive/2025-12/audits/"
}

# COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md → docs/archive/2025-12/audits/
if ($DryRun -eq "false") {
    if (Test-Path "COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits" | Out-Null
        Move-Item "COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md" "docs/archive/2025-12/audits/COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md"
        Write-Host "  ✅ Moved: COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md"
    }
} else {
    Write-Host "  🔍 Would move: COMPREHENSIVE_AUDIT_REPORT_2025-12-22.md → docs/archive/2025-12/audits/"
}

# COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md → docs/archive/2025-12/audits/
if ($DryRun -eq "false") {
    if (Test-Path "COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/audits" | Out-Null
        Move-Item "COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md" "docs/archive/2025-12/audits/COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md"
        Write-Host "  ✅ Moved: COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: COMPREHENSIVE_PROJECT_AUDIT_2025-12-23.md → docs/archive/2025-12/audits/"
}

# Target: docs/archive/2025-12/session-reports/ (33 files)

# BACKEND_PRIORITY_HANDOFF.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "BACKEND_PRIORITY_HANDOFF.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "BACKEND_PRIORITY_HANDOFF.md" "docs/archive/2025-12/session-reports/BACKEND_PRIORITY_HANDOFF.md"
        Write-Host "  ✅ Moved: BACKEND_PRIORITY_HANDOFF.md"
    }
} else {
    Write-Host "  🔍 Would move: BACKEND_PRIORITY_HANDOFF.md → docs/archive/2025-12/session-reports/"
}

# CONTEXT_HANDOFF_2025-12-21_23h.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "CONTEXT_HANDOFF_2025-12-21_23h.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "CONTEXT_HANDOFF_2025-12-21_23h.md" "docs/archive/2025-12/session-reports/CONTEXT_HANDOFF_2025-12-21_23h.md"
        Write-Host "  ✅ Moved: CONTEXT_HANDOFF_2025-12-21_23h.md"
    }
} else {
    Write-Host "  🔍 Would move: CONTEXT_HANDOFF_2025-12-21_23h.md → docs/archive/2025-12/session-reports/"
}

# HANDOFF_CONTEXT.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "HANDOFF_CONTEXT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "HANDOFF_CONTEXT.md" "docs/archive/2025-12/session-reports/HANDOFF_CONTEXT.md"
        Write-Host "  ✅ Moved: HANDOFF_CONTEXT.md"
    }
} else {
    Write-Host "  🔍 Would move: HANDOFF_CONTEXT.md → docs/archive/2025-12/session-reports/"
}

# NEW_SESSION_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NEW_SESSION_HANDOFF_2025-12-22.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "NEW_SESSION_HANDOFF_2025-12-22.md" "docs/archive/2025-12/session-reports/NEW_SESSION_HANDOFF_2025-12-22.md"
        Write-Host "  ✅ Moved: NEW_SESSION_HANDOFF_2025-12-22.md"
    }
} else {
    Write-Host "  🔍 Would move: NEW_SESSION_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/"
}

# NEW_THREAD_HANDOFF_2025-12-21.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NEW_THREAD_HANDOFF_2025-12-21.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "NEW_THREAD_HANDOFF_2025-12-21.md" "docs/archive/2025-12/session-reports/NEW_THREAD_HANDOFF_2025-12-21.md"
        Write-Host "  ✅ Moved: NEW_THREAD_HANDOFF_2025-12-21.md"
    }
} else {
    Write-Host "  🔍 Would move: NEW_THREAD_HANDOFF_2025-12-21.md → docs/archive/2025-12/session-reports/"
}

# NEW_THREAD_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NEW_THREAD_HANDOFF_2025-12-22.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "NEW_THREAD_HANDOFF_2025-12-22.md" "docs/archive/2025-12/session-reports/NEW_THREAD_HANDOFF_2025-12-22.md"
        Write-Host "  ✅ Moved: NEW_THREAD_HANDOFF_2025-12-22.md"
    }
} else {
    Write-Host "  🔍 Would move: NEW_THREAD_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/"
}

# NEW_THREAD_HANDOFF_2025-12-22_01h30.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NEW_THREAD_HANDOFF_2025-12-22_01h30.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "NEW_THREAD_HANDOFF_2025-12-22_01h30.md" "docs/archive/2025-12/session-reports/NEW_THREAD_HANDOFF_2025-12-22_01h30.md"
        Write-Host "  ✅ Moved: NEW_THREAD_HANDOFF_2025-12-22_01h30.md"
    }
} else {
    Write-Host "  🔍 Would move: NEW_THREAD_HANDOFF_2025-12-22_01h30.md → docs/archive/2025-12/session-reports/"
}

# NEW_THREAD_HANDOFF_2025-12-22_Session2.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "NEW_THREAD_HANDOFF_2025-12-22_Session2.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "NEW_THREAD_HANDOFF_2025-12-22_Session2.md" "docs/archive/2025-12/session-reports/NEW_THREAD_HANDOFF_2025-12-22_Session2.md"
        Write-Host "  ✅ Moved: NEW_THREAD_HANDOFF_2025-12-22_Session2.md"
    }
} else {
    Write-Host "  🔍 Would move: NEW_THREAD_HANDOFF_2025-12-22_Session2.md → docs/archive/2025-12/session-reports/"
}

# SESSION_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_HANDOFF_2025-12-22.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_HANDOFF_2025-12-22.md" "docs/archive/2025-12/session-reports/SESSION_HANDOFF_2025-12-22.md"
        Write-Host "  ✅ Moved: SESSION_HANDOFF_2025-12-22.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_HANDOFF_2025-12-22.md → docs/archive/2025-12/session-reports/"
}

# SESSION_HANDOFF_2025-12-22_02h00.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_HANDOFF_2025-12-22_02h00.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_HANDOFF_2025-12-22_02h00.md" "docs/archive/2025-12/session-reports/SESSION_HANDOFF_2025-12-22_02h00.md"
        Write-Host "  ✅ Moved: SESSION_HANDOFF_2025-12-22_02h00.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_HANDOFF_2025-12-22_02h00.md → docs/archive/2025-12/session-reports/"
}

# SESSION_PROGRESS_2025-12-22_01h15.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_PROGRESS_2025-12-22_01h15.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_PROGRESS_2025-12-22_01h15.md" "docs/archive/2025-12/session-reports/SESSION_PROGRESS_2025-12-22_01h15.md"
        Write-Host "  ✅ Moved: SESSION_PROGRESS_2025-12-22_01h15.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_PROGRESS_2025-12-22_01h15.md → docs/archive/2025-12/session-reports/"
}

# SESSION_PROGRESS_2025-12-22_02h30.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_PROGRESS_2025-12-22_02h30.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_PROGRESS_2025-12-22_02h30.md" "docs/archive/2025-12/session-reports/SESSION_PROGRESS_2025-12-22_02h30.md"
        Write-Host "  ✅ Moved: SESSION_PROGRESS_2025-12-22_02h30.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_PROGRESS_2025-12-22_02h30.md → docs/archive/2025-12/session-reports/"
}

# SESSION_SUMMARY_2025-12-21_22h.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_SUMMARY_2025-12-21_22h.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_SUMMARY_2025-12-21_22h.md" "docs/archive/2025-12/session-reports/SESSION_SUMMARY_2025-12-21_22h.md"
        Write-Host "  ✅ Moved: SESSION_SUMMARY_2025-12-21_22h.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_SUMMARY_2025-12-21_22h.md → docs/archive/2025-12/session-reports/"
}

# SESSION_SUMMARY_2025-12-21_23h.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "SESSION_SUMMARY_2025-12-21_23h.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "SESSION_SUMMARY_2025-12-21_23h.md" "docs/archive/2025-12/session-reports/SESSION_SUMMARY_2025-12-21_23h.md"
        Write-Host "  ✅ Moved: SESSION_SUMMARY_2025-12-21_23h.md"
    }
} else {
    Write-Host "  🔍 Would move: SESSION_SUMMARY_2025-12-21_23h.md → docs/archive/2025-12/session-reports/"
}

# TEST_FIX_SESSION_HANDOFF.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "TEST_FIX_SESSION_HANDOFF.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "TEST_FIX_SESSION_HANDOFF.md" "docs/archive/2025-12/session-reports/TEST_FIX_SESSION_HANDOFF.md"
        Write-Host "  ✅ Moved: TEST_FIX_SESSION_HANDOFF.md"
    }
} else {
    Write-Host "  🔍 Would move: TEST_FIX_SESSION_HANDOFF.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_14_SKILLS_COMPLETE.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_14_SKILLS_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_14_SKILLS_COMPLETE.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_14_SKILLS_COMPLETE.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_14_SKILLS_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_14_SKILLS_COMPLETE.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_2025-12-22_02h45.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_2025-12-22_02h45.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_2025-12-22_02h45.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_2025-12-22_02h45.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_2025-12-22_02h45.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_2025-12-22_02h45.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_2025-12-22_03h30.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_2025-12-22_03h30.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_2025-12-22_03h30.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_2025-12-22_03h30.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_2025-12-22_03h30.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_2025-12-22_03h30.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_2025-12-22_04h00.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_2025-12-22_04h00.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_2025-12-22_04h00.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_2025-12-22_04h00.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_2025-12-22_04h00.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_2025-12-22_04h00.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_2025-12-22_12h.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_2025-12-22_12h.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_2025-12-22_12h.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_2025-12-22_12h.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_2025-12-22_12h.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_2025-12-22_12h.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_AUTO_WORKFLOW_TESTING.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_COMPLETE.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_COMPLETE.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_COMPLETE.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_COMPLETE.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_OPTIMIZATION.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_OPTIMIZATION.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_OPTIMIZATION.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_OPTIMIZATION.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_OPTIMIZATION.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_OPTIMIZATION.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_OPTIMIZATION_COMPLETE.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_OPTIMIZATION_PHASE2.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_PHASE2_SESSION1.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_PHASE2_SESSION2.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_PHASE2_SESSION3.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_SPEED.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_SPEED.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_SPEED.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_SPEED.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_SPEED.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_SPEED.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DATABASE_TOOLS.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DATABASE_TOOLS.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DATABASE_TOOLS.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DATABASE_TOOLS.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DATABASE_TOOLS.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DATABASE_TOOLS.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_DB_OPTIMIZATION.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_DB_OPTIMIZATION.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_DB_OPTIMIZATION.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_DB_OPTIMIZATION.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_DB_OPTIMIZATION.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_DB_OPTIMIZATION.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_GUIDE.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_GUIDE.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_GUIDE.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_GUIDE.md → docs/archive/2025-12/session-reports/"
}

# THREAD_HANDOFF_VPS_DEPLOYMENT.md → docs/archive/2025-12/session-reports/
if ($DryRun -eq "false") {
    if (Test-Path "THREAD_HANDOFF_VPS_DEPLOYMENT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/session-reports" | Out-Null
        Move-Item "THREAD_HANDOFF_VPS_DEPLOYMENT.md" "docs/archive/2025-12/session-reports/THREAD_HANDOFF_VPS_DEPLOYMENT.md"
        Write-Host "  ✅ Moved: THREAD_HANDOFF_VPS_DEPLOYMENT.md"
    }
} else {
    Write-Host "  🔍 Would move: THREAD_HANDOFF_VPS_DEPLOYMENT.md → docs/archive/2025-12/session-reports/"
}

# Target: docs/archive/2025-12/completion-reports/ (6 files)

# VED-296_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-296_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-296_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-296_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-296_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-296_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# VED-3JQ_PARTIAL_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-3JQ_PARTIAL_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-3JQ_PARTIAL_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-3JQ_PARTIAL_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-3JQ_PARTIAL_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-3JQ_PARTIAL_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# VED-7P4_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-7P4_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-7P4_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-7P4_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-7P4_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-7P4_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# VED-9YX_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-9YX_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-9YX_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-9YX_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-9YX_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-9YX_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# VED-AOR_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-AOR_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-AOR_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-AOR_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-AOR_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-AOR_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# VED-WF9_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/
if ($DryRun -eq "false") {
    if (Test-Path "VED-WF9_COMPLETION_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/completion-reports" | Out-Null
        Move-Item "VED-WF9_COMPLETION_REPORT.md" "docs/archive/2025-12/completion-reports/VED-WF9_COMPLETION_REPORT.md"
        Write-Host "  ✅ Moved: VED-WF9_COMPLETION_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: VED-WF9_COMPLETION_REPORT.md → docs/archive/2025-12/completion-reports/"
}

# Target: docs/archive/2025-12/test-waves/ (25 files)

# WAVE_1_BATCH_4_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE_1_BATCH_4_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE_1_BATCH_4_REPORT.md" "docs/archive/2025-12/test-waves/WAVE_1_BATCH_4_REPORT.md"
        Write-Host "  ✅ Moved: WAVE_1_BATCH_4_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE_1_BATCH_4_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE_3_5_SUMMARY.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE_3_5_SUMMARY.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE_3_5_SUMMARY.md" "docs/archive/2025-12/test-waves/WAVE_3_5_SUMMARY.md"
        Write-Host "  ✅ Moved: WAVE_3_5_SUMMARY.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE_3_5_SUMMARY.md → docs/archive/2025-12/test-waves/"
}

# WAVE1_BATCH2_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE1_BATCH2_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE1_BATCH2_REPORT.md" "docs/archive/2025-12/test-waves/WAVE1_BATCH2_REPORT.md"
        Write-Host "  ✅ Moved: WAVE1_BATCH2_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE1_BATCH2_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE1_BATCH3_CONTROLLER_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE2_BATCH1_SERVICE_TEST_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE2_BATCH1_SERVICE_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE2_BATCH1_SERVICE_TEST_REPORT.md" "docs/archive/2025-12/test-waves/WAVE2_BATCH1_SERVICE_TEST_REPORT.md"
        Write-Host "  ✅ Moved: WAVE2_BATCH1_SERVICE_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE2_BATCH1_SERVICE_TEST_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE2_BATCH2_SERVICE_TEST_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE2_BATCH2_SERVICE_TEST_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE2_BATCH2_SERVICE_TEST_REPORT.md" "docs/archive/2025-12/test-waves/WAVE2_BATCH2_SERVICE_TEST_REPORT.md"
        Write-Host "  ✅ Moved: WAVE2_BATCH2_SERVICE_TEST_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE2_BATCH2_SERVICE_TEST_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE2_BATCH3_FINAL_SUMMARY.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE2_BATCH3_FINAL_SUMMARY.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE2_BATCH3_FINAL_SUMMARY.md" "docs/archive/2025-12/test-waves/WAVE2_BATCH3_FINAL_SUMMARY.md"
        Write-Host "  ✅ Moved: WAVE2_BATCH3_FINAL_SUMMARY.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE2_BATCH3_FINAL_SUMMARY.md → docs/archive/2025-12/test-waves/"
}

# WAVE2_BATCH3_SERVICE_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE2_BATCH3_SERVICE_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE2_BATCH3_SERVICE_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE2_BATCH3_SERVICE_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE2_BATCH3_SERVICE_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE2_BATCH3_SERVICE_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH1_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH2_CHECKLIST.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH2_CHECKLIST.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH2_CHECKLIST.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH2_CHECKLIST.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH2_CHECKLIST.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH2_CHECKLIST.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH2_DELIVERY_SUMMARY.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH2_DELIVERY_SUMMARY.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH2_DELIVERY_SUMMARY.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH2_DELIVERY_SUMMARY.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH2_DELIVERY_SUMMARY.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH2_DELIVERY_SUMMARY.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH2_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH2_QUICK_START.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH2_QUICK_START.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH2_QUICK_START.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH2_QUICK_START.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH2_QUICK_START.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH2_QUICK_START.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH2_SCHEMA_MIGRATION_PLAN.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH3_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH4_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE3_BATCH5_INTEGRATION_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE4_BATCH1_E2E_DELIVERY_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE4_BATCH1_E2E_DELIVERY_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE4_BATCH1_E2E_DELIVERY_REPORT.md" "docs/archive/2025-12/test-waves/WAVE4_BATCH1_E2E_DELIVERY_REPORT.md"
        Write-Host "  ✅ Moved: WAVE4_BATCH1_E2E_DELIVERY_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE4_BATCH1_E2E_DELIVERY_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE4_BATCH2_E2E_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE4_BATCH2_E2E_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE4_BATCH2_E2E_REPORT.md" "docs/archive/2025-12/test-waves/WAVE4_BATCH2_E2E_REPORT.md"
        Write-Host "  ✅ Moved: WAVE4_BATCH2_E2E_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE4_BATCH2_E2E_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE4_BATCH3_E2E_TESTS_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE4_BATCH3_E2E_TESTS_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE4_BATCH3_E2E_TESTS_REPORT.md" "docs/archive/2025-12/test-waves/WAVE4_BATCH3_E2E_TESTS_REPORT.md"
        Write-Host "  ✅ Moved: WAVE4_BATCH3_E2E_TESTS_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE4_BATCH3_E2E_TESTS_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE4_BATCH4_E2E_SUMMARY.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE4_BATCH4_E2E_SUMMARY.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE4_BATCH4_E2E_SUMMARY.md" "docs/archive/2025-12/test-waves/WAVE4_BATCH4_E2E_SUMMARY.md"
        Write-Host "  ✅ Moved: WAVE4_BATCH4_E2E_SUMMARY.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE4_BATCH4_E2E_SUMMARY.md → docs/archive/2025-12/test-waves/"
}

# WAVE4_BATCH5_E2E_FINAL_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE4_BATCH5_E2E_FINAL_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE4_BATCH5_E2E_FINAL_REPORT.md" "docs/archive/2025-12/test-waves/WAVE4_BATCH5_E2E_FINAL_REPORT.md"
        Write-Host "  ✅ Moved: WAVE4_BATCH5_E2E_FINAL_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE4_BATCH5_E2E_FINAL_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md" "docs/archive/2025-12/test-waves/WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md"
        Write-Host "  ✅ Moved: WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE5_BATCH1_QUALITY_GATES_FAILURE_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE5_BATCH2_QUALITY_GATES_REPORT.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE5_BATCH2_QUALITY_GATES_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE5_BATCH2_QUALITY_GATES_REPORT.md" "docs/archive/2025-12/test-waves/WAVE5_BATCH2_QUALITY_GATES_REPORT.md"
        Write-Host "  ✅ Moved: WAVE5_BATCH2_QUALITY_GATES_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE5_BATCH2_QUALITY_GATES_REPORT.md → docs/archive/2025-12/test-waves/"
}

# WAVE5_BATCH3_QUALITY_CERTIFICATION.md → docs/archive/2025-12/test-waves/
if ($DryRun -eq "false") {
    if (Test-Path "WAVE5_BATCH3_QUALITY_CERTIFICATION.md") {
        New-Item -ItemType Directory -Force -Path "docs/archive/2025-12/test-waves" | Out-Null
        Move-Item "WAVE5_BATCH3_QUALITY_CERTIFICATION.md" "docs/archive/2025-12/test-waves/WAVE5_BATCH3_QUALITY_CERTIFICATION.md"
        Write-Host "  ✅ Moved: WAVE5_BATCH3_QUALITY_CERTIFICATION.md"
    }
} else {
    Write-Host "  🔍 Would move: WAVE5_BATCH3_QUALITY_CERTIFICATION.md → docs/archive/2025-12/test-waves/"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# DELETE FILES (4 files)
# ═══════════════════════════════════════════════════════════

Write-Host "🗑️  Delete: 4 files" -ForegroundColor Yellow

# beads_import.md
# Reason: Superseded or obsolete
if ($DryRun -eq "false") {
    if (Test-Path "beads_import.md") {
        Remove-Item "beads_import.md"
        Write-Host "  ❌ Deleted: beads_import.md"
    }
} else {
    Write-Host "  🔍 Would delete: beads_import.md"
}

# CLEANUP_PLAN.md
# Reason: Superseded or obsolete
if ($DryRun -eq "false") {
    if (Test-Path "CLEANUP_PLAN.md") {
        Remove-Item "CLEANUP_PLAN.md"
        Write-Host "  ❌ Deleted: CLEANUP_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would delete: CLEANUP_PLAN.md"
}

# CONTEXT_SNAPSHOT.md
# Reason: Superseded or obsolete
if ($DryRun -eq "false") {
    if (Test-Path "CONTEXT_SNAPSHOT.md") {
        Remove-Item "CONTEXT_SNAPSHOT.md"
        Write-Host "  ❌ Deleted: CONTEXT_SNAPSHOT.md"
    }
} else {
    Write-Host "  🔍 Would delete: CONTEXT_SNAPSHOT.md"
}

# NEXT_STEPS.md
# Reason: Superseded or obsolete
if ($DryRun -eq "false") {
    if (Test-Path "NEXT_STEPS.md") {
        Remove-Item "NEXT_STEPS.md"
        Write-Host "  ❌ Deleted: NEXT_STEPS.md"
    }
} else {
    Write-Host "  🔍 Would delete: NEXT_STEPS.md"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# BEADS (2 files)
# ═══════════════════════════════════════════════════════════

Write-Host "🔄 Beads: 2 files" -ForegroundColor Cyan

# Target: docs/beads/ (2 files)

# BEADS_INTEGRATION_DEEP_DIVE.md → docs/beads/
if ($DryRun -eq "false") {
    if (Test-Path "BEADS_INTEGRATION_DEEP_DIVE.md") {
        New-Item -ItemType Directory -Force -Path "docs/beads" | Out-Null
        Move-Item "BEADS_INTEGRATION_DEEP_DIVE.md" "docs/beads/BEADS_INTEGRATION_DEEP_DIVE.md"
        Write-Host "  ✅ Moved: BEADS_INTEGRATION_DEEP_DIVE.md"
    }
} else {
    Write-Host "  🔍 Would move: BEADS_INTEGRATION_DEEP_DIVE.md → docs/beads/"
}

# BEADS_OPTIMIZATION_ROADMAP.md → docs/beads/
if ($DryRun -eq "false") {
    if (Test-Path "BEADS_OPTIMIZATION_ROADMAP.md") {
        New-Item -ItemType Directory -Force -Path "docs/beads" | Out-Null
        Move-Item "BEADS_OPTIMIZATION_ROADMAP.md" "docs/beads/BEADS_OPTIMIZATION_ROADMAP.md"
        Write-Host "  ✅ Moved: BEADS_OPTIMIZATION_ROADMAP.md"
    }
} else {
    Write-Host "  🔍 Would move: BEADS_OPTIMIZATION_ROADMAP.md → docs/beads/"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# DEVOPS (14 files)
# ═══════════════════════════════════════════════════════════

Write-Host "⚙️ Devops: 14 files" -ForegroundColor Cyan

# Target: docs/devops/ (14 files)

# DEPLOYMENT_SUMMARY.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "DEPLOYMENT_SUMMARY.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "DEPLOYMENT_SUMMARY.md" "docs/devops/DEPLOYMENT_SUMMARY.md"
        Write-Host "  ✅ Moved: DEPLOYMENT_SUMMARY.md"
    }
} else {
    Write-Host "  🔍 Would move: DEPLOYMENT_SUMMARY.md → docs/devops/"
}

# DEV_SERVER_GUIDE.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "DEV_SERVER_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "DEV_SERVER_GUIDE.md" "docs/devops/DEV_SERVER_GUIDE.md"
        Write-Host "  ✅ Moved: DEV_SERVER_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: DEV_SERVER_GUIDE.md → docs/devops/"
}

# DEVOPS_EPIC_TASKS_BEADS_PLAN.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "DEVOPS_EPIC_TASKS_BEADS_PLAN.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "DEVOPS_EPIC_TASKS_BEADS_PLAN.md" "docs/devops/DEVOPS_EPIC_TASKS_BEADS_PLAN.md"
        Write-Host "  ✅ Moved: DEVOPS_EPIC_TASKS_BEADS_PLAN.md"
    }
} else {
    Write-Host "  🔍 Would move: DEVOPS_EPIC_TASKS_BEADS_PLAN.md → docs/devops/"
}

# DEVOPS_GUIDE.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "DEVOPS_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "DEVOPS_GUIDE.md" "docs/devops/DEVOPS_GUIDE.md"
        Write-Host "  ✅ Moved: DEVOPS_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: DEVOPS_GUIDE.md → docs/devops/"
}

# DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md" "docs/devops/DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md"
        Write-Host "  ✅ Moved: DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: DEVOPS_INFRASTRUCTURE_AUDIT_2025-12-23.md → docs/devops/"
}

# EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md" "docs/devops/EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md"
        Write-Host "  ✅ Moved: EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md"
    }
} else {
    Write-Host "  🔍 Would move: EPIC_DATABASE_OPTIMIZATION_CONTINUATION.md → docs/devops/"
}

# EPIC_VPS_PRODUCTION_DEPLOYMENT.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "EPIC_VPS_PRODUCTION_DEPLOYMENT.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "EPIC_VPS_PRODUCTION_DEPLOYMENT.md" "docs/devops/EPIC_VPS_PRODUCTION_DEPLOYMENT.md"
        Write-Host "  ✅ Moved: EPIC_VPS_PRODUCTION_DEPLOYMENT.md"
    }
} else {
    Write-Host "  🔍 Would move: EPIC_VPS_PRODUCTION_DEPLOYMENT.md → docs/devops/"
}

# SECURITY_AUDIT_REPORT_2025-12-23.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "SECURITY_AUDIT_REPORT_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "SECURITY_AUDIT_REPORT_2025-12-23.md" "docs/devops/SECURITY_AUDIT_REPORT_2025-12-23.md"
        Write-Host "  ✅ Moved: SECURITY_AUDIT_REPORT_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: SECURITY_AUDIT_REPORT_2025-12-23.md → docs/devops/"
}

# SECURITY_FIX_REPORT.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "SECURITY_FIX_REPORT.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "SECURITY_FIX_REPORT.md" "docs/devops/SECURITY_FIX_REPORT.md"
        Write-Host "  ✅ Moved: SECURITY_FIX_REPORT.md"
    }
} else {
    Write-Host "  🔍 Would move: SECURITY_FIX_REPORT.md → docs/devops/"
}

# SECURITY_FIXES_COMPLETE_2025-12-23.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "SECURITY_FIXES_COMPLETE_2025-12-23.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "SECURITY_FIXES_COMPLETE_2025-12-23.md" "docs/devops/SECURITY_FIXES_COMPLETE_2025-12-23.md"
        Write-Host "  ✅ Moved: SECURITY_FIXES_COMPLETE_2025-12-23.md"
    }
} else {
    Write-Host "  🔍 Would move: SECURITY_FIXES_COMPLETE_2025-12-23.md → docs/devops/"
}

# SECURITY_SECRETS_SETUP.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "SECURITY_SECRETS_SETUP.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "SECURITY_SECRETS_SETUP.md" "docs/devops/SECURITY_SECRETS_SETUP.md"
        Write-Host "  ✅ Moved: SECURITY_SECRETS_SETUP.md"
    }
} else {
    Write-Host "  🔍 Would move: SECURITY_SECRETS_SETUP.md → docs/devops/"
}

# VPS_DEPLOYMENT_GUIDE.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "VPS_DEPLOYMENT_GUIDE.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "VPS_DEPLOYMENT_GUIDE.md" "docs/devops/VPS_DEPLOYMENT_GUIDE.md"
        Write-Host "  ✅ Moved: VPS_DEPLOYMENT_GUIDE.md"
    }
} else {
    Write-Host "  🔍 Would move: VPS_DEPLOYMENT_GUIDE.md → docs/devops/"
}

# VPS_MANUAL_COMMANDS.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "VPS_MANUAL_COMMANDS.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "VPS_MANUAL_COMMANDS.md" "docs/devops/VPS_MANUAL_COMMANDS.md"
        Write-Host "  ✅ Moved: VPS_MANUAL_COMMANDS.md"
    }
} else {
    Write-Host "  🔍 Would move: VPS_MANUAL_COMMANDS.md → docs/devops/"
}

# VPS_MANUAL_PGVECTOR.md → docs/devops/
if ($DryRun -eq "false") {
    if (Test-Path "VPS_MANUAL_PGVECTOR.md") {
        New-Item -ItemType Directory -Force -Path "docs/devops" | Out-Null
        Move-Item "VPS_MANUAL_PGVECTOR.md" "docs/devops/VPS_MANUAL_PGVECTOR.md"
        Write-Host "  ✅ Moved: VPS_MANUAL_PGVECTOR.md"
    }
} else {
    Write-Host "  🔍 Would move: VPS_MANUAL_PGVECTOR.md → docs/devops/"
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Core (keep):   79 files" -ForegroundColor Green
Write-Host "  Edtech       :   8 files"
Write-Host "  Testing      :  33 files"
Write-Host "  Archive      :  69 files"
Write-Host "  Delete:         4 files" -ForegroundColor Yellow
Write-Host "  Beads        :   2 files"
Write-Host "  Devops       :  14 files"
Write-Host ""

if ($DryRun -eq "true") {
    Write-Host "✅ Dry run complete - No files were moved" -ForegroundColor Green
    Write-Host ""
    Write-Host "To execute for real, run:" -ForegroundColor Yellow
    Write-Host "  .\move-files.ps1 -DryRun false" -ForegroundColor White
} else {
    Write-Host "✅ Move complete!" -ForegroundColor Green
}
