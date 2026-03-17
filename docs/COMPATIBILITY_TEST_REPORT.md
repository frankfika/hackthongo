# 适配与兼容性测试报告

## 1. 测试范围
- 页面：`/`、`/submit`、`/auth/signin`、`/footer-test/short`、`/ui-test/overlays`。
- 场景：短页贴底、长页滚动、Toast 可视区、Modal 尺寸限制、横向溢出检测。

## 2. 设备与浏览器矩阵
| 平台 | 最低版本 | 状态 | 说明 |
|---|---:|---|---|
| iOS Safari | 12+ | 已纳入矩阵 | 建议真机回归 |
| Android Chrome | 8+ / 90+ | 已纳入矩阵 | 已用 Chromium 近似验证 |
| Chrome | 90+ | 已验证 | Cypress + Backstop |
| Safari | 12+ | 已纳入矩阵 | 建议 BrowserStack 真机验证 |
| Edge | 90+ | 已纳入矩阵 | Chromium 内核兼容 |
| IE | 11 | 不支持 | Next.js 16 不再支持 IE11 |

## 3. 自动化结果
- 构建检查：`npm run i18n:check && pnpm build` 通过。
- 回归用例：
  - `cypress/e2e/smoke.cy.ts` 通过；
  - `cypress/e2e/footer-responsive.cy.ts` 通过；
  - `cypress/e2e/overflow-guard.cy.ts` 通过。
- Cypress 总计：33/33 用例通过（含 320/768/1024/1440 四断点）。
- 视觉回归：BackstopJS 场景覆盖首页、登录页、提交页、短页、弹窗测试页，20/20 通过。

## 4. 问题清单与修复状态
| 问题 | 状态 | 修复说明 |
|---|---|---|
| 小屏下提示可能超宽 | 已修复 | Toast 宽高限制并支持内部滚动 |
| 弹窗内容过长超出视口 | 已修复 | 弹窗统一 `90vw / 85vh` 约束 |
| 横向溢出难以及时发现 | 已修复 | 新增 Cypress 溢出守卫用例 |
| 合并前缺少视觉对比阻断 | 已修复 | 新增 Backstop + CI workflow |

## 5. 附件
- 规范文档：`docs/ADAPTATION_SPEC.md`
- 视觉配置：`backstop.config.cjs`
- CI：`.github/workflows/ui-regression.yml`
- Backstop 报告：`backstop_data/html_report/index.html`
- Backstop CI XML：`backstop_data/ci_report/xunit.xml`
