/* eslint-disable @typescript-eslint/no-explicit-any */
let marked: any;

export async function renderMarkdownToHtml(markdown: string) {
  if (!marked) {
    marked = await import(
      // TODO: npm install and sanitize
      // @ts-expect-error - remote
      "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js"
    );
  }
  try {
    return marked.parse(markdown);
  } catch (error) {
    console.error("Error parsing markdown:", error);
    return markdown;
  }
}
