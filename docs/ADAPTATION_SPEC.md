# 界面适配规范（弹窗/提示/响应式）

## 1. 响应式基线
- 断点：`320`、`768`、`1024`、`1440`。
- 关键页面默认要求无横向溢出：`documentElement.scrollWidth <= clientWidth + 1`。
- 正文字号：移动端最小 `14px`，桌面端最小 `16px`。
- 固定 Footer 预留：主内容底部必须预留 `--app-footer-occupied-height + safe-area`。
- 滚动锚点补偿：`scroll-padding-top/bottom` 必须覆盖 sticky header 与 fixed footer。

## 2. 弹窗规范
- 弹窗容器必须使用 `app-overlay-panel`：
  - 最大宽度：`90vw`；
  - 最大高度：`85vh`；
  - 内容溢出：内部滚动 `overflow: auto`。
- 极小屏（`<=320px`）：
  - 宽度 `94vw`；
  - 高度上限 `82vh`。

## 3. 提示规范（Toast / Tooltip）
- Toast 容器宽度限制：`min(90vw, 420px)`。
- Toast 高度限制：`85vh`，超出内部滚动。
- Tooltip 使用 `app-tooltip`，最大宽度 `min(90vw, 280px)`，文本可折行。

## 4. 交互可访问性
- 点击目标最小尺寸 `44x44px`。
- 所有交互元素具备 `focus-visible` 边框环。
- 对象定位必须保证在可视区域内展示，禁止被裁切在视口外。
- 页面滚动时，按钮、输入框、导航、Footer 链接均需保持可见可点。

## 5. 新增组件强制约束
- 新增弹窗、抽屉、Popover、Tooltip 必须复用本规范尺寸策略。
- 提示组件必须在 Cypress 用例中覆盖 `320/768/1024/1440` 四断点。
- 合并前必须通过：
  - `npm run test:overflow`
  - `npm run visual:test`
