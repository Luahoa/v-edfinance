# Download Command-Suite Key Files
$baseUrl = 'https://raw.githubusercontent.com/qdhenry/Claude-Command-Suite/main/.claude/commands'
$commands = @(
    'analysis/analyze-architecture.md',
    'analysis/code-review.md', 
    'debugging/debug-with-visualization.md',
    'features/create-feature.md',
    'optimization/optimize-performance.md',
    'security/security-audit.md',
    'testing/create-tests.md'
)

New-Item -ItemType Directory -Path '.agents/skills/command-suite/commands' -Force | Out-Null

foreach ($cmd in $commands) {
    $filename = Split-Path $cmd -Leaf
    $url = "$baseUrl/$cmd"
    $dest = ".agents/skills/command-suite/commands/$filename"
    
    Write-Host "Downloading: $filename" -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -ErrorAction Stop
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Host "  SKIP (not found)" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Check .agents/skills/command-suite/" -ForegroundColor Green
