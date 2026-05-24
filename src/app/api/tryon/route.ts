import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not configured." },
      { status: 500 }
    );
  }

  let body: { personImage: string; garmentImage: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { personImage, garmentImage, category = "upper_body" } = body;

  if (!personImage || !garmentImage) {
    return NextResponse.json(
      { error: "Both personImage and garmentImage are required." },
      { status: 400 }
    );
  }

  const replicate = new Replicate({ auth: apiToken });

  try {
    // IDM-VTON — state-of-the-art virtual try-on model
    const output = await replicate.run(
      "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d7f0f23b",
      {
        input: {
          human_img: personImage,
          garm_img: garmentImage,
          garment_des: category,
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }
    );

    return NextResponse.json({ result: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Try-on failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
