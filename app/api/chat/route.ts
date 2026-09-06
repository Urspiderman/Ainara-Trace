import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
Kamu adalah AINARA Assistant, asisten AI untuk platform AINARA Trace.

AINARA adalah digital traceability platform untuk recycled gold.
Kamu membantu pengguna memahami:
- supplier
- gold batch
- traceability
- verification record
- document intelligence
- anomaly detection
- reporting

Jawab dalam Bahasa Indonesia yang profesional, jelas, dan ringkas.
Jangan mengklaim bahwa AINARA dapat menjamin legalitas atau membuktikan bahwa emas berasal dari sumber tertentu.
AINARA menyediakan data traceability dan evidence untuk mendukung proses verification, audit, dan compliance.
`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY belum dikonfigurasi. Tambahkan API key Gemini.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const messages: Message[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error", JSON.stringify(data, null, 2));

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Gemini API mengalami kendala.",
        },
        { status: response.status }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("") || "Maaf, saya belum dapat memberikan jawaban.";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat API error", error);

    return NextResponse.json(
      {
        error: "AINARA Assistant mengalami kendala.",
      },
      { status: 500 }
    );
  }
}