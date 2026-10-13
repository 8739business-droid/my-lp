# Higgsfield 現行仕様 確認済みファクト（確認日: 2026-10-11）

教材執筆時は**この文書に書かれた事実のみ**を断定して使うこと。ここに無い機能名・数値を断定して書いてはいけない。
不確実なものは「執筆時点」「要確認」と明記する。UI名は変わりうるため「〜に相当する機能」という書き方を併用する。

## 1. 制作面（スタジオ）

| 名称 | 内容 | URL |
|---|---|---|
| **Cinema Studio 4.0** | 映画制作用。Director's Panel でカメラ/レンズ/照明/色を指示。最長30秒、参照最大50点。エンジンは Seedance 2.5。2.5/3.0/3.5/4.0 を切替可 | https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio |
| **Marketing Studio** | 広告・商品・UGC用。2026-08にテンプレート先行型へ刷新、**1,500以上のテンプレート**。動画は最長15秒。**バッチ機能なし**（再生成で変種を作る）。MCP/Supercomputer からは未対応 | https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-marketing-studio-to-create-video-ads |
| **Ads Studio**（2026-10-01新設） | **静止画広告のみ**。ブランドキット（ロゴ/色/フォント/トーン/訴求軸）、商品カタログ取込、訴求軸ベースのコンセプト生成、**1商品あたり最大20案の一括生成** | https://higgsfield.ai/blog/higgsfield-ads-studio |
| **Ad Multiplier**（Ads Studio 内） | 既存の動画広告から、**動き・構図・カット・尺を保ったまま**人物/商品/服装/ロケーションを差し替えた変種を生成。フック・スクリプト・CTAの変更も可。入力は4〜30秒の動画＋画像最大20点 | https://higgsfield.ai/blog/ad-multiplier-ads-studio |
| **Genjutsu** | 既存動画の部分編集。Motion Transfer（動きの移植）と Object Swap。入力4〜30秒、参照最大30点、出力最大1080p | https://higgsfield.ai/blog/higgsfield-genjutsu |
| **AI Influencer**（2026-10-03刷新） | 19項目のメニュー選択でキャラクター生成（プロンプト不要） | https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-ai-influencer |
| その他 | Supercomputer（エージェント、有料プランのみ）、Canvas（ノード型）、3D Jutsu、Lipsync Studio、Higgsfield Audio、Popcorn（絵コンテ）、Katana（詳細は一次情報なし＝要確認） | https://higgsfield.ai/ |

- **Product Shots** は Marketing Studio 内のカテゴリ（Studio / Lifestyle / With Model）。
- Marketing Studio のカテゴリ：Product Shots / Ads（Meta・Google 入稿サイズ）/ Marketplace / Posters（唯一後編集可＝Higgsfield Layers）/ UGC Videos（Faceless・Talking Head・Silent、最長15秒）/ Motion（Hypermotion, 2D Product Motion, Mixed Media, Motion Design）/ Ref → Video。
- **Virality Predictor**：クリップの比較スコアリング機能あり。
- **食品専用の機能は存在しない**。「food mode」のような記述をしてはいけない。近いのは Product Shots（Studio/Lifestyle）、Hypermotion/2D Product Motion、Wan 2.6 の流体表現。
- **Draw to Video / Speak は現行で確認できない**。教材に登場させないこと。

## 2. 動画モデル（執筆時点）

| モデル | 版 | 得意 | 最大解像度 | 尺 | 音声 |
|---|---|---|---|---|---|
| Seedance | **2.5**（他に 2.0 / 2.0 Fast / 2.0 Mini / 2.5 Edit） | リアルな動き・人物の表情 | **2.5は1080pまで。4Kは2.0のみ** | 2.5 = 4〜30秒 / 2.0 = 4〜15秒 | ネイティブ音声、多言語リップシンク。音声ONでもクレジット増なし |
| Kling | 3.0 | **1回の生成で最大6カット**、物理的リアリティ、商品広告 | 4K表記あり（未確認） | 15秒 | 台詞/SFX/環境音、**Voice Binding**（キャラごとの声を固定）、日本語対応 |
| Veo | 3.1（Standard / Fast） | 複雑なシーン、キャラ一貫性、台詞主体の広告 | 720p / 1080p @24fps | **4 / 6 / 8秒** | 口の動きと表情つきの発話 |
| Wan | 2.6 | トーキングヘッド、参照動画の動きを保った作り替え、**流体・重力の物理表現を伴う商品カット** | 記載なし | 15秒 | ネイティブ同期音声 |
| Sora | 2 | 短尺SNS、シネマティック | 720p/1080p | 未確認 | 同期音声 |
| Higgsfield DoP | — | **image-to-video 専用**（text-to-video 不可）、プリセット化されたカメラ動作 | 記載なし | **3秒 または 5秒** | — |
| 他 | Grok Imagine 1.5、Gemini Omni Flash、MiniMax H3、Higgsfield Motion（Product Motion用） | | | | |

出典: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-seedance ほか各モデルページ

**4Kの注意**：マーケページには 4K 表記があるが、ヘルプセンターでは **Seedance 2.5 は1080p上限、4Kは2.0のみ**と明記。ヘルプセンター側を正とする。

## 3. 画像モデル

Soul 2.0（https://higgsfield.ai/soul-intro）、Soul Cinema（フィルムスチル調、https://higgsfield.ai/soul-cinema）、Nano Banana 2.1 / Pro、Seedream 5、Flux 2（Flux 3 の告知あり・UIでの提供は未確認）、**GPT Image 2（文字の正確な描画に強い）**、Ideogram 4.5、Recraft V4、Popcorn（絵コンテ）、MS Image（Marketing Studio の商品カット用）。

## 4. カメラ制御

**A. Cinema Studio 4.0 Director's Panel**（https://higgsfield.ai/blog/cinema-studio-4-0）
- Film Setup: Genre（General, Action, Epic, Drama, Comedy, Horror, Noir）/ Era（Auto, 60s, 80s, 90s, 2000s, 2020s）/ Tempo（Auto, Chaotic, Dynamic, Calm, Single Shot）
- Camera body: Auto, Modern, 35mm Film, 8mm Film, DV Camcorder
- Lens look: Auto, Clean Sharp, Anamorphic, Vintage Anamorphic, Warm Vintage, Halation Vintage
- Aperture: Auto, f/1.4, f/4, f/11
- Camera movement: **30以上のプリセット**（POV, Robot Arm, Pan Left, Helicopter Shot ほか）
- Lighting: Auto＋6プリセット（**Silhouette, Practicals, Window, Overhead Fall, Contre-jour, Soft Cross**）＋色/明るさ/拡散/角度の手動調整
- Color Palette: 50以上。生成後の Color Grading（色温度・コントラスト・彩度・シャープ・グレイン・ハイライト・露出）も可
- バージョン差: 3.5 はショット単位でカメラ/レンズ/焦点距離/絞りを設定、3.0 はカメラ移動＋7ジャンル＋8スピードランプ

**B. DoP プリセット（image-to-video）**（https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-dop）
カテゴリ: Basic Camera Control（弱）/ Epic Camera Control（強）/ Effects / Catch the Pulse / Mix / New & Trending / Top Choice。詳細設定は尺3or5秒・シード・ステップ。

**C. Academy のカメラ移動プロンプト集：46例**（Static shot, Pan right, Tilt up, Zoom in, Dolly zoom, Rack focus, Crane up, Drone orbit, Aerial pullback, Dolly in ほか）https://higgsfield.ai/academy

## 5. 一貫性の機能

- **参照画像**：Cinema Studio 4.0 / Seedance 2.5 は1回の生成で最大**50点**のマルチモーダル入力（2.5 = 画像30・動画10・音声10／2.0 = 画像9・動画3・音声3）。参照タイプは **@character / @style / @motion / @audio**。
- **Soul ID**：**20〜80枚**の写真から人物の同一性を学習。数分で学習完了。同一人物として認識できるレベルであり、ピクセル単位の同一ではない。1 Soul ID = 1人。ファイルとして書き出し不可。Seedance では **@ Elements → My Elements** に出現。
- **Elements**：Characters / Locations / Props をプロジェクト横断で再利用。Assets → Create Element から作成。**宿泊施設の客室・外観の一貫性確保に使える中核機能**。
- **AI Cast / Soul Cast**：シーン・角度・照明をまたいで外見を保つAIキャスト。
- **Emotion Wheel**：@タグ付けしたキャラに8種の感情を指定、4.0には表現強度スライダー。
- **始点・終点フレーム指定**：Seedance（first/last frame）、Veo 3.1（first + last image）、Wan 2.6（精密な first/last 制御）で可能。
- **「前のカットの続き」専用機能は存在しない**。Cinema Studio 4.0 の **Forward/Backward Extend**（アップロード動画を最大30秒まで前後に延長）か、「クリップAの最終フレームとクリップBの先頭フレームを参照にして間を生成する」という回避策で実現する。ワンクリック機能として教えてはいけない。
- **マルチショット**：Kling 3.0 は1回の生成で最大6カット。Kling の Element Consistency は外見と声を保持。
- **部分編集**：Seedance 2.5 Edit / Cinema Studio 4.0 の Edit Video で、ラベル・顔・物体・衣装などを全体再生成せずに差し替え可能。

## 6. 価格とクレジット（確認日 2026-10-11）

- **換算レート：1ドル = 20クレジット（1クレジット = $0.05）**
- プラン（公式ブログ記載）：Starter $15/月、Plus $49/月・年額$39/月、Ultra $129/月・年額$99/月。※料金ページ自体はJS描画で直接確認できず、ページのメタ情報には別の階層名も含まれるため、**プラン名は実際の画面で要確認**。
- 無料枠あり（クレジットなし、モデル制限あり）。サブスクのクレジットは**毎サイクルでリセットされ繰越されない**（Enterprise を除く）。
- **Unlimited モデル / 無料生成は higgsfield.ai のサイト上でのみ適用**。**MCP・CLI・Canvas・Supercomputer 経由の生成は常にクレジットを消費する**。2〜4枚のバッチは各々課金。生成失敗はほぼ自動返却。

**公開されている生成あたりのクレジット実費（教材で原価計算に使ってよい数値）**

| 生成物 | クレジット | 概算USD |
|---|---|---|
| Ads Studio 静止画広告 1点 | 4 | $0.20 |
| Ads Studio 20点バッチ | 80 | $4.00 |
| Marketing Studio 動画 8秒 720p | 47.62 | $2.38 |
| **Marketing Studio 動画 15秒 720p** | **89.2** | **$4.46** |
| Product Shot 2K | 1.5 | $0.075 |
| Poster 2K | 7.5 | $0.38 |
| AI Influencer キャラクター | 1.12 | $0.06 |
| Ad Multiplier（フック＋CTA、720p） | 最大140 | 約$7 |
| Ad Multiplier（CTAのみ、720p） | 最大35 | 約$1.75 |

出典: https://higgsfield.ai/blog/higgsfield-ads-studio / https://higgsfield.ai/blog/new-marketing-studio-higgsfield / https://higgsfield.ai/blog/ad-multiplier-ads-studio / https://higgsfield.ai/blog/new-ai-influencer

※第三者情報（Layer3Labs）ではプラン別クレジットを 約200 / 1,000 / 3,000 としているが**一次情報未確認**。教材では第三者情報と明記すること。

## 7. 商用利用（出典: https://higgsfield.ai/terms-of-use-agreement）

- Higgsfield は入力・出力の所有権を主張せず、出力の商用利用を制限しない旨を定めている。解約・アカウント削除後も書き出し済み出力の権利は存続し、顧客への移転・サブライセンスが可能。
- この条項は**有料限定とは書かれていない**。無料・有料の差は利用上限・保存期間・クレジットであり、所有権ではない。
- ただし注意点：出力の唯一性・独占性は保証されない。権利処理の責任は利用者。アップロードする人物の肖像・音声は権利と同意が必要。**法が求める場合のAI生成の開示が必要**で、来歴表示の除去は禁止。サービス自体の再販や競合モデルの学習利用は不可。**各モデル提供元の利用規約も適用され、より厳しい方が優先される**。
- **不整合に注意**：Soul のページは画像の商用利用可と明記、Sora 2 のページは商用利用を有料プランに紐づけている。§4.4 より狭い記述なので、どちらかを普遍のルールとして教えず、**不整合がある事実として伝える**。

## 8. 公式リソース

- Academy: https://higgsfield.ai/academy ／ 講座一覧: https://higgsfield.ai/academy/courses
- ヘルプセンター: https://higgsfield.ai/creator-hub/help-center
- ブログ（実質的な更新履歴）: https://higgsfield.ai/blog
- API コンソール: https://console.higgsfield.ai ／ MCP: https://higgsfield.ai/mcp
- 利用規約: https://higgsfield.ai/terms-of-use-agreement ／ プライバシー: https://higgsfield.ai/privacy-policy
- YouTube: https://www.youtube.com/@HiggsfieldAI ／ Discord: https://discord.com/invite/higgsfield

## 9. Academy 講座（全16件、URL確認済み・ログイン不要）

| # | 講座名 | URL | レベル | 構成 |
|---|---|---|---|---|
| 1 | Blockbuster 4K: The AI Filmmaking Pipeline | https://higgsfield.ai/academy/courses/blockbuster-4k | Intermediate | 10モジュール / 40分 |
| 2 | Build an Ultra-Realistic Short Film in 4K | https://higgsfield.ai/academy/courses/santiago-cinematic | Intermediate | 19 / 33分 |
| 3 | Add AI VFX to Real Footage | https://higgsfield.ai/academy/courses/ai-vfx-real-footage | Advanced | 11 / 12分 |
| 4 | Make an AI Animated Short | https://higgsfield.ai/academy/courses/ai-animated-short | Intermediate | 11 / 17分 |
| 5 | How to evaluate AI filmmaking demos | https://higgsfield.ai/academy/courses/seedance-25-ai-filmmaking | Beginner | 11 / 20分 |
| 6 | The 3-Step Realistic AI Ad Workflow | https://higgsfield.ai/academy/courses/ai-ad-3-step | Intermediate | 16 / 36分 |
| 7 | Build an AI Ad Agency with Claude + Higgsfield | https://higgsfield.ai/academy/courses/claude-higgsfield-ai-ad-agency | Beginner | 12 / 22分 |
| 8 | Seedance 4K: Cinematic Realism | https://higgsfield.ai/academy/courses/cinematic-realism-4k | Intermediate | 8 / 14分 |
| 9 | Build a Brand's Visuals with AI | https://higgsfield.ai/academy/courses/brand-visuals-ai | Intermediate | 9 / 26分 |
| 10 | Make a Cinematic Ad End-to-End | https://higgsfield.ai/academy/courses/cinematic-ad-e2e | Intermediate | 10 / 46分 |
| 11 | Automate a Faceless Niche Channel | https://higgsfield.ai/academy/courses/automate-faceless-niche | Intermediate | 11 / 10分 |
| 12 | Build a Faceless Channel | https://higgsfield.ai/academy/courses/faceless-channel | Beginner | 7 / 14分 |
| 13 | Mix AI with Real Footage | https://higgsfield.ai/academy/courses/mix-ai-real-footage | Intermediate | 10 / 5分 |
| 14 | Build 3D Games with MCP | https://higgsfield.ai/academy/courses/build-3d-games-mcp | Beginner | 10 / 12分 |
| 15 | Direct a cinematic AI car commercial | https://higgsfield.ai/academy/courses/cinematic-car-commercial | Intermediate | 11 / 35分 |
| 16 | Direct AI fight scenes through controlled iteration | https://higgsfield.ai/academy/courses/direct-ai-fight-scenes | Intermediate | 5 / 16分 |

※ 別途 https://higgsfield.ai/academy/courses/cinema-studio-pro（22モジュール / 58分）も存在するが一覧には未掲載。
※ 無効なスラッグは404ではなく Academy トップが表示されるため、リンク確認時はタイトル照合が必要。

### 事業化に直結する重要講座のモジュール構成

**#6 The 3-Step Realistic AI Ad Workflow（16）**: 完成広告と3ステップの全体像 → 商品シート(GPT Image 2.0) → 主役キャラ(Soul Cinema) → 脇役(AICast) → ロケーション固定（キッチン）→ キャラシートで顔を1つに固定 → 他ロケーション固定 → 衣装編集 → 小道具 → ショットリストとClaudeスキル → 各シーン生成 → 完成とまとめ

**#7 Build an AI Ad Agency with Claude + Higgsfield（12）**: 未開拓ニッチの発見 → オファー設計 → ClaudeとHiggsfieldの接続 → ポートフォリオ生成 → 顧客ヒアリング設計 → コールドアウトリーチ → バックオフィス構築 → 納品のサブスク化 → 品質管理ゲート → 営業サイト構築 → 見込み客へのローンチ → 収支の検証
→ **Week 6（商品化・営業）と完全に対応する**

**#9 Build a Brand's Visuals with AI（9）**: AIマーケティングのワークフロー → ブランド設計 → 商品作成 → Marketing Studio の試着 → Hyper Motion 広告 → SNS動画 → TVスポット → SNS・サイト用画像 → パッケージと開封

**#10 Make a Cinematic Ad End-to-End（10）**: アセット構築 → プロンプトのフレームワーク → 12シーンの制作 → パックショット → 反復こそが技術であるというまとめ

---

# 追補：モデル別クレジット単価と Unlimited（確認日 2026-10-11）

公式ヘルプセンターと公式ブログで確認した実数。**料金ページ自体はJS描画で読めないため、プラン名・価格・付与クレジット数は実画面で要確認。**

## 共通の仕組み（公式ヘルプセンター）
- 消費量は **モデル × 解像度 × 尺** で決まる。**生成ボタンに消費クレジットが表示され、設定を変えると数値も変わる**。公式に単価表は存在せず、アプリ内表示が唯一の正確な情報源。
- **バッチ出力は各々課金**（2枚なら2倍）。
- **音声のON/OFFでは費用は変わらない**（Seedance）。※古いブログに「音声で50〜100%増」とあるが、ヘルプセンターが新しく、こちらが正。
- 失敗した生成は**ほとんどが自動返却**されるが、**一部のモデルは返却されない場合がある**と明記。Manage Account → Usage で確認すること。
- 公式の推奨手順は「**720pの短尺で試作し、確定してから本番解像度・本番尺**」。

## 動画モデルの実測値（公式ブログ）

| モデル | 条件 | クレジット | 1秒あたり換算 |
|---|---|---|---|
| **Wan 2.7** | 5秒 720p | 8 | 1.6 |
| Wan 2.7 | 5秒 1080p | 13 | 2.6 |
| **Kling 3.0** | 5秒 720p | 10 | 2.0 |
| Kling 3.0 | 5秒 1080p | 12.5 | 2.5 |
| Kling 3.0 | 10秒 720p | 20 | 2.0 |
| **Seedance 2.0 Fast** | 8秒 720p | 28 | 3.5 |
| **Seedance 2.0** | 5秒 720p | 23 | 4.6 |
| Seedance 2.0 | 8秒 720p | 36 | 4.5 |
| Seedance 2.0 | 5秒 1080p | 45 | 9.0 |
| **Seedance 2.5** | 8秒 480p | 24 | 3.0 |
| Seedance 2.5 | 8秒 720p | 52 | 6.5 |
| Seedance 2.5 | 8秒 1080p | 72 | 9.0 |
| Seedance 2.5 | 10秒 720p | 70 | 7.0 |
| Cinema Studio | 5秒 720p | 25 | 5.0 |
| Cinema Studio | 10秒 1080p | 100 | 10.0 |
| Veo 3.1 Lite | 8秒 無音 | 8 | 1.0 |

- **尺はほぼ線形、解像度は720p→1080pでほぼ倍**。ただし Seedance 2.5 は10秒以上で1秒単価が上がる。
- **Kling 3.0 は解像度の弾性が異常に低い**（720p→1080pで1.25倍のみ）。1080pの練習をするなら最安。
- **Higgsfield DoP、Seedance 2.0 Mini、2.5 Edit の単価は一次・三次情報とも記載なし（未確認）**。生成ボタンで確認すること。
- Wan は現行カタログ上 **2.7**（と第三者情報では 3.0）。「2.6」は現行では確認できない。

## 画像モデルの実測値（公式ブログ）

| モデル | 条件 | クレジット |
|---|---|---|
| **Soul 2.0** | 2Kまで | **0.125** |
| Nano Banana 2 / Pro | 1K・2K | 2 |
| Nano Banana 2 / Pro | 4K | 4 |
| 画像編集ツール | — | 1.5 |

**Soul 2.0 の 0.125 クレジット/枚は、Nano Banana の16分の1、Seedance 2.5 の720p 8秒動画の416分の1。** 静止画で学べることは全部ここで学ぶのが費用的に正しい。画像は1Kと2Kが同額で、**4Kだけ倍**。しかも Unlimited は常に2K上限なので、4Kを選ぶと課金モードに落ちる。

## Unlimited の対象（公式ブログ・23モデル）

- **画像（11）**: Seedream 5.0 Pro / 5.0 Lite / 4.5、Nano Banana Pro / 2 / 無印、Kling O1 Image、GPT Image 2 / High、**Soul 2.0**、Flux.2 Pro
- **動画（7）**: **Seedance 2.0 / 2.0 Mini / 2.0 Fast、Kling 3.0、Kling 3.0 Motion Control、Wan 2.7**、Gemini Omni Flash
- **音声（5）**: Seed Audio 1.0、Eleven v3、MiniMax Speech 2.8 HD、VibeVoice、Seed Speech

**対象外で常に課金されるもの（重要）**
- **Seedance 2.5、Higgsfield DoP、Veo**
- **MCP、CLI、Canvas、Supercomputer**
- **Marketing Studio、Shorts Studio、Presets、Apps、Plugins、Studios のすべて** ← Marketing Studio の 8秒720p=47.62cr が高いのはこのため。同じ条件を素のモデルで作れば Kling 3.0 で16cr、Wan 2.7 で約13cr。**テンプレート経由を避けるだけで3〜4倍安くなる。**

**仕組み**：対象モデルでは生成パネルに Unlimited のトグルが出る。OFF にするとクレジット消費と引き換えに優先キューに入る。Unlimited は標準キュー（速度変動あり）で、**同時実行は画像1・動画1・音声1**。Plus 以上が対象で、**Starter と Basic は対象外**。多くは365日、最新の主力モデルは7日程度。Plus 以上の購入には7日間の All Unlimited ウィンドウが付く。

## 無料で使える枠

- **無料プラン**：クレジット0、使えるモデルは限定、**全出力にウォーターマーク**（解除は有料プラン加入のみ、単体販売なし）、商用利用不可、同時1本。**日次の無料生成数は公式に示されていない**（第三者は「1日5回」「10クレジット/日」説を否定）。
- **1日（24時間）無料 All Unlimited トライアル**：$0、カード登録必要だが請求なし、新規かつ無料プランのみ1回、**ウォーターマークなし**、解像度・尺は月額 Plus 相当、23モデル全対象、同時1本。**24時間後に自動で月額 Plus へ移行**するので、不要なら期間内に解約する（6時間前に警告メール、解約してもトライアル終了までは使える）。

## プランと追加購入

| 出典 | Starter | Plus | Ultra |
|---|---|---|---|
| 公式ブログ（3〜4本が一致） | $15/月・200cr | $49/月（年$39）・1,000cr | $129/月（年$99）・3,000cr |
| 第三者2社（独立に一致） | $19/月・270cr | $59/月（年$47）・1,200cr | $129/月（年$99）・3,000cr |

**食い違っている。契約前に料金ページを実機で確認すること。** Plus と Ultra の間に「Max」という階層が公式の Unlimited 表に登場するが、価格情報は見つからない。

- **クレジットパック**：100〜4,000の固定枚数と5,000以上の可変。**価格は購入画面でのみ表示**。90日で失効。未使用なら7日以内返金可。購入にはサブスク契約が必要。
- **Auto-Refill**：$20 / $40 / $90 / $150 / $300。レートは **$1 = 18クレジット** で、基準の20クレジット/$より約10%割高。90日失効。下位プランでは利用不可。
- **消費順**：サブスク分 → 失効が近い順。サブスク分は毎サイクルでリセットされ繰り越されない。
- **学割は公開情報なし。** プロモコードは公式SNSとDiscordで先行告知され、個別請求はできない。
- サブスクの返金は初回購入から7日以内かつクレジット未使用の場合のみ、最大6%の手数料。更新分は返金不可。

## 同時実行

- Unlimited モード：画像1・動画1・音声1（種類ごとに1本）
- 課金モード：優先キュー、上位プランで最大8本程度
- **プラン別の基本同時実行数は公式に非公開**。第三者2社の情報も食い違う。
- Concurrency Boost で +4 / +8 / +12 / +16（最大+16）。**価格非公開**。
