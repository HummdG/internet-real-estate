"use client";

import { useCallback } from "react";

export function useImportTool(
  width: number,
  height: number,
  buffer: ImageData | null,
  setBuffer: (b: ImageData) => void,
  pushUndo: (snap: ImageData) => void
) {
  const importImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d")!;
        ctx.imageSmoothingEnabled = false; // nearest-neighbor
        ctx.drawImage(img, 0, 0, width, height);
        const newData = ctx.getImageData(0, 0, width, height);
        if (buffer) {
          pushUndo(new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height));
        }
        setBuffer(newData);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    input.click();
  }, [width, height, buffer, setBuffer, pushUndo]);

  return { importImage };
}
