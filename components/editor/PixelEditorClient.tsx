"use client";

import dynamic from "next/dynamic";

interface Props {
  blockId: string;
  editToken: string;
  x: number;
  y: number;
  width: number;
  height: number;
  existingImageUrl: string | null;
  status: string;
}

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

export default function PixelEditorClient(props: Props) {
  return <PixelEditor {...props} />;
}
