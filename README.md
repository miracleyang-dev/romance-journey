# Romance Journey（恋爱日志）

一个面向情侣的轻量级 Web 记录工具，支持双人登录、邀请码配对、数据云端同步与多种恋爱场景记录。项目为纯前端静态站点，使用 Supabase 作为后端服务。

## 主要功能

- 首页恋爱天数与照片墙
- 约会记录（支持单日 / 时间段）
- 节点提醒（公历 / 农历）
- 愿望瓶（短期 / 长期纸条）
- 恋爱条约（支持子条约与拖拽排序）
- 情书（写给对方的心里话，须署名，未设称呼时引导前往设置）
- 提问箱（向对方提问并等待真实回答，须署名，未设称呼时引导前往设置）
- 备忘清单、旅行足迹、系列合集
- 底部导航自定义布局
- 数据导入 / 导出（支持叠加合并与整体覆盖）
- 双人共享、实时同步、邀请码配对
- 变更提醒（仅提示对方的修改，不提示自己的操作；历史数据无编辑者标记时自动跳过检测）
- PWA 配置（支持添加到桌面）

## 技术栈

- HTML + CSS + 原生 JavaScript（ES6+）
- Supabase Auth / Database / Realtime / Storage

## 项目结构

```
index.html          入口与 UI 容器
css/style.css       样式与主题
js/app.js           应用主逻辑与渲染（模块注册、路由、CRUD、各板块渲染）
js/auth.js          登录 / 注册 / 配对
js/store.js         Supabase 持久化、实时同步、变更检测
js/lunar.js         农历公历换算
js/config.js        Supabase 连接配置
manifest.json       PWA 清单
Dockerfile          Nginx 静态部署
```

## 数据模块

| 模块 key | 名称 | 说明 |
|----------|------|------|
| couple | 恋爱信息 | 关系确定日、双方称呼 |
| dates | 约会 | 约会记录，支持单日和时间段 |
| milestones | 节点 | 周期性纪念日提醒，支持农历 |
| plans | 愿望 | 愿望瓶纸条，标记短期/长期、完成状态 |
| treaties | 条约 | 恋爱条约，支持子条约与拖拽排序 |
| memos | 备忘 | 自由文本备忘 |
| travels | 旅行足迹 | 旅行打卡记录 |
| series | 系列 | 自定义合集（电影、美食等） |
| heartwords | 情书 | 写给对方的心里话，须选择称呼署名 |
| questions | 提问箱 | 向对方提问，须选择称呼署名 |
| photos | 照片墙 | 首页照片展示 |

## 本地运行

方式 1：直接打开
- 用浏览器打开 index.html

方式 2：本地静态服务器
- 任意静态服务器均可（如 VS Code Live Server）

## Supabase 配置

在 [js/config.js](js/config.js) 中替换以下配置为你的 Supabase 项目信息：

- `window.__SUPABASE_URL__`
- `window.__SUPABASE_ANON_KEY__`

运行本项目需要以下 Supabase 资源：

- 表 `couples`（字段至少包含 `id`, `data`, `invite_code`, `updated_at`）
- 表 `couple_members`（字段至少包含 `couple_id`, `user_id`）
- RPC 函数 `lookup_couple_by_invite`（通过邀请码查询 `couple_id`）
- Storage bucket `photos`（用于上传照片墙图片）

## Docker 部署

```bash
docker build -t romance-journey .
docker run --rm -p 8080:80 romance-journey
```

浏览器访问 http://localhost:8080

## 许可证

MIT License
