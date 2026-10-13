"use client";

import { TEMPLATES } from "@/lib/templates";
import type { MindMapData } from "@/lib/types";

export default function TemplateGallery({
  onPick,
  onClose,
}: {
  onPick: (data: MindMapData) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[720px] max-w-[90vw] max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            テンプレートから始める
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          目的に合ったひな形を選ぶと、構造ごと作成されます。
        </p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.build())}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow transition"
            >
              <div className="text-3xl mb-2">{t.emoji}</div>
              <div className="font-medium text-gray-800">{t.name}</div>
              <div className="text-xs text-gray-500 mt-1">{t.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
