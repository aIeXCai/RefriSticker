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

function streamJson(work, status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("\n"));
      try {
        const body = await work();
        controller.enqueue(encoder.encode(JSON.stringify(body)));
      } catch (error) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: error.message || "图片生成失败" })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
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

  return streamJson(async () => {
    const result = await generateImage(await readJson(request), {
      provider: process.env.IMAGE_PROVIDER,
      arkApiKey: process.env.ARK_API_KEY,
      agnesApiKey: process.env.AGNES_API_KEY,
      skipCompression: true,
    });
    if (result.status >= 400) return result.body;
    return result.body;
  });
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
