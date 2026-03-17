# Admin / Judge URL 清单

## Admin

| 路径 | 页面名称 | 文件 | 主要功能 | 权限 |
|---|---|---|---|---|
| `/{locale}/admin` | Admin Index | `src/app/[locale]/admin/page.tsx` | 入口跳转到管理控制台 | Admin |
| `/{locale}/admin/dashboard` | 管理控制台 | `src/app/[locale]/admin/dashboard/page.tsx` | 查看赛事状态、提交数、评委数、快捷入口 | Admin |
| `/{locale}/admin/projects` | 项目列表 | `src/app/[locale]/admin/projects/page.tsx` | 查看提交项目列表与基础信息 | Admin |
| `/{locale}/admin/competition` | 赛事配置 | `src/app/[locale]/admin/competition/page.tsx` | 赛事配置页面占位（可扩展编辑） | Admin |
| `/{locale}/admin/judges` | 评委管理 | `src/app/[locale]/admin/judges/page.tsx` | 评委管理页面占位 | Admin |
| `/{locale}/admin/rounds` | 轮次管理 | `src/app/[locale]/admin/rounds/page.tsx` | 轮次与分配页面占位 | Admin |

## Judge

| 路径 | 页面名称 | 文件 | 主要功能 | 权限 |
|---|---|---|---|---|
| `/{locale}/judge` | Judge Index | `src/app/[locale]/judge/page.tsx` | 入口跳转到评审控制台 | Judge |
| `/{locale}/judge/dashboard` | 评审控制台 | `src/app/[locale]/judge/dashboard/page.tsx` | 查看待评分配、历史任务、进入评分 | Judge |
| `/{locale}/judge/scoring/{id}` | 评分任务页 | `src/app/[locale]/judge/scoring/[id]/page.tsx` | 指定任务评分页面占位 | Judge |
