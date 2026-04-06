import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = "Pixel Estate <noreply@pixelestate.com>";
