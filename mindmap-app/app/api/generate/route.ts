import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIMindMap, GenerateRequest } from "@/lib/aiTypes";

export const runtime = "nodejs";

const MODEL = "claude-opus-5-5";

const NEW_SYSTEM = `あなたはマインドマップ生成のエキスパートです。
与えられたテーマから、構造化されたマインドマップを生成します。

以下のルールを守ってください:
- 中心テーマから枝分かれする主要なブランチを 4〜7 個生成する
- 各ブランチには 2〜5 個の子ノードを付ける
- 深さは最大 3 レベルまで（中心＋2段）
- 各ノードのテキストは20字以内、簡潔に
- 必要に応じてアイコン（絵文字 1 文字）を付与
- 出力は必ず有効な JSON のみ。他のテキストや Markdown コードフェンスは一切書かない

出力形式:
{
  "title": "中心テーマ",
  "children": [
    {"text": "ブランチ1", "icon": "🎯", "children": [
      {"text": "子1"},
      {"text": "子2"}
    ]}
  ]
}`;

const EXPAND_SYSTEM = `あなたはマインドマップ生成のエキスパートです。
既存のマインドマップ中のあるノードに対して、サブトピックを生成します。

ルール:
- 子ノードを 3〜6 個生成する
- 各子ノードには 0〜3 個のさらに下位の子ノードを付けてよい
- 各ノードのテキストは20字以内
- 既にある兄弟ノードやコンテキストと重複しない内容にする
- 出力は必ず有効な JSON のみ。コードフェンスは不要

出力形式 (title は対象ノードのテキストをそのまま入れる):
{
  "title": "対象ノードのテキスト",
  "children": [
    {"text": "子1", "children": [{"text": "孫1"}]},
    {"text": "子2"}
  ]
}`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY が設定されていません。.env.local に ANTHROPIC_API_KEY を設定してください。",
      },
      { status: 503 },
    );
  }

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "prompt が必要です" },
      { status: 400 },
    );
  }
  if (body.prompt.length > 2000) {
    return NextResponse.json(
      { error: "プロンプトが長すぎます (最大2000文字)" },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  const system = body.mode === "expand" ? EXPAND_SYSTEM : NEW_SYSTEM;
  const userText =
    body.mode === "expand"
      ? `対象ノード: 「${body.nodeText}」\n親からの経路: ${body.context.join(" > ")}\n\n要望: ${body.prompt}`
      : body.prompt;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      output_config: { effort: "medium" },
      messages: [{ role: "user", content: userText }],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "AI から応答がありませんでした" },
        { status: 500 },
      );
    }

    const parsed = tryParseJson(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI の応答を解析できませんでした", raw: textBlock.text },
        { status: 500 },
      );
    }

    return NextResponse.json({ map: parsed });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "レート制限に達しました。少し待って再度お試しください。" },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY が無効です" },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API エラー: ${err.message}` },
        { status: err.status ?? 500 },
      );
    }
    return NextResponse.json(
      { error: `予期しないエラー: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

function tryParseJson(text: string): AIMindMap | null {
  // Strip common wrappers like ```json ... ``` just in case.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === "object" && typeof obj.title === "string" && Array.isArray(obj.children)) {
      return obj as AIMindMap;
    }
  } catch {
    // Try to extract the first JSON object substring.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const obj = JSON.parse(cleaned.slice(start, end + 1));
        if (obj && typeof obj.title === "string" && Array.isArray(obj.children)) {
          return obj as AIMindMap;
        }
      } catch {
        // fall through
      }
    }
  }
  return null;
}
