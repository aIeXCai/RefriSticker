# RefriSticker HANDOFF

## 1. 定位
RefriSticker 是面向旅行、摄影及文创爱好者的 Web 应用，把用户照片生成可编辑、可下载的个性化冰箱贴设计。
当前为无登录、无付费、无作品库的网页端 MVP（`docs/RefriSticker-PRD-v0.2.md`）。

## 2. 技术栈
| 层 | 选型 | 理由 |
|---|---|---|
| 前端 | React 19、Vite 6、React Icons | 单页创建和编辑流程（`app/package.json:6`） |
| 图像 | 火山引擎 Ark Doubao Seedream 5.0 lite、Sharp、Canvas | 服务端融合并压缩 AI 底图，浏览器合成并下载成品（`app/server/generate-image.js`、`app/src/App.jsx`） |

## 3. 结构速览
```text
refristicker/
├── app/              # React 网站、生成代理、提示词和设计素材
│   ├── public/style-refs/  # 风格参考图（多图融合用）
│   ├── prompts/           # 版本化提示词模板
│   ├── src/               # 应用代码
│   ├── api/ + server/     # Vercel 入口与共享生成服务
│   ├── AGENTS.md
│   ├── ARK.md             # 火山引擎 Ark 接入文档
│   └── vercel.json        # Vercel 运行配置
├── docs/             # PRD 与本交接文档
└── reference_images/ # 视觉参考与素材
```

## 4. 数据模型
当前没有数据库、账号或持久化实体。
照片、版型、风格、模板、文案、图层和生成结果均保存在 React 页面状态中（`app/src/App.jsx`）。

## 5. 关键决策
- 提示词放在独立 Markdown 中并按风格、版型组合，便于直接调试（`app/src/prompt-builder.js:1`）。
- 火山引擎 Ark 经 `/api/generate-image` 服务端代理调用，Vercel 与本地开发复用同一逻辑（`app/server/generate-image.js`）。
- 采用多图融合：图 1 是压缩后的用户照片，图 2 是内置风格参考图；服务端将结果压到 3MB 内（`app/server/generate-image.js`）。
- AI 负责生成插画底图，文案由前端图层排版并通过 Canvas 导出，保证文字可编辑（`app/src/App.jsx`）。
- 用户作品只用常规轮廓；异形轮廓仅用于首页静态效果图（`app/AGENTS.md:11`）。
- 三种固定模板的预览和下载遵循同一套版式规则（`app/AGENTS.md:9`）。

## 6. 启动 & 验证
在 `app/` 中运行 `npm run dev`；生产构建运行 `npm run build`（`app/package.json:6`）。
调用生成前需在 `app/.env.local` 配置 `ARK_API_KEY` 并重启服务（`app/ARK.md:5`）。
跑通标志：首页正常显示；可上传照片、选择比例/风格/模板、调用火山引擎生成、编辑文字并下载图片。

## 7. 陷阱清单
- 不要把 ARK_API_KEY 放进前端代码或加 `VITE_` 前缀，因为浏览器会暴露密钥（`app/api/generate-image.js`）。
- 不要修改 `.env.local` 后沿用旧服务，因为环境变量只在服务启动时加载（`app/vite.config.mjs`）。
- 不要把异形轮廓用于用户生成、编辑或下载结果，因为它仅属于首页静态展示（`app/AGENTS.md:11`）。
- 不要忘记修改 `.env.example` 时同步更新本交接文档中的陷阱清单。
- 不要直接在 `main` 上提交未经确认的素材，因为仓库已关联 `origin`（`https://github.com/aIeXCai/RefriSticker.git`），且本地 `main` 当前跟踪 `origin/main`。

## 用户备注(skill 永不自动覆盖)
<!-- handoff:manual-zone -->
<!-- /handoff:manual-zone -->
