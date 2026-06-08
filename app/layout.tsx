import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Fan Wall: Every pixel a vote for your nation.",
  description:
    "Claim pixels on a 1,000,000-pixel wall, fly your nation's flag, and climb the live fan-loyalty leaderboard. $1 a pixel, which nation's fans are most loyal?",
  openGraph: {
    title: "The Fan Wall: Every pixel a vote for your nation.",
    description: "Claim your pixels, fly your flag, top the leaderboard. $1 a pixel.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Fan Wall: Every pixel a vote for your nation.",
    description: "Claim your pixels, fly your flag, top the leaderboard. $1 a pixel.",
    images: ["/og-image.png"],
  },
};

// Set the theme before first paint to avoid a flash of the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('fanwall-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
