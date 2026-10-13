# MindMap App

MindMeister にインスパイアされたマインドマップアプリ。
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Yjs + Claude API で構築。

## 実装済み機能

### MVP
- 無限 SVG キャンバス (ドラッグでパン、ホイールでズーム)
- ノード CRUD、親子リンク、ドラッグ移動
- キーボードショートカット (`Tab` / `Enter` / `Delete` / `F2`)
- JSON エクスポート/インポート、PNG エクスポート

### v1 - 見た目と資料化
- 5種のテーマ (デフォルト / ダーク / パステル / ビジネス / ネイチャー)
- アイコン・絵文字 (50種のピッカー)
- 画像添付 (ノードに画像、最大 2MB)
- プレゼンテーションモード (スライド形式、Esc / 矢印キー)
- テンプレートギャラリー (SWOT / プロジェクト計画 / ブレスト / 会議メモ / 週次レビュー / 空白)

### v2 - リアルタイム共同編集
- Yjs CRDT によるデータ同期
- y-webrtc による P2P 共同編集 (サーバー不要、公開シグナリング利用)
- IndexedDB 永続化によるオフライン対応
- 共有リンク `?room=<id>` (別タブ/端末で開くと即接続)
- Awareness - 他ユーザーの選択ノードを色付きで表示、ツールバーに参加者バッジ
- コメント - 選択ノード/全件表示、追加/解決/削除
- 閲覧専用モード `?mode=view`

### v3 - AI と連携
- **AI でマップ自動生成** - テキストプロンプトから Claude Opus 5.5 でマインドマップを構造化
- **AI でノード展開** - 選択ノードに対して Claude がサブトピックを提案して追加
- **Markdown エクスポート** - 箇条書きの `.md` ファイルとして出力
- **OPML エクスポート** - 他マインドマップツール互換形式 (MindManager, FreeMind, OmniOutliner など)

## セットアップ

```bash
cd mindmap-app
npm install
cp .env.example .env.local
# ANTHROPIC_API_KEY を .env.local に設定
npm run dev
```

<http://localhost:3000> を開く。

> AI 機能を使わない場合は `ANTHROPIC_API_KEY` の設定は不要です (サーバーが 503 を返し UI にメッセージ表示)。

### 共有・共同編集を試す

1. ツールバーの「共有」ボタン
2. 「このタブで共有開始」でルーム作成 (URL に `?room=` が付与)
3. そのURLを別タブ・別ブラウザで開く
4. 両画面で同時編集・コメント・カーソルが同期

### AI 生成を試す

1. ツールバーの「🤖 AI」ボタン
2. モード選択（新規マップ / 選択ノード展開）
3. プロンプト入力 → 生成 → プレビュー確認 → 適用

## ディレクトリ構成

```
mindmap-app/
├── app/
│   ├── api/
│   │   └── generate/route.ts      # Claude API 呼び出し
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # dynamic import (ssr: false)
├── components/
│   ├── MindMap.tsx                # メインUI
│   ├── AIDialog.tsx               # AI 生成モーダル
│   ├── CommentsPanel.tsx
│   ├── IconPicker.tsx
│   ├── PresentationMode.tsx
│   ├── ShareDialog.tsx
│   └── TemplateGallery.tsx
├── hooks/
│   └── useYMindMap.ts             # Y.Doc + awareness + actions
├── lib/
│   ├── aiConvert.ts               # AI出力 → MindMapData
│   ├── aiTypes.ts
│   ├── collab.ts                  # Y.Doc <-> MindMapData 変換
│   ├── export.ts                  # JSON / PNG / Markdown / OPML
│   ├── mindmap.ts                 # マップ操作ロジック
│   ├── templates.ts
│   ├── themes.ts
│   └── types.ts
└── package.json
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS |
| 描画 | SVG |
| 永続化 (ローカル) | IndexedDB (y-indexeddb) |
| CRDT | Yjs |
| P2P 同期 | y-webrtc + y-protocols |
| AI | @anthropic-ai/sdk (Claude Opus 5.5) |

## 本番運用に向けた次ステップ

- 認証 (NextAuth / Clerk) とユーザーごとのマップ保存 (Supabase / Postgres)
- 画像を Data URL でなくオブジェクトストレージ (S3 / R2) に保存
- y-webrtc 公開シグナリングをセルフホスト、または y-websocket + 認可サーバー
- 権限管理をサーバーサイドで本当に強制 (閲覧URLでは差分書き込みを拒否)
- MeisterTask 相当のタスク連携、Google Drive / Slack 連携
- モバイルアプリ (React Native / Expo)
