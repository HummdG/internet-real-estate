import { resend, FROM_ADDRESS } from "@/lib/resend";
import { formatPrice } from "@/lib/currency";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function sendPurchaseConfirmation(params: {
  to: string;
  editToken: string;
  pixelCount: number;
  width: number;
  height: number;
  x: number;
  y: number;
}) {
  const { to, editToken, pixelCount, width, height, x, y } = params;
  const editUrl = `${BASE_URL}/edit/${editToken}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You claimed ${pixelCount.toLocaleString()} pixels on The Fan Wall!`,
    html: `
      <h1>Welcome to The Fan Wall! 🏟️</h1>
      <p>You've claimed <strong>${pixelCount.toLocaleString()} pixels</strong> (${width}×${height} block at position ${x},${y}) for your nation.</p>
      <p>Use the link below to paint your pixels. <strong>Save this email</strong>: it's the only way to edit your pixels.</p>
      <p><a href="${editUrl}" style="background:#1f8a4c;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Paint Your Pixels</a></p>
      <p style="color:#666;font-size:12px;">Your edit link: ${editUrl}</p>
      <hr/>
      <p style="color:#888;font-size:11px;">The Fan Wall, every pixel a vote for your nation.</p>
    `,
  });
}

export async function sendMarketplaceBuyerEmail(params: {
  to: string;
  editToken: string;
  pixelCount: number;
  width: number;
  height: number;
  x: number;
  y: number;
}) {
  const { to, editToken, pixelCount, width, height, x, y } = params;
  const editUrl = `${BASE_URL}/edit/${editToken}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your Fan Wall purchase is complete!`,
    html: `
      <h1>You've got new pixels! 🏟️</h1>
      <p>You've acquired <strong>${pixelCount.toLocaleString()} pixels</strong> (${width}×${height} at ${x},${y}) on The Fan Wall.</p>
      <p><a href="${editUrl}" style="background:#1f8a4c;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Paint Your Pixels</a></p>
      <p style="color:#666;font-size:12px;">Your edit link: ${editUrl}</p>
    `,
  });
}

export async function sendSaleCompleteEmail(params: {
  to: string;
  amountMinorUnit: number;
  platformFeeMinorUnit: number;
  currency: "USD" | "GBP";
}) {
  const { to, amountMinorUnit, platformFeeMinorUnit, currency } = params;
  const gross = formatPrice(amountMinorUnit, currency);
  const fee = formatPrice(platformFeeMinorUnit, currency);
  const net = formatPrice(amountMinorUnit - platformFeeMinorUnit, currency);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your Fan Wall block sold for ${gross}!`,
    html: `
      <h1>Your pixels sold!</h1>
      <p>Sale price: <strong>${gross}</strong></p>
      <p>Platform fee (2%): ${fee}</p>
      <p>You receive: <strong>${net}</strong></p>
      <p>Stripe will transfer your payout within 7 days.</p>
    `,
  });
}
