# MindMap App

MindMeister にインスパイアされたマインドマップアプリ (MVP)。
Next.js 14 (App Router) + TypeScript + Tailwind CSS で構築。

## MVP で実装している機能

- 無限 SVG キャンバス（ドラッグでパン、ホイールでズーム）
- ノードの追加・編集・削除、親子リンクの自動描画
- ドラッグでノードの位置を自由に移動
- キーボードショートカット
  - `Tab`: 子ノード追加
  - `Enter`: 兄弟ノード追加
  - `Delete` / `Backspace`: 選択ノード削除（子孫ごと）
  - `F2`: リネーム
  - ダブルクリック: リネーム
- タイトル編集
- LocalStorage への自動保存（オフラインでもデータ保持）
- JSON エクスポート / インポート
- PNG エクスポート（SVG → Canvas 変換）
- ヘルプパネル

## セットアップ

```bash
cd mindmap-app
npm install
npm run dev
```

<http://localhost:3000> を開く。

## ディレクトリ構成

```
mindmap-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # エントリ
├── components/
│   └── MindMap.tsx       # 主要 UI
├── lib/
│   ├── export.ts         # JSON / PNG 入出力
│   ├── mindmap.ts        # マップ操作ロジック
│   └── types.ts          # 型定義
└── package.json
```

## ロードマップ

- v1: テーマ・アイコン・画像添付、テンプレート、プレゼンモード
- v2: リアルタイム共同編集 (Yjs + WebSocket)、コメント、共有リンク、権限
- v3: AI でテキスト → マップ自動生成（Claude API）、外部連携
