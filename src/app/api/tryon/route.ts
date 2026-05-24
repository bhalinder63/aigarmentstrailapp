import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

const MODEL_VERSION = "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

const CATEGORY_LABELS: Record<string, string> = {
  upper_body: "upper body garment",
  lower_body: "lower body garment",
  dresses: "dress or full outfit",
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = new Uint8Array(
    atob(b64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  return new Blob([bytes], { type: mime });
}

export async function POST(req: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured." }, { status: 500 });
  }

  let body: { personImage: string; garmentImage: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { personImage, garmentImage, category = "upper_body" } = body;

  if (!personImage || !garmentImage) {
    return NextResponse.json({ error: "Both images are required." }, { status: 400 });
  }

  const replicate = new Replicate({ auth: apiToken });

  try {
    const personBlob = dataUrlToBlob(personImage);
    const garmentBlob = dataUrlToBlob(garmentImage);

    // SDK auto-uploads Blobs to Replicate file storage and passes HTTPS URLs to the model
    const output = await replicate.run(MODEL_VERSION, {
      input: {
        human_img: personBlob,
        garm_img: garmentBlob,
        garment_des: CATEGORY_LABELS[category] ?? "garment",
        category,
        crop: false,
        force_dc: category === "dresses",
      },
    });

    return NextResponse.json({ result: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Tryon error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
