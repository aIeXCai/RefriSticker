import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { generateImage } from "./server/generate-image.js";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

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
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("上传内容超过 4MB 限制"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function arkSeedream(apiKey) {
  const handler = async (req, res, next) => {
    if (req.url !== "/api/generate-image" || req.method !== "POST") return next();
    try {
      const result = await generateImage(await readJson(req), apiKey);
      return sendJson(res, result.status, result.body);
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.message || "图片生成失败" });
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
