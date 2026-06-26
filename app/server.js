import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.post("/api/generate-image", async (req, res) => {
  try {
    const { generateImage } = await import("./server/generate-image.js");
    const result = await generateImage(req.body, {
      provider: process.env.IMAGE_PROVIDER,
      arkApiKey: process.env.ARK_API_KEY,
      agnesApiKey: process.env.AGNES_API_KEY,
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message || "图片生成失败" });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RefriSticker running on port ${PORT}`));
