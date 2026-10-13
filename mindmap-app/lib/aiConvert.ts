import { uid } from "./mindmap";
import type { AIMindMap, AINode } from "./aiTypes";
import type { MindMapData, MindNode, NodeId } from "./types";

const CHILD_X = 220;
const SIB_Y = 70;
const DEEP_X = 180;

export function aiMapToMindMap(
  ai: AIMindMap,
  themeId: MindMapData["themeId"] = "default",
): MindMapData {
  const rootId = uid();
  const nodes: Record<NodeId, MindNode> = {
    [rootId]: { id: rootId, text: ai.title, x: 0, y: 0, parentId: null },
  };
  const branches = ai.children ?? [];
  branches.forEach((branch, i) => {
    const direction = i % 2 === 0 ? 1 : -1;
    const row = Math.floor(i / 2);
    const bId = placeNode(nodes, branch, rootId, CHILD_X * direction, (row - (Math.ceil(branches.length / 2) - 1) / 2) * SIB_Y * 2);
    placeChildren(nodes, branch.children ?? [], bId, direction);
  });
  return {
    version: 2,
    title: ai.title,
    rootId,
    themeId,
    nodes,
  };
}

export function aiChildrenIntoExisting(
  data: MindMapData,
  parentId: NodeId,
  ai: AIMindMap,
): MindMapData {
  const parent = data.nodes[parentId];
  if (!parent) return data;
  const nodes: Record<NodeId, MindNode> = { ...data.nodes };
  // Determine direction from parent relative to the root.
  const root = data.nodes[data.rootId];
  const direction = parent.x >= root.x ? 1 : -1;
  const newChildren = ai.children ?? [];
  newChildren.forEach((child, i) => {
    const yOffset = (i - (newChildren.length - 1) / 2) * SIB_Y;
    const cId = placeNode(
      nodes,
      child,
      parentId,
      parent.x + DEEP_X * direction,
      parent.y + yOffset,
    );
    placeChildren(nodes, child.children ?? [], cId, direction);
  });
  return { ...data, nodes };
}

function placeNode(
  nodes: Record<NodeId, MindNode>,
  n: AINode,
  parentId: NodeId,
  x: number,
  y: number,
): NodeId {
  const id = uid();
  nodes[id] = {
    id,
    text: n.text,
    x,
    y,
    parentId,
    icon: n.icon,
  };
  return id;
}

function placeChildren(
  nodes: Record<NodeId, MindNode>,
  children: AINode[],
  parentId: NodeId,
  direction: 1 | -1,
) {
  const parent = nodes[parentId];
  if (!parent || children.length === 0) return;
  children.forEach((child, i) => {
    const yOffset = (i - (children.length - 1) / 2) * (SIB_Y - 10);
    const cId = placeNode(
      nodes,
      child,
      parentId,
      parent.x + DEEP_X * direction,
      parent.y + yOffset,
    );
    placeChildren(nodes, child.children ?? [], cId, direction);
  });
}
