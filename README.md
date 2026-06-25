# Romance Journey（恋爱日志）

一个面向情侣的轻量级 Web 记录工具，支持双人登录、邀请码配对、云端同步和多种恋爱场景记录。项目是纯前端静态站点，数据持久化和实时同步由 Supabase 提供。

## 主要功能

- 首页展示恋爱天数、近期节点和照片墙
- 约会记录，支持单日和时间段
- 节点提醒，支持公历和农历
- 愿望瓶，支持短期 / 长期和完成状态
- 恋爱条约，支持子条约和拖拽排序
- 备忘清单、旅行足迹（中国大城市地图打卡）、自定义系列合集
- 情书、提问箱、建议箱、自省独白
- 底部导航可自定义布局和排序
- 数据导入 / 导出，支持叠加合并和整体覆盖
- 清除所有数据，带二次确认文本
- 双人共享、实时同步、邀请码配对与「条目级」变更提醒（精确到哪条记录被增 / 改 / 删）
- PWA 配置 + Service Worker 离线缓存，支持添加到桌面

## 模块说明

| 模块 key | 名称 | 说明 |
|----------|------|------|
| home | 首页 | 恋爱天数、照片墙、近期节点 |
| dates | 约会 | 约会记录，支持单日和时间段 |
| milestones | 节点 | 纪念日提醒，支持农历 |
| plans | 愿望 | 愿望瓶纸条，区分短期 / 长期 |
| treaty | 条约 | 恋爱条约，支持子条约和拖拽排序 |
| memo | 备忘 | 记录喜好、密码、重要事项 |
| travel | 旅行足迹 | 中国大城市地图打卡，标记「已去」/「计划」并悬停查看备注 |
| series | 系列 | 自定义合集，例如电影、美食 |
| heartwords | 情书 | 写给对方的心里话，需署名 |
| questions | 提问箱 | 向对方提问，需署名 |
| suggestions | 建议箱 | 给对方的相处建议，支持已读和回应 |
| reflections | 自省独白 | 一支羽毛笔，写给自己的话；允许沉默，也允许被 TA 看见，支持「已看到」回应 |
| photos | 照片墙 | 首页照片展示 |

## 技术栈

- HTML + CSS + 原生 JavaScript（ES6+）
- Supabase Auth / Database / Realtime / Storage
- ECharts 5（旅行足迹模块的中国地图可视化，CDN 引入）
- 中国地图 GeoJSON：运行时从 DataV.GeoAtlas（`geo.datav.aliyun.com`）拉取 `100000_full.json`

## 项目结构

```
index.html           入口和 UI 容器
css/style.css        样式与主题
js/app.js            应用主逻辑与页面渲染
js/auth.js           登录、注册、配对、退出
js/store.js          Supabase 持久化、同步、图片上传、变更检测
js/lunar.js          农历公历换算
js/config.js         Supabase 连接配置
js/sw.js             Service Worker：版本化缓存 + 离线降级 + 旧缓存清理（注册时 scope:'/'）
manifest.json        PWA 清单（含 any / maskable 双图标）
icons/favicon.svg            站点 SVG 矢量图标
icons/apple-touch-icon.png   iOS 主屏图标（180×180）
icons/icon-192.png           PWA 图标（any，192×192）
icons/icon-512.png           PWA 图标（any，512×512）
icons/icon-192-maskable.png  PWA Maskable 图标（含安全区，192×192）
icons/icon-512-maskable.png  PWA Maskable 图标（含安全区，512×512）
icons/icon-1024.png          源图（用于派生其它尺寸）
nginx.conf           Nginx 静态站点配置
Dockerfile           Nginx 静态部署
```

## 缓存与版本机制

为了避免「旧 Service Worker / 旧静态资源覆盖新版」，本项目使用 **发版日期** 作为版本号：

- `index.html` 中所有 `?v=YYYYMMDD` 查询字符串；
- `js/sw.js` 顶部的 `APP_VERSION = 'YYYYMMDD'`，决定 `CACHE_NAME`；
- `manifest.json` 中的 `version` 字段。

三处保持一致即可。同一天多次发版可以追加 `-HHMM`（例如 `20260616-1830`）。

Service Worker 行为：

- **install**：预缓存应用外壳（HTML / CSS / JS / 图标）。
- **activate**：删除所有 `romance-journey-` 前缀但版本号不匹配的旧缓存。
- **fetch**：
  - HTML / manifest 走 **network-first**，离线时降级到缓存；
  - 同源静态资源走 **stale-while-revalidate**，并剥离 `?v=` 命中干净 URL 缓存；
  - Supabase 等跨域请求直通网络。
- 页面端在监听到新 SW 接管（`controllerchange`）时会自动 reload 一次，确保用户拿到最新代码。

## PWA 桌面图标

`manifest.json` 同时声明三类图标：

| 类型 | 用途 |
|------|------|
| `image/svg+xml`（favicon.svg）| 浏览器标签页 / 高分屏自适应 |
| `image/png` `purpose=any` | 普通 Launcher / 旧版浏览器 |
| `image/png` `purpose=maskable` | Android 自适应图标，已经预留 ~20% 安全区，避免被裁切成「方块/碎片」 |

并在 `<head>` 中显式声明 `apple-touch-icon`（180×180）与多尺寸 `<link rel="icon">`，保证桌面安装在 Chrome / Edge / Safari / 安卓自适应图标场景下都能命中正确资源。

## 本地运行

方式 1：直接打开
- 在浏览器中打开 index.html

方式 2：本地静态服务器
- 任意静态服务器均可，例如 VS Code Live Server

登录页只记住邮箱，不保存密码；Supabase 已登录会话会自动恢复。

## Supabase 配置

在 [js/config.js](js/config.js) 中替换为你自己的 Supabase 信息：

- `window.__SUPABASE_URL__`
- `window.__SUPABASE_ANON_KEY__`

运行本项目需要以下 Supabase 资源：

- 表 `couples`，字段至少包含 `id`、`data`、`invite_code`、`updated_at`
- 表 `couple_members`，字段至少包含 `couple_id`、`user_id`
- RPC 函数 `lookup_couple_by_invite`，用于按邀请码查询 `couple_id`
- Storage bucket `photos`，用于上传照片墙图片
- 启用 `couples` 表的 Realtime / Replication

### 设置页功能

设置页提供以下操作：

- 编辑恋爱信息（关系确定日、双方称呼）
- 查看邀请码
- 调整底部导航布局
- 导出数据
- 导入数据
- 清除所有数据
- 退出登录

## 安全策略（RLS）

本项目是纯前端应用，所有数据库操作都通过 Supabase anon key 在客户端执行，因此必须正确配置 Row Level Security（行级安全）。

两张表都需要开启 RLS：

```sql
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
```

### couples 表策略

| 策略名 | 操作 | 规则 |
|--------|------|------|
| members_select_own_couple | SELECT | 仅成员可查看自己的空间 |
| members_update_own_couple | UPDATE | 仅成员可修改自己的空间 |
| authenticated_insert_couple | INSERT | 已登录用户可创建空间 |

### couple_members 表策略

| 策略名 | 操作 | 规则 |
|--------|------|------|
| users_select_own_membership | SELECT | 用户只能查看自己的成员记录 |
| users_insert_own_membership | INSERT | 用户只能以自己的身份加入 |

> 所有策略的目标角色应为 `authenticated`，不要使用 `public`。

### 函数权限

`lookup_couple_by_invite` 使用 SECURITY DEFINER 模式绕过 RLS 查询邀请码，建议收紧调用权限：

```sql
REVOKE EXECUTE ON FUNCTION public.lookup_couple_by_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_couple_by_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_couple_by_invite(text) TO authenticated;
```

### Storage 策略（photos 桶）

| 策略名 | 操作 | 规则 |
|--------|------|------|
| Authenticated users can upload photos | INSERT | 已登录用户可上传 |

当前实现通过 `getPublicUrl` 展示图片；如果使用公开桶，读取无需额外策略。若要改成私有访问，需要切换为 Signed URL 并补充对应读取策略。

## Docker 部署

```bash
docker build -t romance-journey .
docker run --rm -p 8080:80 romance-journey
```

浏览器访问 http://localhost:8080

## 本次迭代亮点（v20260620）

- **旅行足迹模块重做**：从列表打卡升级为可视化中国地图。底图通过 ECharts 渲染，城市标记区分「已去」（实心红点）与「计划」（空心蓝圈），悬停展示日期与备注。
- **城市数据**：内置约 60 个中国大城市坐标；存量 `travels` 记录通过子串匹配自动落到对应城市，并默认补齐 `status: 'visited'`，无需手动迁移。
- **变更提醒升级**：从「模块名」升级到「条目级」。任意一处字段改动都会触发，并在弹窗内分组展示「新增 / 修改 / 删除」与对应条目摘要，包括系列下的子记录。
- **添加按钮统一上移**：备忘、系列、系列详情的「添加」按钮已上移到页面顶部，与约会等模块对齐。
- **愿望瓶细节优化**：移除「已实现的心愿」区块右侧的完成数徽标，标题更克制。
- **文案统一**：所有空状态副文案统一为「文艺克制」风格；所有输入框 placeholder 统一为「平实明了」风格。
- **依赖与版本**：新增 ECharts 5 CDN；缓存版本号同步升级至 `20260620`。

## 许可证

MIT License
