# Romance Journey（恋爱日志）

一个面向情侣的轻量级 Web 记录工具，支持双人登录、邀请码配对、数据云端同步与多种恋爱场景记录。项目为纯前端静态站点，使用 Supabase 作为后端服务。

## 主要功能

- 首页恋爱天数与照片墙
- 约会记录（支持单日 / 时间段）
- 节点提醒（公历 / 农历）
- 愿望瓶（短期 / 长期纸条）
- 恋爱条约（支持子条约与拖拽排序）
- 备忘清单、旅行足迹、系列合集
- 底部导航自定义布局
- 数据导入 / 导出
- 双人共享、实时同步、邀请码配对

## 技术栈

- HTML + CSS + 原生 JavaScript
- Supabase Auth / Database / Realtime / Storage

## 项目结构

- index.html 入口与 UI 容器
- css/style.css 样式与主题
- js/app.js 应用主逻辑与渲染
- js/auth.js 登录 / 注册 / 配对
- js/store.js Supabase 持久化与同步
- js/lunar.js 农历换算
- js/config.js Supabase 配置
- Dockerfile Nginx 静态部署

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

项目包含 Nginx 镜像构建文件：

```bash
docker build -t romance-journey .
docker run --rm -p 8080:80 romance-journey
```

浏览器访问 http://localhost:8080

## 开发建议

- 交互逻辑集中在 [js/app.js](js/app.js)
- 登录 / 配对逻辑在 [js/auth.js](js/auth.js)
- 数据存储与同步在 [js/store.js](js/store.js)
- 农历相关计算在 [js/lunar.js](js/lunar.js)

## 注意事项

- 这是纯静态项目，适合部署在 GitHub Pages、Netlify、Vercel 等平台
- 浏览器缓存可能影响更新，必要时请强制刷新

## 许可证

MIT License
