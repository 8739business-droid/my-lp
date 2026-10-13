export type NodeId = string;

export type MindNode = {
  id: NodeId;
  text: string;
  x: number;
  y: number;
  parentId: NodeId | null;
  color?: string;
  collapsed?: boolean;
};

export type MindMapData = {
  version: 1;
  title: string;
  nodes: Record<NodeId, MindNode>;
  rootId: NodeId;
};

export const STORAGE_KEY = "mindmap-app:data";
