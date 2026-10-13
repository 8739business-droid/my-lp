"use client";

import dynamic from "next/dynamic";

const MindMap = dynamic(() => import("@/components/MindMap"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center text-gray-400">
      読み込み中…
    </div>
  ),
});

export default function Page() {
  return <MindMap />;
}
