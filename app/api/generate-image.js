import { generateImage } from "../server/generate-image.js";

const allowedOrigins = new Set([
  "https://refristicker.aec8a11e.er.aliyun-esa.net",
  "https://refri-sticker.vercel.app",
]);

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(request, response) {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "仅支持 POST 请求" });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const result = await generateImage(body, {
      provider: process.env.IMAGE_PROVIDER,
      arkApiKey: process.env.ARK_API_KEY,
      agnesApiKey: process.env.AGNES_API_KEY,
    });
    return response.status(result.status).json(result.body);
  } catch (error) {
    return response.status(400).json({ error: error.message || "请求内容格式错误" });
  }
}
