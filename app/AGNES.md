# Agnes Image 2.1 Flash 接入

项目可以通过服务端 `/api/generate-image` 代理切换到 Agnes Image 2.1 Flash（`agnes-image-2.1-flash`），浏览器端不会接触 API Key。

## 本地配置

编辑 `app/.env.local`：

```env
IMAGE_PROVIDER=agnes
AGNES_API_KEY=<你的 Agnes API Key>
```

改完后重启开发服务器。

## 调用参数

当前接入使用 Agnes 的 OpenAI 风格图像生成接口：

| 参数 | 值 |
|---|---|
| Endpoint | `https://apihub.agnes-ai.com/v1/images/generations` |
| `model` | `agnes-image-2.1-flash` |
| `prompt` | 前端拼装后的完整冰箱贴提示词，服务端会移除 Ark 多图融合里的“图 1 / 图 2”歧义 |
| `size` | Ark 画幅会映射到 Agnes 1024 级输出尺寸 |
| `extra_body.image` | 仅用户照片的 Data URI Base64 数组 |
| `extra_body.response_format` | `b64_json` |

服务端会兼容 Agnes 返回 `b64_json` 或临时图片 URL 两种格式，并统一压缩成 3MB 内的 JPEG 返回前端。

## 切回 Ark

```env
IMAGE_PROVIDER=ark
ARK_API_KEY=<你的火山方舟 API Key>
```

不设置 `IMAGE_PROVIDER` 时默认使用 `ark`。
