# AI Native & Apple HIG Design System Specification

## 1. Design Philosophy
- **AI Native**: Intelligent, proactive, and immersive.
- **Minimalist**: Focus on content and clarity (Apple HIG style).
- **Glassmorphism**: Depth through translucency and blur.

## 2. Visual Tokens

### Colors (Adaptive)
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Background | #ffffff | #000000 |
| Foreground | #1d1d1f | #f5f5f7 |
| Primary | #0071e3 | #0a84ff |
| Card | rgba(255,255,255,0.8) | rgba(28,28,30,0.8) |

### AI Gradients
- `ai-text-gradient`: Linear 135deg (#0071e3, #5e5ce6, #bf5af2)

### Typography
- **Font Family**: Inter (Modern Sans-serif)
- **Variable Weights**: 200 - 900
- **Scale**: Apple HIG Standard Scale

## 3. Component Library

### Glassmorphism
Applied to: Header, Cards, Popovers.
- **Blur**: 24px
- **Opacity**: 70-80%
- **Border**: 1px solid rgba(var(--border-rgb), 0.15)

### AI Command Center
- Shortcut: `⌘K`
- Features: Voice Command, AI Search, Smart Suggestions.

## 4. Interaction Guidelines
- **Hover**: Subtle scale (1.02) + shadow transition.
- **Page Transitions**: 600ms ease-in-out bitwise fade.
- **Micro-animations**: Powered by `framer-motion`.

## 5. Accessibility (WCAG 2.1 AA)
- Contrast ratio ≥ 4.5:1 for all text.
- Full keyboard navigation support.
- Screen reader optimized ARIA labels.

## 6. Responsive Grid
- 12-column grid system.
- Breakpoints:
  - `xs`: < 576px
  - `sm`: ≥ 576px
  - `md`: ≥ 768px
  - `lg`: ≥ 992px
  - `xl`: ≥ 1200px
