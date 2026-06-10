import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// OG image: Unsplash photo by Brooke Lark (photo-1473093295043-cdd812d0e601),
// cropped to 1200x630. Unsplash License — free for commercial use, no
// attribution required (but credit appreciated).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://recipes.giulioprinaricotti.com";
const OG_IMAGE = {
  url: "/og/default.jpg",
  width: 1200,
  height: 630,
  alt: "dueforchette — pianifica i pasti della settimana",
};
const DEFAULT_DESCRIPTION =
  "Pianifica i pasti della settimana, salva le tue ricette e manda la lista della spesa su Bring!.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "dueforchette",
    template: "%s — dueforchette",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "dueforchette",
    locale: "it_IT",
    url: SITE_URL,
    title: "dueforchette",
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "dueforchette",
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
