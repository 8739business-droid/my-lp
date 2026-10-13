"use client";

import { useEffect, useMemo, useState } from "react";
import type { MindMapData, MindNode, NodeId } from "@/lib/types";
import { getChildren } from "@/lib/mindmap";
import { getTheme } from "@/lib/themes";

export default function PresentationMode({
  data,
  onClose,
}: {
  data: MindMapData;
  onClose: () => void;
}) {
  const theme = getTheme(data.themeId);
  const order = useMemo(() => buildOrder(data), [data]);
  const [index, setIndex] = useState(0);
  const nodeId = order[index];
  const node = nodeId ? data.nodes[nodeId] : null;
  const children = node ? getChildren(data, node.id) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(order.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Home") {
        setIndex(0);
      } else if (e.key === "End") {
        setIndex(order.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order.length, onClose]);

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: theme.canvasBg }}
    >
      <div
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: theme.nodeBorder }}
      >
        <div className="text-sm" style={{ color: theme.nodeText }}>
          <span className="font-semibold">{data.title}</span>
          <span className="opacity-60 ml-3">
            {index + 1} / {order.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="px-3 py-1 text-sm border rounded disabled:opacity-30"
            style={{ borderColor: theme.nodeBorder, color: theme.nodeText }}
          >
            ←
          </button>
          <button
            onClick={() =>
              setIndex((i) => Math.min(order.length - 1, i + 1))
            }
            disabled={index === order.length - 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-30"
            style={{ borderColor: theme.nodeBorder, color: theme.nodeText }}
          >
            →
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded"
            style={{ background: theme.rootBg, color: theme.rootText }}
          >
            終了 (Esc)
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10 overflow-auto">
        <Breadcrumb data={data} nodeId={node.id} textColor={theme.nodeText} />
        <div className="w-full max-w-4xl">
          {node.imageUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={node.imageUrl}
                alt=""
                className="max-h-64 rounded-lg shadow"
              />
            </div>
          )}
          <h1
            className="text-5xl font-bold mb-6 text-center"
            style={{ color: theme.nodeText }}
          >
            {node.icon ? <span className="mr-3">{node.icon}</span> : null}
            {node.text}
          </h1>
          {children.length > 0 && (
            <ul className="space-y-3 mt-10">
              {children.map((c) => (
                <li
                  key={c.id}
                  className="text-xl pl-6 border-l-4"
                  style={{
                    color: theme.nodeText,
                    borderColor: c.color ?? theme.edge,
                  }}
                >
                  {c.icon ? <span className="mr-2">{c.icon}</span> : null}
                  {c.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${theme.rootBg} ${
            ((index + 1) / order.length) * 100
          }%, ${theme.nodeBorder} ${((index + 1) / order.length) * 100}%)`,
        }}
      />
    </div>
  );
}

function Breadcrumb({
  data,
  nodeId,
  textColor,
}: {
  data: MindMapData;
  nodeId: NodeId;
  textColor: string;
}) {
  const trail: MindNode[] = [];
  let current: MindNode | undefined = data.nodes[nodeId];
  while (current) {
    trail.unshift(current);
    current = current.parentId ? data.nodes[current.parentId] : undefined;
  }
  if (trail.length <= 1) return null;
  return (
    <div
      className="text-sm opacity-60 mb-6 text-center"
      style={{ color: textColor }}
    >
      {trail.slice(0, -1).map((n, i) => (
        <span key={n.id}>
          {n.text}
          {i < trail.length - 2 && <span className="mx-2">›</span>}
        </span>
      ))}
    </div>
  );
}

function buildOrder(data: MindMapData): NodeId[] {
  const out: NodeId[] = [];
  const walk = (id: NodeId) => {
    out.push(id);
    for (const c of getChildren(data, id)) walk(c.id);
  };
  walk(data.rootId);
  return out;
}
