import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Lazy proxy: the real Resend client is created on first property access,
// not at module-eval time, so API route modules don't require the API key
// during the build's "collect page data" step.
export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    const client = getResend();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const FROM_ADDRESS = "The Fan Wall <noreply@thefanwall.com>";
