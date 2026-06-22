import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const MAX_BODY_BYTES = 15 * 1024 * 1024;
const allowedSizes = new Set(["1024x1280", "1024x1024", "1152x864"]);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("上传图片过大，请使用 10MB 以内的 JPG 或 PNG"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function minimaxImageApi(apiKey) {
  const handler = async (req, res, next) => {
    if (req.url !== "/api/generate-image" || req.method !== "POST") return next();
    if (!apiKey) return sendJson(res, 503, { error: "尚未配置 MINIMAX_API_KEY，请在 app/.env.local 中配置后重启服务" });

    try {
      const { prompt, image, width, height } = await readJson(req);
      if (typeof prompt !== "string" || !prompt.trim()) return sendJson(res, 400, { error: "生成提示词不能为空" });
      if (prompt.length > 1500) return sendJson(res, 400, { error: `生成提示词超过 MiniMax 的 1500 字符限制（当前 ${prompt.length}）` });
      if (!allowedSizes.has(`${width}x${height}`)) return sendJson(res, 400, { error: "不支持的生成尺寸" });
      if (image && !/^data:image\/(jpeg|png);base64,/i.test(image)) return sendJson(res, 400, { error: "参考图必须是 10MB 以内的 JPG 或 PNG" });

      const payload = {
        model: "image-01",
        prompt: prompt.trim(),
        width,
        height,
        response_format: "base64",
        n: 1,
        prompt_optimizer: false,
        aigc_watermark: false,
        ...(image ? { subject_reference: [{ type: "character", image_file: image }] } : {}),
      };

      const upstream = await fetch("https://api.minimaxi.com/v1/image_generation", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120_000),
      });
      const result = await upstream.json().catch(() => null);
      const apiStatus = result?.base_resp?.status_code;
      if (!upstream.ok || apiStatus !== 0) {
        const knownErrors = {
          1002: "请求过于频繁，请稍后再试",
          1004: "MiniMax API Key 鉴权失败",
          1008: "MiniMax 账户余额不足",
          1026: "图片或描述未通过内容安全检查",
          2013: "MiniMax 请求参数不正确",
          2049: "MiniMax API Key 无效",
        };
        return sendJson(res, upstream.ok ? 400 : upstream.status, { error: knownErrors[apiStatus] || result?.base_resp?.status_msg || "MiniMax 图片生成失败" });
      }

      const base64 = result?.data?.image_base64?.[0];
      if (!base64) return sendJson(res, 502, { error: "MiniMax 未返回生成图片" });
      return sendJson(res, 200, { image: `data:image/jpeg;base64,${base64}`, requestId: result.id });
    } catch (error) {
      const status = error.status || (error.name === "TimeoutError" ? 504 : 500);
      return sendJson(res, status, { error: error.name === "TimeoutError" ? "图片生成超时，请重试" : error.message || "图片生成失败" });
    }
  };

  return {
    name: "minimax-image-api",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    optimizeDeps: { include: ["react", "react-dom/client"] },
    server: { warmup: { clientFiles: ["./src/main.jsx"] } },
    plugins: [react(), minimaxImageApi(env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY)],
  };
});
