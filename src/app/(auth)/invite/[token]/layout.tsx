import type { Metadata } from "next";

// Constant metadata for every invite URL — no DB call, no per-token data
// leak. Same OG card for every token. Image inherits from root layout.
const INVITE_DESCRIPTION =
  "Un amico ti ha invitato a provare Recipe Manager: pianifica i pasti della settimana e manda la spesa su Bring!.";

export const metadata: Metadata = {
  title: "Sei stato/a invitato/a",
  description: INVITE_DESCRIPTION,
  openGraph: {
    title: "Sei stato/a invitato/a — Recipe Manager",
    description: INVITE_DESCRIPTION,
  },
  twitter: {
    title: "Sei stato/a invitato/a — Recipe Manager",
    description: INVITE_DESCRIPTION,
  },
};

export default function InviteTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
