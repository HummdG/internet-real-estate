"use client";

import { useRef, useEffect, useCallback } from "react";
import { Tool } from "./useEditorState";
import { useBrushTool } from "./tools/useBrushTool";
import { useBucketTool } from "./tools/useBucketTool";

interface Props {
  width: number;
  height: number;
  buffer: ImageData | null;
  setBuffer: (b: ImageData) => void;
  pushUndo: (snap: ImageData) => void;
  tool: Tool;
  color: string;
  brushSize: number;
  onPickColor: (color: string) => void;
  zoom: number;
}

export default function EditorCanvas({
  width,
  height,
  buffer,
  setBuffer,
  pushUndo,
  tool,
  color,
  brushSize,
  onPickColor,
  zoom,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const cellSize = Math.max(1, zoom);
  const canvasW = width * cellSize;
  const canvasH = height * cellSize;

  const { startStroke, continueStroke, endStroke } = useBrushTool(buffer, setBuffer, pushUndo, color, brushSize);
  const { fill } = useBucketTool(buffer, setBuffer, pushUndo, color);

  // Render buffer to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Draw each pixel as a cellSize square
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext("2d")!;
    octx.putImageData(buffer, 0, 0);

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(offscreen, 0, 0, canvasW, canvasH);

    // Draw grid lines at zoom >= 4
    if (cellSize >= 4) {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasH);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasW, y * cellSize);
        ctx.stroke();
      }
    }
  }, [buffer, canvasW, canvasH, cellSize, width, height, dpr]);

  const getPixelCoords = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): { px: number; py: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        px: Math.floor((x / canvasW) * width),
        py: Math.floor((y / canvasH) * height),
      };
    },
    [canvasW, canvasH, width, height]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { px, py } = getPixelCoords(e);
      if (px < 0 || py < 0 || px >= width || py >= height) return;

      if (tool === "brush") {
        isDrawing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        startStroke(px, py);
      } else if (tool === "bucket") {
        fill(px, py);
      } else if (tool === "picker" && buffer) {
        const idx = (py * width + px) * 4;
        const r = buffer.data[idx].toString(16).padStart(2, "0");
        const g = buffer.data[idx + 1].toString(16).padStart(2, "0");
        const b = buffer.data[idx + 2].toString(16).padStart(2, "0");
        onPickColor(`#${r}${g}${b}`);
      }
    },
    [tool, getPixelCoords, startStroke, fill, buffer, width, onPickColor]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || tool !== "brush") return;
      const { px, py } = getPixelCoords(e);
      if (px < 0 || py < 0 || px >= width || py >= height) return;
      continueStroke(px, py);
    },
    [tool, getPixelCoords, continueStroke, width, height]
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      endStroke();
    }
  }, [endStroke]);

  const cursor =
    tool === "brush" ? "crosshair" :
    tool === "bucket" ? "cell" :
    tool === "picker" ? "copy" : "default";

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        imageRendering: "pixelated",
        cursor,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
