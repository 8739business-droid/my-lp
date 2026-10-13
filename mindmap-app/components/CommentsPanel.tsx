"use client";

import { useState } from "react";
import type { Comment, MindMapData, NodeId } from "@/lib/types";

export default function CommentsPanel({
  comments,
  nodeId,
  data,
  canEdit,
  onAdd,
  onRemove,
  onResolve,
  onJumpToNode,
  onClose,
}: {
  comments: Comment[];
  nodeId: NodeId | null;
  data: MindMapData;
  canEdit: boolean;
  onAdd: (nodeId: NodeId, text: string) => void;
  onRemove: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onJumpToNode: (id: NodeId) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"selected" | "all">("selected");
  const [draft, setDraft] = useState("");

  const list = filter === "all" || !nodeId
    ? comments
    : comments.filter((c) => c.nodeId === nodeId);
  const open = list.filter((c) => !c.resolved);
  const resolved = list.filter((c) => c.resolved);

  const submit = () => {
    if (!nodeId || !draft.trim()) return;
    onAdd(nodeId, draft.trim());
    setDraft("");
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-20 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="font-semibold text-gray-800 text-sm">コメント</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 bg-gray-50 flex gap-1 text-xs">
        <button
          onClick={() => setFilter("selected")}
          className={`px-2 py-1 rounded ${
            filter === "selected"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          選択ノード
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-2 py-1 rounded ${
            filter === "all"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          すべて ({comments.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {open.length === 0 && resolved.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-10">
            コメントはありません
          </div>
        )}
        {open.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            data={data}
            canEdit={canEdit}
            onJumpToNode={onJumpToNode}
            onRemove={onRemove}
            onResolve={onResolve}
          />
        ))}
        {resolved.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-wide text-gray-400 border-t border-gray-100 pt-2">
              解決済み ({resolved.length})
            </div>
            {resolved.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                data={data}
                canEdit={canEdit}
                onJumpToNode={onJumpToNode}
                onRemove={onRemove}
                onResolve={onResolve}
              />
            ))}
          </>
        )}
      </div>

      {canEdit && nodeId && (
        <div className="p-3 border-t border-gray-200">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="コメントを入力 (⌘ + Enter で送信)"
            className="w-full h-16 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400 resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="text-[10px] text-gray-400 truncate">
              → {data.nodes[nodeId]?.text ?? "?"}
            </div>
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-40"
            >
              送信
            </button>
          </div>
        </div>
      )}
      {!canEdit && (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          閲覧モードではコメントできません
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  data,
  canEdit,
  onJumpToNode,
  onRemove,
  onResolve,
}: {
  comment: Comment;
  data: MindMapData;
  canEdit: boolean;
  onJumpToNode: (id: NodeId) => void;
  onRemove: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
}) {
  const node = data.nodes[comment.nodeId];
  return (
    <div
      className={`border rounded-lg p-2 ${
        comment.resolved
          ? "border-gray-200 bg-gray-50 opacity-70"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
        <span className="font-medium text-gray-700">{comment.author}</span>
        <span>{new Date(comment.createdAt).toLocaleString("ja-JP")}</span>
      </div>
      <div className="text-xs text-gray-800 whitespace-pre-wrap break-words">
        {comment.text}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => onJumpToNode(comment.nodeId)}
          className="text-[10px] text-blue-600 hover:underline truncate max-w-[160px]"
        >
          → {node?.text ?? "(削除されたノード)"}
        </button>
        {canEdit && (
          <div className="flex gap-1">
            <button
              onClick={() => onResolve(comment.id, !comment.resolved)}
              className="text-[10px] text-gray-600 hover:text-gray-900"
            >
              {comment.resolved ? "再開" : "解決"}
            </button>
            <button
              onClick={() => onRemove(comment.id)}
              className="text-[10px] text-red-600 hover:text-red-900"
            >
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
