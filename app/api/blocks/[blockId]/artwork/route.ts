import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compositeArtwork } from "@/lib/grid/compositor";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;

  // Authenticate via Bearer editToken
  const auth = req.headers.get("authorization") ?? "";
  const editToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!editToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const block = await prisma.pixelBlock.findFirst({
    where: { id: blockId, editToken, status: { in: ["ACTIVE", "LISTED"] } },
  });

  if (!block) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  // Read PNG body
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 413 });
  }

  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 413 });
  }

  const artworkPng = Buffer.from(arrayBuffer);

  // Composite onto master grid
  const masterUrl = await compositeArtwork(
    block.x,
    block.y,
    block.width,
    block.height,
    artworkPng
  );

  // Store per-block image key
  const imageKey = `blocks/${block.id}.png`;
  // The per-block image is the artwork itself (not the master)
  await prisma.pixelBlock.update({
    where: { id: blockId },
    data: { imageKey },
  });

  return NextResponse.json({ masterImageUrl: masterUrl });
}
