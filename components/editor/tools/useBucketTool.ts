"use client";

import { useCallback } from "react";

function hexToRgba(hex: string): [number, number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
    255,
  ];
}

function getPixel(data: Uint8ClampedArray, idx: number): [number, number, number, number] {
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function colorsMatch(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/** Iterative BFS flood fill — no recursion to avoid stack overflow */
function floodFill(data: ImageData, startX: number, startY: number, fillColor: [number, number, number, number]) {
  const { width, height } = data;
  const startIdx = (startY * width + startX) * 4;
  const targetColor = getPixel(data.data, startIdx);

  if (colorsMatch(targetColor, fillColor)) return; // already this color

  const queue: number[] = [startX + startY * width];
  const visited = new Uint8Array(width * height);
  visited[startX + startY * width] = 1;

  while (queue.length > 0) {
    const pos = queue.pop()!;
    const px = pos % width;
    const py = Math.floor(pos / width);
    const idx = pos * 4;

    data.data[idx] = fillColor[0];
    data.data[idx + 1] = fillColor[1];
    data.data[idx + 2] = fillColor[2];
    data.data[idx + 3] = fillColor[3];

    const neighbors = [
      [px - 1, py], [px + 1, py],
      [px, py - 1], [px, py + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const npos = nx + ny * width;
      if (visited[npos]) continue;
      visited[npos] = 1;
      const nidx = npos * 4;
      if (colorsMatch(getPixel(data.data, nidx), targetColor)) {
        queue.push(npos);
      }
    }
  }
}

export function useBucketTool(
  buffer: ImageData | null,
  setBuffer: (b: ImageData) => void,
  pushUndo: (snap: ImageData) => void,
  color: string
) {
  const fill = useCallback(
    (px: number, py: number) => {
      if (!buffer) return;
      const snapshot = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
      const copy = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
      floodFill(copy, px, py, hexToRgba(color));
      pushUndo(snapshot);
      setBuffer(copy);
    },
    [buffer, color, setBuffer, pushUndo]
  );

  return { fill };
}
