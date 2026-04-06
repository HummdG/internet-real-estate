"use client";

import { useRef, useCallback } from "react";

function hexToRgba(hex: string): [number, number, number, number] {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return [r, g, b, 255];
}

function paintPixel(data: ImageData, px: number, py: number, size: number, rgba: [number, number, number, number]) {
  const half = Math.floor(size / 2);
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      const x = px + dx;
      const y = py + dy;
      if (x < 0 || y < 0 || x >= data.width || y >= data.height) continue;
      const idx = (y * data.width + x) * 4;
      data.data[idx] = rgba[0];
      data.data[idx + 1] = rgba[1];
      data.data[idx + 2] = rgba[2];
      data.data[idx + 3] = rgba[3];
    }
  }
}

/** Bresenham's line algorithm */
function* linePoints(x0: number, y0: number, x1: number, y1: number) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    yield { x: x0, y: y0 };
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

export function useBrushTool(
  buffer: ImageData | null,
  setBuffer: (b: ImageData) => void,
  pushUndo: (snap: ImageData) => void,
  color: string,
  brushSize: number
) {
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const strokeSnapshot = useRef<ImageData | null>(null);
  // Mutable working buffer for the current stroke — avoids stale React state closures
  const workingBuffer = useRef<ImageData | null>(null);

  const startStroke = useCallback(
    (px: number, py: number) => {
      if (!buffer) return;
      strokeSnapshot.current = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
      workingBuffer.current = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
      const rgba = hexToRgba(color);
      paintPixel(workingBuffer.current, px, py, brushSize, rgba);
      lastPos.current = { x: px, y: py };
      setBuffer(new ImageData(new Uint8ClampedArray(workingBuffer.current.data), workingBuffer.current.width, workingBuffer.current.height));
    },
    [buffer, color, brushSize, setBuffer]
  );

  const continueStroke = useCallback(
    (px: number, py: number) => {
      if (!workingBuffer.current || !lastPos.current) return;
      const rgba = hexToRgba(color);
      for (const pt of linePoints(lastPos.current.x, lastPos.current.y, px, py)) {
        paintPixel(workingBuffer.current, pt.x, pt.y, brushSize, rgba);
      }
      lastPos.current = { x: px, y: py };
      setBuffer(new ImageData(new Uint8ClampedArray(workingBuffer.current.data), workingBuffer.current.width, workingBuffer.current.height));
    },
    [color, brushSize, setBuffer]
  );

  const endStroke = useCallback(() => {
    if (strokeSnapshot.current) {
      pushUndo(strokeSnapshot.current);
      strokeSnapshot.current = null;
    }
    workingBuffer.current = null;
    lastPos.current = null;
  }, [pushUndo]);

  return { startStroke, continueStroke, endStroke };
}
