# 02. Typography System

**Font Family:** `Inter` (Google Fonts)
**Reasoning:** Excellent support for Vietnamese diacritics, high readability for financial data (tabular nums), modern and clean.

## Type Scale (Desktop)

| Role | Element | Size / Line Height | Weight | Tailwind Class | Usage |
|------|---------|--------------------|--------|----------------|-------|
| **Display** | `h1` (Hero) | 48px / 1.1 | Bold (700) | `text-5xl font-bold` | Landing Page Headlines |
| **H1** | `h1` | 36px / 1.2 | Bold (700) | `text-4xl font-bold` | Page Titles |
| **H2** | `h2` | 30px / 1.3 | SemiBold (600) | `text-3xl font-semibold` | Section Headers |
| **H3** | `h3` | 24px / 1.4 | SemiBold (600) | `text-2xl font-semibold` | Card Titles |
| **Body L** | `p.lead` | 18px / 1.6 | Regular (400) | `text-lg` | Lead paragraphs |
| **Body M** | `p` | 16px / 1.6 | Regular (400) | `text-base` | Standard text |
| **Body S** | `small` | 14px / 1.5 | Regular (400) | `text-sm` | Meta data, hints |
| **Tiny** | `span` | 12px / 1.5 | Medium (500) | `text-xs font-medium` | Labels, tags |

## Financial Data Formatting

For financial numbers, always use `tabular-nums` to ensure alignment in tables and lists.

```tsx
<span className="font-mono tabular-nums tracking-tight">
  {formatCurrency(amount, 'VND')}
</span>
```

### Currency Formatting Rules
- **Vietnamese (vi):** `1.234.567 ₫` (Dot thousands separator)
- **English (en):** `$1,234,567` (Comma thousands separator)

## Hierarchy Principles

1.  **Headings:** High contrast, shorter line height.
2.  **Body:** Comfortable reading measure (65-75 chars), loose line height.
3.  **Labels:** Uppercase or medium weight for distinction.

## Accessibility

- Minimum contrast ratio 4.5:1 for normal text.
- Minimum contrast ratio 3:1 for large text (18pt+).
- Do not rely on color alone (use weights/underlines).
