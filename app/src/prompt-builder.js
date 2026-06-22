import promptMarkdown from "../prompts/refri-sticker-v2.md?raw";

export const promptVersion = "v2";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSection(name) {
  const heading = escapeRegExp(name);
  const match = promptMarkdown.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  if (!match) throw new Error(`Prompt section not found: ${name}`);
  return match[1]
    .trim()
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function buildPrompt({ style, format }) {
  return [
    getSection("base"),
    getSection(`style.${style}`),
    getSection(`composition.${format}`),
    getSection("negative"),
  ].join("\n\n");
}

export function getPromptSource() {
  return promptMarkdown;
}
