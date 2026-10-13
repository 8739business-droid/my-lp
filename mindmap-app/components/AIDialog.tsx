"use client";

import { useState } from "react";
import type { AIMindMap } from "@/lib/aiTypes";

type Mode = "new" | "expand";

export default function AIDialog({
  defaultMode,
  selectedNodeText,
  selectedNodeContext,
  onClose,
  onApplyNew,
  onApplyExpand,
}: {
  defaultMode: Mode;
  selectedNodeText?: string;
  selectedNodeContext?: string[];
  onClose: () => void;
  onApplyNew: (ai: AIMindMap) => void;
  onApplyExpand: (ai: AIMindMap) => void;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AIMindMap | null>(null);

  const canSubmit = prompt.trim().length > 0 && !loading;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const body =
        mode === "new"
          ? { mode, prompt }
          : {
              mode,
              prompt,
              nodeText: selectedNodeText ?? "",
              context: selectedNodeContext ?? [],
            };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました");
      } else if (data.map) {
        setPreview(data.map as AIMindMap);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!preview) return;
    if (mode === "new") onApplyNew(preview);
    else onApplyExpand(preview);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[640px] max-w-[92vw] max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>🤖</span> AI でマップを生成
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("new")}
            className={`flex-1 px-3 py-2 text-sm rounded border ${
              mode === "new"
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-700"
            }`}
          >
            新規マップとして生成
          </button>
          <button
            onClick={() => setMode("expand")}
            disabled={!selectedNodeText}
            className={`flex-1 px-3 py-2 text-sm rounded border disabled:opacity-40 ${
              mode === "expand"
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-700"
            }`}
          >
            選択ノードを展開
            {selectedNodeText && (
              <span className="block text-[10px] text-gray-500 truncate mt-0.5">
                → {selectedNodeText}
              </span>
            )}
          </button>
        </div>

        <label className="block text-xs font-medium text-gray-600 mb-1">
          {mode === "new" ? "テーマ・内容を指示" : "どのように展開するか"}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === "new"
              ? "例: Next.js で SaaS を立ち上げるのに必要な技術スタックとマイルストーン"
              : "例: 具体的なタスクに分解して、担当者イメージも含めて"
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400 resize-y"
        />
        <div className="text-[10px] text-gray-400 mt-1 text-right">
          {prompt.length} / 2000
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        {preview && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <div className="text-xs font-semibold text-emerald-800 mb-2">
              プレビュー
            </div>
            <PreviewTree node={{ text: preview.title, children: preview.children }} depth={0} />
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            model: claude-opus-5-5 · サーバー側で生成
          </div>
          <div className="flex gap-2">
            {preview ? (
              <>
                <button
                  onClick={() => {
                    setPreview(null);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                >
                  再生成
                </button>
                <button
                  onClick={apply}
                  className="px-4 py-1.5 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700"
                >
                  {mode === "new" ? "新規マップとして適用" : "選択ノードに追加"}
                </button>
              </>
            ) : (
              <button
                onClick={generate}
                disabled={!canSubmit}
                className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
              >
                {loading ? "生成中…" : "生成"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewTree({
  node,
  depth,
}: {
  node: { text: string; icon?: string; children?: { text: string; icon?: string; children?: unknown[] }[] };
  depth: number;
}) {
  return (
    <div className="text-xs">
      <div
        className={`${depth === 0 ? "font-semibold text-emerald-900" : "text-gray-700"}`}
        style={{ paddingLeft: depth * 12 }}
      >
        {node.icon ? node.icon + " " : ""}
        {node.text}
      </div>
      {node.children?.map((c, i) => (
        <PreviewTree
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          node={c as { text: string; icon?: string; children?: { text: string }[] }}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
