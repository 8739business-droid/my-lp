# MindMap App

MindMeister にインスパイアされたマインドマップアプリ。
Next.js 14 (App Router) + TypeScript + Tailwind CSS で構築。

## 実装済み機能

### MVP
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
- LocalStorage への自動保存
- JSON エクスポート / インポート
- PNG エクスポート

### v1
- **5種類のテーマ** - デフォルト / ダーク / パステル / ビジネス / ネイチャー
  - 枝ごとに自動配色（ブランチパレット）
- **アイコン / 絵文字** - 選択ノードに50種のアイコンから付与
- **画像添付** - ノードに画像をアップロード（最大2MB、Data URL保存）
- **プレゼンテーションモード** - フルスクリーンでスライド形式に発表
  - `← →` / `Space` でページ送り、`Esc` で終了、`Home` / `End` で先頭末尾へ
- **テンプレートギャラリー** - SWOT / プロジェクト計画 / ブレスト / 会議メモ / 週次レビュー / 空白

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
│   └── page.tsx
├── components/
│   ├── MindMap.tsx          # メインUI
│   ├── IconPicker.tsx       # 絵文字グリッド
│   ├── TemplateGallery.tsx  # テンプレート選択モーダル
│   └── PresentationMode.tsx # 発表モード
├── lib/
│   ├── export.ts            # JSON / PNG 入出力
│   ├── mindmap.ts           # マップ操作ロジック
│   ├── templates.ts         # プリセットテンプレ
│   ├── themes.ts            # 5テーマの定義
│   └── types.ts             # 型定義
└── package.json
```

## ロードマップ

- **v2**: リアルタイム共同編集 (Yjs + WebSocket)、コメント、共有リンク、権限
- **v3**: AI でテキスト → マップ自動生成（Claude API）、外部連携 (Google Drive / Slack)
