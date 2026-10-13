"use client";

import { useEffect, useRef } from "react";

const ICONS = [
  "💡", "🎯", "✅", "❌", "⭐", "🔥", "🚀", "📝", "📊", "📅",
  "👤", "👥", "💰", "🏷️", "🔍", "⚠️", "🎉", "❤️", "📌", "🔗",
  "📂", "📈", "📉", "⏰", "🌟", "🧠", "💬", "📣", "🔒", "🎨",
  "🛠️", "⚙️", "🔧", "💻", "📱", "🌍", "☕", "🍎", "🎓", "🏆",
  "😀", "😍", "🤔", "😅", "😎", "🙌", "👍", "👎", "✨", "💎",
];

export default function IconPicker({
  anchorPos,
  value,
  onPick,
  onClose,
}: {
  anchorPos: { x: number; y: number };
  value?: string;
  onPick: (icon: string | undefined) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-30 bg-white border border-gray-200 shadow-lg rounded-lg p-2 w-64"
      style={{ left: anchorPos.x, top: anchorPos.y }}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-xs font-semibold text-gray-700">アイコンを選択</div>
        {value && (
          <button
            className="text-xs text-red-600 hover:underline"
            onClick={() => onPick(undefined)}
          >
            クリア
          </button>
        )}
      </div>
      <div className="grid grid-cols-10 gap-0.5">
        {ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => onPick(icon)}
            className={`text-lg h-7 w-7 rounded hover:bg-gray-100 flex items-center justify-center ${
              value === icon ? "bg-amber-100 ring-1 ring-amber-400" : ""
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
