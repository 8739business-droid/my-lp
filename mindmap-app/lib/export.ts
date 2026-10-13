import type { MindMapData } from "./types";

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
