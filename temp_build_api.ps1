#!/usr/bin/env pwsh
cd "apps/api"
pnpm install
pnpm build 2>&1 | Select-String -Pattern "error TS" | Select-Object -First 40
