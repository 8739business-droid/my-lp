"use client";

import { useEffect, useMemo, useState } from "react";
import { newRoomId } from "@/lib/collab";
import type { CollabUser } from "@/lib/types";

export default function ShareDialog({
  currentRoomId,
  me,
  onUpdateMe,
  onClose,
}: {
  currentRoomId: string | null;
  me: CollabUser;
  onUpdateMe: (patch: Partial<CollabUser>) => void;
  onClose: () => void;
}) {
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [copied, setCopied] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState<string | null>(
    currentRoomId,
  );
  const [nameDraft, setNameDraft] = useState(me.name);

  useEffect(() => setNameDraft(me.name), [me.name]);

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    const rid = generatedRoomId ?? newRoomId();
    const u = new URL(window.location.origin + window.location.pathname);
    u.searchParams.set("room", rid);
    if (permission === "view") u.searchParams.set("mode", "view");
    return u.toString();
  }, [generatedRoomId, permission]);

  const ensureRoom = () => {
    if (!generatedRoomId) {
      const rid = newRoomId();
      setGeneratedRoomId(rid);
      return rid;
    }
    return generatedRoomId;
  };

  const copy = async () => {
    ensureRoom();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("クリップボードへコピーできませんでした。URLを選択してコピーしてください");
    }
  };

  const openInSameTab = () => {
    const rid = ensureRoom();
    const u = new URL(window.location.href);
    u.searchParams.set("room", rid);
    if (permission === "view") u.searchParams.set("mode", "view");
    else u.searchParams.delete("mode");
    window.location.href = u.toString();
  };

  const leaveRoom = () => {
    const u = new URL(window.location.href);
    u.searchParams.delete("room");
    u.searchParams.delete("mode");
    window.location.href = u.toString();
  };

  const commitName = () => {
    if (nameDraft.trim() && nameDraft !== me.name) {
      onUpdateMe({ name: nameDraft.trim() });
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[560px] max-w-[90vw] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            共有・共同編集
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            表示名（他の参加者に見えます）
          </label>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full inline-block"
              style={{ background: me.color }}
              aria-label="あなたの色"
            />
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === "Enter" && commitName()}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            共有時のアクセス権限
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPermission("edit")}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                permission === "edit"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              ✎ 編集可
            </button>
            <button
              onClick={() => setPermission("view")}
              className={`flex-1 px-3 py-2 text-sm rounded border ${
                permission === "view"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              👁 閲覧のみ
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            閲覧のみは別タブのクライアント側で編集UIを無効化します（本番運用には別途サーバー認可が必要）。
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            共有URL
          </label>
          <div className="flex gap-2">
            <input
              value={url}
              readOnly
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs font-mono bg-gray-50"
            />
            <button
              onClick={copy}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {copied ? "✓ コピー済み" : "コピー"}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            このURLを別タブ/別端末で開くと、P2P (y-webrtc) で接続されます。
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            現在のモード:{" "}
            {currentRoomId ? (
              <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">
                collab ({currentRoomId.slice(0, 6)}…)
              </span>
            ) : (
              <span className="font-mono bg-gray-50 text-gray-700 px-1 rounded">
                local
              </span>
            )}
          </div>
          {currentRoomId ? (
            <button
              onClick={leaveRoom}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              共有を終了
            </button>
          ) : (
            <button
              onClick={openInSameTab}
              className="px-3 py-1.5 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700"
            >
              このタブで共有開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
