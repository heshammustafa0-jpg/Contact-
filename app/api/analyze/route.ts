import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const maxDuration = 120;

interface ImageData {
  data: string;
  type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "مفتاح API غير موجود. يرجى إضافة ANTHROPIC_API_KEY إلى متغيرات البيئة.",
      },
      { status: 500 }
    );
  }

  let body: { images: ImageData[]; toyNames: string[]; mode: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { images, toyNames, mode } = body;

  if (!images || images.length === 0) {
    return NextResponse.json(
      { error: "يرجى رفع صورة واحدة على الأقل" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  type ContentBlock =
    | Anthropic.Messages.ImageBlockParam
    | Anthropic.Messages.TextBlockParam;

  const content: ContentBlock[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.type,
        data: img.data,
      },
    });

    const label =
      images.length === 1
        ? "اللعبة المرفقة"
        : i === 0
        ? "اللعبة الأولى"
        : "اللعبة الثانية";

    const nameNote = toyNames[i] ? ` (${toyNames[i]})` : "";
    content.push({
      type: "text",
      text: `الصورة أعلاه هي ${label}${nameNote}.`,
    });
  }

  const instruction =
    mode === "comparison"
      ? "قم بمقارنة اللعبتين التعليميتين في الصورتين المرفقتين. أصدر تقريراً احترافياً شاملاً يتضمن تقييم كل لعبة على حدة ثم قسم المقارنة الكامل مع جميع الجداول والتقييمات المطلوبة."
      : "قم بتحليل اللعبة التعليمية في الصورة المرفقة. أصدر تقريراً احترافياً شاملاً يتضمن جميع الأقسام والجداول والتقييمات المطلوبة.";

  content.push({ type: "text", text: instruction });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const reportText =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return NextResponse.json({ report: reportText });
  } catch (err) {
    const error = err as Error & { status?: number };
    const message =
      error.status === 401
        ? "مفتاح API غير صالح. يرجى التحقق من ANTHROPIC_API_KEY."
        : error.status === 429
        ? "تجاوزت حد الطلبات. يرجى المحاولة لاحقاً."
        : `خطأ في التحليل: ${error.message}`;

    return NextResponse.json({ error: message }, { status: error.status || 500 });
  }
}
