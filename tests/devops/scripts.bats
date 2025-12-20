#!/usr/bin/env bats

# Track 2.4: Deployment and DB Scripts Verification

setup() {
    PROJECT_ROOT="."
}

@test "FORCE_DB_SYNC.bat exists and contains critical commands" {
    [ -f "$PROJECT_ROOT/FORCE_DB_SYNC.bat" ]
    run grep "prisma migrate dev" "$PROJECT_ROOT/FORCE_DB_SYNC.bat"
    [ "$status" -eq 0 ]
    run grep "prisma db seed" "$PROJECT_ROOT/FORCE_DB_SYNC.bat"
    [ "$status" -eq 0 ]
}

@test "START_DEV.bat exists" {
    [ -f "$PROJECT_ROOT/START_DEV.bat" ]
}

@test "RESTART_DEV.bat exists" {
    [ -f "$PROJECT_ROOT/RESTART_DEV.bat" ]
}

@test "docker-compose.yml is valid YAML" {
    if command -v docker-compose &> /dev/null; then
        run docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config -q
        [ "$status" -eq 0 ]
    else
        skip "docker-compose not found"
    fi
}

@test "Diagnostic endpoint is accessible" {
    # This requires the API to be running, so we skip if not
    if curl -s http://localhost:3001/debug/run &> /dev/null; then
        run curl -s http://localhost:3001/debug/run
        [ "$status" -eq 0 ]
    else
        skip "API not running on 3001"
    fi
}

