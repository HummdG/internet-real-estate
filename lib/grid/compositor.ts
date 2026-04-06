"use server";

import sharp from "sharp";
import { GRID_SIZE } from "./constants";
import {
  downloadBuffer,
  uploadBuffer,
  getCurrentMasterKey,
  setCurrentMasterKey,
  R2_PUBLIC_URL,
  BLANK_MASTER_KEY,
} from "@/lib/r2";

/**
 * Composite a pixel art PNG onto the master grid image.
 * Returns the URL of the new master image.
 */
export async function compositeArtwork(
  x: number,
  y: number,
  width: number,
  height: number,
  artworkPng: Buffer
): Promise<string> {
  // Get current master key (or fall back to blank)
  let masterKey = await getCurrentMasterKey();

  let masterBuffer: Buffer;
  if (!masterKey) {
    // Create blank 1000x1000 white PNG as the initial master
    masterBuffer = await sharp({
      create: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  } else {
    masterBuffer = await downloadBuffer(masterKey);
  }

  // Resize/crop artwork to exact block dimensions
  const resizedArtwork = await sharp(artworkPng)
    .resize(width, height, { fit: "fill", kernel: "nearest" })
    .png()
    .toBuffer();

  // Composite onto master
  const composited = await sharp(masterBuffer)
    .composite([{ input: resizedArtwork, left: x, top: y }])
    .png()
    .toBuffer();

  // Upload new versioned master
  const newKey = `grid/master-v${Date.now()}.png`;
  await uploadBuffer(newKey, composited, "image/png");
  await setCurrentMasterKey(newKey);

  return `${R2_PUBLIC_URL}/${newKey}`;
}

/**
 * Get the current master grid image URL.
 */
export async function getMasterUrl(): Promise<string | null> {
  const key = await getCurrentMasterKey();
  if (!key) return null;
  return `${R2_PUBLIC_URL}/${key}`;
}
