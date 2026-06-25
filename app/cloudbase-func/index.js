const { generateImage } = require("./generate-image");

exports.main = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "仅支持 POST 请求" }) };
  }

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const result = await generateImage(body, {
      provider: process.env.IMAGE_PROVIDER,
      arkApiKey: process.env.ARK_API_KEY,
      agnesApiKey: process.env.AGNES_API_KEY,
      skipCompression: true,
    });
    return {
      statusCode: result.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.body),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "图片生成失败" }),
    };
  }
};
