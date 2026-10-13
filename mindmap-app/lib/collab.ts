import * as Y from "yjs";
import type { MindMapData, MindNode, NodeId, Comment } from "./types";

export function createYDoc(): Y.Doc {
  return new Y.Doc();
}

export function docToData(ydoc: Y.Doc): MindMapData | null {
  const meta = ydoc.getMap<unknown>("meta");
  const yNodes = ydoc.getMap<Y.Map<unknown>>("nodes");
  const rootId = meta.get("rootId") as NodeId | undefined;
  if (!rootId) return null;
  const nodes: Record<NodeId, MindNode> = {};
  yNodes.forEach((yNode, id) => {
    const obj = yNode.toJSON() as Partial<MindNode>;
    nodes[id] = {
      id,
      text: String(obj.text ?? ""),
      x: Number(obj.x ?? 0),
      y: Number(obj.y ?? 0),
      parentId: (obj.parentId as NodeId | null) ?? null,
      color: obj.color as string | undefined,
      icon: obj.icon as string | undefined,
      imageUrl: obj.imageUrl as string | undefined,
    };
  });
  return {
    version: 2,
    title: String(meta.get("title") ?? "マインドマップ"),
    themeId: (meta.get("themeId") as MindMapData["themeId"]) ?? "default",
    rootId,
    nodes,
  };
}

export function hydrateDoc(ydoc: Y.Doc, data: MindMapData) {
  ydoc.transact(() => {
    const meta = ydoc.getMap<unknown>("meta");
    meta.set("title", data.title);
    meta.set("themeId", data.themeId ?? "default");
    meta.set("rootId", data.rootId);
    const yNodes = ydoc.getMap<Y.Map<unknown>>("nodes");
    yNodes.clear();
    for (const node of Object.values(data.nodes)) {
      yNodes.set(node.id, nodeToYMap(node));
    }
  });
}

export function isDocEmpty(ydoc: Y.Doc): boolean {
  return ydoc.getMap("nodes").size === 0;
}

export function nodeToYMap(node: MindNode): Y.Map<unknown> {
  const y = new Y.Map<unknown>();
  y.set("text", node.text);
  y.set("x", node.x);
  y.set("y", node.y);
  y.set("parentId", node.parentId);
  if (node.color !== undefined) y.set("color", node.color);
  if (node.icon !== undefined) y.set("icon", node.icon);
  if (node.imageUrl !== undefined) y.set("imageUrl", node.imageUrl);
  return y;
}

export function docSetMeta(
  ydoc: Y.Doc,
  key: "title" | "themeId" | "rootId",
  value: string,
) {
  ydoc.getMap("meta").set(key, value);
}

export function docAddNode(ydoc: Y.Doc, node: MindNode) {
  ydoc.getMap<Y.Map<unknown>>("nodes").set(node.id, nodeToYMap(node));
}

export function docUpdateNode(
  ydoc: Y.Doc,
  id: NodeId,
  patch: Partial<MindNode>,
) {
  const yNode = ydoc.getMap<Y.Map<unknown>>("nodes").get(id);
  if (!yNode) return;
  ydoc.transact(() => {
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) {
        yNode.delete(k);
      } else {
        yNode.set(k, v);
      }
    }
  });
}

export function docDeleteNode(ydoc: Y.Doc, id: NodeId) {
  const yNodes = ydoc.getMap<Y.Map<unknown>>("nodes");
  const rootId = ydoc.getMap("meta").get("rootId") as NodeId;
  if (id === rootId) return;
  // Collect descendants.
  const toDelete = new Set<NodeId>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    yNodes.forEach((yn, nid) => {
      const pid = yn.get("parentId") as NodeId | null;
      if (pid && toDelete.has(pid) && !toDelete.has(nid)) {
        toDelete.add(nid);
        grew = true;
      }
    });
  }
  ydoc.transact(() => {
    toDelete.forEach((nid) => yNodes.delete(nid));
  });
}

export function docAddComment(ydoc: Y.Doc, comment: Comment) {
  const y = new Y.Map<unknown>();
  Object.entries(comment).forEach(([k, v]) => y.set(k, v));
  ydoc.getArray<Y.Map<unknown>>("comments").push([y]);
}

export function docDeleteComment(ydoc: Y.Doc, id: string) {
  const arr = ydoc.getArray<Y.Map<unknown>>("comments");
  for (let i = 0; i < arr.length; i++) {
    const c = arr.get(i);
    if (c?.get("id") === id) {
      arr.delete(i, 1);
      return;
    }
  }
}

export function docSetCommentResolved(
  ydoc: Y.Doc,
  id: string,
  resolved: boolean,
) {
  const arr = ydoc.getArray<Y.Map<unknown>>("comments");
  for (let i = 0; i < arr.length; i++) {
    const c = arr.get(i);
    if (c?.get("id") === id) {
      c.set("resolved", resolved);
      return;
    }
  }
}

export function readComments(ydoc: Y.Doc): Comment[] {
  const arr = ydoc.getArray<Y.Map<unknown>>("comments");
  const out: Comment[] = [];
  arr.forEach((y) => {
    const o = y.toJSON() as Comment;
    if (o && o.id) out.push(o);
  });
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

const USER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function pickUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export function newRoomId(): string {
  // Generate a URL-safe room ID.
  const bytes = new Uint8Array(9);
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
