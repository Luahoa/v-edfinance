# V-EdFinance 🎓💰

> **EdTech platform for financial education** with gamification, AI-powered mentorship, and interactive simulations

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

- 🎮 **Gamification System** - Achievements, leaderboards, and rewards
- 💡 **AI-Powered Mentor** - Personalized guidance with Google Gemini
- 📊 **Interactive Simulations** - Real-world financial scenarios
- 🌍 **Multi-Language** - Vietnamese, English, Chinese (vi/en/zh)
- 🏆 **Social Learning** - Groups, discussions, and peer interactions
- 📱 **Responsive Design** - Mobile-first, accessible (WCAG AA)
- 🔒 **Secure Payments** - Stripe integration for premium features

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+
- **PostgreSQL** 14+

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Luahoa/v-edfinance.git
cd v-edfinance

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
npx prisma migrate dev
npx prisma db seed

# 5. Start development servers
pnpm dev
# Or: scripts/development/START_DEV.bat (Windows)
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

**For detailed setup**: See [docs/getting-started/](docs/getting-started/)

---

## 📚 Documentation

### For Developers
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [AGENTS.md](AGENTS.md) - AI agent instructions
- [docs/getting-started/](docs/getting-started/) - Setup guides

### For Users
- [SPEC.md](SPEC.md) - Product specification
- [docs/guides/](docs/guides/) - User guides

### Operations
- [SECURITY.md](SECURITY.md) - Security policy
- [docs/operations/](docs/operations/) - Deployment & monitoring

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS, shadcn/ui
- **State**: Zustand
- **i18n**: next-intl (vi/en/zh)

### Backend
- **Framework**: NestJS 10
- **Database**: PostgreSQL 16 + Prisma ORM
- **AI**: Google Gemini Pro
- **Payments**: Stripe

### DevOps
- **Deployment**: Cloudflare Pages + VPS
- **Monitoring**: Prometheus + Grafana
- **Testing**: Playwright, Jest, AVA

---

## 📊 Project Status

**Current Version**: 0.1.0 (MVP)

| Component | Progress |
|-----------|----------|
| Backend API | ████████████████░░░░ 80% |
| Frontend UI | ████████████░░░░░░░░ 60% |
| Testing | ██████░░░░░░░░░░░░░░ 30% |
| Documentation | ████████████████████ 100% |

**See**: [CHANGELOG.md](CHANGELOG.md) for detailed version history

---

## 🛠️ Development

### Run Tests

```bash
# All tests
pnpm test

# Frontend tests
pnpm --filter web test

# Backend tests  
pnpm --filter api test

# E2E tests
pnpm --filter web test:e2e
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter web build
pnpm --filter api build
```

### Code Quality

```bash
# Lint
pnpm --filter <package> lint

# Type check
pnpm --filter <package> build
```

---

## 🌟 Key Features in Detail

### Gamification System
- Achievement tracking with badges
- XP and leveling system
- Daily streaks and challenges
- Leaderboards (global, friends, class)

### AI Mentor
- Personalized learning paths
- Context-aware suggestions
- Financial scenario analysis
- 24/7 availability

### Interactive Simulations
- Stock market simulator
- Budget planning tools
- Investment scenarios
- Retirement calculators

---

## 🔒 Security

We take security seriously. See [SECURITY.md](SECURITY.md) for:
- Vulnerability reporting
- Security best practices
- Incident response procedures

**Recent security work**:
- ✅ Removed secrets from git history
- ✅ GitHub secret scanning enabled
- ✅ Branch protection configured
- ✅ Comprehensive .gitignore patterns

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup guide
- Code style standards
- Git workflow
- Pull request process

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch (`git checkout -b feature/ved-xxx-description`)
3. Make changes and test
4. Commit (`git commit -m "feat: description"`)
5. Push and create Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **UI/UX**: Inspired by modern edtech platforms
- **AI Integration**: Powered by Google Gemini
- **Payment**: Stripe for secure transactions
- **Icons**: Lucide React
- **Community**: Open source contributors

---

## 📧 Contact

- **GitHub**: [github.com/Luahoa/v-edfinance](https://github.com/Luahoa/v-edfinance)
- **Issues**: [github.com/Luahoa/v-edfinance/issues](https://github.com/Luahoa/v-edfinance/issues)
- **Discussions**: [github.com/Luahoa/v-edfinance/discussions](https://github.com/Luahoa/v-edfinance/discussions)

---

## 🗺️ Roadmap

### v0.2.0 (Q1 2026)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Additional payment methods

### v0.3.0 (Q2 2026)
- [ ] Peer-to-peer learning
- [ ] Certificate system
- [ ] Third-party integrations
- [ ] Content marketplace

**See**: [CHANGELOG.md](CHANGELOG.md) for complete roadmap

---

<div align="center">

**Made with ❤️ by V-EdFinance Team**

[![GitHub stars](https://img.shields.io/github/stars/Luahoa/v-edfinance?style=social)](https://github.com/Luahoa/v-edfinance/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Luahoa/v-edfinance?style=social)](https://github.com/Luahoa/v-edfinance/network/members)

</div>
