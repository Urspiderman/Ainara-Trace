import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are AINARA Assistant, a concise B2B assistant for AINARA Trace, a digital traceability platform for recycled gold. Explain platform workflows clearly. AINARA records and connects provenance data; it is not a certification body and must not claim to independently certify legality or origin. When discussing verification, refer to verification partners or competent third parties. Avoid inventing transaction facts. Respond in Indonesian unless the user asks for another language.`;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages?: Message[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      content: "Saya siap membantu menjelaskan AINARA. Untuk mode AI penuh, tambahkan OPENAI_API_KEY di environment Vercel atau .env.local. Saat ini prototype dapat tetap digunakan dengan data demo.",
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
  model,
  input: [
  {
    role: "developer",
    content: SYSTEM_PROMPT,
  },
  ...messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
],
  max_output_tokens: 500,
}),
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    console.error("OpenAI error", errorText);
    return NextResponse.json({ content: "Maaf, AINARA Assistant sedang mengalami kendala. Silakan coba lagi." }, { status: 200 });
  }

  const data = await upstream.json();
  const content = data.output_text ?? "Maaf, saya belum mendapatkan respons.";
  return NextResponse.json({ content });
}
