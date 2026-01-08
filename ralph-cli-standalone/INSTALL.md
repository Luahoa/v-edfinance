# Ralph CLI - Quick Installation

## 🚀 Install từ GitHub (1 command)

```bash
# Install globally
npm install -g git+https://github.com/Luahoa/ralph-cli.git

# Or with pnpm
pnpm add -g git+https://github.com/Luahoa/ralph-cli.git

# Use anywhere!
ralph --help
ralph start my-epic --max-iter 30
```

## 📦 Install vào Project

```bash
# Add as dev dependency
pnpm add -D git+https://github.com/Luahoa/ralph-cli.git

# Run via npx
npx ralph start my-epic
```

## 🔧 Clone & Link (Development)

```bash
# Clone repo
git clone https://github.com/Luahoa/ralph-cli.git
cd ralph-cli

# Install & link
pnpm install
pnpm link --global

# Now use everywhere
ralph --version
```

## ⚙️ Setup Project

```bash
# 1. Create config
cat > ralph.config.json << 'EOF'
{
  "maxIterations": 30,
  "qualityGateScript": "scripts/quality-gate.bat"
}
EOF

# 2. Create quality gate
mkdir scripts
# Copy quality gate from examples/

# 3. Create history folder
mkdir history

# 4. Run!
ralph start my-epic --verbose
```

## 📚 More Info

- Full docs: [README.md](README.md)
- API Reference: [docs/API.md](docs/API.md)
- Examples: [examples/](examples/)
