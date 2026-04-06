import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Estate. Own a piece of the internet.",
  description:
    "1,000,000 pixels. $1 each. Yours forever. Buy pixels, paint them however you want, and own real estate on the internet.",
  openGraph: {
    title: "Pixel Estate. Own a piece of the internet.",
    description: "1,000,000 pixels. $1 each. Yours forever.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Estate. Own a piece of the internet.",
    description: "1,000,000 pixels. $1 each. Yours forever.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
