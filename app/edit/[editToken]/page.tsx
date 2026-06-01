import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PixelEditorClient from "@/components/editor/PixelEditorClient";
import { R2_PUBLIC_URL } from "@/lib/r2";

interface Props {
  params: Promise<{ editToken: string }>;
}

export default async function EditPage({ params }: Props) {
  const { editToken } = await params;

  const block = await prisma.pixelBlock.findFirst({
    where: { editToken, status: { in: ["ACTIVE", "LISTED"] } },
  });

  if (!block) {
    notFound();
  }

  const imageUrl = block.imageKey ? `${R2_PUBLIC_URL}/${block.imageKey}` : null;

  return (
    <PixelEditorClient
      blockId={block.id}
      editToken={block.editToken}
      x={block.x}
      y={block.y}
      width={block.width}
      height={block.height}
      existingImageUrl={imageUrl}
      status={block.status}
    />
  );
}
