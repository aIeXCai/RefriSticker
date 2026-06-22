# MiniMax 图片生成接入

项目通过服务端 `/api/generate-image` 代理调用 `image-01`，浏览器端不会接触 API Key。

## 本地配置

1. 复制 `.env.example` 为 `.env.local`。
2. 将 `MINIMAX_API_KEY` 替换为 MiniMax 开放平台密钥。
3. 重启开发服务器。

## 当前请求规则

- 竖版：1024 × 1280（4:5）
- 方形：1024 × 1024（1:1）
- 横版：1152 × 864（4:3）
- 返回格式：Base64
- 水印：关闭
- Prompt 自动优化：关闭，确保使用 `prompts/refri-sticker-v1.md` 中的组合提示词
- 上传照片会先按用户选择的裁剪、缩放和旋转生成 JPG，再作为 `character` 主体参考提交

MiniMax 当前只正式支持 `character` 类型的主体参考，单人正面照片效果最稳定；普通旅行风景照可以提交，但场景结构保持能力不在官方承诺范围内。
