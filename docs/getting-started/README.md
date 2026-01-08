# Getting Started with V-EdFinance

Welcome to V-EdFinance! This guide will help you get the project running on your local machine.

## Quick Links

- [Installation Guide](installation.md) - Detailed setup instructions
- [Development Workflow](development.md) - How to develop and test
- [First Contribution](first-contribution.md) - Make your first contribution
- [Architecture](../architecture/README.md) - System design overview

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL** 14.x or higher
- **Git** for version control

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/Luahoa/v-edfinance.git
cd v-edfinance

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
npx prisma migrate dev
npx prisma db seed

# 5. Start development servers
pnpm dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## What's Next?

1. **Read the [Installation Guide](installation.md)** for detailed setup
2. **Explore the [Development Workflow](development.md)** to understand how to work with the codebase
3. **Check [CONTRIBUTING.md](../../CONTRIBUTING.md)** for code standards
4. **Join our [Discussions](https://github.com/Luahoa/v-edfinance/discussions)** for help

## Need Help?

- **Documentation**: Check [docs/](../) for detailed guides
- **Issues**: Browse [existing issues](https://github.com/Luahoa/v-edfinance/issues)
- **Discussions**: Ask in [GitHub Discussions](https://github.com/Luahoa/v-edfinance/discussions)

---

**Ready to contribute?** See [First Contribution Guide](first-contribution.md)
