#!/usr/bin/env bats

# Track 2.3: File Structure Integrity Tests

setup() {
    # Working directory is the project root
    PROJECT_ROOT="."
}

@test "Core project files exist" {
    [ -f "$PROJECT_ROOT/package.json" ]
    [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]
    [ -f "$PROJECT_ROOT/turbo.json" ]
}

@test "Critical documentation exists" {
    [ -f "$PROJECT_ROOT/README.md" ]
    [ -f "$PROJECT_ROOT/AGENTS.md" ]
    [ -f "$PROJECT_ROOT/SPEC.md" ]
    [ -f "$PROJECT_ROOT/ARCHITECTURE.md" ]
}

@test "App structure is valid" {
    [ -d "$PROJECT_ROOT/apps/web" ]
    [ -d "$PROJECT_ROOT/apps/api" ]
}

@test "Prisma schema exists" {
    [ -f "$PROJECT_ROOT/prisma/schema.prisma" ]
}

@test "I18n locale files exist" {
    [ -f "$PROJECT_ROOT/apps/web/src/messages/vi.json" ]
    [ -f "$PROJECT_ROOT/apps/web/src/messages/en.json" ]
    [ -f "$PROJECT_ROOT/apps/web/src/messages/zh.json" ]
}

@test "Docker configuration exists" {
    [ -f "$PROJECT_ROOT/docker-compose.yml" ]
    [ -f "$PROJECT_ROOT/apps/api/Dockerfile" ]
}
