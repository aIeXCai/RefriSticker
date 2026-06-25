import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
import { buildServerPrompt } from "./prompt-builder.js";

const ARK_MODEL_ID = "doubao-seedream-5-0-260128";
const ARK_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const AGNES_MODEL_ID = "agnes-image-2.1-flash";
const AGNES_ENDPOINT = "https://apihub.agnes-ai.com/v1/images/generations";
const MAX_PROMPT_CHARS = 2000;
const MAX_INPUT_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_OUTPUT_IMAGE_BYTES = 3 * 1024 * 1024;
const allowedSizes = new Set(["1728x2304", "2048x2048", "2304x1728"]);
const agnesSizes = new Map([
  ["1728x2304", "1024x1280"],
  ["2048x2048", "1024x1024"],
  ["2304x1728", "1024x768"],
]);
const allowedStyles = new Set(["illustration", "chinese", "comic"]);
const LANGUAGE_FOR_PROVIDER = { ark: "zh", agnes: "en" };
const imageMimePrefix = /^data:image\/(jpeg|png|webp|bmp|tiff|gif|heic|heif);base64,/i;

function imageBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return Infinity;
  const base64Length = dataUrl.length - comma - 1;
  return Math.floor(base64Length * 0.75);
}
function loadStyleReference(style) {
  const filename = `${style}.png`;
  const candidates = [
    resolve(process.cwd(), "public", "style-refs", filename),
    resolve(process.cwd(), "app", "public", "style-refs", filename),
    fileURLToPath(new URL(`../public/style-refs/${filename}`, import.meta.url)),
  ];

  let lastError;
  for (const path of candidates) {
    try {
      return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
    } catch (error) {
      lastError = error;
    }
  }

  throw Object.assign(new Error(`风格参考图 ${filename} 未打包到服务端函数，请检查 Vercel includeFiles 配置`), {
    cause: lastError,
    status: 500,
  });
}

async function fitOutputForVercel(base64, { skipCompression = false } = {}) {
  if (skipCompression) return base64;

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

async function imageUrlToBase64(url) {
  if (!url) throw Object.assign(new Error("Agnes 未返回生成图片"), { status: 502 });
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw Object.assign(new Error(`无法读取 Agnes 返回的图片 URL（${response.status}）`), { status: 502 });
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function fail(status, error) {
  return { status, body: { error } };
}

function sizeToFormat(size) {
  if (size === "1728x2304") return "portrait";
  if (size === "2048x2048") return "square";
  if (size === "2304x1728") return "landscape";
  throw new Error(`Unknown size ${size}`);
}

function resolveConfig(configOrApiKey = {}, options = {}) {
  if (typeof configOrApiKey === "string") {
    return {
      provider: "ark",
      arkApiKey: configOrApiKey,
      agnesApiKey: process.env.AGNES_API_KEY,
      ...options,
    };
  }

  return {
    provider: process.env.IMAGE_PROVIDER || "ark",
    arkApiKey: process.env.ARK_API_KEY,
    agnesApiKey: process.env.AGNES_API_KEY,
    ...configOrApiKey,
    ...options,
  };
}

async function callArk({ prompt, image, style, size, apiKey, styleReference, skipCompression }) {
  if (!apiKey) return fail(503, "尚未配置 ARK_API_KEY，请在部署环境中配置后重新部署");

  const upstream = await fetch(ARK_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ARK_MODEL_ID,
      prompt: prompt.trim(),
      image: [image, styleReference || loadStyleReference(style)],
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
      404: `模型 ${ARK_MODEL_ID} 不存在或已下线`,
      429: "请求过于频繁，请稍后再试",
      500: "火山引擎服务异常，请重试",
      504: "图片生成超时，请稍后重试",
      InsufficientBalance: "火山引擎账户余额不足，请前往方舟控制台充值",
    };
    return fail(upstream.ok ? 400 : upstream.status, knownErrors[code] || result?.error?.message || `火山引擎 Ark 返回 ${upstream.status}`);
  }

  const base64 = result?.data?.[0]?.b64_json;
  if (!base64) return fail(502, "火山引擎 Ark 未返回生成图片");
  const fitted = await fitOutputForVercel(base64, { skipCompression });
  return { status: 200, body: { image: `data:image/jpeg;base64,${fitted}`, provider: "ark", model: ARK_MODEL_ID } };
}

async function callAgnes({ prompt, image, size, apiKey, skipCompression }) {
  if (!apiKey) return fail(503, "尚未配置 AGNES_API_KEY，请在部署环境中配置后重新部署");

  const agnesSize = agnesSizes.get(size) || size;
  const upstream = await fetch(AGNES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AGNES_MODEL_ID,
      prompt: prompt.trim(),
      size: agnesSize,
      extra_body: {
        image: [image],
        response_format: "b64_json",
      },
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const result = await upstream.json().catch(() => null);

  if (!upstream.ok || result?.error) {
    const code = result?.error?.code || upstream.status;
    const knownErrors = {
      400: "Agnes 请求参数错误，请检查照片、提示词和图片尺寸",
      401: "AGNES_API_KEY 鉴权失败",
      403: "无权限访问 Agnes Image，请确认模型已开通",
      404: `模型 ${AGNES_MODEL_ID} 不存在或已下线`,
      429: "Agnes 请求过于频繁，请稍后再试",
      500: "Agnes 服务异常，请重试",
      504: "Agnes 图片生成超时，请重试",
    };
    const upstreamMessage = result?.error?.message || result?.message;
    const message = knownErrors[code] || upstreamMessage || `Agnes 返回 ${upstream.status}`;
    return fail(upstream.ok ? 400 : upstream.status, upstreamMessage && knownErrors[code] ? `${message}：${upstreamMessage}` : message);
  }

  const item = result?.data?.[0] || result?.images?.[0] || result?.output?.[0];
  const base64 = item?.b64_json || item?.base64 || item?.image_base64 || result?.b64_json;
  const url = item?.url || item?.image_url || result?.url;
  const fitted = await fitOutputForVercel(base64 || await imageUrlToBase64(url), { skipCompression });
  return { status: 200, body: { image: `data:image/jpeg;base64,${fitted}`, provider: "agnes", model: AGNES_MODEL_ID } };
}

export async function generateImage(body, configOrApiKey = {}, options = {}) {
  const config = resolveConfig(configOrApiKey, options);
  const provider = String(config.provider || "ark").trim().toLowerCase();
  const { image, style, size } = body || {};
  if (!allowedSizes.has(size)) return fail(400, `不支持的生成尺寸 ${size}`);
  if (!allowedStyles.has(style)) return fail(400, `不支持的风格 ${style}`);
  if (typeof image !== "string" || !imageMimePrefix.test(image)) return fail(400, "用户照片格式无效，请重新上传");
  if (imageBytes(image) > MAX_INPUT_IMAGE_BYTES) return fail(413, "处理后的照片仍然过大，请压缩后重试");

  const language = LANGUAGE_FOR_PROVIDER[provider] || "zh";
  const prompt = buildServerPrompt({ style, format: sizeToFormat(size), language });
  if (prompt.length > MAX_PROMPT_CHARS) return fail(500, `生成的提示词超过 ${MAX_PROMPT_CHARS} 字符限制（${prompt.length}）`);

  try {
    if (provider === "agnes") {
      return await callAgnes({ prompt, image, size, apiKey: config.agnesApiKey, skipCompression: config.skipCompression });
    }
    if (provider !== "ark") return fail(400, `不支持的图像模型提供方 ${provider}`);
    return await callArk({ prompt, image, style, size, apiKey: config.arkApiKey, styleReference: config.styleReference, skipCompression: config.skipCompression });
  } catch (error) {
    const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
    return fail(error.status || (timedOut ? 504 : 500), timedOut ? "图片生成超时，请稍后重试" : error.message || "图片生成失败");
  }
}
