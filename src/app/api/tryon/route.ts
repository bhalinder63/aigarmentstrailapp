import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const [header, data] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  return { buffer: Buffer.from(data, "base64"), mimeType };
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
    const { buffer: personBuf, mimeType: personMime } = dataUrlToBuffer(personImage);
    const { buffer: garmentBuf, mimeType: garmentMime } = dataUrlToBuffer(garmentImage);

    // Upload both images to Replicate file storage to get proper HTTPS URLs
    const [personFile, garmentFile] = await Promise.all([
      replicate.files.create(new Blob([new Uint8Array(personBuf)], { type: personMime }), { filename: "person.jpg" }),
      replicate.files.create(new Blob([new Uint8Array(garmentBuf)], { type: garmentMime }), { filename: "garment.jpg" }),
    ]);

    // Run IDM-VTON using latest version (no hardcoded hash)
    const output = await replicate.run("cuuupid/idm-vton", {
      input: {
        human_img: personFile.urls.get,
        garm_img: garmentFile.urls.get,
        garment_des: category,
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      },
    });

    return NextResponse.json({ result: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Try-on failed.";
    console.error("Tryon error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
