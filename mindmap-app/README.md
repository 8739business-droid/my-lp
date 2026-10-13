# MindMap App

MindMeister にインスパイアされたマインドマップアプリ。
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Yjs で構築。

## 実装済み機能

### MVP
- 無限 SVG キャンバス（ドラッグでパン、ホイールでズーム）
- ノード CRUD、親子リンク、ドラッグ移動
- キーボードショートカット (`Tab` / `Enter` / `Delete` / `F2`)
- JSON エクスポート/インポート、PNG エクスポート

### v1
- 5種のテーマ（デフォルト / ダーク / パステル / ビジネス / ネイチャー）
- アイコン・絵文字（50種のピッカー）
- 画像添付（ノードに画像、最大2MB）
- プレゼンテーションモード（スライド形式、Esc / 矢印キー）
- テンプレートギャラリー（SWOT / プロジェクト計画 / ブレスト / 会議メモ / 週次レビュー / 空白）

### v2 - リアルタイム共同編集
- **Yjs CRDT** によるデータ同期
- **y-webrtc** で P2P 共同編集（サーバー不要、公開シグナリング利用）
- **IndexedDB 永続化** によるオフライン対応
- **共有リンク** `?room=<id>` を発行、別タブ/端末で開くと即接続
- **Awareness** - 他ユーザーの選択ノードを色付きで表示、ツールバーに参加者バッジ
- **コメント** - 選択ノード/全件表示、追加/解決/削除
- **閲覧専用モード** `?mode=view` - 編集UIを無効化（クライアント側）

## 使い方

```bash
cd mindmap-app
npm install
npm run dev
```

<http://localhost:3000> を開く。

### 共有・共同編集を試す

1. ツールバーの「共有」ボタンをクリック
2. 「このタブで共有開始」でルームを作成（URLに `?room=` が付与される）
3. そのURLをコピーして別タブ・別ブラウザで開く
4. 両画面で同時編集・コメントが同期される（接続は数秒かかる場合あり）

> **シグナリング**: 公開サーバー `wss://signaling.yjs.dev` などに依存。本番用途ではセルフホストを推奨。

## ディレクトリ構成

```
mindmap-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # dynamic import (ssr: false)
├── components/
│   ├── MindMap.tsx             # メインUI
│   ├── IconPicker.tsx
│   ├── TemplateGallery.tsx
│   ├── PresentationMode.tsx
│   ├── ShareDialog.tsx         # 共有モーダル
│   └── CommentsPanel.tsx       # コメントサイドパネル
├── hooks/
│   └── useYMindMap.ts          # Y.Doc 管理 + awareness + actions
├── lib/
│   ├── export.ts
│   ├── mindmap.ts              # マップ操作ロジック（CRDT 非依存）
│   ├── collab.ts               # Y.Doc <-> MindMapData 変換
│   ├── templates.ts
│   ├── themes.ts
│   └── types.ts
└── package.json
```

## ロードマップ

- **v3**: Claude API を使ったテキスト → マインドマップ自動生成、外部連携
