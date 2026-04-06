"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { BlockMeta, buildPixelOwnerMap, getBlockAt, isRegionFree } from "@/lib/grid/blockIndex";
import { GRID_SIZE } from "@/lib/grid/constants";
import PurchaseModal from "@/components/modals/PurchaseModal";
import BlockInfoModal from "@/components/modals/BlockInfoModal";

interface GridData {
  masterImageUrl: string | null;
  blocks: BlockMeta[];
}

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Clamp a value between min and max
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function PixelGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [gridData, setGridData] = useState<GridData>({ masterImageUrl: null, blocks: [] });
  const [pixelOwnerMap, setPixelOwnerMap] = useState<Uint32Array | null>(null);

  // Fit zoom: show all 1M pixels by default; stored so reset can return here
  const fitZoom = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Compute fit-zoom: grid always fills full container width
  const applyFit = useCallback(() => {
    if (!wrapperRef.current) return;
    const { width, height } = wrapperRef.current.getBoundingClientRect();
    if (width === 0) return;
    const z = width / GRID_SIZE;
    fitZoom.current = z;
    setZoom(z);
    setPan({ x: 0, y: Math.min(0, (height - z * GRID_SIZE) / 2) });
  }, []);

  useEffect(() => {
    // Wait one frame so the DOM has finished layout
    const raf = requestAnimationFrame(applyFit);
    window.addEventListener("resize", applyFit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", applyFit);
    };
  }, [applyFit]);

  // Freeform paint selection: a Set of encoded positions (y * GRID_SIZE + x)
  const [selectedPixels, setSelectedPixels] = useState<Set<number>>(new Set());
  const isSelecting = useRef(false);
  const [selectMode, setSelectMode] = useState<"brush" | "rect">("brush");

  // Undo stack for selection changes
  const undoStack = useRef<Set<number>[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const pushUndo = useCallback((snapshot: Set<number>) => {
    undoStack.current.push(new Set(snapshot));
    if (undoStack.current.length > 30) undoStack.current.shift();
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    setSelectedPixels(prev);
    setCanUndo(undoStack.current.length > 0);
  }, []);

  // Hover / tooltip / magnifier state
  const [hoveredBlock, setHoveredBlock] = useState<BlockMeta | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoverCell, setHoverCell] = useState<{ gx: number; gy: number } | null>(null);
  const magnifierRef = useRef<HTMLCanvasElement>(null);
  const masterImgRef = useRef<HTMLImageElement | null>(null);

  // Keep a decoded Image for magnifier use
  useEffect(() => {
    if (!gridData.masterImageUrl) { masterImgRef.current = null; return; }
    const img = new Image();
    img.src = gridData.masterImageUrl;
    masterImgRef.current = img;
  }, [gridData.masterImageUrl]);

  // Modal state
  const [purchaseSelection, setPurchaseSelection] = useState<Selection | null>(null);
  const [purchasePaintedCount, setPurchasePaintedCount] = useState(0);
  const [clickedBlock, setClickedBlock] = useState<BlockMeta | null>(null);

  // Pan state refs
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Drag-select state: track start pixel and current hover pixel for rectangle preview
  const dragStartPixel = useRef<{ gx: number; gy: number } | null>(null);
  const [dragCurrentPixel, setDragCurrentPixel] = useState<{ gx: number; gy: number } | null>(null);

  // Fetch grid data on mount
  useEffect(() => {
    fetch("/api/grid")
      .then((r) => r.json())
      .then((data: GridData) => {
        setGridData(data);
        setPixelOwnerMap(buildPixelOwnerMap(data.blocks));
      })
      .catch(console.error);
  }, []);

  // Refresh after purchase / artwork save
  const refreshGrid = useCallback(() => {
    fetch("/api/grid")
      .then((r) => r.json())
      .then((data: GridData) => {
        setGridData(data);
        setPixelOwnerMap(buildPixelOwnerMap(data.blocks));
      })
      .catch(console.error);
  }, []);

  // ESC clears selection; Ctrl+Z undoes last drag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pushUndo(selectedPixels);
        setSelectedPixels(new Set());
        setCanUndo(undoStack.current.length > 0);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, pushUndo, selectedPixels]);

  // Canvas cell size in CSS pixels
  const cellSize = zoom;

  // Convert screen coords to grid coords
  const screenToGrid = useCallback(
    (sx: number, sy: number): { gx: number; gy: number } | null => {
      if (!containerRef.current) return null;
      // containerRef is the inner moving div — getBoundingClientRect already includes pan offset
      const rect = containerRef.current.getBoundingClientRect();
      const localX = sx - rect.left;
      const localY = sy - rect.top;
      const gx = Math.floor(localX / cellSize);
      const gy = Math.floor(localY / cellSize);
      if (gx < 0 || gy < 0 || gx >= GRID_SIZE || gy >= GRID_SIZE) return null;
      return { gx, gy };
    },
    [cellSize]
  );

  // Bounding rectangle of all painted pixels (what the backend actually purchases)
  const selectionBounds = useMemo((): Selection | null => {
    if (selectedPixels.size === 0) return null;
    let minX = GRID_SIZE, minY = GRID_SIZE, maxX = -1, maxY = -1;
    for (const pos of selectedPixels) {
      const x = pos % GRID_SIZE;
      const y = Math.floor(pos / GRID_SIZE);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }, [selectedPixels]);

  // Live rectangle preview while drag-selecting
  const dragPreviewRect = (dragStartPixel.current && dragCurrentPixel) ? {
    x: Math.min(dragStartPixel.current.gx, dragCurrentPixel.gx),
    y: Math.min(dragStartPixel.current.gy, dragCurrentPixel.gy),
    width: Math.abs(dragCurrentPixel.gx - dragStartPixel.current.gx) + 1,
    height: Math.abs(dragCurrentPixel.gy - dragStartPixel.current.gy) + 1,
  } : null;

  // Draw overlay canvas: owned block outlines + painted selection pixels
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridPx = GRID_SIZE * cellSize;
    canvas.width = gridPx;
    canvas.height = gridPx;
    ctx.clearRect(0, 0, gridPx, gridPx);

    // Draw owned block outlines
    if (gridData.blocks.length > 0) {
      gridData.blocks.forEach((b) => {
        const bx = b.x * cellSize;
        const by = b.y * cellSize;
        const bw = b.width * cellSize;
        const bh = b.height * cellSize;

        if (b.listed) {
          ctx.strokeStyle = "rgba(255,200,0,0.8)";
          ctx.lineWidth = Math.max(1, cellSize * 0.1);
          ctx.strokeRect(bx, by, bw, bh);
        } else {
          ctx.strokeStyle = "rgba(0,85,255,0.4)";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, bw, bh);
        }
      });
    }

    // Draw each painted pixel individually
    if (selectedPixels.size > 0) {
      ctx.fillStyle = "rgba(0,85,255,0.4)";
      for (const pos of selectedPixels) {
        const px = (pos % GRID_SIZE) * cellSize;
        const py = Math.floor(pos / GRID_SIZE) * cellSize;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }

    // Draw live drag-select rectangle preview
    if (dragPreviewRect) {
      const px = dragPreviewRect.x * cellSize;
      const py = dragPreviewRect.y * cellSize;
      const pw = dragPreviewRect.width * cellSize;
      const ph = dragPreviewRect.height * cellSize;
      ctx.fillStyle = "rgba(0,85,255,0.12)";
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "rgba(0,85,255,0.9)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
    }
  }, [selectedPixels, gridData.blocks, cellSize, dragPreviewRect]);

  // Magnifier constants
  const MAG_DISPLAY = 160; // canvas size in CSS px
  const MAG_CELLS = 21;    // how many grid cells to show (odd = centered)
  const MAG_CELL_PX = MAG_DISPLAY / MAG_CELLS; // px per cell in magnifier

  // Draw magnifier whenever hoverCell changes
  useEffect(() => {
    const canvas = magnifierRef.current;
    if (!canvas || !hoverCell) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    canvas.width = MAG_DISPLAY * DPR;
    canvas.height = MAG_DISPLAY * DPR;
    ctx.scale(DPR, DPR);

    const half = Math.floor(MAG_CELLS / 2);
    const { gx, gy } = hoverCell;

    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, MAG_DISPLAY, MAG_DISPLAY);

    // Master image (if loaded)
    if (masterImgRef.current?.complete && masterImgRef.current.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const srcX = gx - half;
      const srcY = gy - half;
      ctx.drawImage(masterImgRef.current, srcX, srcY, MAG_CELLS, MAG_CELLS, 0, 0, MAG_DISPLAY, MAG_DISPLAY);
    }

    // Owned block fills
    if (pixelOwnerMap) {
      for (let dy = 0; dy < MAG_CELLS; dy++) {
        for (let dx = 0; dx < MAG_CELLS; dx++) {
          const cx = gx - half + dx;
          const cy = gy - half + dy;
          if (cx < 0 || cy < 0 || cx >= GRID_SIZE || cy >= GRID_SIZE) continue;
          const idx = getBlockAt(pixelOwnerMap, cx, cy);
          if (idx < 0) continue;
          ctx.fillStyle = gridData.blocks[idx]?.listed ? "rgba(255,200,0,0.35)" : "rgba(0,85,255,0.2)";
          ctx.fillRect(dx * MAG_CELL_PX, dy * MAG_CELL_PX, MAG_CELL_PX, MAG_CELL_PX);
        }
      }
    }

    // Selected pixels
    ctx.fillStyle = "rgba(0,85,255,0.45)";
    for (let dy = 0; dy < MAG_CELLS; dy++) {
      for (let dx = 0; dx < MAG_CELLS; dx++) {
        const cx = gx - half + dx;
        const cy = gy - half + dy;
        if (cx < 0 || cy < 0 || cx >= GRID_SIZE || cy >= GRID_SIZE) continue;
        if (selectedPixels.has(cy * GRID_SIZE + cx))
          ctx.fillRect(dx * MAG_CELL_PX, dy * MAG_CELL_PX, MAG_CELL_PX, MAG_CELL_PX);
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(180,180,180,0.8)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= MAG_CELLS; i++) {
      const p = i * MAG_CELL_PX;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, MAG_DISPLAY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(MAG_DISPLAY, p); ctx.stroke();
    }

    // Center cell highlight
    ctx.strokeStyle = "rgba(255,60,60,0.9)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(half * MAG_CELL_PX + 0.75, half * MAG_CELL_PX + 0.75, MAG_CELL_PX - 1.5, MAG_CELL_PX - 1.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverCell, selectedPixels, gridData.blocks, pixelOwnerMap]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || e.altKey) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return;

      const pos = screenToGrid(e.clientX, e.clientY);
      if (!pos) return;

      // Clicking an owned pixel opens BlockInfoModal
      if (pixelOwnerMap) {
        const idx = getBlockAt(pixelOwnerMap, pos.gx, pos.gy);
        if (idx >= 0) {
          setClickedBlock(gridData.blocks[idx]);
          setSelectedPixels(new Set());
          return;
        }
      }

      // Auto-zoom in if at overview level so the user can paint comfortably
      if (zoom < 4 && wrapperRef.current) {
        const targetZoom = 8;
        const { width: ww, height: wh } = wrapperRef.current.getBoundingClientRect();
        setPan({
          x: ww / 2 - pos.gx * targetZoom - targetZoom / 2,
          y: wh / 2 - pos.gy * targetZoom - targetZoom / 2,
        });
        setZoom(targetZoom);
      }

      setHoverCell(null); // hide magnifier while selecting

      pushUndo(selectedPixels);
      isSelecting.current = true;
      dragStartPixel.current = pos;
      e.currentTarget.setPointerCapture(e.pointerId);

      if (selectMode === "brush") {
        const key = pos.gy * GRID_SIZE + pos.gx;
        setSelectedPixels((prev) => { const n = new Set(prev); n.add(key); return n; });
      } else {
        setDragCurrentPixel(pos);
      }
    },
    [screenToGrid, pan, pixelOwnerMap, gridData.blocks, pushUndo, selectedPixels, selectMode, zoom]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
        return;
      }

      const pos = screenToGrid(e.clientX, e.clientY);

      if (!isSelecting.current) {
        if (pos) {
          setTooltipPos({ x: e.clientX, y: e.clientY });
          setHoverCell(pos);
          if (pixelOwnerMap) {
            const idx = getBlockAt(pixelOwnerMap, pos.gx, pos.gy);
            setHoveredBlock(idx >= 0 ? gridData.blocks[idx] : null);
          }
        } else {
          setHoveredBlock(null);
          setHoverCell(null);
        }
      }

      if (isSelecting.current && pos) {
        if (selectMode === "brush") {
          if (pixelOwnerMap && getBlockAt(pixelOwnerMap, pos.gx, pos.gy) >= 0) return;
          const key = pos.gy * GRID_SIZE + pos.gx;
          setSelectedPixels((prev) => {
            if (prev.has(key)) return prev;
            const n = new Set(prev); n.add(key); return n;
          });
        } else {
          setDragCurrentPixel(pos);
        }
      }
    },
    [screenToGrid, pixelOwnerMap, gridData.blocks, selectMode]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      if (isPanning.current) {
        isPanning.current = false;
        return;
      }

      if (selectMode === "rect" && isSelecting.current && dragStartPixel.current && dragCurrentPixel) {
        const x = Math.min(dragStartPixel.current.gx, dragCurrentPixel.gx);
        const y = Math.min(dragStartPixel.current.gy, dragCurrentPixel.gy);
        const x2 = Math.max(dragStartPixel.current.gx, dragCurrentPixel.gx);
        const y2 = Math.max(dragStartPixel.current.gy, dragCurrentPixel.gy);
        setSelectedPixels((prev) => {
          const next = new Set(prev);
          for (let py = y; py <= y2; py++)
            for (let px = x; px <= x2; px++) {
              if (pixelOwnerMap && getBlockAt(pixelOwnerMap, px, py) >= 0) continue;
              next.add(py * GRID_SIZE + px);
            }
          return next;
        });
      }

      isSelecting.current = false;
      dragStartPixel.current = null;
      setDragCurrentPixel(null);
    },
    [dragCurrentPixel, pixelOwnerMap, selectMode]
  );

  const gridPx = GRID_SIZE * cellSize;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: "crosshair",
        userSelect: "none",
      }}
      onPointerLeave={() => {
        setHoverCell(null);
        setHoveredBlock(null);
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          left: pan.x,
          top: pan.y,
          width: gridPx,
          height: gridPx,
          willChange: "transform",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Layer 1: Master PNG or empty grid */}
        {gridData.masterImageUrl ? (
          <img
            src={gridData.masterImageUrl}
            width={gridPx}
            height={gridPx}
            alt="Pixel grid"
            style={{
              display: "block",
              imageRendering: "pixelated",
              width: gridPx,
              height: gridPx,
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: gridPx,
              height: gridPx,
              background: "#ffffff",
              ...(cellSize >= 4 ? {
                backgroundImage: [
                  "linear-gradient(#e8e8e8 1px, transparent 1px)",
                  "linear-gradient(90deg, #e8e8e8 1px, transparent 1px)",
                ].join(", "),
                backgroundSize: `${cellSize}px ${cellSize}px`,
              } : {}),
            }}
          />
        )}

        {/* Layer 2: Interaction overlay canvas */}
        <canvas
          ref={overlayRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: gridPx,
            height: gridPx,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Magnifier bubble — shown when hovering and not actively selecting */}
      {hoverCell && !isSelecting.current && (
        <canvas
          ref={magnifierRef}
          style={{
            position: "fixed",
            left: tooltipPos.x + 20,
            top: tooltipPos.y - 180,
            width: MAG_DISPLAY,
            height: MAG_DISPLAY,
            border: "1px solid var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            background: "#fff",
            pointerEvents: "none",
            zIndex: 300,
            imageRendering: "pixelated",
          }}
        />
      )}

      {/* Hover tooltip (only when nothing is selected) */}
      {hoveredBlock && selectedPixels.size === 0 && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
            background: "#fff",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "6px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#555",
            pointerEvents: "none",
            zIndex: 200,
          }}
        >
          {hoveredBlock.listed ? (
            <span style={{ color: "rgb(255,200,0)" }}>FOR SALE</span>
          ) : (
            <span style={{ color: "var(--accent)" }}>OWNED</span>
          )}
          &nbsp;{hoveredBlock.width}×{hoveredBlock.height}
        </div>
      )}

      {/* All controls portalled into the instruction bar — nothing overlays the grid */}
      <BarPortals
        canUndo={canUndo}
        undo={undo}
        selectMode={selectMode}
        setSelectMode={setSelectMode}
        selectedPixels={selectedPixels}
        selectionBounds={selectionBounds}
        pixelOwnerMap={pixelOwnerMap}
        pushUndo={pushUndo}
        setSelectedPixels={setSelectedPixels}
        setPurchasePaintedCount={setPurchasePaintedCount}
        setPurchaseSelection={setPurchaseSelection}
        setZoom={setZoom}
        setPan={setPan}
        fitZoom={fitZoom}
        resetView={applyFit}
      />

      {/* Purchase modal */}
      {purchaseSelection && (
        <PurchaseModal
          selection={purchaseSelection}
          paintedPixelCount={purchasePaintedCount}
          onClose={() => {
            setPurchaseSelection(null);
            setSelectedPixels(new Set());
          }}
          onSuccess={refreshGrid}
        />
      )}

      {/* Block info modal */}
      {clickedBlock && (
        <BlockInfoModal
          block={clickedBlock}
          onClose={() => setClickedBlock(null)}
        />
      )}
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: "#fff",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  color: "#333",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

// Portals all grid UI into the instruction bar so nothing overlays the grid canvas
function BarPortals({
  canUndo, undo, selectMode, setSelectMode,
  selectedPixels, selectionBounds, pixelOwnerMap,
  pushUndo, setSelectedPixels, setPurchasePaintedCount, setPurchaseSelection,
  setZoom, setPan, fitZoom, resetView,
}: {
  canUndo: boolean;
  undo: () => void;
  selectMode: "brush" | "rect";
  setSelectMode: (m: "brush" | "rect") => void;
  selectedPixels: Set<number>;
  selectionBounds: { x: number; y: number; width: number; height: number } | null;
  pixelOwnerMap: Uint32Array | null;
  pushUndo: (s: Set<number>) => void;
  setSelectedPixels: React.Dispatch<React.SetStateAction<Set<number>>>;
  setPurchasePaintedCount: (n: number) => void;
  setPurchaseSelection: (s: { x: number; y: number; width: number; height: number } | null) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  fitZoom: React.MutableRefObject<number>;
  resetView: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const controlsTarget = document.getElementById("grid-controls-bar");
  const infoTarget = document.getElementById("grid-info-bar");
  const zoomTarget = document.getElementById("grid-zoom-bar");

  return (
    <>
      {controlsTarget && createPortal(
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{ ...controlBtnStyle, color: canUndo ? "#333" : "#ccc", cursor: canUndo ? "pointer" : "default" }}
          >
            ↩
          </button>
          <button
            onClick={() => setSelectMode("brush")}
            style={{ ...controlBtnStyle, width: "auto", padding: "0 8px", background: selectMode === "brush" ? "var(--accent)" : "#fff", color: selectMode === "brush" ? "#fff" : "#555", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.05em" }}
          >
            BRUSH
          </button>
          <button
            onClick={() => setSelectMode("rect")}
            style={{ ...controlBtnStyle, width: "auto", padding: "0 8px", background: selectMode === "rect" ? "var(--accent)" : "#fff", color: selectMode === "rect" ? "#fff" : "#555", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.05em" }}
          >
            RECT
          </button>
        </div>,
        controlsTarget
      )}

      {infoTarget && createPortal(
        selectedPixels.size > 0 && selectionBounds ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#333" }}>
              {selectedPixels.size.toLocaleString()} pixels
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
              ${selectedPixels.size.toLocaleString()}
            </span>
            <button
              onClick={() => { pushUndo(selectedPixels); setSelectedPixels(new Set()); }}
              style={{ ...controlBtnStyle, width: "auto", padding: "0 10px", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (!pixelOwnerMap || !selectionBounds) return;
                if (!isRegionFree(pixelOwnerMap, selectionBounds.x, selectionBounds.y, selectionBounds.width, selectionBounds.height)) {
                  alert("Some pixels in your selection area are already owned. Try a different region.");
                  return;
                }
                setPurchasePaintedCount(selectedPixels.size);
                setPurchaseSelection(selectionBounds);
              }}
              style={{ ...controlBtnStyle, width: "auto", padding: "0 14px", background: "var(--accent)", border: "none", color: "#fff", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.06em" }}
            >
              Buy →
            </button>
          </div>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "#bbb", textTransform: "uppercase" }}>
            BRUSH: freehand&nbsp;&nbsp;·&nbsp;&nbsp;RECT: rectangle&nbsp;&nbsp;·&nbsp;&nbsp;$1 per pixel
          </span>
        ),
        infoTarget
      )}

      {zoomTarget && createPortal(
        <div style={{ display: "flex", gap: 2 }}>
          {(["+", "−", "⟲"] as const).map((label, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === 0) setZoom((z) => clamp(z * 1.5, fitZoom.current, 20));
                else if (i === 1) setZoom((z) => clamp(z / 1.5, fitZoom.current, 20));
                else resetView();
              }}
              style={controlBtnStyle}
            >
              {label}
            </button>
          ))}
        </div>,
        zoomTarget
      )}
    </>
  );
}
