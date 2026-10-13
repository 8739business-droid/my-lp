import { uid } from "./mindmap";
import type { MindMapData, MindNode, NodeId, ThemeId } from "./types";

type TemplateSpec = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  themeId: ThemeId;
  build: () => MindMapData;
};

function makeMap(
  title: string,
  themeId: ThemeId,
  rootText: string,
  branches: { text: string; children?: string[] }[],
): MindMapData {
  const rootId = uid();
  const nodes: Record<NodeId, MindNode> = {
    [rootId]: { id: rootId, text: rootText, x: 0, y: 0, parentId: null },
  };
  const CHILD_X = 220;
  const SIB_Y = 80;
  const CHILD_LEAF_X = 180;
  const CHILD_LEAF_Y = 60;

  branches.forEach((branch, i) => {
    const direction = i % 2 === 0 ? 1 : -1;
    const row = Math.floor(i / 2);
    const bId = uid();
    nodes[bId] = {
      id: bId,
      text: branch.text,
      x: CHILD_X * direction,
      y: (row - (Math.ceil(branches.length / 2) - 1) / 2) * SIB_Y * 2,
      parentId: rootId,
    };
    (branch.children ?? []).forEach((childText, ci) => {
      const cid = uid();
      nodes[cid] = {
        id: cid,
        text: childText,
        x: (CHILD_X + CHILD_LEAF_X) * direction,
        y:
          (row - (Math.ceil(branches.length / 2) - 1) / 2) * SIB_Y * 2 +
          (ci - ((branch.children?.length ?? 1) - 1) / 2) * CHILD_LEAF_Y,
        parentId: bId,
      };
    });
  });

  return { version: 2, title, rootId, themeId, nodes };
}

export const TEMPLATES: TemplateSpec[] = [
  {
    id: "blank",
    name: "空白",
    description: "まっさらな中心テーマから始める",
    emoji: "✨",
    themeId: "default",
    build: () => {
      const rootId = uid();
      return {
        version: 2,
        title: "新しいマインドマップ",
        rootId,
        themeId: "default",
        nodes: {
          [rootId]: { id: rootId, text: "中心テーマ", x: 0, y: 0, parentId: null },
        },
      };
    },
  },
  {
    id: "swot",
    name: "SWOT分析",
    description: "強み・弱み・機会・脅威の4象限",
    emoji: "📊",
    themeId: "business",
    build: () =>
      makeMap("SWOT分析", "business", "SWOT分析", [
        { text: "💪 Strengths (強み)", children: ["内部リソース", "差別化要因"] },
        { text: "⚠️ Weaknesses (弱み)", children: ["改善点", "制約"] },
        { text: "🌱 Opportunities (機会)", children: ["市場トレンド", "新規顧客"] },
        { text: "🚨 Threats (脅威)", children: ["競合", "外部リスク"] },
      ]),
  },
  {
    id: "project",
    name: "プロジェクト計画",
    description: "目標・スコープ・タスク・リスク・体制",
    emoji: "🚀",
    themeId: "default",
    build: () =>
      makeMap("プロジェクト計画", "default", "プロジェクト", [
        { text: "🎯 目標", children: ["成功指標", "期限"] },
        { text: "📦 スコープ", children: ["含める", "含めない"] },
        { text: "📝 タスク", children: ["フェーズ1", "フェーズ2"] },
        { text: "⚠️ リスク", children: ["技術的", "スケジュール"] },
        { text: "👥 体制", children: ["担当者", "承認者"] },
      ]),
  },
  {
    id: "brainstorm",
    name: "ブレインストーミング",
    description: "自由にアイデアを広げる",
    emoji: "💡",
    themeId: "pastel",
    build: () =>
      makeMap("ブレインストーミング", "pastel", "テーマ", [
        { text: "💡 アイデアA", children: ["詳細", "派生"] },
        { text: "💡 アイデアB", children: ["詳細", "派生"] },
        { text: "💡 アイデアC", children: ["詳細", "派生"] },
        { text: "💡 アイデアD", children: ["詳細", "派生"] },
      ]),
  },
  {
    id: "meeting",
    name: "会議メモ",
    description: "議題・決定事項・ToDo・次回",
    emoji: "📝",
    themeId: "nature",
    build: () =>
      makeMap("会議メモ", "nature", "会議タイトル", [
        { text: "📅 議題", children: ["トピック1", "トピック2"] },
        { text: "✅ 決定事項", children: ["決定1", "決定2"] },
        { text: "📋 ToDo", children: ["担当者 / 期限"] },
        { text: "➡️ 次回", children: ["日時", "議題"] },
      ]),
  },
  {
    id: "weekly",
    name: "週次レビュー",
    description: "振り返り・学び・次の一手",
    emoji: "📆",
    themeId: "dark",
    build: () =>
      makeMap("週次レビュー", "dark", "今週", [
        { text: "✨ よかったこと", children: ["成果", "うまくいった工夫"] },
        { text: "🔧 改善点", children: ["次回試すこと"] },
        { text: "📚 学び", children: ["気づき"] },
        { text: "🎯 来週", children: ["最優先タスク"] },
      ]),
  },
];

export function getTemplate(id: string): TemplateSpec | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
