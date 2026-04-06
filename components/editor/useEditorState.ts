"use client";

import { useState, useRef, useCallback } from "react";

export type Tool = "brush" | "bucket" | "picker" | "import";

const MAX_UNDO = 30;

export interface EditorState {
  tool: Tool;
  color: string; // hex
  brushSize: number; // 1-8
  buffer: ImageData | null;
  zoom: number;
}

export function useEditorState(width: number, height: number) {
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#0055ff");
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [buffer, setBuffer] = useState<ImageData | null>(null);

  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  const pushUndo = useCallback((snapshot: ImageData) => {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return null;
    const prev = undoStack.current.pop()!;
    setBuffer((curr) => {
      if (curr) redoStack.current.push(curr);
      return prev;
    });
    return prev;
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    setBuffer((curr) => {
      if (curr) undoStack.current.push(curr);
      return next;
    });
    return next;
  }, []);

  const initBuffer = useCallback(
    (img?: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      if (img) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, width, height);
      }
      const data = ctx.getImageData(0, 0, width, height);
      setBuffer(data);
      undoStack.current = [];
      redoStack.current = [];
    },
    [width, height]
  );

  return {
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    zoom, setZoom,
    buffer, setBuffer,
    pushUndo, undo, redo,
    initBuffer,
  };
}
