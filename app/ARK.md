# 火山引擎 Ark 接入

项目通过服务端 `/api/generate-image` 代理调用 Doubao Seedream 5.0 lite（`doubao-seedream-5-0-260128`），浏览器端不会接触 API Key。

## 本地配置

1. 复制 `app/.env.example` 为 `app/.env.local`。
2. 将 `ARK_API_KEY` 替换为火山引擎方舟的 API Key。
   - 获取地址：<https://console.volcengine.com/ark/region:ark+cn-beijing/apikey>
   - 确认账号已开通 Doubao Seedream 5.0 lite 模型。
3. 重启开发服务器。

## 调用范式：多图融合

请求体中 `image` 字段传**数组**（最多 14 张），按位置区分角色：

- **图 1**：用户上传的旅行照片（base64）— 提供主体识别度与场景结构
- **图 2**：风格参考图（base64）— 提供艺术语言

风格参考图存放在 `app/public/style-refs/`，由共享服务模块在请求时读取并注入。Vercel Function 与本地 Vite 中间件复用 `app/server/generate-image.js`。

## 当前生成尺寸

| 比例 | 用途 | 像素 |
|---|---|---|
| 4:5 竖版 | 移动端分享、冰箱贴实物 | 1728 × 2304 |
| 1:1 方形 | 头像贴纸、社交方图 | 2048 × 2048 |
| 4:3 横版 | 横版横幅、桌面壁纸 | 2304 × 1728 |

均为 2K 起步。Ark 输出 JPEG 后由服务端压缩到 3MB 内以满足 Vercel 限制；用户最终下载仍由 Canvas 导出 PNG。

## 关键请求参数

| 参数 | 值 | 说明 |
|---|---|---|
| `model` | `doubao-seedream-5-0-260128` | 火山引擎 Ark 模型 ID |
| `prompt` | ≤ 1500 字符 | 来自 `app/prompts/refri-sticker-v1.md` 拼装 |
| `image` | 2 张 Base64 数组 | 多图融合 |
| `size` | `1728x2304` 等 | 必须命中白名单 |
| `response_format` | `b64_json` | 避免 24 小时 URL 过期 |
| `output_format` | `jpeg` | 控制 Serverless 响应体积 |
| `watermark` | `false` | 关闭"AI 生成"水印，RefriSticker 自带品牌水印 |
| `sequential_image_generation` | `disabled` | 关闭组图，本次只生成一张 |

## 错误码映射

| HTTP / 业务码 | 含义 | 提示 |
|---|---|---|
| 400 | 请求参数错误 | 检查 prompt / 尺寸 / 图片格式 |
| 401 | API Key 鉴权失败 | 检查 `ARK_API_KEY` 是否正确 |
| 403 | 无权限 | 确认账号已开通 Seedream 5.0 lite |
| 404 | 模型不存在 | 确认模型 ID 仍有效 |
| 429 | 请求过频 | 请稍后再试 |
| 500 | 服务异常 | 请重试 |
| 504 | 超时（240s） | 请重试 |
| `InsufficientBalance` | 余额不足 | 前往方舟控制台充值 |

## 提示词模板

`app/prompts/refri-sticker-v2.md` 按章节组合：`base + style.<风格> + composition.<比例> + negative`。修改后 Vite 自动热更新，无需重启。

## Vercel

生产入口为 `app/api/generate-image.js`；部署参数和验证步骤见 `app/VERCEL.md`。
