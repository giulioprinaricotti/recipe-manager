import type { Metadata } from "next";

// Constant metadata for every invite URL — no DB call, no per-token data
// leak. Same OG card for every token.
// Next does NOT deep-merge openGraph / twitter from parent metadata, so we
// repeat the full blocks here (otherwise og:image, og:locale, og:type and
// twitter:card=summary_large_image would be lost on this route).
const INVITE_TITLE = "Sei stato/a invitato/a — dueforchette";
const INVITE_DESCRIPTION =
  "Un amico ti ha invitato a provare dueforchette: pianifica i pasti della settimana e manda la spesa su Bring!.";
const OG_IMAGE = {
  url: "/og/default.jpg",
  width: 1200,
  height: 630,
  alt: "dueforchette — pianifica i pasti della settimana",
};

export const metadata: Metadata = {
  title: "Sei stato/a invitato/a",
  description: INVITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "dueforchette",
    locale: "it_IT",
    title: INVITE_TITLE,
    description: INVITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: INVITE_TITLE,
    description: INVITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function InviteTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
