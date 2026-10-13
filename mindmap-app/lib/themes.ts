import type { ThemeId } from "./types";

export type Theme = {
  id: ThemeId;
  name: string;
  canvasBg: string;
  gridColor: string;
  rootBg: string;
  rootText: string;
  nodeBg: string;
  nodeText: string;
  nodeBorder: string;
  edge: string;
  branchPalette: string[];
};

export const THEMES: Record<ThemeId, Theme> = {
  default: {
    id: "default",
    name: "デフォルト",
    canvasBg: "#fafaf9",
    gridColor: "#e5e7eb",
    rootBg: "#1f2937",
    rootText: "#ffffff",
    nodeBg: "#ffffff",
    nodeText: "#111827",
    nodeBorder: "#d1d5db",
    edge: "#9ca3af",
    branchPalette: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
  },
  dark: {
    id: "dark",
    name: "ダーク",
    canvasBg: "#0f172a",
    gridColor: "#1e293b",
    rootBg: "#f8fafc",
    rootText: "#0f172a",
    nodeBg: "#1e293b",
    nodeText: "#f1f5f9",
    nodeBorder: "#334155",
    edge: "#64748b",
    branchPalette: ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"],
  },
  pastel: {
    id: "pastel",
    name: "パステル",
    canvasBg: "#fef3f2",
    gridColor: "#fce7e4",
    rootBg: "#f472b6",
    rootText: "#ffffff",
    nodeBg: "#ffffff",
    nodeText: "#4c1d95",
    nodeBorder: "#f9a8d4",
    edge: "#f9a8d4",
    branchPalette: ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb923c"],
  },
  business: {
    id: "business",
    name: "ビジネス",
    canvasBg: "#f8fafc",
    gridColor: "#e2e8f0",
    rootBg: "#0f172a",
    rootText: "#ffffff",
    nodeBg: "#ffffff",
    nodeText: "#0f172a",
    nodeBorder: "#cbd5e1",
    edge: "#64748b",
    branchPalette: ["#1e3a8a", "#334155", "#0f766e", "#78350f", "#4c1d95", "#9f1239"],
  },
  nature: {
    id: "nature",
    name: "ネイチャー",
    canvasBg: "#f7fee7",
    gridColor: "#d9f99d",
    rootBg: "#166534",
    rootText: "#ffffff",
    nodeBg: "#ffffff",
    nodeText: "#14532d",
    nodeBorder: "#86efac",
    edge: "#4ade80",
    branchPalette: ["#15803d", "#ca8a04", "#9a3412", "#5b21b6", "#0369a1", "#9f1239"],
  },
};

export function getTheme(id: ThemeId | undefined): Theme {
  return THEMES[id ?? "default"];
}

export function pickBranchColor(theme: Theme, index: number): string {
  return theme.branchPalette[index % theme.branchPalette.length];
}
