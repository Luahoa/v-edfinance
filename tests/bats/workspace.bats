#!/usr/bin/env bats

@test "Check if START_DEV.bat exists" {
  [ -f "START_DEV.bat" ]
}

@test "Verify apps/api directory structure" {
  [ -d "apps/api/src" ]
  [ -d "apps/api/prisma" ]
}

@test "Check if pnpm-workspace.yaml is valid" {
  grep -q "apps/*" pnpm-workspace.yaml
}

@test "Verify node_modules exists in root" {
  [ -d "node_modules" ]
}

@test "Check for .env file presence (development requirement)" {
  [ -f ".env" ] || [ -f ".env.example" ]
}

@test "Verify presence of monitoring config" {
  [ -f "docker-compose.monitoring.yml" ]
}
