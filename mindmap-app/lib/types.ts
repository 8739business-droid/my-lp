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

export const STORAGE_KEY = "mindmap-app:data";
