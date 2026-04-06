import { prisma } from "@/lib/prisma";

/**
 * Verify that the given editToken belongs to the given blockId.
 * Returns the block if valid, null otherwise.
 */
export async function verifyEditToken(editToken: string, blockId: string) {
  if (!editToken || !blockId) return null;
  const block = await prisma.pixelBlock.findFirst({
    where: { id: blockId, editToken },
  });
  return block;
}

/**
 * Verify listingToken ownership. Returns listing if valid.
 */
export async function verifyListingToken(listingToken: string, listingId: string) {
  if (!listingToken || !listingId) return null;
  return prisma.listing.findFirst({
    where: { id: listingId, listingToken },
  });
}
