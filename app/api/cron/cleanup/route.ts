import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESERVATION_EXPIRY_MINUTES } from "@/lib/grid/constants";

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RESERVATION_EXPIRY_MINUTES * 60 * 1000);

  const { count } = await prisma.pixelBlock.deleteMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: cutoff },
    },
  });

  await prisma.auditLog.create({
    data: { event: "cron_cleanup", payload: { deletedCount: count, cutoff } },
  });

  return NextResponse.json({ deleted: count });
}
