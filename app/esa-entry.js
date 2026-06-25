import { generateImage } from "./server/generate-image.js";

const MAX_BODY_BYTES = 4 * 1024 * 1024;

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw Object.assign(new Error("上传内容超过 4MB 限制"), { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    throw Object.assign(new Error("上传内容超过 4MB 限制"), { status: 413 });
  }
  return JSON.parse(body || "{}");
}

async function handleGenerateImage(request) {
  if (request.method !== "POST") {
    return json({ error: "仅支持 POST 请求" }, 405, { allow: "POST" });
  }

  try {
    const result = await generateImage(await readJson(request), {
      provider: process.env.IMAGE_PROVIDER,
      arkApiKey: process.env.ARK_API_KEY,
      agnesApiKey: process.env.AGNES_API_KEY,
    });
    return json(result.body, result.status);
  } catch (error) {
    return json({ error: error.message || "请求内容格式错误" }, error.status || 400);
  }
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/generate-image") {
      return handleGenerateImage(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
