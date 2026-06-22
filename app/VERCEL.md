# Vercel 部署

## 导入项目

- Git 仓库：`aIeXCai/RefriSticker`
- Root Directory：`app`
- Framework Preset：`Vite`
- Build Command：`npm run build`
- Output Directory：`dist`

## 环境变量

在 Vercel 项目的 Production、Preview 和 Development 环境中添加：

```text
ARK_API_KEY=<火山方舟 API Key>
```

不要添加 `VITE_` 前缀；该密钥只能由 `api/generate-image.js` 在服务端读取。

## 运行配置

`vercel.json` 已将函数部署到香港区域，并把生成接口超时设置为 300 秒。函数请求和响应均受 Vercel 4.5 MB 限制，因此浏览器会在请求前压缩参考照片，服务端会把 Seedream 输出转换成不超过 3 MB 的 JPEG。最终用户下载仍由浏览器 Canvas 导出 PNG。

## 验证

部署完成后依次确认：首页与静态素材正常、照片可上传和裁剪、三种风格均能生成、编辑器预览正常、下载 PNG 正常、浏览器源码中不存在 `ARK_API_KEY`。
