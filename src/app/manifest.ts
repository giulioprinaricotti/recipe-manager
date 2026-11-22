import type { MetadataRoute } from "next";

// Same description as the page metadata in layout.tsx.
const DESCRIPTION = 
  "Pianifica i pasti della settimana, salva le tue ricette e manda la lista della spesa su Bring!.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dueforchette",
    short_name: "dueforchette",
    description: DESCRIPTION,
    start_url: "/recipes",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/recipes/new",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
