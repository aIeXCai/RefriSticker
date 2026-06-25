import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = resolve(__dirname, "..", "prompts");

const CACHE = new Map();

function loadMarkdown(name) {
  if (CACHE.has(name)) return CACHE.get(name);
  const path = resolve(PROMPTS_DIR, name);
  const text = readFileSync(path, "utf8");
  CACHE.set(name, text);
  return text;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSection(markdown, name) {
  const heading = escapeRegExp(name);
  const match = markdown.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  if (!match) throw new Error(`Prompt section not found: ${name}`);
  return match[1]
    .trim()
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

const LANGUAGE_FILES = {
  zh: "refri-sticker-v2.md",
  en: "refri-sticker-v2-en.md",
};

export function buildServerPrompt({ style, format, language = "zh" }) {
  const filename = LANGUAGE_FILES[language];
  if (!filename) throw new Error(`不支持的 prompt 语言 ${language}`);
  const markdown = loadMarkdown(filename);
  return [
    getSection(markdown, "base"),
    getSection(markdown, `style.${style}`),
    getSection(markdown, `composition.${format}`),
    getSection(markdown, "negative"),
  ].join("\n\n");
}
