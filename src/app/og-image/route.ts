import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * OGP画像をRoute Handlerで配信。
 * Content-Type: image/png を明示し、Facebook等のクローラーが正しく画像として認識できるようにする。
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "og-image.png");

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const imageBuffer = fs.readFileSync(filePath);

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
