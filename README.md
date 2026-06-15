# Romance Journey（恋爱日志）

一个面向情侣的轻量级 Web 记录工具，支持双人登录、邀请码配对、云端同步和多种恋爱场景记录。项目是纯前端静态站点，数据持久化和实时同步由 Supabase 提供。

## 主要功能

- 首页展示恋爱天数、近期节点和照片墙
- 约会记录，支持单日和时间段
- 节点提醒，支持公历和农历
- 愿望瓶，支持短期 / 长期和完成状态
- 恋爱条约，支持子条约和拖拽排序
- 备忘清单、旅行足迹、自定义系列合集
- 情书、提问箱、建议箱、自省独白
- 底部导航可自定义布局和排序
- 数据导入 / 导出，支持叠加合并和整体覆盖
- 清除所有数据，带二次确认文本
- 双人共享、实时同步、邀请码配对与变更提醒
- PWA 配置，支持添加到桌面

## 模块说明

| 模块 key | 名称 | 说明 |
|----------|------|------|
| home | 首页 | 恋爱天数、照片墙、近期节点 |
| dates | 约会 | 约会记录，支持单日和时间段 |
| milestones | 节点 | 纪念日提醒，支持农历 |
| plans | 愿望 | 愿望瓶纸条，区分短期 / 长期 |
| treaty | 条约 | 恋爱条约，支持子条约和拖拽排序 |
| memo | 备忘 | 记录喜好、密码、重要事项 |
| travel | 旅行足迹 | 旅行打卡记录 |
| series | 系列 | 自定义合集，例如电影、美食 |
| heartwords | 情书 | 写给对方的心里话，需署名 |
| questions | 提问箱 | 向对方提问，需署名 |
| suggestions | 建议箱 | 给对方的相处建议，支持已读和回应 |
| reflections | 自省 | 只关于自己的独白，支持“已看到”标记 |
| photos | 照片墙 | 首页照片展示 |

## 技术栈

- HTML + CSS + 原生 JavaScript（ES6+）
- Supabase Auth / Database / Realtime / Storage

## 项目结构

```
index.html           入口和 UI 容器
css/style.css        样式与主题
js/app.js            应用主逻辑与页面渲染
js/auth.js           登录、注册、配对、退出
js/store.js          Supabase 持久化、同步、图片上传、变更检测
js/lunar.js          农历公历换算
js/config.js         Supabase 连接配置
manifest.json        PWA 清单
icons/favicon.svg    站点图标
icons/apple-touch-icon.png  iOS 图标
icons/icon-192.png   PWA 图标
icons/icon-512.png   PWA 图标
icons/icon-1024.png  PWA 图标
nginx.conf           Nginx 静态站点配置
Dockerfile           Nginx 静态部署
```

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

## 许可证

MIT License
