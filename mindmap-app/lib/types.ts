export type NodeId = string;

export type MindNode = {
  id: NodeId;
  text: string;
  x: number;
  y: number;
  parentId: NodeId | null;
  color?: string;
  icon?: string;
  imageUrl?: string;
  collapsed?: boolean;
};

export type ThemeId =
  | "default"
  | "dark"
  | "pastel"
  | "business"
  | "nature";

export type MindMapData = {
  version: 2;
  title: string;
  nodes: Record<NodeId, MindNode>;
  rootId: NodeId;
  themeId?: ThemeId;
};

export type Comment = {
  id: string;
  nodeId: NodeId;
  author: string;
  text: string;
  createdAt: number;
  resolved?: boolean;
};

export type CollabUser = {
  id: number;
  name: string;
  color: string;
  selectedId?: NodeId | null;
};

export const STORAGE_KEY = "mindmap-app:data";
export const USER_KEY = "mindmap-app:user";
