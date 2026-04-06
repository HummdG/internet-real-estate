"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditorState, Tool } from "./useEditorState";
import EditorCanvas from "./EditorCanvas";
import { useImportTool } from "./tools/useImportTool";
import SocialShareModal from "@/components/modals/SocialShareModal";

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

const TOOL_ICONS: Record<Tool, string> = {
  brush: "✏️",
  bucket: "🪣",
  picker: "💉",
  import: "📁",
};

const TOOL_LABELS: Record<Tool, string> = {
  brush: "Brush",
  bucket: "Fill",
  picker: "Pick",
  import: "Import",
};

export default function PixelEditor({
  blockId,
  editToken,
  x,
  y,
  width,
  height,
  existingImageUrl,
  status,
}: Props) {
  const state = useEditorState(width, height);
  const {
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    zoom, setZoom,
    buffer, setBuffer,
    pushUndo, undo, redo,
    initBuffer,
  } = state;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showShare, setShowShare] = useState(false);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // Set initial zoom to fit the block in the editor area
  useEffect(() => {
    const maxPx = Math.min(600, window.innerHeight - 200);
    const az = Math.max(1, Math.floor(maxPx / Math.max(width, height)));
    setZoom(az);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing image or init blank canvas
  useEffect(() => {
    if (existingImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => initBuffer(img);
      img.onerror = () => initBuffer();
      img.src = existingImageUrl;
    } else {
      initBuffer();
    }
  }, [existingImageUrl, initBuffer]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
        if (e.key === "s") { e.preventDefault(); handleSave(); }
        return;
      }
      if (e.key === "b") setTool("brush");
      if (e.key === "g") setTool("bucket");
      if (e.key === "i") setTool("picker");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, setTool]);

  const { importImage } = useImportTool(width, height, buffer, setBuffer, pushUndo);

  const handleToolClick = (t: Tool) => {
    if (t === "import") {
      importImage();
    } else {
      setTool(t);
    }
  };

  const handleSave = useCallback(async () => {
    if (!buffer) return;
    setSaving(true);
    setSaveError("");

    // Render buffer to blob
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(buffer, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setSaveError("Failed to export image");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/blocks/${blockId}/artwork`, {
        method: "PUT",
        headers: {
          "Content-Type": "image/png",
          Authorization: `Bearer ${editToken}`,
        },
        body: blob,
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Save failed");
        setSaving(false);
        return;
      }

      setShowShare(true);
    } catch {
      setSaveError("Network error. Please try again.");
    }
    setSaving(false);
  }, [buffer, blockId, editToken, width, height]);

  const displayZoom = zoom;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "var(--font-mono)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href="/"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            ← PIXEL ESTATE
          </a>
          <span style={{ color: "#333" }}>|</span>
          <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em" }}>
            EDITOR · {width}×{height} BLOCK AT ({x},{y})
          </span>
          {status === "LISTED" && (
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "rgb(255,200,0)",
                border: "1px solid",
                padding: "2px 6px",
              }}
            >
              FOR SALE
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { undo(); }}
            title="Undo (Ctrl+Z)"
            style={{ ...btnStyle, color: "#555" }}
          >
            ↩
          </button>
          <button
            onClick={() => { redo(); }}
            title="Redo (Ctrl+Shift+Z)"
            style={{ ...btnStyle, color: "#555" }}
          >
            ↪
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...btnStyle,
              background: saving ? "#333" : "#fff",
              color: saving ? "#666" : "#000",
              fontWeight: 700,
              padding: "6px 20px",
              letterSpacing: "0.08em",
            }}
          >
            {saving ? "SAVING..." : "SAVE & PUBLISH"}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left toolbar */}
        <div
          style={{
            width: 56,
            borderRight: "1px solid #1a1a1a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "16px 0",
            gap: 4,
          }}
        >
          {(["brush", "bucket", "picker", "import"] as Tool[]).map((t) => (
            <button
              key={t}
              onClick={() => handleToolClick(t)}
              title={TOOL_LABELS[t]}
              style={{
                width: 40,
                height: 40,
                background: tool === t ? "#1a1a1a" : "transparent",
                border: tool === t ? "1px solid var(--accent)" : "1px solid transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {TOOL_ICONS[t]}
            </button>
          ))}

          <div style={{ marginTop: 16, width: "100%", borderTop: "1px solid #1a1a1a", paddingTop: 16 }} />

          {/* Color swatch */}
          <div style={{ position: "relative" }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
              title="Pick color"
            />
            <div
              style={{
                width: 28,
                height: 28,
                background: color,
                border: "2px solid #333",
              }}
            />
          </div>

          <div style={{ marginTop: 8, width: "100%", borderTop: "1px solid #1a1a1a", paddingTop: 8 }} />

          {/* Brush sizes */}
          {[1, 2, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              title={`Brush size ${s}`}
              style={{
                width: 40,
                height: 28,
                background: brushSize === s ? "#1a1a1a" : "transparent",
                border: brushSize === s ? "1px solid #333" : "1px solid transparent",
                color: brushSize === s ? "#fff" : "#555",
                cursor: "pointer",
                fontSize: 10,
                letterSpacing: "0.05em",
              }}
            >
              {s}px
            </button>
          ))}

          <div style={{ marginTop: 8, width: "100%", borderTop: "1px solid #1a1a1a", paddingTop: 8 }} />

          {/* Zoom controls */}
          {[["Z+", () => setZoom((z) => Math.min(z * 1.5, 32))], ["Z-", () => setZoom((z) => Math.max(z / 1.5, 1))]].map(
            ([label, fn]) => (
              <button
                key={label as string}
                onClick={fn as () => void}
                style={{ ...btnStyle, width: 40, height: 28, fontSize: 10 }}
              >
                {label as string}
              </button>
            )
          )}
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: 24,
            background: "#060606",
          }}
        >
          <div
            style={{
              border: "1px solid #1a1a1a",
              display: "inline-block",
            }}
          >
            {buffer && (
              <EditorCanvas
                width={width}
                height={height}
                buffer={buffer}
                setBuffer={setBuffer}
                pushUndo={pushUndo}
                tool={tool}
                color={color}
                brushSize={brushSize}
                onPickColor={(c) => { setColor(c); setTool("brush"); }}
                zoom={displayZoom}
              />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            width: 180,
            borderLeft: "1px solid #1a1a1a",
            padding: 16,
            fontSize: 10,
            color: "#444",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ letterSpacing: "0.15em", marginBottom: 8, color: "#555" }}>INFO</div>
            <div>Size: {width}×{height}</div>
            <div>Position: ({x},{y})</div>
            <div>Pixels: {(width * height).toLocaleString()}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ letterSpacing: "0.15em", marginBottom: 8, color: "#555" }}>SHORTCUTS</div>
            <div>B: brush</div>
            <div>G: fill</div>
            <div>I: pick</div>
            <div>Ctrl+Z: undo</div>
            <div>Ctrl+S: save</div>
          </div>

          {saveError && (
            <div
              style={{
                color: "#ff4444",
                fontSize: 11,
                background: "rgba(255,68,68,0.1)",
                border: "1px solid rgba(255,68,68,0.2)",
                padding: "8px",
                marginTop: 8,
              }}
            >
              {saveError}
            </div>
          )}
        </div>
      </div>

      {showShare && (
        <SocialShareModal
          onClose={() => {
            setShowShare(false);
            window.location.href = "/";
          }}
          onEdit={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #1a1a1a",
  color: "#aaa",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
  letterSpacing: "0.05em",
};
