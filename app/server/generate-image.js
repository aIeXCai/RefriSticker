import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MODEL_ID = "doubao-seedream-5-0-260128";
const ARK_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const MAX_PROMPT_CHARS = 1500;
const MAX_INPUT_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_OUTPUT_IMAGE_BYTES = 3 * 1024 * 1024;
const allowedSizes = new Set(["1728x2304", "2048x2048", "2304x1728"]);
const allowedStyles = new Set(["illustration", "chinese", "comic"]);
const imageMimePrefix = /^data:image\/(jpeg|png|webp|bmp|tiff|gif|heic|heif);base64,/i;
const styleReferencePaths = {
  illustration: fileURLToPath(new URL("../public/style-refs/illustration.png", import.meta.url)),
  chinese: fileURLToPath(new URL("../public/style-refs/chinese.png", import.meta.url)),
  comic: fileURLToPath(new URL("../public/style-refs/comic.png", import.meta.url)),
};

function imageBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return Infinity;
  const base64Length = dataUrl.length - comma - 1;
  return Math.floor(base64Length * 0.75);
}
function loadStyleReference(style) {
  return `data:image/png;base64,${readFileSync(styleReferencePaths[style]).toString("base64")}`;
}

async function fitOutputForVercel(base64) {
  const source = Buffer.from(base64, "base64");
  const attempts = [
    { quality: 88 },
    { quality: 80 },
    { quality: 76, maxEdge: 2048 },
  ];

  for (const attempt of attempts) {
    let pipeline = sharp(source).rotate();
    if (attempt.maxEdge) {
      pipeline = pipeline.resize({
        width: attempt.maxEdge,
        height: attempt.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const output = await pipeline.jpeg({ quality: attempt.quality, mozjpeg: true }).toBuffer();
    if (output.length <= MAX_OUTPUT_IMAGE_BYTES) return output.toString("base64");
  }

  throw Object.assign(new Error("生成图片体积过大，请重新生成"), { status: 502 });
}

function fail(status, error) {
  return { status, body: { error } };
}

export async function generateImage(body, apiKey = process.env.ARK_API_KEY) {
  if (!apiKey) return fail(503, "尚未配置 ARK_API_KEY，请在部署环境中配置后重新部署");

  const { prompt, image, style, size } = body || {};
  if (typeof prompt !== "string" || !prompt.trim()) return fail(400, "生成提示词不能为空");
  if (prompt.length > MAX_PROMPT_CHARS) return fail(400, `生成提示词超过 ${MAX_PROMPT_CHARS} 字符限制（当前 ${prompt.length}）`);
  if (!allowedSizes.has(size)) return fail(400, `不支持的生成尺寸 ${size}`);
  if (!allowedStyles.has(style)) return fail(400, `不支持的风格 ${style}`);
  if (typeof image !== "string" || !imageMimePrefix.test(image)) return fail(400, "用户照片格式无效，请重新上传");
  if (imageBytes(image) > MAX_INPUT_IMAGE_BYTES) return fail(413, "处理后的照片仍然过大，请压缩后重试");

  try {
    const upstream = await fetch(ARK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        prompt: prompt.trim(),
        image: [image, loadStyleReference(style)],
        size,
        response_format: "b64_json",
        output_format: "jpeg",
        watermark: false,
        sequential_image_generation: "disabled",
      }),
      signal: AbortSignal.timeout(240_000),
    });
    const result = await upstream.json().catch(() => null);

    if (!upstream.ok || result?.error) {
      const code = result?.error?.code || upstream.status;
      const knownErrors = {
        400: "请求参数错误，请检查照片、提示词和图片尺寸",
        401: "ARK_API_KEY 鉴权失败",
        403: "无权限访问 Seedream 5.0 lite，请确认模型已开通",
        404: `模型 ${MODEL_ID} 不存在或已下线`,
        429: "请求过于频繁，请稍后再试",
        500: "火山引擎服务异常，请重试",
        504: "图片生成超时，请稍后重试",
        InsufficientBalance: "火山引擎账户余额不足，请前往方舟控制台充值",
      };
      return fail(upstream.ok ? 400 : upstream.status, knownErrors[code] || result?.error?.message || `火山引擎 Ark 返回 ${upstream.status}`);
    }

    const base64 = result?.data?.[0]?.b64_json;
    if (!base64) return fail(502, "火山引擎 Ark 未返回生成图片");
    const fitted = await fitOutputForVercel(base64);
    return { status: 200, body: { image: `data:image/jpeg;base64,${fitted}` } };
  } catch (error) {
    const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
    return fail(error.status || (timedOut ? 504 : 500), timedOut ? "图片生成超时，请稍后重试" : error.message || "图片生成失败");
  }
}
