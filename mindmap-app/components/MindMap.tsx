"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addChild,
  addSibling,
  createEmptyMap,
  deleteNode,
  moveNode,
  updateNode,
} from "@/lib/mindmap";
import { downloadJSON, exportSvgAsPng, readJSONFile } from "@/lib/export";
import type { MindMapData, MindNode, NodeId } from "@/lib/types";
import { STORAGE_KEY } from "@/lib/types";

type Viewport = { x: number; y: number; scale: number };

const NODE_WIDTH = 140;
const NODE_HEIGHT = 44;

export default function MindMap() {
  const [data, setData] = useState<MindMapData>(() => createEmptyMap());
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [editingId, setEditingId] = useState<NodeId | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MindMapData;
        if (parsed && parsed.nodes && parsed.rootId) {
          setData(parsed);
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

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
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
  }, [data, selectedId]);

  // Pan handlers.
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
      setData((prev) =>
        updateNode(prev, d.id, { x: d.nodeX + dx, y: d.nodeY + dy }),
      );
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
    dragStart.current = null;
  };

  // Wheel zoom.
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

  // Node interactions.
  const onNodeMouseDown = (e: React.MouseEvent, node: MindNode) => {
    e.stopPropagation();
    setSelectedId(node.id);
    dragStart.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
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

  // Actions.
  const newMap = () => {
    if (!confirm("現在のマップを破棄して新規作成しますか?")) return;
    const empty = createEmptyMap();
    setData(empty);
    setSelectedId(empty.rootId);
  };

  const exportJson = () => downloadJSON(data);

  const importJson = async (file: File) => {
    try {
      const next = await readJSONFile(file);
      setData(next);
      setSelectedId(next.rootId);
    } catch (err) {
      alert("読み込みに失敗しました: " + (err as Error).message);
    }
  };

  const exportPng = async () => {
    if (!svgRef.current) return;
    const inner = svgRef.current.querySelector("g.map-root") as SVGGElement | null;
    if (!inner) return;
    // Build a temp svg with just the inner content (no viewport transform).
    const tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    tmp.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    tmp.appendChild(inner.cloneNode(true));
    document.body.appendChild(tmp);
    try {
      await exportSvgAsPng(tmp, data.title);
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

  return (
    <div className="w-screen h-screen flex flex-col bg-canvas select-none">
      <Toolbar
        title={data.title}
        onTitleChange={(t) => setData({ ...data, title: t })}
        onNew={newMap}
        onExportJson={exportJson}
        onImport={() => fileInputRef.current?.click()}
        onExportPng={exportPng}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        scale={viewport.scale}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importJson(file);
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
              <circle cx={1} cy={1} r={1} fill="#e5e7eb" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <g
            className="map-root"
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            {/* Edges */}
            {nodes.map((n) => {
              if (!n.parentId) return null;
              const parent = data.nodes[n.parentId];
              if (!parent) return null;
              return (
                <path
                  key={`edge-${n.id}`}
                  d={edgePath(parent, n)}
                  stroke={n.color ?? "#9ca3af"}
                  strokeWidth={2}
                  fill="none"
                  opacity={0.6}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const isRoot = n.id === data.rootId;
              const isSelected = n.id === selectedId;
              const isEditing = n.id === editingId;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x - NODE_WIDTH / 2} ${n.y - NODE_HEIGHT / 2})`}
                  onMouseDown={(e) => onNodeMouseDown(e, n)}
                  onDoubleClick={() => onNodeDoubleClick(n)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={isRoot ? 22 : 10}
                    fill={isRoot ? "#1f2937" : "#ffffff"}
                    stroke={
                      isSelected
                        ? "#f59e0b"
                        : isRoot
                          ? "#1f2937"
                          : n.color ?? "#3b82f6"
                    }
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  {isEditing ? (
                    <foreignObject
                      x={6}
                      y={6}
                      width={NODE_WIDTH - 12}
                      height={NODE_HEIGHT - 12}
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
                        style={{
                          color: isRoot ? "#ffffff" : "#111827",
                          font: "inherit",
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={NODE_WIDTH / 2}
                      y={NODE_HEIGHT / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={14}
                      fill={isRoot ? "#ffffff" : "#111827"}
                    >
                      {truncate(n.text, 18)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <HelpPanel />
      </div>
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

function Toolbar({
  title,
  onTitleChange,
  onNew,
  onExportJson,
  onImport,
  onExportPng,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  scale,
}: {
  title: string;
  onTitleChange: (t: string) => void;
  onNew: () => void;
  onExportJson: () => void;
  onImport: () => void;
  onExportPng: () => void;
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
      <ToolbarButton onClick={onNew}>新規</ToolbarButton>
      <ToolbarButton onClick={onImport}>読み込み</ToolbarButton>
      <ToolbarButton onClick={onExportJson}>JSONで保存</ToolbarButton>
      <ToolbarButton onClick={onExportPng}>PNG出力</ToolbarButton>
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
