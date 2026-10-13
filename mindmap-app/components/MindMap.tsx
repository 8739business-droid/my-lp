"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useYMindMap } from "@/hooks/useYMindMap";
import {
  downloadJSON,
  downloadMarkdown,
  downloadOPML,
  exportSvgAsPng,
  readJSONFile,
} from "@/lib/export";
import { resolveNodeColor } from "@/lib/mindmap";
import { THEMES, getTheme } from "@/lib/themes";
import { aiMapToMindMap, aiChildrenIntoExisting } from "@/lib/aiConvert";
import type { AIMindMap } from "@/lib/aiTypes";
import type {
  CollabUser,
  MindMapData,
  MindNode,
  NodeId,
  ThemeId,
} from "@/lib/types";
import IconPicker from "./IconPicker";
import TemplateGallery from "./TemplateGallery";
import PresentationMode from "./PresentationMode";
import ShareDialog from "./ShareDialog";
import CommentsPanel from "./CommentsPanel";
import AIDialog from "./AIDialog";

type Viewport = { x: number; y: number; scale: number };

const NODE_WIDTH = 160;
const NODE_HEIGHT_BASE = 46;
const IMAGE_HEIGHT = 80;
const IMAGE_PADDING = 8;

export default function MindMap() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("room"));
    setViewMode(params.get("mode") === "view" ? "view" : "edit");
    setUrlReady(true);
  }, []);

  if (!urlReady) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-gray-400">
        読み込み中…
      </div>
    );
  }

  return <MindMapInner roomId={roomId} viewMode={viewMode} />;
}

function MindMapInner({
  roomId,
  viewMode,
}: {
  roomId: string | null;
  viewMode: "edit" | "view";
}) {
  const { data, comments, status, canEdit, me, peers, actions } = useYMindMap({
    roomId,
    viewMode,
  });

  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [editingId, setEditingId] = useState<NodeId | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<
    { x: number; y: number } | null
  >(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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

  const theme = useMemo(() => getTheme(data?.themeId), [data?.themeId]);

  // Center viewport on root once data arrives.
  useEffect(() => {
    if (status !== "ready" || !svgRef.current || !data) return;
    const rect = svgRef.current.getBoundingClientRect();
    setViewport((v) => ({ ...v, x: rect.width / 2, y: rect.height / 2 }));
    setSelectedId((prev) => prev ?? data.rootId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Sync local selection to awareness.
  useEffect(() => {
    actions.setSelectedForAwareness(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
      if (presenting || !canEdit || !data) return;
      if (!selectedId) return;
      if (e.key === "Tab") {
        e.preventDefault();
        const newId = actions.createChild(selectedId);
        if (newId) {
          setSelectedId(newId);
          setEditingId(newId);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const newId = actions.createSibling(selectedId);
        if (newId) {
          setSelectedId(newId);
          setEditingId(newId);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId === data.rootId) return;
        e.preventDefault();
        const parent = data.nodes[selectedId]?.parentId ?? data.rootId;
        actions.removeNode(selectedId);
        setSelectedId(parent);
      } else if (e.key === "F2") {
        e.preventDefault();
        setEditingId(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, selectedId, presenting, canEdit, actions]);

  if (status === "loading" || !data) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-gray-400">
        同期中…
      </div>
    );
  }

  const nodes = Object.values(data.nodes);

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
    } else if (dragStart.current && canEdit) {
      const d = dragStart.current;
      const dx = (e.clientX - d.startX) / viewport.scale;
      const dy = (e.clientY - d.startY) / viewport.scale;
      if (!d.moved && Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 3) {
        d.moved = true;
      }
      if (d.moved) {
        actions.updateNode(d.id, { x: d.nodeX + dx, y: d.nodeY + dy });
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
    if (!canEdit) return;
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
    if (canEdit) setEditingId(node.id);
  };

  const onTextChange = (id: NodeId, text: string) =>
    actions.updateNode(id, { text });

  const commitEdit = () => setEditingId(null);

  const newMap = async (fromTemplate: boolean) => {
    if (fromTemplate) {
      setTemplateOpen(true);
      return;
    }
    if (!confirm("現在のマップを破棄して新規作成しますか?")) return;
    const { createEmptyMap } = await import("@/lib/mindmap");
    const empty = createEmptyMap();
    actions.replaceMap(empty);
    setSelectedId(empty.rootId);
  };

  const useTemplateData = (next: MindMapData) => {
    actions.replaceMap(next);
    setSelectedId(next.rootId);
    setTemplateOpen(false);
  };

  const exportJson = () => {
    downloadJSON(data);
    setExportMenuOpen(false);
  };

  const exportMarkdown = () => {
    downloadMarkdown(data);
    setExportMenuOpen(false);
  };

  const exportOpml = () => {
    downloadOPML(data);
    setExportMenuOpen(false);
  };

  const importJson = async (file: File) => {
    try {
      const next = await readJSONFile(file);
      actions.replaceMap(next);
      setSelectedId(next.rootId);
    } catch (err) {
      alert("読み込みに失敗しました: " + (err as Error).message);
    }
  };

  const exportPng = async () => {
    setExportMenuOpen(false);
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

  const applyAINew = (ai: AIMindMap) => {
    const next = aiMapToMindMap(ai, data.themeId);
    actions.replaceMap(next);
    setSelectedId(next.rootId);
    setAiOpen(false);
  };

  const applyAIExpand = (ai: AIMindMap) => {
    if (!selectedId) return;
    const next = aiChildrenIntoExisting(data, selectedId, ai);
    actions.replaceMap(next);
    setAiOpen(false);
  };

  const getNodeContext = (id: NodeId | null): string[] => {
    if (!id) return [];
    const trail: string[] = [];
    let cur: MindNode | undefined = data.nodes[id];
    while (cur) {
      trail.unshift(cur.text);
      cur = cur.parentId ? data.nodes[cur.parentId] : undefined;
    }
    return trail.slice(0, -1);
  };

  const zoomIn = () =>
    setViewport((v) => ({ ...v, scale: Math.min(3, v.scale * 1.2) }));
  const zoomOut = () =>
    setViewport((v) => ({ ...v, scale: Math.max(0.2, v.scale / 1.2) }));
  const resetZoom = () => {
    const rect = svgRef.current!.getBoundingClientRect();
    setViewport({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
  };

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
    actions.updateNode(selectedId, { icon });
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
      actions.updateNode(selectedId, { imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (!selectedId) return;
    actions.updateNode(selectedId, { imageUrl: undefined });
  };

  const jumpToNode = (id: NodeId) => {
    if (!svgRef.current) return;
    const node = data.nodes[id];
    if (!node) return;
    setSelectedId(id);
    const rect = svgRef.current.getBoundingClientRect();
    setViewport({
      x: rect.width / 2 - node.x * viewport.scale,
      y: rect.height / 2 - node.y * viewport.scale,
      scale: viewport.scale,
    });
  };

  // Count comments per node for the badge.
  const commentCountByNode = new Map<NodeId, number>();
  comments.forEach((c) => {
    if (c.resolved) return;
    commentCountByNode.set(c.nodeId, (commentCountByNode.get(c.nodeId) ?? 0) + 1);
  });

  const selectedNode = selectedId ? data.nodes[selectedId] : null;

  return (
    <div
      className="w-screen h-screen flex flex-col select-none"
      style={{ background: theme.canvasBg }}
    >
      <Toolbar
        title={data.title}
        theme={theme.id}
        peers={peers}
        me={me}
        canEdit={canEdit}
        roomId={roomId}
        onThemeChange={(t) => actions.setTheme(t)}
        onTitleChange={(t) => actions.setTitle(t)}
        onNewBlank={() => newMap(false)}
        onNewFromTemplate={() => newMap(true)}
        onExportJson={exportJson}
        onExportMarkdown={exportMarkdown}
        onExportOpml={exportOpml}
        onImport={() => jsonInputRef.current?.click()}
        onExportPng={exportPng}
        onPresent={() => setPresenting(true)}
        onShare={() => setShareOpen(true)}
        onAI={() => setAiOpen(true)}
        onToggleComments={() => setCommentsOpen((v) => !v)}
        exportMenuOpen={exportMenuOpen}
        onToggleExportMenu={() => setExportMenuOpen((v) => !v)}
        commentsCount={comments.filter((c) => !c.resolved).length}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        scale={viewport.scale}
      />
      {selectedNode && canEdit && (
        <ContextBar
          node={selectedNode}
          onPickIcon={openIconPicker}
          onAttachImage={attachImage}
          onRemoveImage={removeImage}
        />
      )}
      {!canEdit && (
        <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 text-center">
          👁 閲覧モード - 編集は無効化されています
        </div>
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
              const peerSelecting = peers.find((p) => p.selectedId === n.id);
              const stroke = isSelected
                ? "#f59e0b"
                : peerSelecting
                  ? peerSelecting.color
                  : isRoot
                    ? theme.rootBg
                    : branchColor;
              const strokeW = isSelected || peerSelecting ? 3 : 2;
              const nComments = commentCountByNode.get(n.id) ?? 0;

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x - NODE_WIDTH / 2} ${n.y - h / 2})`}
                  onMouseDown={(e) => onNodeMouseDown(e, n)}
                  onDoubleClick={() => onNodeDoubleClick(n)}
                  style={{ cursor: canEdit ? "pointer" : "default" }}
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
                  {peerSelecting && (
                    <g>
                      <rect
                        x={NODE_WIDTH - 6}
                        y={-10}
                        width={peerSelecting.name.length * 7 + 14}
                        height={18}
                        rx={9}
                        fill={peerSelecting.color}
                      />
                      <text
                        x={NODE_WIDTH + 1}
                        y={-1}
                        fontSize={10}
                        fill="#ffffff"
                        fontWeight={500}
                      >
                        {peerSelecting.name}
                      </text>
                    </g>
                  )}
                  {nComments > 0 && (
                    <g>
                      <circle cx={NODE_WIDTH - 10} cy={h - 10} r={9} fill="#f59e0b" />
                      <text
                        x={NODE_WIDTH - 10}
                        y={h - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={10}
                        fill="#ffffff"
                        fontWeight={600}
                      >
                        {nComments}
                      </text>
                    </g>
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

        {commentsOpen && (
          <CommentsPanel
            comments={comments}
            nodeId={selectedId}
            data={data}
            canEdit={canEdit}
            onAdd={actions.addComment}
            onRemove={actions.removeComment}
            onResolve={actions.resolveComment}
            onJumpToNode={jumpToNode}
            onClose={() => setCommentsOpen(false)}
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

      {shareOpen && (
        <ShareDialog
          currentRoomId={roomId}
          me={me}
          onUpdateMe={actions.updateMe}
          onClose={() => setShareOpen(false)}
        />
      )}

      {aiOpen && (
        <AIDialog
          defaultMode={selectedId && selectedId !== data.rootId ? "expand" : "new"}
          selectedNodeText={selectedNode?.text}
          selectedNodeContext={getNodeContext(selectedId)}
          onClose={() => setAiOpen(false)}
          onApplyNew={applyAINew}
          onApplyExpand={applyAIExpand}
        />
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

function Toolbar({
  title,
  theme,
  peers,
  me,
  canEdit,
  roomId,
  onThemeChange,
  onTitleChange,
  onNewBlank,
  onNewFromTemplate,
  onExportJson,
  onExportMarkdown,
  onExportOpml,
  onImport,
  onExportPng,
  onPresent,
  onShare,
  onAI,
  onToggleComments,
  exportMenuOpen,
  onToggleExportMenu,
  commentsCount,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  scale,
}: {
  title: string;
  theme: ThemeId;
  peers: CollabUser[];
  me: CollabUser;
  canEdit: boolean;
  roomId: string | null;
  onThemeChange: (t: ThemeId) => void;
  onTitleChange: (t: string) => void;
  onNewBlank: () => void;
  onNewFromTemplate: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onExportOpml: () => void;
  onImport: () => void;
  onExportPng: () => void;
  onPresent: () => void;
  onShare: () => void;
  onAI: () => void;
  onToggleComments: () => void;
  exportMenuOpen: boolean;
  onToggleExportMenu: () => void;
  commentsCount: number;
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
        disabled={!canEdit}
        className="px-2 py-1 border border-gray-200 rounded text-sm w-64 focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
      />
      <div className="w-px h-6 bg-gray-200 mx-1" />
      {canEdit && (
        <>
          <ToolbarButton onClick={onNewFromTemplate}>テンプレート</ToolbarButton>
          <ToolbarButton onClick={onNewBlank}>新規</ToolbarButton>
          <ToolbarButton onClick={onImport}>読み込み</ToolbarButton>
          <ToolbarButton onClick={onAI}>🤖 AI</ToolbarButton>
        </>
      )}
      <div className="relative">
        <ToolbarButton onClick={onToggleExportMenu}>エクスポート ▾</ToolbarButton>
        {exportMenuOpen && (
          <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-30">
            <ExportItem onClick={onExportJson} label="JSON" hint="再読込可" />
            <ExportItem onClick={onExportPng} label="PNG画像" hint="2x高解像度" />
            <ExportItem onClick={onExportMarkdown} label="Markdown" hint=".md 箇条書き" />
            <ExportItem onClick={onExportOpml} label="OPML" hint="他ツール互換" />
          </div>
        )}
      </div>
      <ToolbarButton onClick={onPresent}>▶ 発表</ToolbarButton>
      <ToolbarButton onClick={onShare}>
        {roomId ? "🔗 共有中" : "共有"}
      </ToolbarButton>
      <ToolbarButton onClick={onToggleComments}>
        💬 {commentsCount > 0 ? commentsCount : ""}
      </ToolbarButton>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <select
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as ThemeId)}
        disabled={!canEdit}
        className="text-sm border border-gray-200 rounded px-2 py-1 bg-white disabled:bg-gray-50 disabled:text-gray-400"
      >
        {Object.values(THEMES).map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <div className="flex-1" />
      {roomId && (
        <div className="flex items-center gap-1 mr-2">
          <PeerBadge user={me} isMe />
          {peers.map((p) => (
            <PeerBadge key={p.id} user={p} />
          ))}
        </div>
      )}
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

function PeerBadge({ user, isMe }: { user: CollabUser; isMe?: boolean }) {
  const initial = user.name.charAt(0).toUpperCase() || "?";
  return (
    <div
      title={isMe ? `${user.name} (あなた)` : user.name}
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2"
      style={{
        background: user.color,
        boxShadow: isMe ? "0 0 0 1px white, 0 0 0 2px #3b82f6" : undefined,
      }}
    >
      {initial}
    </div>
  );
}

function ContextBar({
  node,
  onPickIcon,
  onAttachImage,
  onRemoveImage,
}: {
  node: MindNode;
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

function ExportItem({
  onClick,
  label,
  hint,
}: {
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
    >
      <div className="text-gray-800">{label}</div>
      <div className="text-[10px] text-gray-500">{hint}</div>
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
