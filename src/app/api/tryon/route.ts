import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const FASHN_BASE = "https://api.fashn.ai/v1";

async function poll(id: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + 55_000; // stay under 60s function limit
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${FASHN_BASE}/status/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.status === "completed") {
      const url = Array.isArray(data.output) ? data.output[0] : data.output;
      if (!url) throw new Error("No output image returned.");
      return url;
    }
    if (data.status === "failed") {
      throw new Error(data.error ?? "Try-on failed on Fashn.ai.");
    }
  }
  throw new Error("Try-on timed out. Please try again.");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FASHN_API_KEY is not configured." }, { status: 500 });
  }

  let body: { personImage: string; garmentImage: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { personImage, garmentImage } = body;
  if (!personImage || !garmentImage) {
    return NextResponse.json({ error: "Both images are required." }, { status: 400 });
  }

  try {
    // Start the try-on prediction
    const runRes = await fetch(`${FASHN_BASE}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "tryon-max",
        inputs: {
          model_image: personImage,
          product_image: garmentImage,
          resolution: "1k",
          generation_mode: "balanced",
        },
      }),
    });

    const runData = await runRes.json();
    if (!runRes.ok || runData.error) {
      throw new Error(runData.error ?? `Fashn.ai error: ${runRes.status}`);
    }

    const predictionId = runData.id;
    if (!predictionId) throw new Error("No prediction ID returned.");

    // Poll until done
    const resultUrl = await poll(predictionId, apiKey);
    return NextResponse.json({ result: resultUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Tryon error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
