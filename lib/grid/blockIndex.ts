import { GRID_SIZE } from "./constants";

export interface BlockMeta {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  publicSlug: string;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  listed: boolean;
  listingPrice?: number;
  listingCurrency?: string;
  country: string | null;
}

/**
 * Build a flat Uint32Array spatial index from a list of blocks.
 * Each cell stores a 1-based index into the blocks array (0 = unowned).
 * This enables O(1) pixel-level ownership lookups.
 */
export function buildPixelOwnerMap(blocks: BlockMeta[]): Uint32Array {
  const map = new Uint32Array(GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < blocks.length; i++) {
    const { x, y, width, height } = blocks[i];
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        map[row * GRID_SIZE + col] = i + 1; // 1-based
      }
    }
  }
  return map;
}

/**
 * Check if all pixels in the selection [x1,x2) x [y1,y2) are unowned.
 */
export function isRegionFree(
  map: Uint32Array,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (map[row * GRID_SIZE + col] !== 0) return false;
    }
  }
  return true;
}

/**
 * Get the block index (0-based) at grid position (gx, gy), or -1 if unowned.
 */
export function getBlockAt(map: Uint32Array, gx: number, gy: number): number {
  const val = map[gy * GRID_SIZE + gx];
  return val === 0 ? -1 : val - 1;
}
