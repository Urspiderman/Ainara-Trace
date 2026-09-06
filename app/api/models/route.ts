import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum tersedia" },
      { status: 500 }
    );
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models",
    {
      headers: {
        "x-goog-api-key": apiKey,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  const models = (data.models ?? [])
    .filter((model: { supportedGenerationMethods?: string[] }) =>
      model.supportedGenerationMethods?.includes("generateContent")
    )
    .map((model: { name: string }) => model.name);

  return NextResponse.json({ models });
}