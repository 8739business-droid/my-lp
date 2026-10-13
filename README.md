# Core Bloom AI Video Marketing Academy

Higgsfield を中心としたAI動画マーケティングの実践型学習サイト。6週間・30レッスン。

静的サイト1枚（依存ライブラリなし）。教材は JSON で管理し、ビルドで1つの HTML に埋め込む。

---

## 構成

```
corebloom-academy/
├── data/                 教材データ（ここだけ編集すれば内容が更新される）
│   ├── week1.json 〜 week6.json   各週5レッスン
│   ├── setup.json                 レッスンごとの推奨設定とモデル単価（費用はここから計算される）
│   ├── prompts.json               プロンプトライブラリ（工程記号つき）
│   ├── resources.json             参考教材リンク集（確認状態つき）
│   └── meta.json                  コース情報・評価軸・使い方・費用設計
├── public/
│   └── template.html     UI本体（HTML + CSS + JS。__DATA__ にデータが差し込まれる）
├── docs/
│   ├── LESSON_SCHEMA.md  レッスンJSONのスキーマと執筆ルール
│   ├── HIGGSFIELD_FACTS.md  確認済みの現行仕様（教材執筆の事実ベース）
│   └── DESIGN.md         設計書・情報設計・技術構成・運用手順
├── build.js              ビルドと検証
└── dist/index.html       生成物（これ1枚で動く）
```

## ビルド

```bash
node build.js
```

- `data/*.json` を読み、スキーマを検証し、`dist/index.html` を出力する
- 検証エラーがあれば終了コード1で停止する（必須項目の欠落、存在しない resourceId）
- 警告は表示のみ（所要時間の不整合、ルーブリック軸の欠落、未参照の教材、プロンプトの status）
- Node.js のみ。npm install 不要。

## 内容を更新する

| やりたいこと | 編集するファイル |
|---|---|
| レッスンの文章・手順・課題を直す | `data/weekN.json` |
| 使うモデル・尺・解像度・生成本数を変える | `data/setup.json` の `lessons` |
| **クレジット単価が変わった** | `data/setup.json` の `models`。レッスン表示・週次集計・費用設計ページがまとめて再計算される |
| プロンプトを追加する | `data/prompts.json` |
| 教材リンクを追加・確認日を更新する | `data/resources.json` |
| 評価軸・使い方・費用設計の文章を変える | `data/meta.json` |
| 見た目・画面構成を変える | `public/template.html` |

### 費用の計算について

`data/setup.json` の `models` が各モデルの単価（画像は1枚あたり、動画は1秒あたり）を持ち、各レッスンの `images` / `videos` / `videoSeconds` / `videoRes` から `build.js` が費用を算出します。手書きの金額はどこにも持っていないため、単価を1か所直せば全ページが整合したまま更新されます。

`unlimited: true` のモデルは、Unlimited が有効な期間はクレジットを消費しないものとして、別枠（「Unlimited適用時」）で集計されます。

編集後に `node build.js` を実行し、`dist/index.html` を再公開する。

リンクの確認は月1回を目安に。`resources.json` の `status` を `確認済み` / `未確認` で更新し、`checkedOn` に確認日を入れる。トップの `checkedOn` はサイトのサイドバーに表示される。

## 公開

### 現在の公開方法（Claude Artifact）
`dist/index.html` を Artifact として公開済み。URLを共有すれば誰でも閲覧できる。再公開すると同じURLが更新される。

### Vercel で公開する場合
```bash
npx vercel --prod
```
`vercel.json` により `dist/` を静的配信する。ビルドコマンドは `node build.js`。環境変数は不要。

GitHub 連携で自動デプロイする場合は、リポジトリを作って push し、Vercel 側で Framework Preset を「Other」、Build Command を `node build.js`、Output Directory を `dist` に設定する。

## 進捗データの扱い

学習進捗・作業メモ・自己評価・ポートフォリオは、閲覧しているブラウザの `localStorage` にのみ保存される。

- サーバーには一切送信されない
- **端末間・ブラウザ間で同期しない**
- ブラウザのデータ消去で失われる
- シークレットウィンドウでは保存されないことがある

端末を移すときは、ダッシュボード下部の「データをコピー」でJSONをコピーし、移行先で「データを読み込む」から貼り付ける。

同期が必要になった段階で Supabase 等を検討する。その場合も、`localStorage` の読み書きは `load()` / `save()` の2関数に閉じているため、差し替え範囲は小さい。

## 制約

- 認証なし。URLを知っていれば閲覧できる
- 複数端末の同期なし
- 掲載プロンプトは生成検証をしていない（すべて「未検証」表示）
- Higgsfield の仕様・価格は変わる。記載は 2026-10-11 時点の確認内容
