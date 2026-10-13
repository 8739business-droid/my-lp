import type { MindMapData, MindNode, NodeId } from "./types";

export function uid(): NodeId {
  return Math.random().toString(36).slice(2, 10);
}

export function createEmptyMap(): MindMapData {
  const rootId = uid();
  return {
    version: 2,
    title: "新しいマインドマップ",
    rootId,
    themeId: "default",
    nodes: {
      [rootId]: {
        id: rootId,
        text: "中心テーマ",
        x: 0,
        y: 0,
        parentId: null,
      },
    },
  };
}

export function getChildren(data: MindMapData, id: NodeId): MindNode[] {
  return Object.values(data.nodes).filter((n) => n.parentId === id);
}

export function getDescendants(
  data: MindMapData,
  id: NodeId,
): MindNode[] {
  const out: MindNode[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of getChildren(data, cur)) {
      out.push(child);
      stack.push(child.id);
    }
  }
  return out;
}

export function deleteNode(
  data: MindMapData,
  id: NodeId,
): MindMapData {
  if (id === data.rootId) return data;
  const toDelete = new Set([id, ...getDescendants(data, id).map((n) => n.id)]);
  const nodes: Record<NodeId, MindNode> = {};
  for (const [nid, n] of Object.entries(data.nodes)) {
    if (!toDelete.has(nid)) nodes[nid] = n;
  }
  return { ...data, nodes };
}

const CHILD_OFFSET_X = 180;
const SIBLING_OFFSET_Y = 80;

export function addChild(
  data: MindMapData,
  parentId: NodeId,
): { data: MindMapData; newId: NodeId } {
  const parent = data.nodes[parentId];
  if (!parent) return { data, newId: parentId };
  const siblings = getChildren(data, parentId);
  const direction = parent.parentId === null
    ? siblings.length % 2 === 0 ? 1 : -1
    : parent.x >= (data.nodes[parent.parentId]?.x ?? 0) ? 1 : -1;

  const newId = uid();
  const yOffset = siblings.length === 0
    ? 0
    : (siblings.length % 2 === 0 ? 1 : -1) *
      Math.ceil((siblings.length + 1) / 2) *
      SIBLING_OFFSET_Y;

  // Pass through parent's color (branch root nodes get a palette color later).
  const newNode: MindNode = {
    id: newId,
    text: "新しいトピック",
    x: parent.x + CHILD_OFFSET_X * direction,
    y: parent.y + yOffset,
    parentId,
    color: parent.color,
  };
  return {
    data: { ...data, nodes: { ...data.nodes, [newId]: newNode } },
    newId,
  };
}

export function addSibling(
  data: MindMapData,
  nodeId: NodeId,
): { data: MindMapData; newId: NodeId } {
  const node = data.nodes[nodeId];
  if (!node || node.parentId === null) {
    return addChild(data, nodeId);
  }
  return addChild(data, node.parentId);
}

export function updateNode(
  data: MindMapData,
  id: NodeId,
  patch: Partial<MindNode>,
): MindMapData {
  const node = data.nodes[id];
  if (!node) return data;
  return { ...data, nodes: { ...data.nodes, [id]: { ...node, ...patch } } };
}

export function moveNode(
  data: MindMapData,
  id: NodeId,
  dx: number,
  dy: number,
): MindMapData {
  const node = data.nodes[id];
  if (!node) return data;
  return updateNode(data, id, { x: node.x + dx, y: node.y + dy });
}

// Return a color for a node derived from its branch (direct child of root).
// Honors an explicit color override on any ancestor.
export function resolveNodeColor(
  data: MindMapData,
  nodeId: NodeId,
  branchPalette: string[],
): string | undefined {
  const node = data.nodes[nodeId];
  if (!node) return undefined;
  if (node.color) return node.color;
  if (node.id === data.rootId) return undefined;

  let current = node;
  while (current.parentId && current.parentId !== data.rootId) {
    current = data.nodes[current.parentId];
    if (current.color) return current.color;
  }
  // current is now a direct child of root.
  const rootChildren = getChildren(data, data.rootId);
  const idx = rootChildren.findIndex((n) => n.id === current.id);
  if (idx < 0) return undefined;
  return branchPalette[idx % branchPalette.length];
}
