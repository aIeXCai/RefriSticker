# RefriSticker HANDOFF

## 1. 定位
RefriSticker 是面向旅行、摄影及文创爱好者的 Web 应用，把用户照片生成可编辑、可下载的个性化冰箱贴设计。
当前为无登录、无付费、无作品库的网页端 MVP（`docs/RefriSticker-PRD-v0.2.md`）。

## 2. 技术栈
| 层 | 选型 | 理由 |
|---|---|---|
| 前端 | React 19、Vite 6、React Icons | 单页创建和编辑流程（`app/package.json:6`） |
| 图像 | MiniMax `image-01`、Canvas | AI 生成底图，浏览器合成并下载成品（`app/vite.config.mjs:36`、`app/src/App.jsx:442`） |

## 3. 结构速览
```text
refristicker/
├── app/              # React 网站、生成代理、提示词和设计素材
├── docs/             # PRD 与本交接文档
└── reference_images/ # 产品和视觉参考图
```

## 4. 数据模型
当前没有数据库、账号或持久化实体。
照片、版型、风格、模板、文案、图层和生成结果均保存在 React 页面状态中（`app/src/App.jsx:506`）。

## 5. 关键决策
- 提示词放在独立 Markdown 中并按风格、版型组合，便于直接调试（`app/src/prompt-builder.js:1`）。
- MiniMax 经 `/api/generate-image` 服务端代理调用，避免 API Key 暴露给浏览器（`app/vite.config.mjs:24`）。
- AI 负责生成插画底图，文案由前端图层排版并通过 Canvas 导出，保证文字可编辑（`app/src/App.jsx:442`）。
- 用户作品只用常规轮廓；异形轮廓仅用于首页静态效果图（`app/AGENTS.md:11`）。
- 三种固定模板的预览和下载遵循同一套版式规则（`app/AGENTS.md:9`）。

## 6. 启动 & 验证
在 `app/` 中运行 `npm run dev`；生产构建运行 `npm run build`（`app/package.json:6`）。
调用生成前需在 `app/.env.local` 配置 `MINIMAX_API_KEY` 并重启服务（`app/MINIMAX.md:5`）。
跑通标志：首页正常显示；可上传照片、选择比例/风格/模板、调用 MiniMax 生成、编辑文字并下载图片。

## 7. 陷阱清单
- 不要把 MiniMax Key 放进前端代码，因为浏览器请求会暴露密钥（`app/vite.config.mjs:48`）。
- 不要修改 `.env.local` 后沿用旧服务，因为环境变量只在服务启动时加载（`app/vite.config.mjs:84`）。
- 不要假设风景参考图能严格保持结构，因为 MiniMax 仅正式支持 `character` 主体参考（`app/MINIMAX.md:21`）。
- 不要把异形轮廓用于用户生成、编辑或下载结果，因为它仅属于首页静态展示（`app/AGENTS.md:11`）。
- 不要把当前目录当作已有 Git 仓库，因为扫描时未发现 Git 元数据。

## 用户备注(skill 永不自动覆盖)
<!-- handoff:manual-zone -->
<!-- /handoff:manual-zone -->
