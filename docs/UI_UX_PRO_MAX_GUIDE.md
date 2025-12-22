# UI/UX Pro Max - Hướng Dẫn Sử Dụng

## Tổng Quan

**UI/UX Pro Max** là skill AI cung cấp thiết kế thông minh cho xây dựng giao diện chuyên nghiệp trên nhiều nền tảng và frameworks.

## Tính Năng

- ✅ **57 UI Styles** - Glassmorphism, Claymorphism, Minimalism, Brutalism, Neumorphism, Bento Grid, Dark Mode...
- ✅ **95 Color Palettes** - Palettes chuyên biệt cho SaaS, E-commerce, Healthcare, Fintech, Beauty...
- ✅ **56 Font Pairings** - Typography đã được curate với Google Fonts
- ✅ **24 Chart Types** - Gợi ý cho dashboards và analytics
- ✅ **8 Tech Stacks** - React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, HTML+Tailwind
- ✅ **98 UX Guidelines** - Best practices, anti-patterns, accessibility rules

## Đã Cài Đặt

Skill đã được cài đặt cho tất cả AI assistants:
- `.claude/` - Claude Code (Amp)
- `.cursor/` - Cursor
- `.windsurf/` - Windsurf
- `.agent/` - Antigravity
- `.github/` - GitHub Copilot
- `.kiro/` - Kiro
- `.shared/` - Database chung

## Cách Sử Dụng

### Với Amp (Claude Code)

Skill tự động kích hoạt khi bạn yêu cầu công việc UI/UX. Chat tự nhiên:

```
Build a landing page for my SaaS product

Create a dashboard for healthcare analytics

Design a portfolio website with dark mode

Make a mobile app UI for e-commerce
```

### Với Cursor/Windsurf

Dùng slash command:

```
/ui-ux-pro-max Build a landing page for my SaaS product
```

### Cơ Chế Hoạt Động

1. **Bạn yêu cầu** - Request UI/UX task (build, design, create, implement, review, fix)
2. **Skill kích hoạt** - AI tự động search database để tìm styles, colors, typography, guidelines
3. **Smart recommendations** - Dựa trên product type, tìm matching design system
4. **Code generation** - Implement UI với colors, fonts, spacing, best practices

## Stacks Được Hỗ Trợ

Dự án V-EdFinance có thể dùng:
- **Next.js + React** (hiện tại) ✅
- **HTML + Tailwind** (mặc định)
- **Vue** / **Svelte**
- **React Native** / **Flutter** (mobile)

## Ví Dụ Sử Dụng Cho V-EdFinance

### 1. Landing Page Fintech

```
Build a modern landing page for V-EdFinance with:
- Fintech color palette
- Professional typography
- Trust-building elements
- Mobile-first design
```

### 2. Dashboard Analytics

```
Create a financial dashboard for V-EdFinance with:
- Chart types for budget tracking
- Card-based layout
- Dark mode support
- Clean data visualization
```

### 3. Mobile App UI

```
Design a mobile app UI for financial education with:
- Gamification elements
- Progress tracking
- Achievement badges
- Friendly, approachable design
```

### 4. Forms & Input

```
Build a multi-step onboarding form with:
- Clear validation
- Progress indicator
- Accessibility compliance
- Smooth transitions
```

## Best Practices cho V-EdFinance

### Color Palette Recommendations
- **Primary**: Fintech-focused (trust, professionalism)
- **Secondary**: Education-friendly (engaging, approachable)
- **Accent**: Gamification (rewards, achievements)

### Typography
- **Headlines**: Clear, confident
- **Body**: Readable, accessible
- **Data**: Monospace for numbers/stats

### UX Guidelines
- **Onboarding**: Progressive disclosure
- **Navigation**: Clear hierarchy
- **Feedback**: Immediate, encouraging
- **Accessibility**: WCAG AA compliance

## Maintenance

### Cập Nhật Skill

```bash
# Check version
uipro versions

# Update to latest
uipro update

# Install specific version
uipro init --version v1.0.0
```

### Gỡ Cài Đặt

```bash
# Remove skill folders
rm -rf .claude/skills/ui-ux-pro-max
rm -rf .cursor/commands/ui-ux-pro-max.md
rm -rf .windsurf/workflows/ui-ux-pro-max.md
rm -rf .agent/workflows/ui-ux-pro-max.md
rm -rf .github/prompts/ui-ux-pro-max.prompt.md
rm -rf .kiro/steering/ui-ux-pro-max.md
rm -rf .shared/ui-ux-pro-max
```

## Dependencies

**Python 3.x** - Required cho search script (đã có sẵn trên hầu hết hệ thống)

```bash
# Kiểm tra
python3 --version

# Windows
winget install Python.Python.3.12
```

## Troubleshooting

### Skill không kích hoạt?
1. Restart AI assistant
2. Kiểm tra folders đã được tạo
3. Thử command rõ ràng hơn

### Search không hoạt động?
1. Kiểm tra Python đã cài
2. Verify `.shared/ui-ux-pro-max/` tồn tại
3. Check permissions

## Resources

- **GitHub**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **CLI**: `npm install -g uipro-cli`
- **License**: MIT

## Integration với V-EdFinance

Skill này đã được tích hợp vào workflow development:

1. **Design System**: Dùng để xây dựng component library
2. **Landing Pages**: Generate marketing pages
3. **Dashboards**: Financial analytics UI
4. **Mobile Apps**: React Native/Flutter layouts
5. **A/B Testing**: Multiple design variations

---

**📌 Note**: Skill này là AI assistant skill, KHÔNG phải là NPM package. Nó hoạt động như context/workflow cho AI coding assistants.
