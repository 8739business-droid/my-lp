"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addChild,
  addSibling,
  createEmptyMap,
  deleteNode,
  resolveNodeColor,
  updateNode,
} from "@/lib/mindmap";
import { downloadJSON, exportSvgAsPng, readJSONFile } from "@/lib/export";
import { THEMES, getTheme } from "@/lib/themes";
import type { MindMapData, MindNode, NodeId, ThemeId } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/types";
import IconPicker from "./IconPicker";
import TemplateGallery from "./TemplateGallery";
import PresentationMode from "./PresentationMode";

type Viewport = { x: number; y: number; scale: number };

const NODE_WIDTH = 160;
const NODE_HEIGHT_BASE = 46;
const IMAGE_HEIGHT = 80;
const IMAGE_PADDING = 8;

export default function MindMap() {
  const [data, setData] = useState<MindMapData>(() => createEmptyMap());
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [editingId, setEditingId] = useState<NodeId | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<
    { x: number; y: number } | null
  >(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(
    null,
  );
  const dragStart = useRef<{
    id: NodeId;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const theme = getTheme(data.themeId);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MindMapData;
        if (parsed && parsed.nodes && parsed.rootId) {
          setData(migrate(parsed));
          setSelectedId(parsed.rootId);
        }
      } else {
        setSelectedId((prev) => prev ?? Object.keys(data.nodes)[0]);
      }
    } catch (e) {
      console.warn("Failed to load mindmap", e);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on data change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed", e);
    }
  }, [data, hydrated]);

  // Center viewport on root once.
  useEffect(() => {
    if (!hydrated || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setViewport((v) => ({ ...v, x: rect.width / 2, y: rect.height / 2 }));
  }, [hydrated]);

  const nodes = useMemo(() => Object.values(data.nodes), [data]);

  const nodeHeight = useCallback(
    (n: MindNode) => (n.imageUrl ? NODE_HEIGHT_BASE + IMAGE_HEIGHT + IMAGE_PADDING : NODE_HEIGHT_BASE),
    [],
  );

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (presenting) return;
      if (!selectedId) return;
      if (e.key === "Tab") {
        e.preventDefault();
        const { data: next, newId } = addChild(data, selectedId);
        setData(next);
        setSelectedId(newId);
        setEditingId(newId);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const { data: next, newId } = addSibling(data, selectedId);
        setData(next);
        setSelectedId(newId);
        setEditingId(newId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId === data.rootId) return;
        e.preventDefault();
        const parent = data.nodes[selectedId]?.parentId ?? data.rootId;
        setData(deleteNode(data, selectedId));
        setSelectedId(parent);
      } else if (e.key === "F2") {
        e.preventDefault();
        setEditingId(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, selectedId, presenting]);

  const onBgMouseDown = (e: React.MouseEvent) => {
    if (e.target !== svgRef.current && (e.target as Element).tagName !== "rect") {
      return;
    }
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      vx: viewport.x,
      vy: viewport.y,
    };
    setSelectedId(null);
    setEditingId(null);
    setIconPickerPos(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart.current) {
      setViewport((v) => ({
        ...v,
        x: panStart.current!.vx + (e.clientX - panStart.current!.x),
        y: panStart.current!.vy + (e.clientY - panStart.current!.y),
      }));
    } else if (dragStart.current) {
      const d = dragStart.current;
      const dx = (e.clientX - d.startX) / viewport.scale;
      const dy = (e.clientY - d.startY) / viewport.scale;
      if (!d.moved && Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 3) {
        d.moved = true;
      }
      if (d.moved) {
        setData((prev) =>
          updateNode(prev, d.id, { x: d.nodeX + dx, y: d.nodeY + dy }),
        );
      }
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
    dragStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const nextScale = Math.max(0.2, Math.min(3, viewport.scale * (1 + delta)));
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - viewport.x) / viewport.scale;
    const wy = (my - viewport.y) / viewport.scale;
    setViewport({ x: mx - wx * nextScale, y: my - wy * nextScale, scale: nextScale });
  };

  const onNodeMouseDown = (e: React.MouseEvent, node: MindNode) => {
    e.stopPropagation();
    setSelectedId(node.id);
    setIconPickerPos(null);
    dragStart.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false,
    };
  };

  const onNodeDoubleClick = (node: MindNode) => {
    setSelectedId(node.id);
    setEditingId(node.id);
  };

  const onTextChange = (id: NodeId, text: string) => {
    setData((prev) => updateNode(prev, id, { text }));
  };

  const commitEdit = () => setEditingId(null);

  const newMap = (fromTemplate = false) => {
    if (fromTemplate) {
      setTemplateOpen(true);
      return;
    }
    if (!confirm("現在のマップを破棄して新規作成しますか?")) return;
    const empty = createEmptyMap();
    setData(empty);
    setSelectedId(empty.rootId);
  };

  const useTemplateData = (next: MindMapData) => {
    setData(next);
    setSelectedId(next.rootId);
    setTemplateOpen(false);
  };

  const exportJson = () => downloadJSON(data);

  const importJson = async (file: File) => {
    try {
      const next = await readJSONFile(file);
      setData(migrate(next));
      setSelectedId(next.rootId);
    } catch (err) {
      alert("読み込みに失敗しました: " + (err as Error).message);
    }
  };

  const exportPng = async () => {
    if (!svgRef.current) return;
    const inner = svgRef.current.querySelector("g.map-root") as SVGGElement | null;
    if (!inner) return;
    const tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tmp.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    tmp.appendChild(inner.cloneNode(true));
    document.body.appendChild(tmp);
    try {
      await exportSvgAsPng(tmp, data.title, theme.canvasBg);
    } finally {
      tmp.remove();
    }
  };

  const zoomIn = () =>
    setViewport((v) => ({ ...v, scale: Math.min(3, v.scale * 1.2) }));
  const zoomOut = () =>
    setViewport((v) => ({ ...v, scale: Math.max(0.2, v.scale / 1.2) }));
  const resetZoom = () => {
    const rect = svgRef.current!.getBoundingClientRect();
    setViewport({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
  };

  const changeTheme = (themeId: ThemeId) =>
    setData((prev) => ({ ...prev, themeId }));

  const openIconPicker = () => {
    if (!selectedId || !svgRef.current) return;
    const node = data.nodes[selectedId];
    if (!node) return;
    const sx = node.x * viewport.scale + viewport.x;
    const sy = node.y * viewport.scale + viewport.y;
    setIconPickerPos({ x: sx + 20, y: sy + 20 });
  };

  const setIcon = (icon: string | undefined) => {
    if (!selectedId) return;
    setData((prev) => updateNode(prev, selectedId, { icon }));
    setIconPickerPos(null);
  };

  const attachImage = () => imageInputRef.current?.click();

  const onImageSelected = (file: File) => {
    if (!selectedId) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("画像は2MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setData((prev) => updateNode(prev, selectedId, { imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (!selectedId) return;
    setData((prev) => updateNode(prev, selectedId, { imageUrl: undefined }));
  };

  const selectedNode = selectedId ? data.nodes[selectedId] : null;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none"
      style={{ background: theme.canvasBg }}
    >
      <Toolbar
        title={data.title}
        theme={theme.id}
        onThemeChange={changeTheme}
        onTitleChange={(t) => setData({ ...data, title: t })}
        onNewBlank={() => newMap(false)}
        onNewFromTemplate={() => newMap(true)}
        onExportJson={exportJson}
        onImport={() => jsonInputRef.current?.click()}
        onExportPng={exportPng}
        onPresent={() => setPresenting(true)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        scale={viewport.scale}
      />
      {selectedNode && (
        <ContextBar
          node={selectedNode}
          themeNodeText={theme.nodeText}
          onPickIcon={openIconPicker}
          onAttachImage={attachImage}
          onRemoveImage={removeImage}
        />
      )}
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importJson(file);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageSelected(file);
          e.target.value = "";
        }}
      />
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className={`w-full h-full ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={onBgMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <defs>
            <pattern
              id="grid"
              width={40 * viewport.scale}
              height={40 * viewport.scale}
              patternUnits="userSpaceOnUse"
              x={viewport.x}
              y={viewport.y}
            >
              <circle cx={1} cy={1} r={1} fill={theme.gridColor} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <g
            className="map-root"
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            {nodes.map((n) => {
              if (!n.parentId) return null;
              const parent = data.nodes[n.parentId];
              if (!parent) return null;
              const color =
                resolveNodeColor(data, n.id, theme.branchPalette) ?? theme.edge;
              return (
                <path
                  key={`edge-${n.id}`}
                  d={edgePath(parent, n)}
                  stroke={color}
                  strokeWidth={2.5}
                  fill="none"
                  opacity={0.75}
                />
              );
            })}

            {nodes.map((n) => {
              const isRoot = n.id === data.rootId;
              const isSelected = n.id === selectedId;
              const isEditing = n.id === editingId;
              const h = nodeHeight(n);
              const branchColor =
                resolveNodeColor(data, n.id, theme.branchPalette) ?? theme.edge;
              const fill = isRoot ? theme.rootBg : theme.nodeBg;
              const textColor = isRoot ? theme.rootText : theme.nodeText;
              const stroke = isSelected ? "#f59e0b" : isRoot ? theme.rootBg : branchColor;
              const strokeW = isSelected ? 3 : 2;

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x - NODE_WIDTH / 2} ${n.y - h / 2})`}
                  onMouseDown={(e) => onNodeMouseDown(e, n)}
                  onDoubleClick={() => onNodeDoubleClick(n)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={h}
                    rx={isRoot ? 22 : 10}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />
                  {n.imageUrl && (
                    <image
                      href={n.imageUrl}
                      x={IMAGE_PADDING}
                      y={IMAGE_PADDING}
                      width={NODE_WIDTH - IMAGE_PADDING * 2}
                      height={IMAGE_HEIGHT}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`inset(0 round 6px)`}
                    />
                  )}
                  {isEditing ? (
                    <foreignObject
                      x={6}
                      y={h - NODE_HEIGHT_BASE + 6}
                      width={NODE_WIDTH - 12}
                      height={NODE_HEIGHT_BASE - 12}
                    >
                      <input
                        autoFocus
                        value={n.text}
                        onChange={(e) => onTextChange(n.id, e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            e.preventDefault();
                            commitEdit();
                          }
                          e.stopPropagation();
                        }}
                        className="w-full h-full px-1 text-center bg-transparent outline-none text-sm"
                        style={{ color: textColor, font: "inherit" }}
                      />
                    </foreignObject>
                  ) : (
                    <>
                      {n.icon && (
                        <text
                          x={14}
                          y={h - NODE_HEIGHT_BASE / 2}
                          dominantBaseline="middle"
                          fontSize={18}
                        >
                          {n.icon}
                        </text>
                      )}
                      <text
                        x={n.icon ? 36 : NODE_WIDTH / 2}
                        y={h - NODE_HEIGHT_BASE / 2}
                        textAnchor={n.icon ? "start" : "middle"}
                        dominantBaseline="middle"
                        fontSize={14}
                        fill={textColor}
                      >
                        {truncate(n.text, n.icon ? 14 : 18)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {iconPickerPos && (
          <IconPicker
            anchorPos={iconPickerPos}
            value={selectedNode?.icon}
            onPick={setIcon}
            onClose={() => setIconPickerPos(null)}
          />
        )}

        <HelpPanel />
      </div>

      {templateOpen && (
        <TemplateGallery
          onPick={useTemplateData}
          onClose={() => setTemplateOpen(false)}
        />
      )}

      {presenting && (
        <PresentationMode data={data} onClose={() => setPresenting(false)} />
      )}
    </div>
  );
}

function edgePath(parent: MindNode, child: MindNode): string {
  const dx = child.x - parent.x;
  const midX = parent.x + dx / 2;
  return `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${child.y}, ${child.x} ${child.y}`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function migrate(d: MindMapData): MindMapData {
  if (!d.themeId) {
    return { ...d, version: 2, themeId: "default" };
  }
  return d;
}

function Toolbar({
  title,
  theme,
  onThemeChange,
  onTitleChange,
  onNewBlank,
  onNewFromTemplate,
  onExportJson,
  onImport,
  onExportPng,
  onPresent,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  scale,
}: {
  title: string;
  theme: ThemeId;
  onThemeChange: (t: ThemeId) => void;
  onTitleChange: (t: string) => void;
  onNewBlank: () => void;
  onNewFromTemplate: () => void;
  onExportJson: () => void;
  onImport: () => void;
  onExportPng: () => void;
  onPresent: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  scale: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      <div className="font-semibold text-gray-800 mr-2">🧠 MindMap</div>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="px-2 py-1 border border-gray-200 rounded text-sm w-64 focus:outline-none focus:border-blue-400"
      />
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <ToolbarButton onClick={onNewFromTemplate}>テンプレート</ToolbarButton>
      <ToolbarButton onClick={onNewBlank}>新規</ToolbarButton>
      <ToolbarButton onClick={onImport}>読み込み</ToolbarButton>
      <ToolbarButton onClick={onExportJson}>JSON</ToolbarButton>
      <ToolbarButton onClick={onExportPng}>PNG</ToolbarButton>
      <ToolbarButton onClick={onPresent}>▶ 発表</ToolbarButton>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <select
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as ThemeId)}
        className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
      >
        {Object.values(THEMES).map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div className="flex-1" />
      <ToolbarButton onClick={onZoomOut}>－</ToolbarButton>
      <button
        onClick={onZoomReset}
        className="text-xs text-gray-600 min-w-[48px] text-center"
      >
        {Math.round(scale * 100)}%
      </button>
      <ToolbarButton onClick={onZoomIn}>＋</ToolbarButton>
    </div>
  );
}

function ContextBar({
  node,
  themeNodeText,
  onPickIcon,
  onAttachImage,
  onRemoveImage,
}: {
  node: MindNode;
  themeNodeText: string;
  onPickIcon: () => void;
  onAttachImage: () => void;
  onRemoveImage: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs">
      <span className="text-amber-700 font-medium">
        選択: {node.icon ? node.icon + " " : ""}
        {truncate(node.text, 20)}
      </span>
      <div className="w-px h-4 bg-amber-200 mx-1" />
      <button
        onClick={onPickIcon}
        className="px-2 py-0.5 rounded hover:bg-amber-100 border border-amber-200 text-amber-800"
      >
        {node.icon ? "アイコン変更" : "+ アイコン"}
      </button>
      <button
        onClick={onAttachImage}
        className="px-2 py-0.5 rounded hover:bg-amber-100 border border-amber-200 text-amber-800"
      >
        {node.imageUrl ? "画像変更" : "+ 画像"}
      </button>
      {node.imageUrl && (
        <button
          onClick={onRemoveImage}
          className="px-2 py-0.5 rounded hover:bg-red-100 border border-red-200 text-red-700"
        >
          画像削除
        </button>
      )}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded"
    >
      {children}
    </button>
  );
}

function HelpPanel() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white border border-gray-200 shadow text-lg"
        aria-label="ヘルプを表示"
      >
        ?
      </button>
    );
  }
  return (
    <div className="absolute bottom-4 right-4 w-64 bg-white border border-gray-200 shadow rounded-lg p-3 text-xs text-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">キーボードショートカット</div>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-700"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
      <ul className="space-y-1">
        <li>
          <Kbd>Tab</Kbd> 子ノード追加
        </li>
        <li>
          <Kbd>Enter</Kbd> 兄弟ノード追加
        </li>
        <li>
          <Kbd>Del</Kbd> ノード削除
        </li>
        <li>
          <Kbd>F2</Kbd> / ダブルクリックで編集
        </li>
        <li>マウスドラッグ: 移動 / パン</li>
        <li>ホイール: ズーム</li>
      </ul>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono mr-1">
      {children}
    </span>
  );
}
