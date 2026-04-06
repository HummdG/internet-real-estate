import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import { R2_PUBLIC_URL } from "@/lib/r2";

const PixelEditor = dynamic(() => import("@/components/editor/PixelEditor"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "#333",
        letterSpacing: "0.1em",
        background: "#000",
      }}
    >
      LOADING EDITOR...
    </div>
  ),
});

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
    <PixelEditor
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
