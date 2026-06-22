import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 30 * 1024 * 1024;
const allowedSizes = new Set([
  "1728x2304", // 4:5 portrait (2K)
  "2048x2048", // 1:1 square  (2K)
  "2304x1728", // 4:3 landscape (2K)
]);
const imageMimePrefix = /^data:image\/(jpeg|png|webp|bmp|tiff|gif|heic|heif);base64,/i;
const allowedStyles = new Set(["illustration", "chinese", "comic"]);
const MAX_PROMPT_CHARS = 1500; // 火山引擎 Ark 实际限制为 1500 字符
const MODEL_ID = "doubao-seedream-5-0-260128";
const ARK_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

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
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("上传内容超过 30MB 限制"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function loadStyleReference(style) {
  const path = resolve(__dirname, "public", "style-refs", `${style}.png`);
  const buf = readFileSync(path);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function arkSeedream(apiKey) {
  const handler = async (req, res, next) => {
    if (req.url !== "/api/generate-image" || req.method !== "POST") return next();
    if (!apiKey) return sendJson(res, 503, { error: "尚未配置 ARK_API_KEY，请在 app/.env.local 中配置后重启服务" });

    try {
      const { prompt, image, style, size } = await readJson(req);

      if (typeof prompt !== "string" || !prompt.trim()) return sendJson(res, 400, { error: "生成提示词不能为空" });
      if (prompt.length > MAX_PROMPT_CHARS) return sendJson(res, 400, { error: `生成提示词超过 ${MAX_PROMPT_CHARS} 字符限制（当前 ${prompt.length}）` });
      if (!allowedSizes.has(size)) return sendJson(res, 400, { error: `不支持的生成尺寸 ${size}` });
      if (!allowedStyles.has(style)) return sendJson(res, 400, { error: `不支持的风格 ${style}` });
      if (typeof image !== "string" || !imageMimePrefix.test(image)) {
        const preview = typeof image === "string" ? image.slice(0, 100) : `(type: ${typeof image})`;
        console.error(`[ark-seedream] image field invalid. Received: ${preview}`);
        return sendJson(res, 400, {
          error: "用户照片必须是 jpeg/png/webp/bmp/tiff/gif/heic/heif 格式的 Base64",
          debug: { type: typeof image, length: typeof image === "string" ? image.length : 0, preview },
        });
      }

      const styleRef = loadStyleReference(style);

      const payload = {
        model: MODEL_ID,
        prompt: prompt.trim(),
        image: [image, styleRef], // 多图融合：图1 用户照片（保结构），图2 风格参考（提供艺术语言）
        size,
        response_format: "b64_json",
        watermark: false,
        sequential_image_generation: "disabled",
      };

      const upstream = await fetch(ARK_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(180_000),
      });
      const result = await upstream.json().catch(() => null);

      if (!upstream.ok || result?.error) {
        const errCode = result?.error?.code || upstream.status;
        const errMsg = result?.error?.message || `火山引擎 Ark 返回 ${upstream.status}`;
        const knownErrors = {
          400: "请求参数错误，请检查 prompt / 尺寸 / 图片格式",
          401: "ARK_API_KEY 鉴权失败",
          403: "无权限访问该模型，请确认账号已开通 Seedream 5.0 lite",
          404: `模型 ${MODEL_ID} 不存在或已下线`,
          429: "请求过于频繁，请稍后再试",
          500: "火山引擎服务异常，请重试",
          504: "图片生成超时（180s），Seedream 繁忙时段会慢，请稍后重试",
          InsufficientBalance: "火山引擎账户余额不足，请前往方舟控制台充值",
        };
        return sendJson(res, upstream.ok ? 400 : upstream.status, {
          error: knownErrors[errCode] || errMsg,
        });
      }

      const b64 = result?.data?.[0]?.b64_json;
      if (!b64) return sendJson(res, 502, { error: "火山引擎 Ark 未返回生成图片" });
      return sendJson(res, 200, { image: `data:image/png;base64,${b64}` });
    } catch (error) {
      const status = error.status || (error.name === "TimeoutError" ? 504 : 500);
      return sendJson(res, status, {
        error: error.name === "TimeoutError" ? "图片生成超时（180s），Seedream 繁忙时段会慢，请稍后重试" : error.message || "图片生成失败",
      });
    }
  };

  return {
    name: "ark-seedream",
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    optimizeDeps: { include: ["react", "react-dom/client"] },
    server: { warmup: { clientFiles: ["./src/main.jsx"] } },
    plugins: [react(), arkSeedream(env.ARK_API_KEY || process.env.ARK_API_KEY)],
  };
});
