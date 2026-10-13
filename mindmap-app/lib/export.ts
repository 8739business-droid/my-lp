import type { MindMapData, NodeId } from "./types";
import { getChildren } from "./mindmap";

export function downloadJSON(data: MindMapData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title || "mindmap"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(data: MindMapData) {
  const lines: string[] = [`# ${data.title}`, ""];
  const walk = (id: NodeId, depth: number) => {
    const children = getChildren(data, id);
    for (const c of children) {
      const indent = "  ".repeat(depth);
      const icon = c.icon ? `${c.icon} ` : "";
      lines.push(`${indent}- ${icon}${c.text}`);
      walk(c.id, depth + 1);
    }
  };
  walk(data.rootId, 0);
  const blob = new Blob([lines.join("\n") + "\n"], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title || "mindmap"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadOPML(data: MindMapData) {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const walk = (id: NodeId, depth: number): string => {
    const children = getChildren(data, id);
    if (children.length === 0) return "";
    const pad = "  ".repeat(depth);
    return children
      .map((c) => {
        const sub = walk(c.id, depth + 1);
        const text = esc(`${c.icon ? c.icon + " " : ""}${c.text}`);
        if (!sub) return `${pad}<outline text="${text}"/>`;
        return `${pad}<outline text="${text}">\n${sub}\n${pad}</outline>`;
      })
      .join("\n");
  };
  const body = walk(data.rootId, 3);
  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${esc(data.title)}</title>
  </head>
  <body>
    <outline text="${esc(data.title)}">
${body}
    </outline>
  </body>
</opml>
`;
  const blob = new Blob([opml], { type: "text/x-opml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title || "mindmap"}.opml`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readJSONFile(file: File): Promise<MindMapData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed && typeof parsed === "object" && parsed.nodes && parsed.rootId) {
          resolve(parsed as MindMapData);
        } else {
          reject(new Error("Invalid mind map file"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function exportSvgAsPng(
  svg: SVGSVGElement,
  title: string,
  background = "#fafaf9",
) {
  const bbox = svg.getBBox();
  const padding = 40;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute(
    "viewBox",
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`,
  );
  clone.setAttribute("width", String(bbox.width + padding * 2));
  clone.setAttribute("height", String(bbox.height + padding * 2));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("x", String(bbox.x - padding));
  bgRect.setAttribute("y", String(bbox.y - padding));
  bgRect.setAttribute("width", String(bbox.width + padding * 2));
  bgRect.setAttribute("height", String(bbox.height + padding * 2));
  bgRect.setAttribute("fill", background);
  clone.insertBefore(bgRect, clone.firstChild);

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = (bbox.width + padding * 2) * scale;
  canvas.height = (bbox.height + padding * 2) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${title || "mindmap"}.png`;
    a.click();
    URL.revokeObjectURL(pngUrl);
  }, "image/png");
}
