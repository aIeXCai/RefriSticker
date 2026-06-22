import { generateImage } from "../server/generate-image.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "仅支持 POST 请求" });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const result = await generateImage(body);
    return response.status(result.status).json(result.body);
  } catch (error) {
    return response.status(400).json({ error: error.message || "请求内容格式错误" });
  }
}
